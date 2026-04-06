import React from 'react';
import { Clock, Zap, BarChart3, AlertCircle, RefreshCw } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';
import { AppState } from '../types';
import { WorkloadEngine } from '../services/workload';
import { useAuraStore } from '../hooks/useAuraStore';

export function Dashboard({ state }: { state: AppState }) {
  const today = new Date();
  const tasks = state.tasks || [];
  const lessons = state.lessons || [];
  
  const todayTasks = tasks.filter(t => t.status !== 'done');
  const todayLessons = lessons.filter(l => l.dayOfWeek === today.getDay());
  const loadFactor = WorkloadEngine.calculateLoadFactor(today, lessons, tasks);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-4xl font-bold tracking-tighter mb-2">С возвращением, {state.settings.userName}</h1>
        <p className="text-foreground/40 text-lg">Сегодня {format(today, 'EEEE, d MMMM', { locale: ru })}. У вас {todayTasks.length} активных задач на сегодня.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <section className="bg-card border border-border rounded-none p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Clock className="w-5 h-5 text-accent" />
                Расписание на сегодня
              </h2>
            </div>
            
            <div className="space-y-4">
              {todayLessons.length > 0 ? todayLessons.map(l => (
                <div key={l.id} className="flex gap-4 group">
                  <div className="w-16 text-right text-xs text-foreground/30 pt-1 font-mono">
                    {l.startTime}
                  </div>
                  <div className="flex-1 bg-foreground/5 border-l-4 border-accent p-4 rounded-none group-hover:bg-foreground/10 transition-colors">
                    <h3 className="font-bold">{l.subject}</h3>
                    <p className="text-xs text-foreground/40">{l.location || 'Место не указано'}</p>
                  </div>
                </div>
              )) : (
                <div className="py-12 text-center border border-dashed border-border rounded-none">
                  <p className="text-foreground/20">На сегодня занятий нет.</p>
                </div>
              )}
            </div>
          </section>

          <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-card border border-border rounded-none p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5 text-accent" />
                Прогноз энергии
              </h3>
              <div className="h-24 flex items-end gap-1">
                {[40, 70, 90, 80, 50, 30, 60, 85].map((h, i) => (
                  <div key={i} className="flex-1 bg-foreground/10 rounded-none hover:bg-accent/50 transition-all cursor-help border border-transparent hover:border-accent/20" style={{ height: `${h}%` }} />
                ))}
              </div>
            </div>
            
            <div className="bg-card border border-border rounded-none p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-accent" />
                Баланс нагрузки
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-foreground/50 uppercase tracking-widest">Текущая нагрузка</span>
                  <span className="font-bold">{Math.round(loadFactor * 100)}%</span>
                </div>
                <div className="w-full h-4 bg-foreground/5 rounded-none overflow-hidden border border-border p-0.5">
                  <div className="h-full bg-accent transition-all duration-500 rounded-none" style={{ width: `${loadFactor * 100}%` }} />
                </div>
              </div>
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="bg-card border border-border rounded-none p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-500" />
                Критические дедлайны
              </h2>
            </div>
            <div className="space-y-4">
              {todayTasks.filter(t => t.priority === 'critical').map(t => (
                <div key={t.id} className="p-4 bg-red-500/10 border border-red-500/20 rounded-none">
                  <h3 className="font-bold text-red-400 uppercase tracking-tight">{t.title}</h3>
                </div>
              ))}
              {todayTasks.filter(t => t.priority === 'critical').length === 0 && (
                <p className="text-foreground/20 text-sm italic">Критических дедлайнов на сегодня нет.</p>
              )}
            </div>
          </section>

          <section className="bg-accent/5 border border-accent/10 rounded-none p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold flex items-center gap-2 text-accent">
                <Zap className="w-5 h-5" />
                Инсайты ИИ
              </h2>
              <button 
                onClick={() => useAuraStore.getState().generateAndAddInsights()}
                className="p-2 hover:bg-accent/10 rounded-none transition-colors border border-transparent hover:border-accent/20"
                title="Обновить инсайты"
              >
                <RefreshCw className="w-4 h-4 text-accent" />
              </button>
            </div>
            <div className="space-y-4">
              {state.insights.slice(0, 3).map((insight, i) => (
                <div key={i} className="space-y-1 border-l-2 border-accent/20 pl-4 py-1">
                  <h4 className="text-sm font-bold text-accent uppercase tracking-widest">{insight.title}</h4>
                  <p className="text-xs text-foreground/60 leading-relaxed">
                    {insight.content}
                  </p>
                </div>
              ))}
              {state.insights.length === 0 && (
                <p className="text-xs text-foreground/30 italic">Нажмите на кнопку обновления, чтобы сгенерировать инсайты.</p>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
