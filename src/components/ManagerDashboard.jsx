import React, { useState } from 'react';
import { useTasks } from '../context/TaskContext';
import TeamProgressGrid from './TeamProgressGrid';
import TaskCard from './TaskCard';
import CreateTaskModal from './CreateTaskModal';
import { 
  Plus, 
  Search, 
  CheckCircle2, 
  Clock, 
  Layers, 
  Calendar, 
  HeartHandshake, 
  Sparkles,
  ShieldCheck,
  Zap,
  User,
  Users
} from 'lucide-react';
import { getDepartmentBadge } from '../lib/demoData';

export default function ManagerDashboard() {
  const {
    tasks,
    profiles,
    metrics,
    currentUser,
    isAdmin,
    selectedStatus,
    setSelectedStatus,
    selectedPriority,
    setSelectedPriority,
    searchQuery,
    setSearchQuery
  } = useTasks();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Strictly filter tasks to ONLY the logged in user's assigned tasks
  const myTasks = tasks.filter((t) => t.assigned_to === (currentUser?.full_name || currentUser?.username));

  // Filter tasks by status, priority, search
  const filteredTasks = myTasks.filter((task) => {
    if (selectedStatus === 'pending' && task.status === 'done') return false;
    if (selectedStatus === 'review' && task.status !== 'review') return false;
    if (selectedStatus === 'completed' && task.status !== 'done') return false;
    
    if (selectedPriority !== 'all' && (task.priority || '').toLowerCase() !== selectedPriority.toLowerCase()) return false;
    
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = (task.title || '').toLowerCase().includes(q);
      const matchDesc = (task.description || '').toLowerCase().includes(q);
      if (!matchTitle && !matchDesc) return false;
    }
    return true;
  });

  const myTotal = myTasks.length;
  const myCompleted = myTasks.filter((t) => t.status === 'done').length;
  const myPending = myTotal - myCompleted;
  const myRate = myTotal > 0 ? Math.round((myCompleted / myTotal) * 100) : 0;

  const allReviewTasks = tasks.filter(t => t.status === 'review');

  const handleOpenCreate = () => {
    setIsCreateModalOpen(true);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Admin Operations Banner */}
      <div className="rounded-3xl glass-panel p-6 sm:p-7 border border-slate-800 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold mb-3">
              <ShieldCheck size={14} />
              HR & Admin Management Panel ({currentUser?.full_name})
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Company Task & Workflow Hub
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl">
              Assign and monitor Daily Checklists, Weekly Goals, and HR tasks for all 6 company members in real time.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleOpenCreate()}
              disabled={!isAdmin}
              title={!isAdmin ? "Only HR/Admin can assign tasks" : ""}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white transition-all shadow-lg ${
                isAdmin 
                  ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 shadow-indigo-600/30 hover:scale-[1.02] active:scale-[0.98]'
                  : 'bg-slate-700 opacity-50 cursor-not-allowed'
              }`}
            >
              <Plus size={16} className="stroke-[3]" />
              Assign New Task
            </button>
          </div>
        </div>

        {/* Personal KPIs for Logged-In User */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mt-6 pt-6 border-t border-slate-800/80">
          <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800">
            <div className="text-slate-400 text-xs font-medium">My Assigned Tasks</div>
            <div className="text-xl sm:text-2xl font-black text-white mt-1">
              {myTotal}
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800">
            <div className="text-slate-400 text-xs font-medium">Completed</div>
            <div className="text-xl sm:text-2xl font-black text-emerald-400 mt-1 flex items-center gap-1.5">
              <CheckCircle2 size={18} />
              {myCompleted}
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800">
            <div className="text-slate-400 text-xs font-medium">Pending Checklist</div>
            <div className="text-xl sm:text-2xl font-black text-amber-400 mt-1 flex items-center gap-1.5">
              <Clock size={18} />
              {myPending}
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800">
            <div className="text-slate-400 text-xs font-medium">Completion Rate</div>
            <div className="text-xl sm:text-2xl font-black text-indigo-400 mt-1">
              {myRate}%
            </div>
          </div>
        </div>
      </div>

      {/* 6-Person Team Progress Grid */}
      <div className="rounded-3xl glass-panel p-5 border border-slate-800">
        <TeamProgressGrid />
      </div>

      {/* Awaiting Approval Section (For HR/Admin) */}
      {isAdmin && allReviewTasks.length > 0 && (
        <div className="space-y-4 mb-8">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-amber-500/30 pb-3">
            <h3 className="text-lg font-bold text-amber-400 flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
              </span>
              Awaiting HR Approval ({allReviewTasks.length})
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {allReviewTasks.map((task) => (
              <TaskCard key={`review-${task.id}`} task={task} />
            ))}
          </div>
        </div>
      )}

      {/* Task Filters & Feed */}
      <div className="space-y-4">
        {/* Status Tab (previously Categories) */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-bold text-white">Tasks Overview</h3>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Showing tasks for: <strong className="text-white">{currentUser?.full_name || currentUser?.username}</strong></span>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/70 p-3 rounded-2xl border border-slate-800">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search my assigned tasks..."
              className="w-full pl-9 pr-4 py-2 rounded-xl glass-input text-xs text-white placeholder:text-slate-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Status */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="rounded-xl glass-input px-3 py-2 text-xs text-slate-200 bg-slate-900 cursor-pointer"
            >
              <option value="all">All Statuses ({myTotal})</option>
              <option value="pending">Pending Only ({myPending})</option>
              <option value="review">In Review (Awaiting HR)</option>
              <option value="completed">Completed Only ({myCompleted})</option>
            </select>

            {/* Priority */}
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="rounded-xl glass-input px-3 py-2 text-xs text-slate-200 bg-slate-900 cursor-pointer"
            >
              <option value="all">All Priorities</option>
              <option value="Urgent">Urgent</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>
        </div>

        {/* Task Cards Grid */}
        {filteredTasks.length === 0 ? (
          <div className="text-center py-16 rounded-3xl glass-panel border border-slate-800">
            <div className="w-12 h-12 rounded-2xl bg-slate-800 text-slate-400 mx-auto flex items-center justify-center mb-3">
              <CheckCircle2 size={24} />
            </div>
            <h4 className="text-sm font-bold text-slate-200">No tasks found</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              No tasks currently match your filter criteria. Click below to assign a new task.
            </p>
            <button
              onClick={() => handleOpenCreate()}
              disabled={!isAdmin}
              title={!isAdmin ? "Only HR/Admin can assign tasks" : ""}
              className={`mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-xs font-bold transition-colors shadow-md ${
                isAdmin ? 'bg-indigo-600 hover:bg-indigo-500' : 'bg-slate-700 opacity-50 cursor-not-allowed'
              }`}
            >
              <Plus size={14} />
              Assign Task Now
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {filteredTasks.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        )}
      </div>

      {/* Create Modal */}
      <CreateTaskModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </div>
  );
}
