import React from 'react';
import { TaskProvider, useTasks } from './context/TaskContext';
import Navbar from './components/Navbar';
import ManagerDashboard from './components/ManagerDashboard';
import StaffDashboard from './components/StaffDashboard';
import { 
  Users, 
  ShieldCheck, 
  CheckCircle2, 
  Clock, 
  HeartHandshake, 
  Calendar, 
  Layers,
  Sparkles
} from 'lucide-react';

function DashboardView() {
  const { currentUser, profiles, setCurrentUser } = useTasks();

  return (
    <div className="min-h-screen flex flex-col justify-between">
      <div>
        <Navbar />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {currentUser?.role === 'manager' ? (
            <ManagerDashboard />
          ) : (
            <StaffDashboard />
          )}
        </main>
      </div>

      {/* Persistent Quick Member Switcher Strip at bottom */}
      <footer className="border-t border-slate-800/80 bg-slate-950/90 py-4 px-4 mt-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-2 text-slate-400">
            <Users size={14} className="text-indigo-400" />
            <span className="font-semibold text-slate-300">Quick Test Switcher:</span>
            <span className="hidden sm:inline">Click any team avatar to view their screen</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {profiles.map((profile) => {
              const isSelected = profile.id === currentUser?.id;
              return (
                <button
                  key={profile.id}
                  onClick={() => setCurrentUser(profile)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl transition-all ${
                    isSelected
                      ? 'bg-indigo-600 text-white font-bold ring-2 ring-indigo-400/40 shadow-sm'
                      : 'bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                  title={`${profile.name} (${profile.title})`}
                >
                  <img
                    src={profile.avatar_url}
                    alt={profile.name}
                    className="w-4 h-4 rounded-full object-cover"
                  />
                  <span className="text-[11px] truncate max-w-[80px]">
                    {profile.name.split(' ')[0]}
                  </span>
                  {profile.role === 'manager' && (
                    <span className="text-[9px] px-1 py-0.2 bg-amber-500/20 text-amber-300 rounded font-semibold">
                      Admin
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="text-[11px] text-slate-400">
            Realtime Task Manager &bull; React + Tailwind + Supabase
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
