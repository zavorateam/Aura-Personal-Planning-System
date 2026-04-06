import { Task, Lesson } from '../types';
import { addMinutes, isWithinInterval, parseISO, startOfDay, endOfDay, eachHourOfInterval, format } from 'date-fns';

export interface TimeSlot {
  start: Date;
  end: Date;
  type: 'free' | 'lesson' | 'task';
  entityId?: string;
  label: string;
}

export class WorkloadEngine {
  static getDayTimeline(date: Date, lessons: Lesson[], tasks: Task[]): TimeSlot[] {
    const dayStart = startOfDay(date);
    const dayEnd = endOfDay(date);
    const dayOfWeek = date.getDay();
    
    const timeline: TimeSlot[] = [];
    
    // 1. Add lessons (fixed)
    lessons.filter(l => l.dayOfWeek === dayOfWeek).forEach(l => {
      const [startH, startM] = l.startTime.split(':').map(Number);
      const [endH, endM] = l.endTime.split(':').map(Number);
      
      const start = new Date(date);
      start.setHours(startH, startM, 0, 0);
      const end = new Date(date);
      end.setHours(endH, endM, 0, 0);
      
      timeline.push({
        start,
        end,
        type: 'lesson',
        entityId: l.id,
        label: l.subject
      });
    });

    // 2. Sort timeline
    timeline.sort((a, b) => a.start.getTime() - b.start.getTime());

    // 3. Fill gaps with 'free' slots
    const fullTimeline: TimeSlot[] = [];
    let lastTime = dayStart;

    timeline.forEach(slot => {
      if (slot.start > lastTime) {
        fullTimeline.push({
          start: lastTime,
          end: slot.start,
          type: 'free',
          label: 'Free Window'
        });
      }
      fullTimeline.push(slot);
      lastTime = slot.end;
    });

    if (lastTime < dayEnd) {
      fullTimeline.push({
        start: lastTime,
        end: dayEnd,
        type: 'free',
        label: 'Free Window'
      });
    }

    return fullTimeline;
  }

  static calculateLoadFactor(date: Date, lessons: Lesson[], tasks: Task[]): number {
    const dayOfWeek = date.getDay();
    const dayLessons = lessons.filter(l => l.dayOfWeek === dayOfWeek);
    
    let totalBusyMinutes = dayLessons.reduce((acc, l) => {
      const [sh, sm] = l.startTime.split(':').map(Number);
      const [eh, em] = l.endTime.split(':').map(Number);
      return acc + ((eh * 60 + em) - (sh * 60 + sm));
    }, 0);

    // Add tasks due today or scheduled for today
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayTasks = tasks.filter(t => 
      t.status !== 'done' && 
      ((t.date && t.date === dateStr) || (t.deadline && t.deadline.startsWith(dateStr)))
    );
    totalBusyMinutes += dayTasks.reduce((acc, t) => acc + t.estimatedDuration, 0);

    const totalAvailableMinutes = 16 * 60; // Assume 16 hours awake
    return Math.min(1, totalBusyMinutes / totalAvailableMinutes);
  }

  static getRecommendations(date: Date, lessons: Lesson[], tasks: Task[]) {
    const timeline = this.getDayTimeline(date, lessons, tasks);
    const freeSlots = timeline.filter(s => s.type === 'free');
    const pendingTasks = tasks.filter(t => t.status === 'todo').sort((a, b) => b.urgency - a.urgency);

    const recommendations: { taskId: string; slot: TimeSlot; reason: string }[] = [];

    pendingTasks.forEach(task => {
      const duration = task.estimatedDuration;
      const suitableSlot = freeSlots.find(slot => {
        const slotDuration = (slot.end.getTime() - slot.start.getTime()) / (1000 * 60);
        return slotDuration >= duration;
      });

      if (suitableSlot) {
        recommendations.push({
          taskId: task.id,
          slot: suitableSlot,
          reason: `Fits perfectly in your ${Math.round((suitableSlot.end.getTime() - suitableSlot.start.getTime()) / 60000)}m free window.`
        });
        // In a real engine, we'd "consume" this slot
      }
    });

    return recommendations;
  }

  static generateInsights(lessons: Lesson[], tasks: Task[]): { title: string; content: string; category: 'productivity' | 'health' | 'learning' | 'general' }[] {
    const insights: { title: string; content: string; category: 'productivity' | 'health' | 'learning' | 'general' }[] = [];
    
    // 1. Check for busy days
    const dayLoads = [0, 1, 2, 3, 4, 5, 6].map(d => {
      const date = new Date();
      date.setDate(date.getDate() - date.getDay() + d);
      return { day: d, load: this.calculateLoadFactor(date, lessons, tasks) };
    });

    const peakDay = dayLoads.reduce((a, b) => a.load > b.load ? a : b);
    const dayNames = ['воскресенье', 'понедельник', 'вторник', 'среду', 'четверг', 'пятницу', 'субботу'];
    
    if (peakDay.load > 0.7) {
      insights.push({
        title: 'Пиковая нагрузка',
        content: `Ваша нагрузка достигает пика в ${dayNames[peakDay.day]}. Рассмотрите возможность переноса несрочных задач на более свободные дни.`,
        category: 'productivity'
      });
    }

    // 2. Check for task completion
    const completedTasks = tasks.filter(t => t.status === 'done').length;
    if (completedTasks > 10) {
      insights.push({
        title: 'Отличный прогресс',
        content: `Вы выполнили уже ${completedTasks} задач! Ваша продуктивность растет.`,
        category: 'general'
      });
    }

    // 3. Check for late night tasks
    const lateTasks = tasks.filter(t => t.startTime && parseInt(t.startTime.split(':')[0]) > 22);
    if (lateTasks.length > 0) {
      insights.push({
        title: 'Режим сна',
        content: 'У вас есть задачи, запланированные на позднее время. Постарайтесь завершать дела до 22:00 для лучшего восстановления.',
        category: 'health'
      });
    }

    return insights;
  }
}
