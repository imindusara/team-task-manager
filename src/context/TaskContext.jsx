import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { INITIAL_PROFILES, INITIAL_TASKS } from '../lib/demoData';
import { getSupabaseClient, getSupabaseConfig, resetSupabaseClient } from '../lib/supabase';

const TaskContext = createContext(null);

export const TaskProvider = ({ children }) => {
  // Profiles state
  const [profiles, setProfiles] = useState(() => {
    const saved = localStorage.getItem('team_profiles');
    return saved ? JSON.parse(saved) : INITIAL_PROFILES;
  });

  // Current active user (default is Alex Rivera - Manager)
  const [currentUser, setCurrentUser] = useState(() => {
    const savedId = localStorage.getItem('team_active_user_id');
    if (savedId) {
      const found = INITIAL_PROFILES.find(p => p.id === savedId);
      if (found) return found;
    }
    return INITIAL_PROFILES[0]; // Manager
  });

  // Tasks state
  const [tasks, setTasks] = useState(() => {
    const saved = localStorage.getItem('team_tasks');
    return saved ? JSON.parse(saved) : INITIAL_TASKS;
  });

  const [loading, setLoading] = useState(false);
  const [isSupabaseLive, setIsSupabaseLive] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(new Date());

  // Filter states
  const [selectedCategory, setSelectedCategory] = useState('all'); // all, daily, weekly, hr, general
  const [selectedStatus, setSelectedStatus] = useState('all'); // all, pending, completed
  const [selectedPriority, setSelectedPriority] = useState('all'); // all, urgent, high, medium, low
  const [selectedAssignee, setSelectedAssignee] = useState('all'); // all or profile id
  const [searchQuery, setSearchQuery] = useState('');

  // Persist demo state
  useEffect(() => {
    localStorage.setItem('team_tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('team_profiles', JSON.stringify(profiles));
  }, [profiles]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('team_active_user_id', currentUser.id);
    }
  }, [currentUser]);

  // Broadcast channel for multi-tab realtime in demo mode
  const broadcastChannel = useMemo(() => {
    try {
      return new BroadcastChannel('team_task_sync');
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    if (!broadcastChannel) return;

    const handleMessage = (event) => {
      const { type, payload } = event.data || {};
      if (type === 'TASKS_UPDATED') {
        setTasks(payload);
        setLastSyncTime(new Date());
      } else if (type === 'USER_CHANGED') {
        // keep local user preference or sync if desired
      }
    };

    broadcastChannel.onmessage = handleMessage;
    return () => {
      broadcastChannel.onmessage = null;
    };
  }, [broadcastChannel]);

  // Load from Supabase if connected
  const fetchSupabaseData = useCallback(async () => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      setIsSupabaseLive(false);
      return;
    }

    try {
      setLoading(true);
      // Fetch profiles
      const { data: dbProfiles, error: profileErr } = await supabase
        .from('profiles')
        .select('*')
        .order('role', { ascending: false });

      if (!profileErr && dbProfiles && dbProfiles.length > 0) {
        setProfiles(dbProfiles);
        // keep current user valid
        const updatedCurrent = dbProfiles.find(p => p.id === currentUser?.id) || dbProfiles[0];
        setCurrentUser(updatedCurrent);
      }

      // Fetch tasks
      const { data: dbTasks, error: taskErr } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });

      if (!taskErr && dbTasks) {
        setTasks(dbTasks);
        setIsSupabaseLive(true);
        setLastSyncTime(new Date());
      }
    } catch (err) {
      console.warn('Could not sync with Supabase, staying in offline demo mode:', err);
      setIsSupabaseLive(false);
    } finally {
      setLoading(false);
    }
  }, [currentUser?.id]);

  // Subscribe to Supabase Realtime
  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    fetchSupabaseData();

    const channel = supabase
      .channel('public:tasks-and-profiles')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks' },
        (payload) => {
          setLastSyncTime(new Date());
          if (payload.eventType === 'INSERT') {
            setTasks(prev => [payload.new, ...prev.filter(t => t.id !== payload.new.id)]);
          } else if (payload.eventType === 'UPDATE') {
            setTasks(prev => prev.map(t => (t.id === payload.new.id ? payload.new : t)));
          } else if (payload.eventType === 'DELETE') {
            setTasks(prev => prev.filter(t => t.id !== payload.old.id));
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles' },
        () => {
          fetchSupabaseData();
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setIsSupabaseLive(true);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchSupabaseData]);

  // Trigger celebration confetti
  const triggerConfetti = useCallback(() => {
    try {
      confetti({
        particleCount: 65,
        spread: 60,
        origin: { y: 0.8 },
        colors: ['#6366f1', '#10b981', '#06b6d4', '#f59e0b', '#ec4899']
      });
    } catch {
      // ignore
    }
  }, []);

  // 1-Click Toggle Task Status (Tick mark)
  const toggleTaskStatus = useCallback(async (taskId, note = '') => {
    const currentTask = tasks.find(t => t.id === taskId);
    if (!currentTask) return;

    const isCompleting = currentTask.status !== 'completed';
    const nowIso = new Date().toISOString();

    const updatedTask = {
      ...currentTask,
      status: isCompleting ? 'completed' : 'pending',
      completed_at: isCompleting ? nowIso : null,
      completed_by: isCompleting ? currentUser.id : null,
      completion_note: isCompleting ? (note || currentTask.completion_note || '') : '',
      updated_at: nowIso
    };

    if (isCompleting) {
      triggerConfetti();
    }

    // Optimistic UI update
    const newTasks = tasks.map(t => (t.id === taskId ? updatedTask : t));
    setTasks(newTasks);
    setLastSyncTime(new Date());

    if (broadcastChannel) {
      broadcastChannel.postMessage({ type: 'TASKS_UPDATED', payload: newTasks });
    }

    // Sync to Supabase if live
    const supabase = getSupabaseClient();
    if (supabase && isSupabaseLive) {
      try {
        await supabase
          .from('tasks')
          .update({
            status: updatedTask.status,
            completed_at: updatedTask.completed_at,
            completed_by: updatedTask.completed_by,
            completion_note: updatedTask.completion_note,
            updated_at: nowIso
          })
          .eq('id', taskId);
      } catch (err) {
        console.error('Supabase update task failed:', err);
      }
    }
  }, [tasks, currentUser, triggerConfetti, broadcastChannel, isSupabaseLive]);

  // Create Task
  const createTask = useCallback(async (taskData) => {
    const newTask = {
      id: crypto.randomUUID ? crypto.randomUUID() : `t-${Date.now()}`,
      title: taskData.title.trim(),
      description: (taskData.description || '').trim(),
      category: taskData.category || 'general',
      priority: taskData.priority || 'medium',
      status: 'pending',
      assigned_to: taskData.assigned_to || currentUser.id,
      created_by: currentUser.id,
      due_date: taskData.due_date ? new Date(taskData.due_date).toISOString() : null,
      completed_at: null,
      completed_by: null,
      completion_note: '',
      tags: taskData.tags || [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Optimistic UI
    const updated = [newTask, ...tasks];
    setTasks(updated);
    setLastSyncTime(new Date());

    if (broadcastChannel) {
      broadcastChannel.postMessage({ type: 'TASKS_UPDATED', payload: updated });
    }

    const supabase = getSupabaseClient();
    if (supabase && isSupabaseLive) {
      try {
        await supabase.from('tasks').insert([newTask]);
      } catch (err) {
        console.error('Supabase insert task failed:', err);
      }
    }

    return newTask;
  }, [currentUser, tasks, broadcastChannel, isSupabaseLive]);

  // Update Task details
  const updateTask = useCallback(async (taskId, updates) => {
    const nowIso = new Date().toISOString();
    const updatedTasks = tasks.map(t => {
      if (t.id === taskId) {
        return { ...t, ...updates, updated_at: nowIso };
      }
      return t;
    });

    setTasks(updatedTasks);
    setLastSyncTime(new Date());

    if (broadcastChannel) {
      broadcastChannel.postMessage({ type: 'TASKS_UPDATED', payload: updatedTasks });
    }

    const supabase = getSupabaseClient();
    if (supabase && isSupabaseLive) {
      try {
        await supabase.from('tasks').update({ ...updates, updated_at: nowIso }).eq('id', taskId);
      } catch (err) {
        console.error('Supabase update failed:', err);
      }
    }
  }, [tasks, broadcastChannel, isSupabaseLive]);

  // Delete Task
  const deleteTask = useCallback(async (taskId) => {
    const updatedTasks = tasks.filter(t => t.id !== taskId);
    setTasks(updatedTasks);
    setLastSyncTime(new Date());

    if (broadcastChannel) {
      broadcastChannel.postMessage({ type: 'TASKS_UPDATED', payload: updatedTasks });
    }

    const supabase = getSupabaseClient();
    if (supabase && isSupabaseLive) {
      try {
        await supabase.from('tasks').delete().eq('id', taskId);
      } catch (err) {
        console.error('Supabase delete failed:', err);
      }
    }
  }, [tasks, broadcastChannel, isSupabaseLive]);

  // Reset demo data back to defaults
  const resetToDefaultData = useCallback(() => {
    setTasks(INITIAL_TASKS);
    setProfiles(INITIAL_PROFILES);
    setCurrentUser(INITIAL_PROFILES[0]);
    localStorage.removeItem('team_tasks');
    localStorage.removeItem('team_profiles');
    localStorage.removeItem('team_active_user_id');
  }, []);

  // Compute metrics
  const metrics = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'completed').length;
    const pending = total - completed;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    // Per member stats
    const memberStats = profiles.map(member => {
      const memberTasks = tasks.filter(t => t.assigned_to === member.id);
      const mTotal = memberTasks.length;
      const mCompleted = memberTasks.filter(t => t.status === 'completed').length;
      const mPending = mTotal - mCompleted;
      const mRate = mTotal > 0 ? Math.round((mCompleted / mTotal) * 100) : 0;

      // Category breakdown
      const dailyCount = memberTasks.filter(t => t.category === 'daily').length;
      const weeklyCount = memberTasks.filter(t => t.category === 'weekly').length;
      const hrCount = memberTasks.filter(t => t.category === 'hr').length;

      return {
        ...member,
        totalTasks: mTotal,
        completedTasks: mCompleted,
        pendingTasks: mPending,
        completionRate: mRate,
        dailyCount,
        weeklyCount,
        hrCount
      };
    });

    return {
      total,
      completed,
      pending,
      completionRate,
      memberStats
    };
  }, [tasks, profiles]);

  const value = {
    profiles,
    currentUser,
    setCurrentUser,
    tasks,
    loading,
    isSupabaseLive,
    lastSyncTime,
    selectedCategory,
    setSelectedCategory,
    selectedStatus,
    setSelectedStatus,
    selectedPriority,
    setSelectedPriority,
    selectedAssignee,
    setSelectedAssignee,
    searchQuery,
    setSearchQuery,
    toggleTaskStatus,
    createTask,
    updateTask,
    deleteTask,
    resetToDefaultData,
    fetchSupabaseData,
    metrics
  };

  return (
    <TaskContext.Provider value={value}>
      {children}
    </TaskContext.Provider>
  );
};

export const useTasks = () => {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error('useTasks must be used within a TaskProvider');
  }
  return context;
};
