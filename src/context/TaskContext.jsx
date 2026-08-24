import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { supabase } from '../lib/supabase';
import { TEAM_MEMBERS } from '../lib/demoData';

const TaskContext = createContext(null);

export const TaskProvider = ({ children }) => {
  // Session & Authenticated User
  const [session, setSession] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Database records
  const [profiles, setProfiles] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [isRealtimeLive, setIsRealtimeLive] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(new Date());

  // Filter states
  const [selectedCategory, setSelectedCategory] = useState('all'); // all, daily, weekly, hr, general
  const [selectedStatus, setSelectedStatus] = useState('all'); // all, pending, completed
  const [selectedPriority, setSelectedPriority] = useState('all'); // all, Urgent, High, Medium, Low
  const [selectedAssignee, setSelectedAssignee] = useState('all'); // all or profile id
  const [searchQuery, setSearchQuery] = useState('');

  // 1. Fetch profiles strictly from public.profiles
  const fetchProfiles = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('full_name', { ascending: true });

      if (!error && data && data.length > 0) {
        const enriched = data.map(p => {
          const preset = TEAM_MEMBERS.find(tm => tm.id === p.id || tm.username === p.username || tm.email === p.email);
          return {
            ...p,
            avatar_url: p.avatar_url || preset?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(p.full_name || p.username)}`,
            color: preset?.color || '#6366f1'
          };
        });
        setProfiles(enriched);
        return enriched;
      }
    } catch (err) {
      console.error('Error fetching profiles from Supabase:', err);
    }
    return [];
  }, []);

  // 2. Fetch tasks strictly from public.tasks
  const fetchTasks = useCallback(async () => {
    try {
      setLoadingTasks(true);
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        const normalized = data.map(t => ({
          ...t,
          category: t.task_type || t.category || 'general',
          status: t.is_completed ? 'completed' : 'pending'
        }));
        setTasks(normalized);
        setLastSyncTime(new Date());
      } else if (error) {
        console.error('Error fetching tasks from Supabase:', error);
      }
    } catch (err) {
      console.error('Task fetch exception:', err);
    } finally {
      setLoadingTasks(false);
    }
  }, []);

  // 3. Check Session on Mount
  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      try {
        const loadedProfiles = await fetchProfiles();
        const { data: { session: currentSession } } = await supabase.auth.getSession();

        if (isMounted) {
          setSession(currentSession);
          if (currentSession?.user?.email) {
            const userEmail = currentSession.user.email.toLowerCase().trim();
            const username = userEmail.split('@')[0];
            const matched = loadedProfiles.find(
              p => p.email?.toLowerCase() === userEmail || p.username?.toLowerCase() === username
            );
            if (matched) {
              setCurrentUser(matched);
            }
          }
          await fetchTasks();
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
      } finally {
        if (isMounted) {
          setAuthLoading(false);
        }
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      setSession(newSession);
      if (newSession?.user?.email) {
        const userEmail = newSession.user.email.toLowerCase().trim();
        const username = userEmail.split('@')[0];
        const loadedProfiles = await fetchProfiles();
        const matched = loadedProfiles.find(
          p => p.email?.toLowerCase() === userEmail || p.username?.toLowerCase() === username
        );
        if (matched) {
          setCurrentUser(matched);
          fetchTasks();
        } else {
          // User authenticated but not authorized in profiles table
          setCurrentUser(null);
        }
      } else if (event === 'SIGNED_OUT') {
        setCurrentUser(null);
      }
    });

    return () => {
      isMounted = false;
      subscription?.unsubscribe();
    };
  }, [fetchProfiles, fetchTasks]);

  // 4. Subscribe to Supabase Realtime for Tasks & Profiles
  useEffect(() => {
    const channel = supabase
      .channel('realtime:company-tasks')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks' },
        (payload) => {
          setLastSyncTime(new Date());
          if (payload.eventType === 'INSERT') {
            const normalized = {
              ...payload.new,
              category: payload.new.task_type || payload.new.category || 'general',
              status: payload.new.is_completed ? 'completed' : 'pending'
            };
            setTasks(prev => [normalized, ...prev.filter(t => t.id !== normalized.id)]);
          } else if (payload.eventType === 'UPDATE') {
            const normalized = {
              ...payload.new,
              category: payload.new.task_type || payload.new.category || 'general',
              status: payload.new.is_completed ? 'completed' : 'pending'
            };
            setTasks(prev => prev.map(t => (t.id === normalized.id ? normalized : t)));
          } else if (payload.eventType === 'DELETE') {
            setTasks(prev => prev.filter(t => t.id !== payload.old.id));
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles' },
        () => {
          fetchProfiles();
        }
      )
      .subscribe((status) => {
        setIsRealtimeLive(status === 'SUBSCRIBED');
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchProfiles]);

  // Confetti trigger
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

  // 5. Strict Login Handler: Only users in Supabase with valid credentials can log in
  const login = async (identifier, password) => {
    const trimmedId = identifier.trim().toLowerCase();
    let email = trimmedId;
    if (!email.includes('@')) {
      email = `${trimmedId}@company.com`;
    }
    const username = trimmedId.replace('@company.com', '');

    // Step 1: Check if the user exists in Supabase profiles table
    let currentProfiles = profiles;
    if (currentProfiles.length === 0) {
      currentProfiles = await fetchProfiles();
    }

    const matchedProfile = currentProfiles.find(
      p => p.email?.toLowerCase() === email || p.username?.toLowerCase() === username
    );

    if (!matchedProfile) {
      return {
        success: false,
        error: `User "${identifier}" was not found in the Supabase company profiles database. Access denied.`
      };
    }

    // Step 2: Authenticate credentials against Supabase
    try {
      // Authenticate with Supabase Auth
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (signInError) {
        // If password is wrong or auth failed
        return {
          success: false,
          error: 'Invalid password or username. Please check your Supabase credentials and try again.'
        };
      }

      if (signInData?.session) {
        setSession(signInData.session);
        setCurrentUser(matchedProfile);
        await fetchTasks();
        return { success: true, user: matchedProfile };
      }

      return {
        success: false,
        error: 'Authentication failed. Please verify your Supabase account status.'
      };
    } catch (err) {
      console.error('Authentication exception:', err);
      return {
        success: false,
        error: err.message || 'Authentication error. Please check your credentials.'
      };
    }
  };

  // 6. Logout Handler
  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('Sign out error:', err);
    }
    setSession(null);
    setCurrentUser(null);
  };

  // 7. Toggle Task Status (Checkbox Tick)
  const toggleTaskStatus = useCallback(async (taskId, note = '') => {
    const currentTask = tasks.find(t => t.id === taskId);
    if (!currentTask) return;

    const nextIsCompleted = !currentTask.is_completed;
    const nowIso = new Date().toISOString();

    const updatedTask = {
      ...currentTask,
      is_completed: nextIsCompleted,
      status: nextIsCompleted ? 'completed' : 'pending',
      completed_at: nextIsCompleted ? nowIso : null,
      completion_note: nextIsCompleted ? (note || currentTask.completion_note || '') : ''
    };

    if (nextIsCompleted) {
      triggerConfetti();
    }

    // Optimistic UI Update
    setTasks(prev => prev.map(t => (t.id === taskId ? updatedTask : t)));
    setLastSyncTime(new Date());

    try {
      const { error } = await supabase
        .from('tasks')
        .update({
          is_completed: nextIsCompleted,
          completed_at: nextIsCompleted ? nowIso : null,
          completion_note: updatedTask.completion_note
        })
        .eq('id', taskId);

      if (error) {
        console.error('Error updating task in Supabase:', error);
      }
    } catch (err) {
      console.error('Task update exception:', err);
    }
  }, [tasks, triggerConfetti]);

  // 8. Create Task
  const createTask = useCallback(async (taskData) => {
    const payload = {
      title: taskData.title.trim(),
      description: (taskData.description || '').trim() || null,
      task_type: taskData.category || taskData.task_type || 'general',
      priority: taskData.priority || 'Medium',
      assigned_to: taskData.assigned_to || currentUser?.id,
      created_by: currentUser?.id || null,
      is_completed: false,
      due_date: taskData.due_date ? new Date(taskData.due_date).toISOString() : null,
      completed_at: null,
      completion_note: null
    };

    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert([payload])
        .select();

      if (!error && data && data[0]) {
        const created = {
          ...data[0],
          category: data[0].task_type,
          status: 'pending'
        };
        setTasks(prev => [created, ...prev.filter(t => t.id !== created.id)]);
        setLastSyncTime(new Date());
        return created;
      } else if (error) {
        console.error('Error creating task in Supabase:', error);
      }
    } catch (err) {
      console.error('Create task exception:', err);
    }
  }, [currentUser]);

  // 9. Update Task details
  const updateTask = useCallback(async (taskId, updates) => {
    setTasks(prev => prev.map(t => (t.id === taskId ? { ...t, ...updates } : t)));

    try {
      await supabase
        .from('tasks')
        .update(updates)
        .eq('id', taskId);
    } catch (err) {
      console.error('Error updating task:', err);
    }
  }, []);

  // 10. Delete Task
  const deleteTask = useCallback(async (taskId) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
    setLastSyncTime(new Date());

    try {
      await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);
    } catch (err) {
      console.error('Error deleting task in Supabase:', err);
    }
  }, []);

  // Role permissions
  const isAdmin = useMemo(() => {
    if (!currentUser) return false;
    return currentUser.role === 'admin' || currentUser.department === 'HR';
  }, [currentUser]);

  // Metrics calculation
  const metrics = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.is_completed).length;
    const pending = total - completed;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    const memberStats = profiles.map(member => {
      const memberTasks = tasks.filter(t => t.assigned_to === member.id);
      const mTotal = memberTasks.length;
      const mCompleted = memberTasks.filter(t => t.is_completed).length;
      const mPending = mTotal - mCompleted;
      const mRate = mTotal > 0 ? Math.round((mCompleted / mTotal) * 100) : 0;

      return {
        ...member,
        totalTasks: mTotal,
        completedTasks: mCompleted,
        pendingTasks: mPending,
        completionRate: mRate
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
    session,
    currentUser,
    setCurrentUser,
    authLoading,
    profiles,
    tasks,
    loadingTasks,
    isRealtimeLive,
    lastSyncTime,
    isAdmin,
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
    login,
    logout,
    toggleTaskStatus,
    createTask,
    updateTask,
    deleteTask,
    fetchTasks,
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
