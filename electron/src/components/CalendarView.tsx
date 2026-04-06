import React, { useState } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, BookOpen, CheckSquare, Sparkles } from 'lucide-react';
import { AppState, Lesson, Task } from '../types';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, addDays, subDays, startOfDay } from 'date-fns';
import { ru } from 'date-fns/locale';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { motion, AnimatePresence } from 'motion/react';

function cn(...inputs: any[]) {
  return twMerge(clsx(inputs));
}

export function CalendarView({ state }: { state: AppState }) {
  const [viewDate, setViewDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'day'>('day');

  const weekDays = eachDayOfInterval({
    start: startOfWeek(selectedDate, { weekStartsOn: 1 }),
    end: endOfWeek(selectedDate, { weekStartsOn: 1 }),
  });

  const monthStart = startOfMonth(viewDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const calendarDays = eachDayOfInterval({
    start: startDate,
    end: endDate,
  });

  const nextMonth = () => setViewDate(addMonths(viewDate, 1));
  const prevMonth = () => setViewDate(subMonths(viewDate, 1));

  const dayLessons = state.lessons.filter(l => l.dayOfWeek === selectedDate.getDay());
  const dayTasks = state.tasks.filter(t => 
    (t.date && isSameDay(new Date(t.date), selectedDate)) || 
    (t.deadline && isSameDay(new Date(t.deadline), selectedDate))
  );
  const daySubtasks = state.tasks.flatMap(t => 
    t.checklist.filter(item => item.date && isSameDay(new Date(item.date), selectedDate))
      .map(item => ({ ...item, parentTask: t }))
  );

  const allDayEvents = [
    ...dayLessons.map(l => ({ ...l, eventType: 'lesson' as const, time: l.startTime })),
    ...dayTasks.map(t => ({ 
      ...t, 
      eventType: 'task' as const, 
      time: t.startTime || (t.deadline ? format(new Date(t.deadline), 'HH:mm') : '00:00') 
    })),
    ...daySubtasks.map(s => ({
      ...s,
      id: s.id,
      title: `${s.parentTask.title}: ${s.text}`,
      eventType: 'task' as const,
      time: s.startTime || '00:00'
    }))
  ].sort((a, b) => a.time.localeCompare(b.time));

  const hours = Array.from({ length: 17 }, (_, i) => i + 7); // 07:00 to 23:00

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold tracking-tighter capitalize">
            {viewMode === 'month' ? format(viewDate, 'LLLL yyyy', { locale: ru }) : format(selectedDate, 'd MMMM', { locale: ru })}
          </h1>
          <div className="flex items-center gap-1 bg-foreground/5 rounded-none p-1 border border-border">
            <button 
              onClick={() => setViewMode(viewMode === 'month' ? 'day' : 'month')}
              className="px-3 py-1 text-[10px] font-bold uppercase tracking-widest hover:bg-foreground/10 rounded-none transition-colors"
            >
              {viewMode === 'month' ? 'День' : 'Месяц'}
            </button>
            <div className="w-px h-4 bg-border mx-1" />
            <button onClick={() => {
              const today = new Date();
              setViewDate(today);
              setSelectedDate(today);
            }} className="px-3 py-1 text-[10px] font-bold uppercase tracking-widest hover:bg-foreground/10 rounded-none transition-colors">
              Сегодня
            </button>
          </div>
        </div>
        
        <div className="flex items-center gap-2 bg-foreground/5 rounded-none p-1 border border-border">
          <button 
            onClick={() => viewMode === 'month' ? prevMonth() : setSelectedDate(subDays(selectedDate, 1))} 
            className="p-1.5 hover:bg-foreground/10 rounded-none transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button 
            onClick={() => viewMode === 'month' ? nextMonth() : setSelectedDate(addDays(selectedDate, 1))} 
            className="p-1.5 hover:bg-foreground/10 rounded-none transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {viewMode === 'day' && (
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          {weekDays.map(day => {
            const isSelected = isSameDay(day, selectedDate);
            const isToday = isSameDay(day, new Date());
            return (
              <button
                key={day.toString()}
                onClick={() => setSelectedDate(day)}
                className={cn(
                  "flex flex-col items-center min-w-[60px] py-3 rounded-none border transition-all",
                  isSelected ? "bg-accent border-accent text-accent-foreground shadow-lg shadow-accent/20" : "bg-card border-border hover:bg-foreground/5",
                  isToday && !isSelected && "border-accent/50"
                )}
              >
                <span className={cn("text-[10px] font-bold uppercase tracking-widest mb-1", isSelected ? "opacity-60" : "text-foreground/30")}>
                  {format(day, 'eee', { locale: ru })}
                </span>
                <span className="text-lg font-bold font-mono">
                  {format(day, 'd')}
                </span>
              </button>
            );
          })}
        </div>
      )}

      <div className="flex-1 bg-card border border-border rounded-none overflow-hidden flex flex-col relative">
        <AnimatePresence mode="wait">
          {viewMode === 'month' ? (
            <motion.div 
              key="month"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex-1 flex flex-col"
            >
              <div className="grid grid-cols-7 border-b border-border bg-foreground/5">
                {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map(day => (
                  <div key={day} className="py-3 text-center text-[10px] font-bold uppercase tracking-widest text-foreground/30">
                    {day}
                  </div>
                ))}
              </div>
              <div className="flex-1 grid grid-cols-7 grid-rows-6">
                {calendarDays.map((day, idx) => {
                  const isCurrentMonth = isSameMonth(day, monthStart);
                  const isToday = isSameDay(day, new Date());
                  const isSelected = isSameDay(day, selectedDate);
                  const dayTasks = state.tasks.filter(t => 
                    (t.date && isSameDay(new Date(t.date), day)) || 
                    (t.deadline && isSameDay(new Date(t.deadline), day))
                  );
                  const daySubtasks = state.tasks.flatMap(t => 
                    t.checklist.filter(item => item.date && isSameDay(new Date(item.date), day))
                      .map(item => ({ ...item, parentTask: t }))
                  );
                  const dayLessons = state.lessons.filter(l => l.dayOfWeek === day.getDay());

                  return (
                    <div 
                      key={day.toString()} 
                      onClick={() => {
                        setSelectedDate(day);
                        setViewMode('day');
                      }}
                      className={cn(
                        "border-r border-b border-border/50 p-2 transition-colors hover:bg-foreground/[0.02] flex flex-col gap-1 cursor-pointer",
                        !isCurrentMonth && "opacity-20",
                        isSelected && "bg-foreground/[0.05]",
                        idx % 7 === 6 && "border-r-0"
                      )}
                    >
                      <div className="flex justify-between items-start">
                        <span className={cn(
                          "text-xs font-mono p-1 rounded-none min-w-[24px] text-center border border-transparent",
                          isToday && "bg-accent text-accent-foreground font-bold border-accent"
                        )}>
                          {format(day, 'd')}
                        </span>
                      </div>
                      <div className="space-y-1 overflow-hidden">
                        {dayLessons.slice(0, 2).map(l => (
                          <div key={l.id} className="text-[8px] truncate bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded-none border border-blue-500/30">
                            {l.subject}
                          </div>
                        ))}
                        {[...dayTasks, ...daySubtasks].slice(0, 2).map((t, i) => (
                          <div key={i} className="text-[8px] truncate bg-accent/20 text-accent px-1.5 py-0.5 rounded-none border border-accent/30">
                            {'title' in t ? t.title : (t as any).text}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="day"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex-1 overflow-y-auto custom-scrollbar p-6"
            >
              <div className="relative min-h-[1000px]">
                {/* Hour lines */}
                {hours.map(hour => (
                  <div key={hour} className="absolute w-full border-t border-border/50 flex items-start" style={{ top: `${(hour - 7) * 60}px` }}>
                    <span className="text-[10px] font-mono text-foreground/20 -mt-2 pr-4 bg-card z-10">
                      {hour.toString().padStart(2, '0')}:00
                    </span>
                  </div>
                ))}

                {/* Events */}
                <div className="ml-16 relative h-full">
                  {allDayEvents.map((event, idx) => {
                    const [h, m] = event.time.split(':').map(Number);
                    const top = (h - 7) * 60 + m;
                    const duration = event.eventType === 'lesson' ? 90 : 45;
                    
                    // Simple overlap handling: if multiple events start at the same time, shift them
                    const sameTimeEvents = allDayEvents.filter(e => e.time === event.time);
                    const eventIndex = sameTimeEvents.findIndex(e => e.id === event.id);
                    const width = 100 / sameTimeEvents.length;
                    const left = eventIndex * width;

                    return (
                      <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        key={event.id}
                        className={cn(
                          "absolute p-3 rounded-none border flex flex-col justify-between group hover:scale-[1.01] transition-all cursor-pointer shadow-xl",
                          event.eventType === 'lesson' 
                            ? "bg-blue-500/10 border-blue-500/20 text-blue-400 hover:bg-blue-500/20" 
                            : "bg-accent/10 border-accent/20 text-accent hover:bg-accent/20"
                        )}
                        style={{ 
                          top: `${top}px`, 
                          height: `${duration}px`,
                          left: `${left}%`,
                          width: `${width - 1}%`,
                          zIndex: 20 + idx
                        }}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-1.5 min-w-0">
                            {event.eventType === 'lesson' ? <BookOpen className="w-3 h-3 shrink-0" /> : <CheckSquare className="w-3 h-3 shrink-0" />}
                            <span className="text-[9px] font-bold uppercase tracking-widest opacity-40 truncate">
                              {event.eventType === 'lesson' ? 'Урок' : 'Задача'}
                            </span>
                          </div>
                          <span className="text-[9px] font-mono opacity-40 shrink-0">{event.time}</span>
                        </div>
                        <div className="mt-1">
                          <h4 className="font-bold text-sm leading-tight line-clamp-2">
                            {'title' in event ? event.title : event.subject}
                          </h4>
                          {'description' in event && event.description && (
                            <p className="text-[10px] opacity-50 line-clamp-1 mt-0.5">{event.description}</p>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}

                  {/* Current time indicator */}
                  {isSameDay(selectedDate, new Date()) && (
                    <div 
                      className="absolute left-0 right-0 border-t-2 border-red-500 z-50 flex items-center"
                      style={{ top: `${(new Date().getHours() - 7) * 60 + new Date().getMinutes()}px` }}
                    >
                      <div className="w-2 h-2 bg-red-500 rounded-none -ml-1" />
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
