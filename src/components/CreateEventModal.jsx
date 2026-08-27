import React, { useState } from 'react';
import { X, Calendar as CalendarIcon, User, Tag } from 'lucide-react';
import { useTasks } from '../context/TaskContext';

export default function CreateEventModal({ isOpen, onClose }) {
  const { createEvent, requestLeave, profiles, currentUser, isAdmin } = useTasks();

  const [title, setTitle] = useState('');
  const [type, setType] = useState(isAdmin ? 'meeting' : 'leave');
  const [date, setDate] = useState('');
  const [assigneeId, setAssigneeId] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title || !date) return;

    if (type === 'leave') {
      requestLeave({
        title, // using title for reason/details
        profile_id: isAdmin ? assigneeId : currentUser?.id,
        start_date: new Date(date).toISOString(),
        status: isAdmin ? 'approved' : 'pending' // Admin logged leaves are instantly approved
      });
    } else {
      createEvent({
        title,
        type,
        date: new Date(date).toISOString()
      });
    }

    // reset and close
    setTitle('');
    setType(isAdmin ? 'meeting' : 'leave');
    setDate('');
    setAssigneeId('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div 
        className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden animate-scale-up relative"
      >
        <div className="p-6 border-b border-slate-800">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <CalendarIcon size={18} className="text-indigo-400" />
              {isAdmin ? 'Add Event / Leave' : 'Request Leave'}
            </h2>
            <button 
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-white bg-slate-800 rounded-lg transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Tag size={13} /> Event Title / Details
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Q3 Planning Meeting"
              className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder:text-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {isAdmin && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Tag size={13} /> Type
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="meeting">Meeting</option>
                  <option value="leave">Leave / Day Off</option>
                  <option value="holiday">Company Holiday</option>
                  <option value="reminder">Reminder</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <CalendarIcon size={13} /> Date
                </label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>
          )}

          {!isAdmin && (
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <CalendarIcon size={13} /> Date
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          )}

          {isAdmin && type === 'leave' && (
            <div className="animate-fade-in">
              <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <User size={13} /> Member on Leave
              </label>
              <select
                required
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              >
                <option value="">Select member...</option>
                {profiles.map(p => (
                  <option key={p.id} value={p.id}>{p.full_name || p.username}</option>
                ))}
              </select>
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md shadow-indigo-600/20"
            >
              {isAdmin ? 'Add to Calendar' : 'Submit Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
