import React, { useState } from 'react';
import { useTasks } from '../context/TaskContext';
import UserSwitcher from './UserSwitcher';
import SupabaseConfigModal from './SupabaseConfigModal';
import CreateTaskModal from './CreateTaskModal';
import { 
  CheckSquare, 
  Plus, 
  Database, 
  Radio, 
  Sparkles, 
  HelpCircle,
  Clock,
  Layers
} from 'lucide-react';

export default function Navbar() {
  const { isSupabaseLive, currentUser, lastSyncTime } = useTasks();
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-slate-950/85 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Brand & Title */}
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25 ring-2 ring-indigo-400/30">
              <CheckSquare size={22} className="stroke-[2.5]" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-extrabold tracking-tight text-white">
                  TeamSync
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  6-Person Team
                </span>
              </div>
              <span className="text-[11px] text-slate-400 block -mt-0.5">
                Task Management & Realtime Operations
              </span>
            </div>
          </div>

          {/* Right Actions: Realtime status, Supabase Settings, Create Task, User Switcher */}
          <div className="flex items-center gap-2.5 sm:gap-3.5">
            {/* Realtime Status Badge */}
            <button
              onClick={() => setIsSupabaseModalOpen(true)}
              className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-all text-xs group"
              title="Click to view Supabase Realtime backend settings"
            >
              <span className="relative flex h-2 w-2">
                <span
                  className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                    isSupabaseLive ? 'bg-emerald-400' : 'bg-indigo-400'
                  }`}
                />
                <span
                  className={`relative inline-flex rounded-full h-2 w-2 ${
                    isSupabaseLive ? 'bg-emerald-500' : 'bg-indigo-500'
                  }`}
                />
              </span>
              <span className="font-semibold text-slate-300 group-hover:text-white">
                {isSupabaseLive ? 'Supabase Live' : 'Realtime Sync'}
              </span>
              <Database size={13} className="text-slate-500 group-hover:text-indigo-400 transition-colors" />
            </button>

            {/* Quick Add Task Button */}
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white transition-all shadow-md shadow-indigo-600/25 hover:scale-105 active:scale-95"
            >
              <Plus size={15} className="stroke-[3]" />
              <span className="hidden sm:inline">New Task</span>
            </button>

            {/* Role & User Switcher Dropdown */}
            <UserSwitcher />
          </div>
        </div>
      </header>

      {/* Supabase & Create Task Modals */}
      <SupabaseConfigModal
        isOpen={isSupabaseModalOpen}
        onClose={() => setIsSupabaseModalOpen(false)}
      />

      <CreateTaskModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </>
  );
}
