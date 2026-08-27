import React, { useState } from 'react';
import { X, Plus, Calendar, Sparkles } from 'lucide-react';
import { useTasks } from '../context/TaskContext';

export default function CreateTaskModal({ isOpen, onClose, defaultCategory = 'general' }) {
  const { profiles, currentUser, createTask } = useTasks();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [assignedTo, setAssignedTo] = useState(profiles[0]?.full_name || profiles[0]?.username || '');
  const [dueDate, setDueDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    setToastMessage(null);

    try {
      await createTask({
        title,
        description,
        priority,
        assigned_to: assignedTo || (currentUser?.full_name || currentUser?.username),
        due_date: dueDate || null
      });

      setToastMessage({ type: 'success', text: 'Task assigned successfully!' });
      setTitle('');
      setDescription('');
      setDueDate('');
      
      setTimeout(() => {
        setToastMessage(null);
        onClose();
      }, 1500);

    } catch (error) {
      console.error(error);
      setToastMessage({ type: 'error', text: error?.message || 'Failed to assign task' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const priorityOptions = ['Low', 'Medium', 'High', 'Urgent'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-lg rounded-3xl glass-panel border border-slate-700 shadow-2xl p-6 relative animate-slide-up max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
            <Plus size={22} className="stroke-[2.5]" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Create & Assign New Task</h3>
            <p className="text-xs text-slate-400">
              Admin & HR task management for the 6-person team
            </p>
          </div>
        </div>

        {toastMessage && (
          <div className={`mb-4 p-3 rounded-xl text-xs font-bold ${
            toastMessage.type === 'success' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
          }`}>
            {toastMessage.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              Task Title <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Financial Q3 Audit Review / Daily Standup"
              className="w-full rounded-xl glass-input px-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 font-medium"
              autoFocus
            />
          </div>



          {/* Assignee & Priority */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Assignee Selection (6 members) */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Assign To (Team Member)
              </label>
              <select
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                className="w-full rounded-xl glass-input px-3 py-2.5 text-xs text-slate-200 bg-slate-900 cursor-pointer"
              >
                {profiles.map((p) => (
                  <option key={p.id} value={p.full_name || p.username} className="bg-slate-900 text-slate-200">
                    {p.full_name || p.username} ({p.department})
                  </option>
                ))}
              </select>
            </div>

            {/* Priority */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full rounded-xl glass-input px-3 py-2.5 text-xs text-slate-200 bg-slate-900 cursor-pointer"
              >
                {priorityOptions.map((p) => (
                  <option key={p} value={p} className="bg-slate-900 text-slate-200">
                    {p} Priority
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Due Date */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
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

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              Task Details & Instructions
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe requirements, acceptance criteria or steps..."
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
              {isSubmitting ? 'Assigning...' : 'Assign & Save Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
