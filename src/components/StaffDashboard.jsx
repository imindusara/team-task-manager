import React, { useState } from 'react';
import { useTasks } from '../context/TaskContext';
import TaskCard from './TaskCard';
import CreateTaskModal from './CreateTaskModal';
import { 
  CheckCircle2, 
  Clock, 
  Layers, 
  Calendar, 
  HeartHandshake, 
  Sparkles, 
  Plus, 
  Search,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  UserCheck
} from 'lucide-react';

export default function StaffDashboard() {
  const {
    currentUser,
    tasks,
    selectedCategory,
    setSelectedCategory,
    selectedStatus,
    setSelectedStatus,
    searchQuery,
    setSearchQuery
  } = useTasks();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [modalCategory, setModalCategory] = useState('daily');

  // Filter tasks specifically assigned to current staff member
  const myAllTasks = tasks.filter((t) => t.assigned_to === currentUser?.id);

  const filteredTasks = myAllTasks.filter((task) => {
    // Category match
    if (selectedCategory !== 'all' && task.category !== selectedCategory) return false;
    // Status match
    if (selectedStatus !== 'all' && task.status !== selectedStatus) return false;
    // Search match
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = task.title.toLowerCase().includes(q);
      const matchDesc = task.description?.toLowerCase().includes(q);
      const matchTags = task.tags?.some((t) => t.toLowerCase().includes(q));
      if (!matchTitle && !matchDesc && !matchTags) return false;
    }
    return true;
  });

  const totalMyTasks = myAllTasks.length;
  const completedMyTasks = myAllTasks.filter((t) => t.status === 'completed').length;
  const pendingMyTasks = totalMyTasks - completedMyTasks;
  const rate = totalMyTasks > 0 ? Math.round((completedMyTasks / totalMyTasks) * 100) : 0;

  const categories = [
    { id: 'all', label: 'All My Tasks', icon: Layers, count: myAllTasks.length },
    { id: 'daily', label: 'Daily Checklist', icon: Clock, count: myAllTasks.filter(t => t.category === 'daily').length },
    { id: 'weekly', label: 'Weekly Goals', icon: Calendar, count: myAllTasks.filter(t => t.category === 'weekly').length },
    { id: 'hr', label: 'HR & Dept', icon: HeartHandshake, count: myAllTasks.filter(t => t.category === 'hr').length },
    { id: 'general', label: 'General', icon: Sparkles, count: myAllTasks.filter(t => t.category === 'general').length },
  ];

  const handleOpenCreate = (category = 'daily') => {
    setModalCategory(category);
    setIsCreateModalOpen(true);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Staff Hero Banner */}
      <div className="rounded-3xl glass-panel p-6 border border-slate-800/90 relative overflow-hidden">
        {/* Glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none -mr-16 -mt-16" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4">
            <div className="relative">
              <img
                src={currentUser?.avatar_url}
                alt={currentUser?.name}
                className="w-16 h-16 rounded-2xl object-cover ring-2 ring-indigo-500/50 shadow-xl"
              />
              <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-400 border-2 border-slate-900 shadow-sm" />
            </div>

            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-[11px] font-semibold mb-1">
                <UserCheck size={12} />
                Staff Workspace
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                Welcome back, {currentUser?.name}
              </h1>
              <p className="text-xs text-slate-400">
                {currentUser?.title} &bull; <span className="text-slate-300">{currentUser?.department}</span>
              </p>
            </div>
          </div>

          {/* Quick Create Task */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleOpenCreate('daily')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white transition-all shadow-lg shadow-emerald-600/25 hover:scale-[1.02] active:scale-[0.98]"
            >
              <Plus size={16} className="stroke-[3]" />
              + Add Daily Task
            </button>
          </div>
        </div>

        {/* Staff Metrics & Progress Bar */}
        <div className="mt-6 pt-6 border-t border-slate-800/80">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <TrendingUp size={15} className="text-indigo-400" />
              <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                My Completion Progress
              </span>
            </div>
            <span className="text-xs font-extrabold text-emerald-400">
              {rate}% Completed ({completedMyTasks} of {totalMyTasks})
            </span>
          </div>

          <div className="w-full bg-slate-800/90 rounded-full h-3 overflow-hidden border border-slate-700/50">
            <div
              className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-sky-500 to-emerald-400 transition-all duration-500"
              style={{ width: `${rate}%` }}
            />
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-3 mt-4">
            <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800 text-center">
              <div className="text-[11px] text-slate-400 font-medium">Assigned Tasks</div>
              <div className="text-lg font-extrabold text-white mt-0.5">{totalMyTasks}</div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800 text-center">
              <div className="text-[11px] text-slate-400 font-medium">Pending Checklist</div>
              <div className="text-lg font-extrabold text-amber-400 mt-0.5">{pendingMyTasks}</div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800 text-center">
              <div className="text-[11px] text-slate-400 font-medium">Completed Items</div>
              <div className="text-lg font-extrabold text-emerald-400 mt-0.5">{completedMyTasks}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Category Tabs & Quick Tick Instructions */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex flex-wrap items-center gap-2">
            {categories.map((cat) => {
              const Icon = cat.icon;
              const isActive = selectedCategory === cat.id;

              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25 scale-[1.02]'
                      : 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-800'
                  }`}
                >
                  <Icon size={14} />
                  <span>{cat.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                      isActive ? 'bg-indigo-800/60 text-white' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {cat.count}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Click any <strong>checkbox</strong> to toggle complete</span>
          </div>
        </div>

        {/* Toolbar: Search & Status Filter */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/70 p-3 rounded-2xl border border-slate-800">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search my tasks..."
              className="w-full pl-9 pr-4 py-2 rounded-xl glass-input text-xs text-white placeholder:text-slate-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="rounded-xl glass-input px-3 py-2 text-xs text-slate-200 bg-slate-900 cursor-pointer"
            >
              <option value="all">All Statuses ({totalMyTasks})</option>
              <option value="pending">Pending Only ({pendingMyTasks})</option>
              <option value="completed">Completed Only ({completedMyTasks})</option>
            </select>
          </div>
        </div>

        {/* Task Cards */}
        {filteredTasks.length === 0 ? (
          <div className="text-center py-16 rounded-3xl glass-panel border border-slate-800/80">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center mb-3">
              <CheckCircle2 size={24} />
            </div>
            <h4 className="text-sm font-bold text-slate-200">
              {pendingMyTasks === 0 ? 'All caught up! Excellent work!' : 'No tasks match current filter'}
            </h4>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              {pendingMyTasks === 0
                ? 'You have completed all assigned tasks in this category.'
                : 'Try switching tabs or add a new checklist item.'}
            </p>
            <button
              onClick={() => handleOpenCreate('daily')}
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-500 transition-colors"
            >
              <Plus size={14} />
              Add Personal Checklist Item
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

      {/* Create Task Modal */}
      <CreateTaskModal
        isOpen={isCreateModalOpen}
        defaultCategory={modalCategory}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </div>
  );
}
