import React, { useState } from 'react';
import { 
  Check, 
  Clock, 
  Calendar, 
  MessageSquare, 
  Trash2, 
  AlertCircle, 
  Tag, 
  CheckCircle2,
  Edit3
} from 'lucide-react';
import { useTasks } from '../context/TaskContext';
import TaskCompletionModal from './TaskCompletionModal';

export default function TaskCard({ task }) {
  const { profiles, toggleTaskStatus, deleteTask, updateTask, currentUser } = useTasks();
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const assignedProfile = profiles.find((p) => p.id === task.assigned_to);
  const isCompleted = task.status === 'completed';

  // Category Theme Details
  const getCategoryTheme = (cat) => {
    switch (cat) {
      case 'daily':
        return {
          label: 'Daily Task',
          badge: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
        };
      case 'weekly':
        return {
          label: 'Weekly Goal',
          badge: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30'
        };
      case 'hr':
        return {
          label: 'HR / Dept',
          badge: 'bg-pink-500/15 text-pink-300 border-pink-500/30'
        };
      default:
        return {
          label: 'General',
          badge: 'bg-slate-700/40 text-slate-300 border-slate-600/40'
        };
    }
  };

  // Priority Theme Details
  const getPriorityTheme = (prio) => {
    switch (prio) {
      case 'urgent':
        return {
          label: 'Urgent',
          dot: 'bg-rose-500',
          badge: 'bg-rose-500/15 text-rose-300 border-rose-500/30'
        };
      case 'high':
        return {
          label: 'High',
          dot: 'bg-amber-500',
          badge: 'bg-amber-500/15 text-amber-300 border-amber-500/30'
        };
      case 'medium':
        return {
          label: 'Medium',
          dot: 'bg-sky-500',
          badge: 'bg-sky-500/15 text-sky-300 border-sky-500/30'
        };
      default:
        return {
          label: 'Low',
          dot: 'bg-slate-500',
          badge: 'bg-slate-800 text-slate-400 border-slate-700'
        };
    }
  };

  // Due Date status formatting
  const getDueDateInfo = () => {
    if (!task.due_date) return null;
    const due = new Date(task.due_date);
    const now = new Date();
    const diffHours = (due - now) / (1000 * 60 * 60);

    if (isCompleted) {
      return {
        text: `Due ${due.toLocaleDateString([], { month: 'short', day: 'numeric' })}`,
        isOverdue: false,
        className: 'text-slate-500'
      };
    }

    if (diffHours < 0) {
      return {
        text: `Overdue (${Math.abs(Math.round(diffHours))}h ago)`,
        isOverdue: true,
        className: 'text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-md border border-rose-500/20 font-semibold'
      };
    } else if (diffHours <= 24) {
      return {
        text: `Due Today (${due.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`,
        isOverdue: false,
        className: 'text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20 font-medium'
      };
    } else {
      return {
        text: `Due ${due.toLocaleDateString([], { month: 'short', day: 'numeric' })}`,
        isOverdue: false,
        className: 'text-slate-400'
      };
    }
  };

  const catTheme = getCategoryTheme(task.category);
  const prioTheme = getPriorityTheme(task.priority);
  const dueInfo = getDueDateInfo();

  const handleCheckboxClick = (e) => {
    e.stopPropagation();
    toggleTaskStatus(task.id);
  };

  const handleSaveNote = (note) => {
    updateTask(task.id, { completion_note: note });
  };

  return (
    <>
      <div
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`group relative rounded-2xl p-4 transition-all duration-200 border ${
          isCompleted
            ? 'bg-slate-900/40 border-slate-800/60 opacity-85'
            : 'bg-slate-900/80 hover:bg-slate-900 border-slate-800 hover:border-slate-700/80 shadow-lg shadow-black/20 hover:shadow-indigo-500/5'
        }`}
      >
        <div className="flex items-start gap-3.5">
          {/* 1-Click Tick Mark / Checkbox */}
          <button
            type="button"
            onClick={handleCheckboxClick}
            aria-label={isCompleted ? 'Mark task as incomplete' : 'Mark task as complete'}
            className={`mt-0.5 w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-200 border ${
              isCompleted
                ? 'bg-emerald-500 border-emerald-400 text-slate-950 shadow-md shadow-emerald-500/20 scale-105'
                : 'bg-slate-950/60 border-slate-700 text-transparent hover:border-indigo-500 hover:text-indigo-400 hover:bg-indigo-950/40'
            }`}
          >
            <Check size={14} className="stroke-[3] transition-transform duration-150" />
          </button>

          {/* Content Body */}
          <div className="flex-1 min-w-0">
            {/* Header: Title & Badges */}
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${catTheme.badge}`}>
                {catTheme.label}
              </span>

              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border flex items-center gap-1 ${prioTheme.badge}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${prioTheme.dot}`} />
                {prioTheme.label}
              </span>

              {dueInfo && (
                <span className={`text-[11px] flex items-center gap-1 ${dueInfo.className}`}>
                  <Calendar size={12} />
                  {dueInfo.text}
                </span>
              )}
            </div>

            {/* Task Title */}
            <h4
              className={`text-sm font-semibold leading-snug transition-colors ${
                isCompleted
                  ? 'text-slate-400 line-through decoration-slate-500 decoration-2'
                  : 'text-slate-100 group-hover:text-indigo-200'
              }`}
            >
              {task.title}
            </h4>

            {/* Task Description */}
            {task.description && (
              <p
                className={`text-xs mt-1 leading-relaxed line-clamp-2 ${
                  isCompleted ? 'text-slate-400' : 'text-slate-400'
                }`}
              >
                {task.description}
              </p>
            )}

            {/* Completion Note Banner (if present) */}
            {task.completion_note && (
              <div className="mt-2.5 p-2 rounded-xl bg-emerald-950/30 border border-emerald-800/40 flex items-start gap-2 text-xs text-emerald-300">
                <MessageSquare size={13} className="mt-0.5 flex-shrink-0 text-emerald-400" />
                <div className="flex-1 min-w-0">
                  <span className="font-semibold text-[11px] uppercase tracking-wider text-emerald-400 block">
                    Completion Note:
                  </span>
                  <p className="text-xs text-emerald-200 line-clamp-2">{task.completion_note}</p>
                </div>
                <button
                  onClick={() => setIsNoteModalOpen(true)}
                  className="text-emerald-400 hover:text-emerald-200 p-1"
                  title="Edit note"
                >
                  <Edit3 size={12} />
                </button>
              </div>
            )}

            {/* Tags */}
            {task.tags && task.tags.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                {task.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="text-[10px] text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded-md border border-slate-700/60"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* Footer: Assignee & Action Buttons */}
            <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-800/70 text-xs">
              {/* Assignee Avatar */}
              <div className="flex items-center gap-2">
                {assignedProfile ? (
                  <div className="flex items-center gap-2">
                    <img
                      src={assignedProfile.avatar_url}
                      alt={assignedProfile.name}
                      className="w-5 h-5 rounded-full object-cover ring-1 ring-slate-700"
                    />
                    <span className="text-[11px] font-medium text-slate-300">
                      {assignedProfile.name}
                    </span>
                  </div>
                ) : (
                  <span className="text-[11px] text-slate-500 italic">Unassigned</span>
                )}

                {isCompleted && task.completed_at && (
                  <span className="text-[10px] text-emerald-400 font-medium ml-2 flex items-center gap-1">
                    <CheckCircle2 size={11} />
                    Done {new Date(task.completed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1">
                {/* Add/Edit Note Button */}
                <button
                  type="button"
                  onClick={() => setIsNoteModalOpen(true)}
                  className="p-1.5 text-slate-400 hover:text-indigo-300 hover:bg-slate-800 rounded-lg transition-colors"
                  title={task.completion_note ? 'Edit Completion Note' : 'Add Completion Note'}
                >
                  <MessageSquare size={14} />
                </button>

                {/* Delete Button */}
                <button
                  type="button"
                  onClick={() => deleteTask(task.id)}
                  className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors opacity-70 hover:opacity-100"
                  title="Delete task"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Completion / Note Modal */}
      <TaskCompletionModal
        task={task}
        isOpen={isNoteModalOpen}
        onClose={() => setIsNoteModalOpen(false)}
        onConfirm={handleSaveNote}
      />
    </>
  );
}
