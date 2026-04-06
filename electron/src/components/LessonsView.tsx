import React, { useState } from 'react';
import { BookOpen, Plus, Clock, MapPin, Edit2, Trash2, X, Check, CheckSquare, Zap } from 'lucide-react';
import { AppState, Lesson, Task } from '../types';
import { parseISO, getDay, isSameDay } from 'date-fns';

interface LessonsViewProps {
  state: AppState;
  addLesson: (lesson: Partial<Lesson>) => void;
  updateLesson: (id: string, updates: Partial<Lesson>) => void;
  deleteLesson: (id: string) => void;
}

export function LessonsView({ state, addLesson, updateLesson, deleteLesson }: LessonsViewProps) {
  const days = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [formData, setFormData] = useState<Partial<Lesson>>({
    subject: '',
    startTime: '09:00',
    endTime: '10:30',
    location: '',
    dayOfWeek: 1,
  });

  const handleOpenAdd = () => {
    setEditingLesson(null);
    setFormData({
      subject: '',
      startTime: '09:00',
      endTime: '10:30',
      location: '',
      dayOfWeek: 1,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (lesson: Lesson) => {
    setEditingLesson(lesson);
    setFormData(lesson);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingLesson) {
      updateLesson(editingLesson.id, formData);
    } else {
      addLesson(formData);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tighter">Учебное расписание</h1>
        <button 
          onClick={handleOpenAdd}
          className="bg-accent text-accent-foreground p-2 rounded-none transition-colors hover:opacity-90 border border-accent"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        {days.slice(1, 6).map((day, index) => {
          const dayNum = index + 1;
          const dayLessons = state.lessons
            .filter(l => l.dayOfWeek === dayNum)
            .sort((a, b) => a.startTime.localeCompare(b.startTime));
          
          // Also find tasks scheduled for this day of the week (if they have a date)
          // For simplicity, we'll show tasks scheduled for the CURRENT week's day
          const today = new Date();
          const dayOffset = dayNum - today.getDay();
          const targetDate = new Date(today);
          targetDate.setDate(today.getDate() + dayOffset);

          const dayTasks = state.tasks.filter(t => 
            (t.date && isSameDay(parseISO(t.date), targetDate)) ||
            (t.deadline && isSameDay(parseISO(t.deadline), targetDate))
          );

          const daySubtasks = state.tasks.flatMap(t => 
            t.checklist.filter(item => item.date && isSameDay(parseISO(item.date), targetDate))
              .map(item => ({ ...item, parentTask: t }))
          );
          
          const allEvents = [
            ...dayLessons.map(l => ({ ...l, type: 'lesson' as const, time: l.startTime })),
            ...dayTasks.map(t => ({ ...t, type: 'task' as const, time: t.startTime || '00:00' })),
            ...daySubtasks.map(s => ({ ...s, type: 'subtask' as const, time: s.startTime || '00:00', title: `${s.parentTask.title}: ${s.text}` }))
          ].sort((a, b) => a.time.localeCompare(b.time));

          return (
            <div key={day} className="bg-card border border-border rounded-none p-6 flex flex-col">
              <h2 className="text-lg font-bold mb-4 text-accent">{day}</h2>
              <div className="space-y-3 flex-1">
                {allEvents.length > 0 ? allEvents.map((event, i) => (
                  <div key={i} className={`p-3 bg-foreground/5 rounded-none border-l-2 ${event.type === 'lesson' ? 'border-accent' : 'border-blue-500'} group hover:bg-foreground/10 transition-all relative border border-transparent hover:border-border/20`}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1 text-[10px] text-foreground/30">
                        <Clock className="w-3 h-3" />
                        {event.time} {event.type === 'lesson' ? `- ${(event as Lesson).endTime}` : ''}
                      </div>
                      {event.type === 'lesson' && (
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => handleOpenEdit(event as Lesson)} className="text-foreground/30 hover:text-foreground">
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button onClick={() => deleteLesson((event as Lesson).id)} className="text-foreground/30 hover:text-red-500">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {event.type !== 'lesson' && <CheckSquare className="w-3 h-3 text-blue-400" />}
                      <p className="font-medium text-sm">{'subject' in event ? event.subject : (event as any).title}</p>
                    </div>
                    {event.type === 'lesson' && (event as Lesson).location && (
                      <div className="flex items-center gap-1 text-[10px] text-foreground/20 mt-1">
                        <MapPin className="w-3 h-3" />
                        {(event as Lesson).location}
                      </div>
                    )}
                  </div>
                )) : (
                  <div className="h-full flex items-center justify-center border border-dashed border-border rounded-none py-8">
                    <p className="text-[10px] text-foreground/10 uppercase tracking-widest">Нет событий</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-none p-8 w-full max-w-md space-y-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold tracking-tighter">
                {editingLesson ? 'Редактировать занятие' : 'Добавить занятие'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-foreground/30 hover:text-foreground p-2 hover:bg-foreground/5 rounded-none border border-transparent hover:border-border/20 transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs text-foreground/30 uppercase tracking-widest font-bold">Предмет</label>
                <input 
                  type="text" 
                  required
                  className="w-full bg-foreground/5 border border-border rounded-none p-3 text-sm focus:border-accent outline-none transition-colors"
                  value={formData.subject}
                  onChange={e => setFormData({ ...formData, subject: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs text-foreground/30 uppercase tracking-widest font-bold">Начало</label>
                  <input 
                    type="time" 
                    required
                    className="w-full bg-foreground/5 border border-border rounded-none p-3 text-sm focus:border-accent outline-none transition-colors"
                    value={formData.startTime}
                    onChange={e => setFormData({ ...formData, startTime: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-foreground/30 uppercase tracking-widest font-bold">Конец</label>
                  <input 
                    type="time" 
                    required
                    className="w-full bg-foreground/5 border border-border rounded-none p-3 text-sm focus:border-accent outline-none transition-colors"
                    value={formData.endTime}
                    onChange={e => setFormData({ ...formData, endTime: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs text-foreground/30 uppercase tracking-widest font-bold">День недели</label>
                <select 
                  className="w-full bg-foreground/5 border border-border rounded-none p-3 text-sm focus:border-accent outline-none appearance-none transition-colors"
                  value={formData.dayOfWeek}
                  onChange={e => setFormData({ ...formData, dayOfWeek: parseInt(e.target.value) })}
                >
                  {days.map((day, i) => (
                    <option key={day} value={i} className="bg-card">{day}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs text-foreground/30 uppercase tracking-widest font-bold">Место (аудитория)</label>
                <input 
                  type="text" 
                  className="w-full bg-foreground/5 border border-border rounded-none p-3 text-sm focus:border-accent outline-none transition-colors"
                  value={formData.location}
                  onChange={e => setFormData({ ...formData, location: e.target.value })}
                />
              </div>

              <button 
                type="submit"
                className="w-full bg-accent text-accent-foreground font-bold py-4 rounded-none hover:opacity-90 transition-all flex items-center justify-center gap-2 border border-accent"
              >
                <Check className="w-5 h-5" />
                {editingLesson ? 'Сохранить изменения' : 'Добавить в расписание'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
