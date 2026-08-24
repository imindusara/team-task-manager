import React from 'react';
import { TaskProvider, useTasks } from './context/TaskContext';
import Navbar from './components/Navbar';
import LoginView from './components/LoginView';
import ManagerDashboard from './components/ManagerDashboard';
import StaffDashboard from './components/StaffDashboard';
import { Users } from 'lucide-react';

function DashboardView() {
  const { currentUser, authLoading, isAdmin, profiles, setCurrentUser } = useTasks();

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-300 gap-3">
        <div className="w-8 h-8 border-3 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
        <span className="text-xs font-semibold text-slate-400">Connecting to Supabase Workspace...</span>
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
          {isAdmin ? (
            <ManagerDashboard />
          ) : (
            <StaffDashboard />
          )}
        </main>
      </div>

      {/* Persistent Quick Member Switcher Strip at bottom */}
      <footer className="border-t border-slate-800/80 bg-slate-950/90 py-3 px-4 mt-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-400">
            <Users size={14} className="text-indigo-400" />
            <span className="font-bold text-slate-300">Quick Test Switcher (6 Members):</span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {profiles.map((profile) => {
              const isSelected = profile.id === currentUser?.id;
              const isHRAdmin = profile.role === 'admin' || profile.department === 'HR';

              return (
                <button
                  key={profile.id}
                  onClick={() => setCurrentUser(profile)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl transition-all ${
                    isSelected
                      ? 'bg-indigo-600 text-white font-bold ring-2 ring-indigo-400/40 shadow-sm'
                      : 'bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                  title={`${profile.full_name} (${profile.department})`}
                >
                  <img
                    src={profile.avatar_url}
                    alt={profile.full_name}
                    className="w-4 h-4 rounded-full object-cover"
                  />
                  <span className="text-[11px] truncate max-w-[85px]">
                    {profile.full_name?.split(' ')[0] || profile.username}
                  </span>
                  {isHRAdmin && (
                    <span className="text-[8px] px-1 py-0.2 bg-amber-500/20 text-amber-300 rounded font-bold">
                      HR
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="text-[11px] text-slate-400">
            Supabase Live &bull; Realtime Sync Active
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
