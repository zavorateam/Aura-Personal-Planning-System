import React, { useState } from 'react';
import { StickyNote, Plus, Tag, Inbox as InboxIcon, Edit2, Trash2, X, Check, Briefcase } from 'lucide-react';
import { AppState, Note } from '../types';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: any[]) {
  return twMerge(clsx(inputs));
}

interface NotesViewProps {
  state: AppState;
  addNote: (note: Partial<Note>) => void;
  updateNote: (id: string, updates: Partial<Note>) => void;
  deleteNote: (id: string) => void;
}

export function NotesView({ state, addNote, updateNote, deleteNote }: NotesViewProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [formData, setFormData] = useState<Partial<Note>>({
    title: '',
    content: '',
    tags: [],
  });

  const handleOpenAdd = () => {
    setEditingNote(null);
    setFormData({ title: '', content: '', tags: [] });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (note: Note) => {
    setEditingNote(note);
    setFormData(note);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingNote) {
      updateNote(editingNote.id, formData);
    } else {
      addNote(formData);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tighter">Заметки и мысли</h1>
        <button 
          onClick={handleOpenAdd}
          className="bg-accent text-accent-foreground px-4 py-2 rounded-none font-bold text-sm flex items-center gap-2 hover:opacity-90 transition-colors border border-accent"
        >
          <Plus className="w-4 h-4" /> Новая заметка
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {state.notes.map(n => (
          <div 
            key={n.id} 
            onClick={() => handleOpenEdit(n)}
            className="bg-card border border-border p-6 rounded-none hover:bg-foreground/5 transition-all cursor-pointer group relative overflow-hidden"
          >
            {n.isInbox && (
              <div className="absolute top-0 right-0 p-2">
                <InboxIcon className="w-4 h-4 text-accent/50" />
              </div>
            )}
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-lg group-hover:text-accent transition-colors truncate pr-8">{n.title}</h3>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  deleteNote(n.id);
                }}
                className="opacity-0 group-hover:opacity-100 p-2 hover:text-red-500 transition-all border border-transparent hover:border-border/20 rounded-none"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <p className="text-sm text-foreground/40 line-clamp-4 leading-relaxed">{n.content || 'Пустая заметка...'}</p>
            <div className="mt-6 flex flex-wrap gap-2">
              {n.projectId && (
                <span className="text-[10px] bg-accent/10 px-2 py-1 rounded-none text-accent flex items-center gap-1 font-bold border border-accent/20">
                  <Briefcase className="w-2 h-2" />
                  {state.projects.find(p => p.id === n.projectId)?.name}
                </span>
              )}
              {n.tags.map(t => (
                <span key={t} className="text-[10px] bg-foreground/5 px-2 py-1 rounded-none text-foreground/30 flex items-center gap-1 border border-foreground/10">
                  <Tag className="w-2 h-2" />
                  {t}
                </span>
              ))}
            </div>
          </div>
        ))}
        {state.notes.length === 0 && (
          <div className="col-span-full py-20 text-center border border-dashed border-border rounded-none">
            <StickyNote className="w-12 h-12 text-foreground/5 mx-auto mb-4" />
            <p className="text-foreground/20">Ваш входящий ящик пуст. Запишите мысль, чтобы начать.</p>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-none p-8 w-full max-w-2xl space-y-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold tracking-tighter">
                {editingNote ? 'Редактировать заметку' : 'Новая заметка'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-foreground/30 hover:text-foreground p-2 hover:bg-foreground/5 rounded-none border border-transparent hover:border-border/20 transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs text-foreground/30 uppercase tracking-widest font-bold">Заголовок</label>
                <input 
                  type="text" 
                  required
                  className="w-full bg-foreground/5 border border-border rounded-none p-3 text-sm focus:border-accent outline-none transition-colors"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs text-foreground/30 uppercase tracking-widest font-bold">Содержание</label>
                <textarea 
                  className="w-full bg-foreground/5 border border-border rounded-none p-3 text-sm focus:border-accent outline-none min-h-[200px] resize-none transition-colors"
                  value={formData.content}
                  onChange={e => setFormData({ ...formData, content: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs text-foreground/30 uppercase tracking-widest font-bold">Теги (через запятую)</label>
                <input 
                  type="text" 
                  className="w-full bg-foreground/5 border border-border rounded-none p-3 text-sm focus:border-accent outline-none transition-colors"
                  value={formData.tags?.join(', ')}
                  onChange={e => setFormData({ ...formData, tags: e.target.value.split(',').map(t => t.trim()).filter(t => t) })}
                />
              </div>

              <button 
                type="submit"
                className="w-full bg-accent text-accent-foreground font-bold py-4 rounded-none hover:opacity-90 transition-all flex items-center justify-center gap-2 border border-accent"
              >
                <Check className="w-5 h-5" />
                {editingNote ? 'Сохранить изменения' : 'Создать заметку'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
