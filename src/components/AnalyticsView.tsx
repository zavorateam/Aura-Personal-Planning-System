import React from 'react';
import { BarChart3, TrendingUp, Calendar, AlertCircle } from 'lucide-react';
import { AppState } from '../types';
import { WorkloadEngine } from '../services/workload';
import { format, eachDayOfInterval, subDays } from 'date-fns';
import { ru } from 'date-fns/locale';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export function AnalyticsView({ state }: { state: AppState }) {
  const last7Days = eachDayOfInterval({
    start: subDays(new Date(), 6),
    end: new Date()
  });

  const chartData = last7Days.map(date => ({
    name: format(date, 'EEE', { locale: ru }),
    load: Math.round(WorkloadEngine.calculateLoadFactor(date, state.lessons, state.tasks) * 100)
  }));

  const accentColor = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#f97316';

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold tracking-tighter">Аналитика нагрузки</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-card border border-border rounded-none p-8">
          <h2 className="text-xl font-semibold mb-8 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-accent" />
            Тренд нагрузки (последние 7 дней)
          </h2>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorLoad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={accentColor} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={accentColor} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-border/30" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  stroke="currentColor" 
                  className="text-foreground/40"
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                />
                <YAxis 
                  stroke="currentColor" 
                  className="text-foreground/40"
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                  tickFormatter={(v) => `${v}%`}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '0' }}
                  itemStyle={{ color: accentColor }}
                />
                <Area 
                  type="monotone" 
                  dataKey="load" 
                  stroke={accentColor} 
                  fillOpacity={1} 
                  fill="url(#colorLoad)" 
                  strokeWidth={3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-card border border-border rounded-none p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-500" />
              Еженедельный отчет
            </h3>
            <div className="space-y-4">
              <StatRow label="Средняя нагрузка" value={`${Math.round(chartData.reduce((a, b) => a + b.load, 0) / 7)}%`} />
              <StatRow label="Пиковый день" value={chartData.reduce((a, b) => a.load > b.load ? a : b).name} />
              <StatRow label="Задач выполнено" value={state.tasks.filter(t => t.status === 'done').length.toString()} />
            </div>
          </div>

          <div className="bg-accent/10 border border-accent/20 rounded-none p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-accent">
              <AlertCircle className="w-5 h-5" />
              Инсайты
            </h3>
            <div className="space-y-4">
              {[...WorkloadEngine.generateInsights(state.lessons, state.tasks), ...(state.insights || [])].map((insight, i) => (
                <div key={i} className="space-y-1">
                  <h4 className="text-sm font-bold text-accent uppercase tracking-widest">{insight.title}</h4>
                  <p className="text-xs text-accent/70 leading-relaxed">
                    {insight.content}
                  </p>
                </div>
              ))}
              {[...WorkloadEngine.generateInsights(state.lessons, state.tasks), ...(state.insights || [])].length === 0 && (
                <p className="text-xs text-accent/70 italic">Пока недостаточно данных для инсайтов.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatRow({ label, value }: { label: string, value: string }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-sm text-foreground/40">{label}</span>
      <span className="font-mono font-bold">{value}</span>
    </div>
  );
}
