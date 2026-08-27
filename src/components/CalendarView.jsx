import React, { useState } from 'react';
import { useTasks } from '../context/TaskContext';
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, Bell, Users, Clock, Hash, MapPin, Search } from 'lucide-react';
import CreateEventModal from './CreateEventModal';

export default function CalendarView() {
  const { currentUser, isAdmin, calendarEvents, leaves, updateLeaveStatus, profiles } = useTasks();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);

  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();

  const prevMonth = () => setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentYear, currentMonth + 1, 1));

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Helper to check if an event falls on a specific date
  const getEventsForDate = (day) => {
    return calendarEvents.filter(event => {
      // Only show approved leaves on the calendar
      if (event.type === 'leave' && event.status !== 'approved') return false;

      const eDate = new Date(event.date);
      return eDate.getDate() === day && eDate.getMonth() === currentMonth && eDate.getFullYear() === currentYear;
    });
  };

  const getProfileForAssignee = (assigneeId) => {
    return profiles.find(p => p.id === assigneeId);
  };

  const today = new Date();
  const isCurrentMonth = today.getMonth() === currentMonth && today.getFullYear() === currentYear;

  // Reminders for sidebar
  const upcomingReminders = calendarEvents
    .filter(e => e.type === 'reminder' || e.type === 'meeting' || (e.type === 'leave' && e.status === 'approved'))
    .filter(e => new Date(e.date) >= new Date().setHours(0,0,0,0))
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 5);

  const pendingLeaves = leaves.filter(l => l.status === 'pending');

  return (
    <div className="flex flex-col lg:flex-row gap-6 animate-fade-in">
      
      {/* LEFT COLUMN: Calendar */}
      <div className="flex-1 space-y-4">
        {/* Header */}
        <div className="rounded-3xl glass-panel p-5 sm:p-6 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 text-indigo-400">
              <CalendarIcon size={24} />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-white">Team Calendar</h1>
              <p className="text-xs text-slate-400">Manage leaves, holidays, and meetings.</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {(currentUser?.role === 'HR' || currentUser?.role === 'admin' || currentUser?.role === 'Admin') ? (
              <button
                onClick={() => setIsEventModalOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all"
              >
                <Plus size={16} className="stroke-[3]" />
                <span className="hidden sm:inline">+ Add Event / Leave</span>
              </button>
            ) : (
              <button
                onClick={() => setIsEventModalOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-bold text-xs shadow-lg shadow-indigo-500/20 transition-all"
              >
                <Plus size={16} className="stroke-[3]" />
                <span className="hidden sm:inline">+ Request Leave</span>
              </button>
            )}
            
            <div className="flex items-center bg-slate-900 rounded-xl border border-slate-800 p-1">
              <button onClick={prevMonth} className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors">
                <ChevronLeft size={16} />
              </button>
              <span className="w-32 text-center text-sm font-bold text-slate-200">
                {monthNames[currentMonth]} {currentYear}
              </span>
              <button onClick={nextMonth} className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="rounded-3xl glass-panel p-5 sm:p-6 border border-slate-800 bg-slate-950/50">
          <div className="grid grid-cols-7 gap-2 sm:gap-3 mb-3">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-500">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2 sm:gap-3">
            {/* Empty slots for days before 1st of month */}
            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
              <div key={`empty-${i}`} className="min-h-[80px] sm:min-h-[100px] p-2 rounded-2xl bg-slate-900/30 border border-slate-800/30 opacity-50" />
            ))}

            {/* Days of month */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const isToday = isCurrentMonth && day === today.getDate();
              const events = getEventsForDate(day);
              
              // Calculate day of week to determine weekends
              const dayOfWeek = new Date(currentYear, currentMonth, day).getDay();
              const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

              const isHoliday = events.some(e => e.type === 'holiday');

              return (
                <div 
                  key={`day-${day}`} 
                  className={`min-h-[80px] sm:min-h-[100px] p-2 rounded-2xl border transition-all ${
                    isToday 
                      ? 'bg-indigo-900/30 border-indigo-500/50 ring-1 ring-indigo-500/50' 
                      : isHoliday
                      ? 'bg-amber-900/10 border-amber-500/20'
                      : isWeekend
                      ? 'bg-slate-900/40 border-slate-800/50'
                      : 'bg-slate-900/60 border-slate-800 hover:bg-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className={`text-xs font-black ${
                      isToday ? 'text-indigo-400' : isWeekend || isHoliday ? 'text-slate-500' : 'text-slate-300'
                    }`}>
                      {day}
                    </span>
                    {events.length > 0 && (
                      <span className="text-[9px] px-1.5 rounded-full bg-slate-800 text-slate-400 font-bold">
                        {events.length}
                      </span>
                    )}
                  </div>
                  
                  <div className="space-y-1.5 flex flex-col items-start w-full">
                    {events.slice(0, 3).map(evt => (
                      <div key={evt.id} className="w-full">
                        {evt.type === 'leave' && (
                          <div 
                            className="flex items-center gap-1.5 p-1 rounded-md bg-rose-500/10 border border-rose-500/20 w-full overflow-hidden"
                            title={evt.title}
                          >
                            {evt.assignee_id && getProfileForAssignee(evt.assignee_id) ? (
                              <img 
                                src={getProfileForAssignee(evt.assignee_id).avatar_url} 
                                alt="avatar" 
                                className="w-4 h-4 rounded-full flex-shrink-0"
                              />
                            ) : (
                              <div className="w-4 h-4 rounded-full bg-rose-500/20 flex-shrink-0" />
                            )}
                            <span className="text-[9px] font-bold text-rose-300 truncate">Leave</span>
                          </div>
                        )}
                        
                        {evt.type === 'meeting' && (
                          <div 
                            className="flex items-center gap-1 p-1 rounded-md bg-sky-500/10 border border-sky-500/20 w-full overflow-hidden"
                            title={evt.title}
                          >
                            <Clock size={10} className="text-sky-400 flex-shrink-0" />
                            <span className="text-[9px] font-bold text-sky-300 truncate">{evt.title}</span>
                          </div>
                        )}

                        {evt.type === 'holiday' && (
                          <div 
                            className="flex items-center gap-1 p-1 rounded-md bg-amber-500/10 border border-amber-500/20 w-full overflow-hidden"
                            title={evt.title}
                          >
                            <span className="text-[9px] font-bold text-amber-300 truncate">{evt.title}</span>
                          </div>
                        )}

                        {evt.type === 'reminder' && (
                          <div 
                            className="flex items-center gap-1 p-1 rounded-md bg-indigo-500/10 border border-indigo-500/20 w-full overflow-hidden"
                            title={evt.title}
                          >
                            <Bell size={10} className="text-indigo-400 flex-shrink-0" />
                            <span className="text-[9px] font-bold text-indigo-300 truncate">{evt.title}</span>
                          </div>
                        )}
                      </div>
                    ))}
                    {events.length > 3 && (
                      <div className="text-[9px] text-slate-500 font-semibold text-center w-full">
                        +{events.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: Reminders Widget */}
      <div className="w-full lg:w-80 flex-shrink-0 space-y-4">
        <div className="rounded-3xl glass-panel p-5 border border-slate-800 bg-slate-900/80">
          <div className="flex items-center gap-2 mb-4 border-b border-slate-800 pb-3">
            <Bell size={16} className="text-amber-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">Upcoming Reminders</h2>
          </div>

          <div className="space-y-3">
            {upcomingReminders.length === 0 ? (
              <div className="text-center py-6 text-slate-500 text-xs">
                No upcoming reminders.
              </div>
            ) : (
              upcomingReminders.map(rem => (
                <div key={`rem-${rem.id}`} className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition-colors">
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-xs font-bold text-slate-200 line-clamp-2">{rem.title}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] font-medium mt-2">
                    <CalendarIcon size={12} className="text-indigo-400" />
                    <span className="text-indigo-300">{new Date(rem.date).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    
                    <span className="mx-1 text-slate-600">|</span>
                    
                    <span className={`px-1.5 py-0.5 rounded capitalize ${
                      rem.type === 'leave' ? 'bg-rose-500/10 text-rose-400' :
                      rem.type === 'meeting' ? 'bg-sky-500/10 text-sky-400' :
                      'bg-amber-500/10 text-amber-400'
                    }`}>
                      {rem.type}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {isAdmin && pendingLeaves.length > 0 && (
          <div className="rounded-3xl glass-panel p-5 border border-amber-800/50 bg-amber-950/20">
            <div className="flex items-center gap-2 mb-4 border-b border-amber-800/50 pb-3">
              <Users size={16} className="text-amber-400" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">Pending Leaves</h2>
            </div>
            <div className="space-y-3">
              {pendingLeaves.map(leave => (
                <div key={leave.id} className="p-3 rounded-xl bg-slate-900 border border-slate-700">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-200">
                      {getProfileForAssignee(leave.profile_id)?.full_name || 'Member'}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(leave.start_date || leave.date).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => updateLeaveStatus(leave.id, 'approved')}
                      className="flex-1 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 text-[10px] font-bold transition-colors"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => updateLeaveStatus(leave.id, 'rejected')}
                      className="flex-1 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 text-[10px] font-bold transition-colors"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="rounded-3xl glass-panel p-5 border border-slate-800 bg-slate-900/80 text-xs text-slate-400">
          <strong className="text-slate-300 block mb-1">Calendar Guide:</strong>
          <div className="space-y-1.5 mt-3">
            <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded bg-rose-500/40" /> Approved Leaves</div>
            <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded bg-sky-500/40" /> Scheduled Meetings</div>
            <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded bg-amber-500/40" /> Company Holidays</div>
            <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded bg-indigo-500/40" /> Special Reminders</div>
          </div>
        </div>
      </div>

      <CreateEventModal 
        isOpen={isEventModalOpen} 
        onClose={() => setIsEventModalOpen(false)} 
      />
    </div>
  );
}
