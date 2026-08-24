import React, { useState } from 'react';
import { X, Plus, Calendar, Tag, AlertCircle, Sparkles, CheckCircle, Clock } from 'lucide-react';
import { useTasks } from '../context/TaskContext';

export default function CreateTaskModal({ isOpen, onClose, defaultCategory = 'general' }) {
  const { profiles, currentUser, createTask } = useTasks();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(defaultCategory);
  const [priority, setPriority] = useState('medium');
  const [assignedTo, setAssignedTo] = useState(currentUser?.id || profiles[0]?.id);
  const [dueDate, setDueDate] = useState('');
  const [tagsString, setTagsString] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);

    const tags = tagsString
      .split(',')
      .map(t => t.trim().toLowerCase())
      .filter(Boolean);

    await createTask({
      title,
      description,
      category,
      priority,
      assigned_to: assignedTo,
      due_date: dueDate || null,
      tags
    });

    setIsSubmitting(false);
    // Reset
    setTitle('');
    setDescription('');
    setDueDate('');
    setTagsString('');
    onClose();
  };

  const categoryOptions = [
    { id: 'daily', label: 'Daily Task', badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' },
    { id: 'weekly', label: 'Weekly Task', badge: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30' },
    { id: 'hr', label: 'HR / Dept Task', badge: 'bg-pink-500/10 text-pink-400 border-pink-500/30' },
    { id: 'general', label: 'General Task', badge: 'bg-slate-500/10 text-slate-400 border-slate-500/30' },
  ];

  const priorityOptions = [
    { id: 'low', label: 'Low', color: 'text-slate-400 border-slate-700 bg-slate-800/50' },
    { id: 'medium', label: 'Medium', color: 'text-sky-400 border-sky-500/30 bg-sky-500/10' },
    { id: 'high', label: 'High', color: 'text-amber-400 border-amber-500/30 bg-amber-500/10' },
    { id: 'urgent', label: 'Urgent', color: 'text-rose-400 border-rose-500/30 bg-rose-500/10' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-lg rounded-2xl glass-panel border border-slate-700/80 shadow-2xl p-6 relative animate-slide-up max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/80 transition-colors"
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
            <Plus size={22} className="stroke-[2.5]" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Create New Task</h3>
            <p className="text-xs text-slate-400">
              Assign a new goal or checklist item to a team member
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Task Title <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Conduct Daily Standup & Review Sprint Velocity"
              className="w-full rounded-xl glass-input px-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 font-medium"
              autoFocus
            />
          </div>

          {/* Category Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Category
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {categoryOptions.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setCategory(opt.id)}
                  className={`py-2 px-2.5 rounded-xl text-xs font-semibold border transition-all text-center ${
                    category === opt.id
                      ? `${opt.badge} ring-2 ring-indigo-500/50 shadow-md`
                      : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Assignee & Priority (2 columns) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Assignee */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Assign To (Team Member)
              </label>
              <select
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                className="w-full rounded-xl glass-input px-3 py-2.5 text-xs text-slate-200 bg-slate-900 cursor-pointer"
              >
                {profiles.map((p) => (
                  <option key={p.id} value={p.id} className="bg-slate-900 text-slate-200 py-1">
                    {p.name} ({p.department})
                  </option>
                ))}
              </select>
            </div>

            {/* Priority */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full rounded-xl glass-input px-3 py-2.5 text-xs text-slate-200 bg-slate-900 cursor-pointer"
              >
                {priorityOptions.map((p) => (
                  <option key={p.id} value={p.id} className="bg-slate-900 text-slate-200">
                    {p.label} Priority
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Due Date & Tags */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Calendar size={13} className="text-indigo-400" />
                Due Date & Time
              </label>
              <input
                type="datetime-local"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full rounded-xl glass-input px-3 py-2 text-xs text-slate-200"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Tag size={13} className="text-indigo-400" />
                Tags (comma separated)
              </label>
              <input
                type="text"
                value={tagsString}
                onChange={(e) => setTagsString(e.target.value)}
                placeholder="ops, sprint, compliance"
                className="w-full rounded-xl glass-input px-3.5 py-2.5 text-xs text-slate-200 placeholder:text-slate-500"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Task Details / Requirements
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe goals, acceptance criteria or steps to fulfill..."
              className="w-full rounded-xl glass-input p-3 text-xs placeholder:text-slate-500 resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800/80">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-xl shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Sparkles size={14} />
              {isSubmitting ? 'Creating...' : 'Assign & Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
