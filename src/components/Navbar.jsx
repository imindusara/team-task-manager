import React, { useState } from 'react';
import { useTasks } from '../context/TaskContext';
import CreateTaskModal from './CreateTaskModal';
import { 
  CheckSquare, 
  Plus, 
  LogOut, 
  ShieldCheck, 
  User,
  ChevronDown
} from 'lucide-react';
import { getDepartmentBadge } from '../lib/demoData';

export default function Navbar() {
  const { 
    currentUser, 
    isAdmin, 
    logout, 
    isRealtimeLive 
  } = useTasks();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Brand Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25 ring-2 ring-indigo-400/30">
              <CheckSquare size={22} className="stroke-[2.5]" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-black tracking-tight text-white">
                  TeamSync
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Supabase Live
                </span>
              </div>
              <span className="text-[11px] text-slate-400 block -mt-0.5">
                6-Person Task & Workflow Board
              </span>
            </div>
          </div>

          {/* Right Header Navigation */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Realtime Pulsing Badge */}
            <div 
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs font-semibold text-slate-300"
              title="Supabase Realtime channel active"
            >
              <span className="relative flex h-2 w-2">
                <span
                  className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                    isRealtimeLive ? 'bg-emerald-400' : 'bg-indigo-400'
                  }`}
                />
                <span
                  className={`relative inline-flex rounded-full h-2 w-2 ${
                    isRealtimeLive ? 'bg-emerald-500' : 'bg-indigo-500'
                  }`}
                />
              </span>
              <span className="text-[11px]">
                {isRealtimeLive ? 'Realtime Connected' : 'Syncing'}
              </span>
            </div>

            {/* Admin: + New Task Button */}
            {isAdmin && (
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-xs font-bold text-white transition-all shadow-md shadow-indigo-600/25 hover:scale-105 active:scale-95"
              >
                <Plus size={15} className="stroke-[3]" />
                <span className="hidden sm:inline">New Task</span>
              </button>
            )}

            {/* Authenticated User Profile */}
            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-left transition-all"
              >
                <div className="relative">
                  <img
                    src={currentUser?.avatar_url}
                    alt={currentUser?.full_name}
                    className="w-8 h-8 rounded-full object-cover ring-2 ring-indigo-500/40"
                  />
                  <span
                    className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-slate-900 ${
                      isAdmin ? 'bg-amber-400' : 'bg-emerald-400'
                    }`}
                  />
                </div>

                <div className="hidden md:block text-left">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-100 leading-none">
                      {currentUser?.full_name || currentUser?.username}
                    </span>
                    {isAdmin ? (
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                        Admin
                      </span>
                    ) : (
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-medium">
                        Member
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400 block leading-tight mt-0.5">
                    {currentUser?.department}
                  </span>
                </div>

                <ChevronDown size={14} className="text-slate-400" />
              </button>

              {/* Profile Menu Dropdown */}
              {isUserMenuOpen && (
                <div 
                  className="absolute right-0 mt-2 w-60 rounded-2xl glass-panel p-2 shadow-2xl border border-slate-700 z-50 animate-slide-up"
                  onMouseLeave={() => setIsUserMenuOpen(false)}
                >
                  <div className="px-3 py-2 border-b border-slate-800/80 mb-2">
                    <span className="text-xs font-bold text-white block">
                      {currentUser?.full_name}
                    </span>
                    <span className="text-[11px] text-slate-400 block">
                      {currentUser?.email}
                    </span>
                    <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded mt-1.5 border ${getDepartmentBadge(currentUser?.department)}`}>
                      {currentUser?.department} &bull; {currentUser?.role}
                    </span>
                  </div>

                  <button
                    onClick={logout}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-500/10 transition-colors"
                  >
                    <LogOut size={14} />
                    Sign Out (Logout)
                  </button>
                </div>
              )}
            </div>

            {/* Direct Logout Button */}
            <button
              onClick={logout}
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors"
              title="Sign Out (Logout)"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </header>

      {/* Create Task Modal */}
      {isAdmin && (
        <CreateTaskModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
        />
      )}
    </>
  );
}
