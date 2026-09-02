import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { supabase } from '../lib/supabase';
import { TEAM_MEMBERS } from '../lib/demoData';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { toDateStringOnly } from '../lib/dateUtils';

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || '');

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

  // View, Calendar, Projects & Work Roster states
  const [currentView, setCurrentView] = useState('dashboard'); // 'dashboard', 'projects', or 'calendar'
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [workRosters, setWorkRosters] = useState([]);
  const [projects, setProjects] = useState([]);

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

  // 2b. Fetch Calendar Events strictly from public.calendar_events
  const fetchCalendarEvents = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('calendar_events')
        .select('*')
        .order('start_date', { ascending: true });
      if (!error && data) {
        setCalendarEvents(data);
      } else if (error) {
        // Graceful fallback if table is newly created or empty
        console.warn('Notice from calendar_events fetch:', error.message);
      }
    } catch (err) {
      console.error('calendar_events fetch exception:', err);
    }
  }, []);

  // 2c. Fetch Daily Work Rosters strictly from public.work_roster
  const fetchWorkRosters = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('work_roster')
        .select('*')
        .order('date', { ascending: true });
      if (!error && data) {
        setWorkRosters(data);
      } else if (error) {
        console.warn('Notice from work_roster fetch:', error.message);
      }
    } catch (err) {
      console.error('work_roster fetch exception:', err);
    }
  }, []);

  // 2d. Fetch Projects strictly from public.projects
  const fetchProjects = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error && data) {
        setProjects(data);
      } else if (error) {
        console.warn('Notice from projects fetch:', error.message);
        setProjects([]);
      }
    } catch (err) {
      console.warn('projects fetch exception:', err);
      setProjects([]);
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
          await fetchCalendarEvents();
          await fetchWorkRosters();
          await fetchProjects();
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
          fetchCalendarEvents();
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
  }, [fetchProfiles, fetchTasks, fetchCalendarEvents]);

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
        { event: '*', schema: 'public', table: 'calendar_events' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setCalendarEvents(prev => {
              // Avoid duplicate if optimistic temp id exists or id matches
              const exists = prev.some(e => e.id === payload.new.id);
              if (exists) return prev;
              return [...prev, payload.new];
            });
          } else if (payload.eventType === 'UPDATE') {
            setCalendarEvents(prev => prev.map(e => e.id === payload.new.id ? payload.new : e));
          } else if (payload.eventType === 'DELETE') {
            setCalendarEvents(prev => prev.filter(e => e.id !== payload.old.id));
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'work_roster' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setWorkRosters(prev => {
              const exists = prev.some(r => r.date === payload.new.date || r.id === payload.new.id);
              if (exists) return prev.map(r => (r.date === payload.new.date || r.id === payload.new.id ? payload.new : r));
              return [...prev, payload.new];
            });
          } else if (payload.eventType === 'UPDATE') {
            setWorkRosters(prev => prev.map(r => (r.date === payload.new.date || r.id === payload.new.id ? payload.new : r)));
          } else if (payload.eventType === 'DELETE') {
            setWorkRosters(prev => prev.filter(r => r.id !== payload.old.id && r.date !== payload.old.date));
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'projects' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setProjects(prev => {
              const exists = prev.some(p => p.id === payload.new.id);
              if (exists) return prev;
              const next = [payload.new, ...prev];
              localStorage.setItem('univerz_projects_data', JSON.stringify(next));
              return next;
            });
          } else if (payload.eventType === 'UPDATE') {
            setProjects(prev => {
              const next = prev.map(p => (p.id === payload.new.id ? payload.new : p));
              localStorage.setItem('univerz_projects_data', JSON.stringify(next));
              return next;
            });
          } else if (payload.eventType === 'DELETE') {
            setProjects(prev => {
              const next = prev.filter(p => p.id !== payload.old.id);
              localStorage.setItem('univerz_projects_data', JSON.stringify(next));
              return next;
            });
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

  // Role permissions: HR / Admins (Ashan & Widura) have full management rights
  const isAdmin = useMemo(() => {
    if (!currentUser) return false;
    const role = (currentUser.role || '').toLowerCase();
    const dept = (currentUser.department || '').toLowerCase();
    const username = (currentUser.username || '').toLowerCase();
    const name = (currentUser.full_name || '').toLowerCase();
    return (
      role === 'admin' ||
      role === 'manager' ||
      role === 'hr' ||
      dept === 'hr' ||
      username === 'ashan' ||
      username === 'widura' ||
      name.includes('ashan') ||
      name.includes('widura')
    );
  }, [currentUser]);

  // Approve / Reject workflows (HR/Admin only)
  const approveTask = useCallback(async (taskId) => {
    if (!isAdmin) return;
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ status: 'done' })
        .eq('id', taskId);

      if (error) {
        console.error("Failed to approve task in Supabase:", error);
        alert("Failed to update database: " + error.message);
        return;
      }

      setTasks(prev => prev.map(t => (t.id === taskId ? { ...t, status: 'done' } : t)));
      setLastSyncTime(new Date());
      triggerConfetti();
    } catch (err) {
      console.error("Exception in approveTask:", err);
      alert("Failed to update database: " + err.message);
    }
  }, [isAdmin, triggerConfetti]);

  const rejectTask = useCallback(async (taskId) => {
    if (!isAdmin) return;
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ status: 'todo' })
        .eq('id', taskId);

      if (error) {
        console.error("Failed to reject task in Supabase:", error);
        alert("Failed to update database: " + error.message);
        return;
      }

      setTasks(prev => prev.map(t => (t.id === taskId ? { ...t, status: 'todo' } : t)));
      setLastSyncTime(new Date());
    } catch (err) {
      console.error("Exception in rejectTask:", err);
      alert("Failed to update database: " + err.message);
    }
  }, [isAdmin]);

  // Metrics calculation
  const metrics = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'done').length;
    const pending = total - completed;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    const memberStats = profiles.map(member => {
      const memberTasks = tasks.filter(t => {
        const a = t.assigned_to;
        return (
          a === member.id ||
          a === member.full_name ||
          a === member.username ||
          a?.toLowerCase() === member.full_name?.toLowerCase() ||
          a?.toLowerCase() === member.username?.toLowerCase()
        );
      });
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

  // Helper to normalize event type string
  const normalizeEventType = (rawType) => {
    if (!rawType) return 'meeting';
    const t = rawType.toLowerCase().trim();
    if (t.includes('leave')) return 'leave';
    if (t.includes('meeting') || t.includes('sync')) return 'meeting';
    if (t.includes('holiday') || t.includes('poya')) return 'holiday';
    if (t.includes('reminder') || t.includes('review')) return 'reminder';
    return t;
  };

  // Supabase Calendar Actions (Direct CRUD on public.calendar_events)
  const createCalendarEvent = useCallback(async (eventData) => {
    const rawType = eventData.event_type || eventData.type || 'meeting';
    const normalizedType = normalizeEventType(rawType);
    const isLeave = normalizedType === 'leave';

    // Handle user_ids array for multi-member support
    let userIds = [];
    if (Array.isArray(eventData.user_ids)) {
      userIds = eventData.user_ids;
    } else if (eventData.member_id) {
      userIds = [eventData.member_id];
    } else if (isLeave) {
      userIds = [eventData.assignee_id || currentUser?.id].filter(Boolean);
    }

    const payload = {
      title: eventData.title.trim(),
      event_type: normalizedType,
      user_ids: userIds,
      member_id: userIds.length === 1 ? userIds[0] : (eventData.member_id || null),
      member_name: eventData.member_name || null,
      start_date: eventData.start_date || toDateStringOnly(eventData.date || new Date()),
      end_date: eventData.end_date || null,
      all_day: eventData.all_day ?? true,
      description: (eventData.description || eventData.notes || '').trim() || null,
      status: eventData.status || (isLeave ? (isAdmin ? 'approved' : 'pending') : 'approved'),
      created_by: currentUser?.id || null
    };

    // Optimistic insert
    const tempId = 'temp-' + Date.now();
    const optimisticEvent = {
      ...payload,
      id: tempId,
      created_at: new Date().toISOString()
    };
    setCalendarEvents(prev => [...prev, optimisticEvent]);

    try {
      const { data, error } = await supabase
        .from('calendar_events')
        .insert([payload])
        .select();

      if (!error && data && data[0]) {
        setCalendarEvents(prev => prev.map(e => (e.id === tempId ? data[0] : e)));
        if (payload.status === 'approved' && isLeave) {
          triggerConfetti();
        }
        return data[0];
      } else if (error) {
        console.error('Error inserting into calendar_events in Supabase:', error);
        throw error;
      }
    } catch (err) {
      console.error('Exception creating calendar event:', err);
      throw err;
    }
  }, [currentUser, isAdmin, triggerConfetti]);

  const updateCalendarEvent = useCallback(async (eventId, updates) => {
    setCalendarEvents(prev => prev.map(e => (e.id === eventId ? { ...e, ...updates } : e)));

    try {
      const { data, error } = await supabase
        .from('calendar_events')
        .update(updates)
        .eq('id', eventId)
        .select();

      if (error) {
        console.error('Error updating calendar_events in Supabase:', error);
        throw error;
      }
      return data?.[0];
    } catch (err) {
      console.error('Exception updating calendar event:', err);
      throw err;
    }
  }, []);

  const deleteCalendarEvent = useCallback(async (eventId) => {
    setCalendarEvents(prev => prev.filter(e => e.id !== eventId));

    try {
      const { error } = await supabase
        .from('calendar_events')
        .delete()
        .eq('id', eventId);

      if (error) {
        console.error('Error deleting calendar_events in Supabase:', error);
        throw error;
      }
    } catch (err) {
      console.error('Exception deleting calendar event:', err);
      throw err;
    }
  }, []);

  const updateLeaveStatus = useCallback(async (leaveId, status) => {
    if (!isAdmin) return;
    setCalendarEvents(prev => prev.map(e => (e.id === leaveId ? { ...e, status } : e)));

    if (status === 'approved') {
      triggerConfetti();
    }

    try {
      const { error } = await supabase
        .from('calendar_events')
        .update({ status })
        .eq('id', leaveId);

      if (error) {
        console.error('Error updating leave status in Supabase:', error);
      }
    } catch (err) {
      console.error('Exception in updateLeaveStatus:', err);
    }
  }, [isAdmin, triggerConfetti]);

  // Work Roster / Daily Duty Schedule Actions
  const saveDailyRoster = useCallback(async (dateStr, assignedMemberIds, notes = '') => {
    const formattedDate = toDateStringOnly(dateStr);
    const memberIds = Array.isArray(assignedMemberIds) ? assignedMemberIds : [];

    const payload = {
      date: formattedDate,
      assigned_member_ids: memberIds,
      notes: notes?.trim() || null,
      created_by: currentUser?.id || null
    };

    // Optimistic state update
    setWorkRosters(prev => {
      const existingIdx = prev.findIndex(r => r.date === formattedDate);
      if (existingIdx >= 0) {
        const next = [...prev];
        next[existingIdx] = { ...next[existingIdx], ...payload };
        return next;
      }
      return [...prev, { ...payload, id: 'temp-' + Date.now(), created_at: new Date().toISOString() }];
    });

    try {
      const { data, error } = await supabase
        .from('work_roster')
        .upsert([payload], { onConflict: 'date' })
        .select();

      if (!error && data && data[0]) {
        setWorkRosters(prev => prev.map(r => (r.date === formattedDate ? data[0] : r)));
        return data[0];
      } else if (error) {
        console.error('Error saving daily roster in Supabase:', error);
        throw error;
      }
    } catch (err) {
      console.error('Exception saving daily roster:', err);
      throw err;
    }
  }, [currentUser]);

  const deleteDailyRoster = useCallback(async (dateStr) => {
    const formattedDate = toDateStringOnly(dateStr);
    setWorkRosters(prev => prev.filter(r => r.date !== formattedDate));

    try {
      const { error } = await supabase
        .from('work_roster')
        .delete()
        .eq('date', formattedDate);

      if (error) {
        console.error('Error deleting daily roster in Supabase:', error);
        throw error;
      }
    } catch (err) {
      console.error('Exception deleting daily roster:', err);
      throw err;
    }
  }, []);

  // Backward compatibility alias methods
  const createEvent = useCallback(async (payload) => {
    return createCalendarEvent(payload);
  }, [createCalendarEvent]);

  const requestLeave = useCallback(async (payload) => {
    return createCalendarEvent({
      ...payload,
      event_type: 'leave',
      status: isAdmin ? 'approved' : 'pending'
    });
  }, [createCalendarEvent, isAdmin]);

  // Local Executive Report Fallback Generator
  const generateLocalExecutiveReport = (payload) => {
    const { metrics, upcomingEvents, teamProfiles } = payload;
    
    // Department-wise stats aggregation
    const deptStats = {};
    metrics.memberStats.forEach(member => {
      const dept = member.department || 'General';
      if (!deptStats[dept]) {
        deptStats[dept] = { total: 0, completed: 0, pending: 0, members: [] };
      }
      deptStats[dept].total += member.totalTasks;
      deptStats[dept].completed += member.completedTasks;
      deptStats[dept].pending += member.pendingTasks;
      deptStats[dept].members.push(member.full_name || member.username);
    });

    const deptLines = Object.entries(deptStats).map(([dept, stat]) => {
      const rate = stat.total > 0 ? Math.round((stat.completed / stat.total) * 100) : 0;
      return `### 💼 ${dept} Department
- **Team Members:** ${stat.members.join(', ')}
- **Task Status:** ${stat.completed} completed, ${stat.pending} pending (Total: ${stat.total})
- **Completion Rate:** \`${rate}%\``;
    }).join('\n\n');

    const memberBreakdowns = metrics.memberStats.map(m => {
      return `- **${m.full_name || m.username}** (${m.role}): Completed **${m.completedTasks}** of **${m.totalTasks}** assigned tasks (Completion Rate: \`${m.completionRate}%\`)`;
    }).join('\n');

    const upcomingEventsLines = upcomingEvents.length > 0
      ? upcomingEvents.map(e => `- 🗓️ **${e.title || 'Event'}** on \`${new Date(e.date || e.event_date || e.created_at).toLocaleDateString()}\` (${e.description || 'No description'})`).join('\n')
      : "- No upcoming team events scheduled.";

    const currentDate = new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    return `# 📊 Company Executive HR Report
**Generated on:** ${currentDate}
**Status:** ⚠️ Local Offline Fallback Generator (Gemini Service Unavailable)

---

## 📈 1. Executive Summary & Operational Health
- **Total Registered Team Members:** ${teamProfiles.length} members
- **Company-Wide Task Volume:** **${metrics.total}** active tasks
- **Tasks Completed:** **${metrics.completed}** completed items
- **Awaiting Handover / Pending Checklist:** **${metrics.pending}** pending items
- **Overall Operational Efficiency:** \`${metrics.completionRate}%\` completion rate

---

## 🏢 2. Departmental Breakdown
${deptLines}

---

## 👥 3. Individual Productivity Metrics
${memberBreakdowns}

---

## 🗓️ 4. Upcoming Team Events & Leaves
${upcomingEventsLines}

---

## ⚡ 5. Strategic Recommendations & Bottlenecks
1. **Unassigned / Overdue Checks:** There are currently **${metrics.pending}** tasks requiring active attention. Ensure priorities are set appropriately.
2. **Weekly Workflow Alignment:** Conduct departmental check-ins for teams with completion rates below 80% to address capacity issues.
3. **Cross-Department Support:** Share resources from higher-performing departments to clear backlogs in slower queues.
`;
  };

  // AI HR Report Generation
  const generateAIReport = useCallback(async () => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    
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

    const MODEL_CANDIDATES = [
      "gemini-1.5-flash-latest",
      "gemini-1.5-flash",
      "gemini-2.0-flash",
      "gemini-1.5-pro-latest"
    ];

    let reportContent = null;
    let lastError = null;

    if (apiKey) {
      try {
        const genAI = new GoogleGenerativeAI(apiKey);
        for (const modelName of MODEL_CANDIDATES) {
          try {
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();
            if (text) {
              reportContent = text;
              break;
            }
          } catch (err) {
            console.warn(`Model ${modelName} failed:`, err);
            lastError = err;
          }
        }
      } catch (err) {
        console.error("SDK initialization error:", err);
      }
    } else {
      console.warn("Gemini API Key is missing in environment. Using local fallback report.");
    }

    // Offline / Local fallback if all external models fail or API Key is missing
    if (!reportContent) {
      console.warn("All model candidates failed or key is missing. Generating structured local report fallback.");
      reportContent = generateLocalExecutiveReport(payload);
    }

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
  }, [metrics, calendarEvents, profiles, currentUser]);

  // Unified Normalized Calendar Events for UI
  const calendarEventsComputed = useMemo(() => {
    return calendarEvents.map(e => {
      const normalizedType = normalizeEventType(e.event_type || e.type);

      // Extract user_ids array
      let userIds = [];
      if (Array.isArray(e.user_ids) && e.user_ids.length > 0) {
        userIds = e.user_ids;
      } else if (e.member_id) {
        userIds = [e.member_id];
      } else if (e.assignee_id) {
        userIds = [e.assignee_id];
      }

      const isAllTeam = userIds.length === 0 || (profiles.length > 0 && userIds.length >= profiles.length);

      return {
        ...e,
        title: e.title || (normalizedType === 'leave' ? 'Leave Request' : 'Untitled Event'),
        type: normalizedType,
        event_type: normalizedType,
        user_ids: userIds,
        member_id: userIds[0] || e.member_id || null,
        assignee_id: userIds[0] || e.assignee_id || e.member_id || null,
        member_name: e.member_name || '',
        is_all_team: isAllTeam,
        date: e.start_date || e.date || e.created_at,
        start_date: e.start_date || e.date || e.created_at,
        end_date: e.end_date || null,
        all_day: e.all_day ?? true,
        description: e.description || '',
        notes: e.description || '',
        status: e.status || 'approved',
        created_by: e.created_by
      };
    });
  }, [calendarEvents, profiles]);

  const leaves = useMemo(() => {
    return calendarEventsComputed.filter(e => e.type === 'leave');
  }, [calendarEventsComputed]);

  // Project CRUD Actions
  const createProject = useCallback(async (projectData) => {
    const newProject = {
      id: 'proj-' + Date.now(),
      name: projectData.name?.trim() || 'Untitled Project',
      client_name: (projectData.client_name || '').trim(),
      project_type: projectData.project_type || 'Web Development',
      lead_id: projectData.lead_id || null,
      lead_name: projectData.lead_name || '',
      supporting_member_ids: Array.isArray(projectData.supporting_member_ids) ? projectData.supporting_member_ids : [],
      status: projectData.status || 'In Progress',
      website_url: (projectData.website_url || '').trim() || null,
      deadline: projectData.deadline || null,
      description: (projectData.description || '').trim() || '',
      created_at: new Date().toISOString()
    };

    setProjects(prev => [newProject, ...prev.filter(p => p.id !== newProject.id)]);

    triggerConfetti();

    try {
      const { data, error } = await supabase
        .from('projects')
        .insert([newProject])
        .select();

      if (!error && data && data[0]) {
        setProjects(prev => [data[0], ...prev.filter(p => p.id !== newProject.id && p.id !== data[0].id)]);
        return data[0];
      }
    } catch (err) {
      console.warn('Supabase projects insert exception:', err);
    }
    return newProject;
  }, [triggerConfetti]);

  const updateProject = useCallback(async (projectId, updates) => {
    setProjects(prev => prev.map(p => (p.id === projectId ? { ...p, ...updates } : p)));

    try {
      await supabase
        .from('projects')
        .update(updates)
        .eq('id', projectId);
    } catch (err) {
      console.warn('Error updating project in Supabase:', err);
    }
  }, []);

  const deleteProject = useCallback(async (projectId) => {
    setProjects(prev => prev.filter(p => p.id !== projectId));

    try {
      await supabase
        .from('projects')
        .delete()
        .eq('id', projectId);
    } catch (err) {
      console.warn('Error deleting project in Supabase:', err);
    }
  }, []);

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
    rawCalendarEvents: calendarEvents,
    leaves,
    createCalendarEvent,
    updateCalendarEvent,
    deleteCalendarEvent,
    fetchCalendarEvents,
    workRosters,
    saveDailyRoster,
    deleteDailyRoster,
    fetchWorkRosters,
    projects,
    fetchProjects,
    createProject,
    updateProject,
    deleteProject,
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
