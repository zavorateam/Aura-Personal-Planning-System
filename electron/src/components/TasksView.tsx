import React, { useState } from 'react';
import { CheckSquare, Clock, Settings, Zap, Trash2, Edit2, Calendar, Plus, X } from 'lucide-react';
import { AppState, Task } from '../types';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { motion, AnimatePresence } from 'motion/react';
import { v4 as uuidv4 } from 'uuid';

function cn(...inputs: any[]) {
  return twMerge(clsx(inputs));
}

interface TasksViewProps {
  state: AppState;
  addTask: (task: Partial<Task>) => Task;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
}

export function TasksView({ state, addTask, updateTask, deleteTask }: TasksViewProps) {
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const priorityLabels: Record<string, string> = {
    low: 'Низкий',
    medium: 'Средний',
    high: 'Высокий',
    critical: 'Критический'
  };

  const handleSaveTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingTask) {
      const exists = state.tasks.find(t => t.id === editingTask.id);
      if (exists) {
        updateTask(editingTask.id, editingTask);
      } else {
        addTask(editingTask);
      }
      setEditingTask(null);
    }
  };

  const handleCreateNewTask = () => {
    const newTask: any = {
      id: uuidv4(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1,
      type: 'task',
      title: '',
      status: 'todo',
      priority: 'medium',
      energyCost: 3,
      estimatedDuration: 30,
      isPinned: false,
      isOptional: false,
      dependencies: [],
      checklist: [],
      tags: [],
      urgency: 5,
    };
    setEditingTask(newTask);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tighter">Активные задачи</h1>
        <button 
          onClick={handleCreateNewTask}
          className="bg-accent text-accent-foreground p-2 rounded-none transition-colors hover:opacity-90 border border-accent"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {state.tasks.map(t => (
          <div key={t.id} className="group bg-card border border-border p-4 rounded-none flex items-center gap-4 hover:bg-foreground/5 transition-all">
            <button 
              onClick={() => updateTask(t.id, { status: t.status === 'done' ? 'todo' : 'done' })}
              className={cn(
                "w-6 h-6 rounded-none border-2 flex items-center justify-center transition-all",
                t.status === 'done' ? "bg-accent border-accent" : "border-foreground/20 hover:border-accent/50"
              )}
            >
              {t.status === 'done' && <Zap className="w-3 h-3 text-accent-foreground fill-accent-foreground" />}
            </button>
            <div className="flex-1 cursor-pointer" onClick={() => setEditingTask(t)}>
              <h3 className={cn("font-medium transition-all", t.status === 'done' && "text-foreground/30 line-through")}>{t.title}</h3>
              <div className="flex items-center gap-3 mt-1">
                <span className={cn(
                  "text-[10px] uppercase tracking-widest font-bold px-2 py-0.5 rounded-none border border-current/20",
                  t.priority === 'high' || t.priority === 'critical' ? "bg-red-500/20 text-red-400" : "bg-foreground/10 text-foreground/40"
                )}>
                  {priorityLabels[t.priority] || t.priority}
                </span>
                <span className="text-[10px] text-foreground/30 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {t.estimatedDuration} мин
                </span>
                {(t.date || t.startTime) && (
                  <span className="text-[10px] text-accent/50 font-bold uppercase tracking-widest flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {t.date} {t.startTime}
                  </span>
                )}
                {t.projectId && (
                  <span className="text-[10px] text-accent/50 font-bold uppercase tracking-widest flex items-center gap-1">
                    <Settings className="w-3 h-3" />
                    {state.projects.find(p => p.id === t.projectId)?.name}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setEditingTask(t)}
                className="opacity-0 group-hover:opacity-100 p-2 text-foreground/20 hover:text-accent transition-all border border-transparent hover:border-border/20 rounded-none"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button 
                onClick={() => deleteTask(t.id)}
                className="opacity-0 group-hover:opacity-100 p-2 text-foreground/20 hover:text-red-500 transition-all border border-transparent hover:border-border/20 rounded-none"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
        {state.tasks.length === 0 && (
          <div className="py-20 text-center border border-dashed border-border rounded-none">
            <CheckSquare className="w-12 h-12 text-foreground/5 mx-auto mb-4" />
            <p className="text-foreground/20">Задач не найдено. Используйте строку быстрого добавления.</p>
          </div>
        )}
      </div>

      {/* Task Edit Modal */}
      <AnimatePresence>
        {editingTask && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingTask(null)}
              className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="relative w-full max-w-2xl bg-card border border-border rounded-none p-8 shadow-2xl overflow-y-auto max-h-[90vh] custom-scrollbar"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Редактировать задачу</h2>
                <button onClick={() => setEditingTask(null)} className="p-2 hover:bg-foreground/5 rounded-none transition-colors border border-transparent hover:border-border/20">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSaveTask} className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-foreground/30 mb-2">Название</label>
                    <input 
                      type="text" 
                      value={editingTask.title}
                      onChange={e => setEditingTask({ ...editingTask, title: e.target.value })}
                      className="w-full bg-foreground/5 border border-border rounded-none px-4 py-3 focus:outline-none focus:border-accent transition-colors"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-widest text-foreground/30 mb-2">Дата выполнения</label>
                      <input 
                        type="date" 
                        value={editingTask.date || ''}
                        onChange={e => setEditingTask({ ...editingTask, date: e.target.value })}
                        className="w-full bg-foreground/5 border border-border rounded-none px-4 py-3 focus:outline-none focus:border-accent transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-widest text-foreground/30 mb-2">Время выполнения</label>
                      <input 
                        type="time" 
                        value={editingTask.startTime || ''}
                        onChange={e => setEditingTask({ ...editingTask, startTime: e.target.value })}
                        className="w-full bg-foreground/5 border border-border rounded-none px-4 py-3 focus:outline-none focus:border-accent transition-colors"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-widest text-foreground/30 mb-2">Приоритет</label>
                      <select 
                        value={editingTask.priority}
                        onChange={e => setEditingTask({ ...editingTask, priority: e.target.value as any })}
                        className="w-full bg-foreground/5 border border-border rounded-none px-4 py-3 focus:outline-none focus:border-accent transition-colors"
                      >
                        <option value="low">Низкий</option>
                        <option value="medium">Средний</option>
                        <option value="high">Высокий</option>
                        <option value="critical">Критический</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-widest text-foreground/30 mb-2">Длительность (мин)</label>
                      <input 
                        type="number" 
                        value={editingTask.estimatedDuration}
                        onChange={e => setEditingTask({ ...editingTask, estimatedDuration: parseInt(e.target.value) })}
                        className="w-full bg-foreground/5 border border-border rounded-none px-4 py-3 focus:outline-none focus:border-accent transition-colors"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-widest text-foreground/30">Подзадачи (части)</label>
                    <button 
                      type="button"
                      onClick={() => setEditingTask({
                        ...editingTask,
                        checklist: [...editingTask.checklist, { id: uuidv4(), text: '', completed: false }]
                      })}
                      className="text-xs font-bold uppercase tracking-widest text-accent hover:underline"
                    >
                      Добавить часть
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                    {editingTask.checklist.map((item, index) => (
                      <div key={item.id} className="bg-foreground/5 border border-border rounded-none p-4 space-y-3">
                        <div className="flex items-center gap-3">
                          <input 
                            type="checkbox"
                            checked={item.completed}
                            onChange={e => {
                              const newList = [...editingTask.checklist];
                              newList[index].completed = e.target.checked;
                              setEditingTask({ ...editingTask, checklist: newList });
                            }}
                            className="w-5 h-5 rounded-none border-border text-accent focus:ring-accent"
                          />
                          <input 
                            type="text"
                            value={item.text}
                            onChange={e => {
                              const newList = [...editingTask.checklist];
                              newList[index].text = e.target.value;
                              setEditingTask({ ...editingTask, checklist: newList });
                            }}
                            className="flex-1 bg-transparent border-none focus:ring-0 p-0 text-sm"
                            placeholder="Название части..."
                          />
                          <button 
                            type="button"
                            onClick={() => {
                              const newList = editingTask.checklist.filter((_, i) => i !== index);
                              setEditingTask({ ...editingTask, checklist: newList });
                            }}
                            className="text-foreground/20 hover:text-red-500 transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-3 pl-8">
                          <input 
                            type="date"
                            value={item.date || ''}
                            onChange={e => {
                              const newList = [...editingTask.checklist];
                              newList[index].date = e.target.value;
                              setEditingTask({ ...editingTask, checklist: newList });
                            }}
                            className="bg-background/50 border border-border rounded-none px-2 py-1 text-[10px] focus:border-accent outline-none"
                          />
                          <input 
                            type="time"
                            value={item.startTime || ''}
                            onChange={e => {
                              const newList = [...editingTask.checklist];
                              newList[index].startTime = e.target.value;
                              setEditingTask({ ...editingTask, checklist: newList });
                            }}
                            className="bg-background/50 border border-border rounded-none px-2 py-1 text-[10px] focus:border-accent outline-none"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button 
                    type="button"
                    onClick={() => setEditingTask(null)}
                    className="flex-1 px-4 py-3 rounded-none font-bold border border-border hover:bg-foreground/5 transition-colors"
                  >
                    Отмена
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 bg-accent text-accent-foreground px-4 py-3 rounded-none font-bold hover:opacity-90 transition-opacity border border-accent"
                  >
                    Сохранить
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
