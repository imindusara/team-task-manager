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
  Zap
} from 'lucide-react';
import { getDepartmentBadge } from '../lib/demoData';

export default function ManagerDashboard() {
  const {
    tasks,
    profiles,
    metrics,
    currentUser,
    selectedCategory,
    setSelectedCategory,
    selectedStatus,
    setSelectedStatus,
    selectedPriority,
    setSelectedPriority,
    selectedAssignee,
    setSelectedAssignee,
    searchQuery,
    setSearchQuery
  } = useTasks();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [modalCategory, setModalCategory] = useState('general');

  // Filter tasks
  const filteredTasks = tasks.filter((task) => {
    const cat = (task.task_type || task.category || '').toLowerCase();
    if (selectedCategory !== 'all' && cat !== selectedCategory.toLowerCase()) return false;
    
    const isDone = Boolean(task.is_completed);
    if (selectedStatus === 'pending' && isDone) return false;
    if (selectedStatus === 'completed' && !isDone) return false;
    
    if (selectedPriority !== 'all' && (task.priority || '').toLowerCase() !== selectedPriority.toLowerCase()) return false;
    if (selectedAssignee !== 'all' && task.assigned_to !== selectedAssignee) return false;
    
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = (task.title || '').toLowerCase().includes(q);
      const matchDesc = (task.description || '').toLowerCase().includes(q);
      if (!matchTitle && !matchDesc) return false;
    }
    return true;
  });

  const categories = [
    { id: 'all', label: 'All Tasks', icon: Layers, count: tasks.length },
    { id: 'daily', label: 'Daily Checklist', icon: Clock, count: tasks.filter(t => (t.task_type || t.category) === 'daily').length },
    { id: 'weekly', label: 'Weekly Goals', icon: Calendar, count: tasks.filter(t => (t.task_type || t.category) === 'weekly').length },
    { id: 'hr', label: 'HR & Dept', icon: HeartHandshake, count: tasks.filter(t => (t.task_type || t.category) === 'hr').length },
    { id: 'general', label: 'General Tasks', icon: Sparkles, count: tasks.filter(t => (t.task_type || t.category) === 'general').length },
  ];

  const handleOpenCreate = (category = 'general') => {
    setModalCategory(category);
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
              onClick={() => handleOpenCreate('daily')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-slate-200 transition-all shadow-sm"
            >
              <Clock size={14} className="text-emerald-400" />
              + Daily Task
            </button>
            <button
              onClick={() => handleOpenCreate('general')}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-xs font-bold text-white transition-all shadow-lg shadow-indigo-600/30 hover:scale-[1.02] active:scale-[0.98]"
            >
              <Plus size={16} className="stroke-[3]" />
              Assign New Task
            </button>
          </div>
        </div>

        {/* Global KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mt-6 pt-6 border-t border-slate-800/80">
          <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800">
            <div className="text-slate-400 text-xs font-medium">Total Tasks</div>
            <div className="text-xl sm:text-2xl font-black text-white mt-1">
              {metrics.total}
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800">
            <div className="text-slate-400 text-xs font-medium">Completed</div>
            <div className="text-xl sm:text-2xl font-black text-emerald-400 mt-1 flex items-center gap-1.5">
              <CheckCircle2 size={18} />
              {metrics.completed}
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800">
            <div className="text-slate-400 text-xs font-medium">Pending Checklist</div>
            <div className="text-xl sm:text-2xl font-black text-amber-400 mt-1 flex items-center gap-1.5">
              <Clock size={18} />
              {metrics.pending}
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800">
            <div className="text-slate-400 text-xs font-medium">Team Completion Rate</div>
            <div className="text-xl sm:text-2xl font-black text-indigo-400 mt-1">
              {metrics.completionRate}%
            </div>
          </div>
        </div>
      </div>

      {/* 6-Person Team Progress Grid */}
      <div className="rounded-3xl glass-panel p-5 border border-slate-800">
        <TeamProgressGrid />
      </div>

      {/* Task Filters & Feed */}
      <div className="space-y-4">
        {/* Category Tabs */}
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-3">
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
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                    isActive ? 'bg-indigo-800/60 text-white' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {cat.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/70 p-3 rounded-2xl border border-slate-800">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search company tasks..."
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
              <option value="all">All Statuses</option>
              <option value="pending">Pending Only</option>
              <option value="completed">Completed Only</option>
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

            {/* Assignee Filter */}
            <select
              value={selectedAssignee}
              onChange={(e) => setSelectedAssignee(e.target.value)}
              className="rounded-xl glass-input px-3 py-2 text-xs text-slate-200 bg-slate-900 cursor-pointer"
            >
              <option value="all">All 6 Members</option>
              {profiles.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.full_name || p.username} ({p.department})
                </option>
              ))}
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
              onClick={() => handleOpenCreate('daily')}
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-500 transition-colors shadow-md"
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
        defaultCategory={modalCategory}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </div>
  );
}
