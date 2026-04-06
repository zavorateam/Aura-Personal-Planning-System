import React from 'react';
import { AppState, Note, Insight } from '../types';
import { Inbox, Sparkles, Trash2, CheckCircle2, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

interface InboxViewProps {
  state: AppState;
  updateNote: (id: string, updates: Partial<Note>) => void;
  deleteNote: (id: string) => void;
  deleteInsight: (id: string) => void;
}

export function InboxView({ state, updateNote, deleteNote, deleteInsight }: InboxViewProps) {
  const inboxNotes = (state.notes || []).filter(n => n.isInbox);
  const insights = state.insights || [];

  const allItems = [
    ...inboxNotes.map(n => ({ ...n, itemType: 'note' as const })),
    ...insights.map(i => ({ ...i, itemType: 'insight' as const }))
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tighter flex items-center gap-3">
          <Inbox className="w-8 h-8 text-accent" />
          Входящие
        </h1>
        <div className="text-xs text-foreground/40 font-mono uppercase tracking-widest">
          {allItems.length} элементов ожидает обработки
        </div>
      </div>

      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {allItems.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20 bg-card border border-dashed border-border rounded-none"
            >
              <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4 opacity-20" />
              <p className="text-foreground/40">Все входящие обработаны. Отличная работа!</p>
            </motion.div>
          ) : (
            allItems.map((item) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="group bg-card border border-border p-6 rounded-none hover:bg-foreground/[0.08] transition-all relative overflow-hidden"
              >
                {item.itemType === 'insight' && (
                  <div className="absolute top-0 right-0 p-1 bg-accent/20 border-l border-b border-accent/30 rounded-none">
                    <Sparkles className="w-3 h-3 text-accent" />
                  </div>
                )}

                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-none border ${item.itemType === 'insight' ? 'bg-accent/20 text-accent border-accent/30' : 'bg-blue-500/20 text-blue-400 border-blue-500/30'}`}>
                        {item.itemType === 'insight' ? 'Инсайт ИИ' : 'Заметка'}
                      </span>
                      <span className="text-[10px] text-foreground/20 flex items-center gap-1 font-mono">
                        <Clock className="w-3 h-3" />
                        {format(new Date(item.createdAt), 'd MMM, HH:mm', { locale: ru })}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold tracking-tight">{item.title}</h3>
                    <p className="text-foreground/60 text-sm leading-relaxed">
                      {item.itemType === 'note' ? (item as Note).content : (item as Insight).content}
                    </p>
                  </div>

                  <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {item.itemType === 'note' ? (
                      <button 
                        onClick={() => updateNote(item.id, { isInbox: false })}
                        className="p-2 bg-green-500/20 text-green-400 hover:bg-green-500 hover:text-white rounded-none border border-green-500/30 transition-all"
                        title="Обработать"
                      >
                        <CheckCircle2 className="w-5 h-5" />
                      </button>
                    ) : (
                      <button 
                        onClick={() => deleteInsight(item.id)}
                        className="p-2 bg-green-500/20 text-green-400 hover:bg-green-500 hover:text-white rounded-none border border-green-500/30 transition-all"
                        title="Принять"
                      >
                        <CheckCircle2 className="w-5 h-5" />
                      </button>
                    )}
                    <button 
                      onClick={() => item.itemType === 'note' ? deleteNote(item.id) : deleteInsight(item.id)}
                      className="p-2 bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white rounded-none border border-red-500/30 transition-all"
                      title="Удалить"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
