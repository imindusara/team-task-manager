import React from 'react';
import { TaskProvider, useTasks } from './context/TaskContext';
import Navbar from './components/Navbar';
import LoginView from './components/LoginView';
import ManagerDashboard from './components/ManagerDashboard';
import StaffDashboard from './components/StaffDashboard';
import CalendarView from './components/CalendarView';
import RemindersListView from './components/RemindersListView';
import ProjectsView from './components/ProjectsView';
import { ShieldCheck } from 'lucide-react';

function DashboardView() {
  const { currentUser, authLoading, isAdmin, currentView } = useTasks();

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-300 gap-3">
        <div className="w-8 h-8 border-3 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
        <span className="text-xs font-semibold text-slate-400">Verifying Supabase Session...</span>
      </div>
    );
  }

  if (!currentUser) {
    return <LoginView />;
  }

  return (
    <div className="min-h-screen flex flex-col justify-between bg-slate-950 text-slate-100">
      <div>
        <Navbar />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {currentView === 'reminders' ? (
            <RemindersListView />
          ) : currentView === 'projects' ? (
            <ProjectsView />
          ) : currentView === 'calendar' ? (
            <CalendarView />
          ) : isAdmin ? (
            <ManagerDashboard />
          ) : (
            <StaffDashboard />
          )}
        </main>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950/90 py-4 px-4 mt-12">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <ShieldCheck size={14} className="text-emerald-400" />
            <span>Authenticated as <strong className="text-slate-200">{currentUser.full_name || currentUser.username}</strong> ({currentUser.department} &bull; {currentUser.role})</span>
          </div>

          <div className="text-[11px] text-slate-400">
            Supabase Live Database &bull; Realtime Sync Active
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <TaskProvider>
      <DashboardView />
    </TaskProvider>
  );
}
