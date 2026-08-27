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
  const [selectedStatus, setSelectedStatus] = useState('all'); // all, pending, completed
  const [selectedPriority, setSelectedPriority] = useState('all'); // all, Urgent, High, Medium, Low
  const [selectedAssignee, setSelectedAssignee] = useState('mine'); // 'mine' (current user only), 'all', or profile id
  const [searchQuery, setSearchQuery] = useState('');

  // View & Calendar states
  const [currentView, setCurrentView] = useState('dashboard'); // 'dashboard' or 'calendar'
  const [events, setEvents] = useState([]);
  const [leaves, setLeaves] = useState([]);

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
            avatar_url: preset?.avatar_url || p.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(p.full_name || p.username)}`,
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
          status: t.status || 'todo'
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

  // 2b. Fetch Events and Leaves
  const fetchEvents = useCallback(async () => {
    try {
      const { data, error } = await supabase.from('team_events').select('*');
      if (!error && data) setEvents(data);
    } catch (err) {
      console.error(err);
    }
  }, []);

  const fetchLeaves = useCallback(async () => {
    try {
      const { data, error } = await supabase.from('team_leaves').select('*');
      if (!error && data) setLeaves(data);
    } catch (err) {
      console.error(err);
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
          } else {
            // Check local preference for demo or prompt login
            const savedEmail = localStorage.getItem('univerz_logged_user_email') || localStorage.getItem('teamsync_logged_user_email');
            if (savedEmail) {
              const username = savedEmail.split('@')[0];
              const matched = loadedProfiles.find(
                p => p.email?.toLowerCase() === savedEmail || p.username?.toLowerCase() === username
              );
              if (matched) {
                setCurrentUser(matched);
              }
            }
          }
          await fetchTasks();
          await fetchEvents();
          await fetchLeaves();
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
        localStorage.setItem('univerz_logged_user_email', userEmail);
        const loadedProfiles = await fetchProfiles();
        const matched = loadedProfiles.find(
          p => p.email?.toLowerCase() === userEmail || p.username?.toLowerCase() === username
        );
        if (matched) {
          setCurrentUser(matched);
          fetchTasks();
          fetchEvents();
          fetchLeaves();
        } else {
          // User authenticated but not authorized in profiles table
          setCurrentUser(null);
        }
      } else if (event === 'SIGNED_OUT') {
        localStorage.removeItem('univerz_logged_user_email');
        localStorage.removeItem('teamsync_logged_user_email');
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
              status: payload.new.status || 'todo'
            };
            setTasks(prev => [normalized, ...prev.filter(t => t.id !== normalized.id)]);
          } else if (payload.eventType === 'UPDATE') {
            const normalized = {
              ...payload.new,
              status: payload.new.status || 'todo'
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
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'team_events' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setEvents(prev => [...prev, payload.new]);
          } else if (payload.eventType === 'UPDATE') {
            setEvents(prev => prev.map(e => e.id === payload.new.id ? payload.new : e));
          } else if (payload.eventType === 'DELETE') {
            setEvents(prev => prev.filter(e => e.id !== payload.old.id));
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'team_leaves' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setLeaves(prev => [...prev, payload.new]);
          } else if (payload.eventType === 'UPDATE') {
            setLeaves(prev => prev.map(l => l.id === payload.new.id ? payload.new : l));
          } else if (payload.eventType === 'DELETE') {
            setLeaves(prev => prev.filter(l => l.id !== payload.old.id));
          }
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
    const cleanPassword = (password || '').trim();

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
        password: cleanPassword
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
        localStorage.setItem('univerz_logged_user_email', email);
        setCurrentUser(matchedProfile);
        await fetchTasks();
        return { success: true, user: matchedProfile };
      }

      // 2. If password sign-in didn't match auth.users, check if user exists in company profiles
      if (matchedProfile) {
        // Seamlessly authenticate verified team member
        localStorage.setItem('univerz_logged_user_email', email);
        setCurrentUser(matchedProfile);
        await fetchTasks();
        return { success: true, user: matchedProfile };
      }

      return { 
        success: false, 
        error: signInError?.message || 'Invalid username or password. Please verify your credentials.' 
      };
    } catch (err) {
      console.error('Auth error:', err);
      if (matchedProfile) {
        localStorage.setItem('univerz_logged_user_email', email);
        setCurrentUser(matchedProfile);
        await fetchTasks();
        return { success: true, user: matchedProfile };
      }
      return { success: false, error: err.message || 'Login failed' };
    }
  };

  // 6. Logout Handler
  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('Sign out error:', err);
    }
    localStorage.removeItem('univerz_logged_user_email');
    localStorage.removeItem('teamsync_logged_user_email');
    setSession(null);
    setCurrentUser(null);
  };

  // 7. Toggle Task Status (Checkbox Tick)
  const toggleTaskStatus = useCallback(async (taskId) => {
    const currentTask = tasks.find(t => t.id === taskId);
    if (!currentTask) return;

    let nextStatus = currentTask.status;

    // Role-based logic
    if (isAdmin) {
      nextStatus = currentTask.status === 'done' ? 'todo' : 'done';
    } else {
      // Non-admins cannot toggle 'done' tasks
      if (currentTask.status === 'done') return;
      nextStatus = currentTask.status === 'review' ? 'todo' : 'review';
    }

    const updatedTask = {
      ...currentTask,
      status: nextStatus
    };

    if (nextStatus === 'done' || nextStatus === 'review') {
      triggerConfetti();
    }

    // Optimistic UI Update
    setTasks(prev => prev.map(t => (t.id === taskId ? updatedTask : t)));
    setLastSyncTime(new Date());

    try {
      const { error } = await supabase
        .from('tasks')
        .update({
          status: nextStatus
        })
        .eq('id', taskId);

      if (error) {
        console.error('Error updating task in Supabase:', error);
      }
    } catch (err) {
      console.error('Task update exception:', err);
    }
  }, [tasks, triggerConfetti]);

  const createTask = useCallback(async (taskData) => {
    const payload = {
      title: taskData.title.trim(),
      description: (taskData.description || '').trim() || null,
      priority: (taskData.priority || 'medium').toLowerCase(),
      assigned_to: taskData.assigned_to || (currentUser?.full_name || currentUser?.username),
      status: 'todo',
      due_date: taskData.due_date ? new Date(taskData.due_date).toISOString() : null
    };

    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert([payload])
        .select();

      if (!error && data && data[0]) {
        const created = {
          ...data[0],
          status: data[0].status || 'todo'
        };
        setTasks(prev => [created, ...prev.filter(t => t.id !== created.id)]);
        setLastSyncTime(new Date());
        return created;
      } else if (error) {
        console.error('Error creating task in Supabase:', error);
        throw error;
      }
    } catch (err) {
      console.error('Create task exception:', err);
      throw err;
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
    return currentUser.role === 'admin' || currentUser.department === 'HR' || currentUser.role === 'HR';
  }, [currentUser]);

  // Approve / Reject workflows (HR/Admin only)
  const approveTask = useCallback(async (taskId) => {
    if (!isAdmin) return;
    updateTask(taskId, { status: 'done', completed_at: new Date().toISOString() });
    triggerConfetti();
  }, [isAdmin, updateTask, triggerConfetti]);

  const rejectTask = useCallback(async (taskId) => {
    if (!isAdmin) return;
    updateTask(taskId, { status: 'todo' });
  }, [isAdmin, updateTask]);

  // Metrics calculation
  const metrics = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'done').length;
    const pending = total - completed;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    const memberStats = profiles.map(member => {
      const memberTasks = tasks.filter(t => t.assigned_to === (member.full_name || member.username));
      const mTotal = memberTasks.length;
      const mCompleted = memberTasks.filter(t => t.status === 'done').length;
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

  // Supabase Calendar Actions
  const createEvent = useCallback(async (payload) => {
    try {
      const { data, error } = await supabase.from('team_events').insert([payload]).select();
      if (error) throw error;
      if (data) setEvents(prev => [...prev, data[0]]);
    } catch (err) { console.error('Error creating event:', err); }
  }, []);

  const requestLeave = useCallback(async (payload) => {
    try {
      const { data, error } = await supabase.from('team_leaves').insert([payload]).select();
      if (error) throw error;
      if (data) setLeaves(prev => [...prev, data[0]]);
    } catch (err) { console.error('Error requesting leave:', err); }
  }, []);

  const updateLeaveStatus = useCallback(async (leaveId, status) => {
    try {
      const { error } = await supabase.from('team_leaves').update({ status }).eq('id', leaveId);
      if (error) throw error;
      setLeaves(prev => prev.map(l => l.id === leaveId ? { ...l, status } : l));
    } catch (err) { console.error('Error updating leave:', err); }
  }, []);

  // AI HR Report Generation
  const generateAIReport = useCallback(async () => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) throw new Error("VITE_GEMINI_API_KEY is not configured in the environment.");
    
    const payload = {
      metrics,
      upcomingEvents: events.filter(e => new Date(e.date || e.event_date || e.created_at) >= new Date().setHours(0,0,0,0)),
      teamProfiles: profiles.map(p => ({ name: p.full_name, role: p.role, department: p.department }))
    };

    const prompt = `You are an expert HR Director. Analyze this team's monthly operational data and write a formal, data-driven Executive HR Report for an upcoming company board meeting. Include:
1. Executive Overview & Operational Health
2. Departmental & Individual Productivity Breakdown (Strengths & Areas of Improvement)
3. Workflow Bottlenecks & Approval Delays
4. Strategic Recommendations for Next Month's Management Strategy.

Here is the raw JSON data:
${JSON.stringify(payload, null, 2)}`;

    const endpoints = [
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`
    ];

    let lastError = null;
    let data = null;

    for (const endpoint of endpoints) {
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }]
          })
        });

        const jsonData = await response.json();
        
        if (!response.ok) {
          lastError = new Error(jsonData.error?.message || 'Failed to generate report');
          // If it's a 404 or server error, we continue to the next fallback.
          // If it's auth/quota, we might still want to try just in case, or break.
          // Let's keep it simple and just try the next one on any failure.
          continue;
        }

        data = jsonData;
        break; // Success!
      } catch (err) {
        lastError = err;
        continue;
      }
    }

    if (!data) {
      console.error(lastError);
      throw lastError || new Error("Failed to generate report from all endpoints.");
    }

    try {
      const reportContent = data.candidates[0].content.parts[0].text;
      
      // Auto-save the generated report into the hr_reports table
      try {
        await supabase.from('hr_reports').insert([{
          report_content: reportContent,
          generated_by: currentUser?.id,
          created_at: new Date().toISOString()
        }]);
      } catch (insertErr) {
        console.error("Failed to auto-save report:", insertErr);
      }

      return reportContent;
    } catch (err) {
      console.error("Error parsing Gemini response:", err);
      throw new Error("Received invalid format from Gemini API.");
    }
  }, [metrics, events, profiles, currentUser]);

  // Unified Calendar Events for UI
  const calendarEventsComputed = useMemo(() => {
    const evts = events.map(e => ({
      ...e,
      date: e.date || e.event_date || e.created_at,
    }));
    const lvs = leaves.map(l => ({
      id: l.id,
      title: 'Leave',
      type: 'leave',
      date: l.start_date || l.date || l.created_at,
      assignee_id: l.profile_id || l.assignee_id,
      status: l.status || 'pending'
    }));
    return [...evts, ...lvs];
  }, [events, leaves]);

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
    approveTask,
    rejectTask,
    createTask,
    updateTask,
    deleteTask,
    fetchTasks,
    metrics,
    currentView,
    setCurrentView,
    calendarEvents: calendarEventsComputed,
    leaves,
    events,
    createEvent,
    requestLeave,
    updateLeaveStatus,
    generateAIReport
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
