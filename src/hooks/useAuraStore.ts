import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AppState, Task, Lesson, Note, Habit, Attendance, Project, Goal, Insight } from '../types';
import { v4 as uuidv4 } from 'uuid';

const STORAGE_KEY = 'aura_app_state_v2';

interface AuraStore {
  state: AppState;
  addTask: (task: Partial<Task>) => Task;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  addNote: (note: Partial<Note>) => Note;
  updateNote: (id: string, updates: Partial<Note>) => void;
  deleteNote: (id: string) => void;
  addLesson: (lesson: Partial<Lesson>) => Lesson;
  updateLesson: (id: string, updates: Partial<Lesson>) => void;
  deleteLesson: (id: string) => void;
  addHabit: (habit: Partial<Habit>) => Habit;
  toggleHabit: (id: string, date: string) => void;
  addAttendance: (attendance: Partial<Attendance>) => Attendance;
  addInsight: (insight: Partial<Insight>) => Insight;
  deleteInsight: (id: string) => void;
  addGoal: (goal: Partial<Goal>) => Goal;
  updateGoal: (id: string, updates: Partial<Goal>) => void;
  deleteGoal: (id: string) => void;
  addProject: (project: Partial<Project>) => Project;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  selectedProjectId: string | null;
  setSelectedProjectId: (id: string | null) => void;
  generateAndAddInsights: () => Promise<void>;
  setState: (updater: AppState | ((prev: AppState) => AppState)) => void;
}

const defaultState: AppState = {
  tasks: [],
  lessons: [],
  attendance: [],
  habits: [],
  notes: [],
  projects: [],
  goals: [],
  insights: [],
  settings: {
    userName: 'User',
    theme: 'dark',
    accentColor: '#f97316',
    syncEnabled: false,
    isSetupComplete: false,
    aiEnabled: true,
    aiProvider: 'gemini',
    aiBaseUrl: 'http://localhost:11434/v1',
    aiModel: 'llama3',
  }
};

export const useAuraStore = create<AuraStore>()(
  persist(
    (set, get) => ({
      state: defaultState,

      selectedProjectId: null,
      setSelectedProjectId: (id) => set({ selectedProjectId: id }),

      generateAndAddInsights: async () => {
        const { generateInsights } = await import('../services/ai');
        const { WorkloadEngine } = await import('../services/workload');
        const state = get().state;
        
        try {
          const aiInsights = await generateInsights(state);
          const engineInsights = WorkloadEngine.generateInsights(state.lessons, state.tasks);
          
          const newInsights: Insight[] = [...aiInsights, ...engineInsights].map(i => ({
            id: uuidv4(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            version: 1,
            type: 'insight',
            title: i.title || 'Insight',
            content: i.content || '',
            category: i.category || 'general',
            isRead: false,
          }));

          set((s) => ({ state: { ...s.state, insights: [...newInsights, ...s.state.insights].slice(0, 50) } }));
        } catch (err) {
          console.error('Failed to generate insights:', err);
        }
      },

      addTask: (task) => {
        const newTask: Task = {
          id: uuidv4(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          version: 1,
          type: 'task',
          title: task.title || 'Untitled Task',
          status: 'todo',
          priority: task.priority || 'medium',
          energyCost: task.energyCost || 3,
          estimatedDuration: task.estimatedDuration || 30,
          isPinned: false,
          isOptional: false,
          dependencies: [],
          checklist: [],
          tags: task.tags || [],
          urgency: 5,
          date: task.date,
          startTime: task.startTime,
          ...task
        };
        set((s) => ({ state: { ...s.state, tasks: [...s.state.tasks, newTask] } }));
        return newTask;
      },

      updateTask: (id, updates) => {
        set((s) => ({
          state: {
            ...s.state,
            tasks: s.state.tasks.map((t) =>
              t.id === id ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t
            ),
          },
        }));
      },

      deleteTask: (id) => {
        set((s) => ({ state: { ...s.state, tasks: s.state.tasks.filter((t) => t.id !== id) } }));
      },

      addNote: (note) => {
        const newNote: Note = {
          id: uuidv4(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          version: 1,
          type: 'note',
          title: note.title || 'Новая заметка',
          content: note.content || '',
          tags: note.tags || [],
          isInbox: note.isInbox ?? true,
          projectId: note.projectId,
        };
        set((s) => ({ state: { ...s.state, notes: [...s.state.notes, newNote] } }));
        return newNote;
      },

      updateNote: (id, updates) => {
        set((s) => ({
          state: {
            ...s.state,
            notes: s.state.notes.map((n) =>
              n.id === id ? { ...n, ...updates, updatedAt: new Date().toISOString() } : n
            ),
          },
        }));
      },

      deleteNote: (id) => {
        set((s) => ({ state: { ...s.state, notes: s.state.notes.filter((n) => n.id !== id) } }));
      },

      addLesson: (lesson) => {
        const newLesson: Lesson = {
          id: uuidv4(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          version: 1,
          type: 'lesson',
          subject: lesson.subject || 'Новый предмет',
          startTime: lesson.startTime || '09:00',
          endTime: lesson.endTime || '10:30',
          dayOfWeek: lesson.dayOfWeek ?? 1,
          isFixed: true,
          hasFreeWindow: false,
          onlyRecommendations: false,
          projectId: lesson.projectId,
          ...lesson
        };
        set((s) => ({ state: { ...s.state, lessons: [...s.state.lessons, newLesson] } }));
        return newLesson;
      },

      updateLesson: (id, updates) => {
        set((s) => ({
          state: {
            ...s.state,
            lessons: s.state.lessons.map((l) =>
              l.id === id ? { ...l, ...updates, updatedAt: new Date().toISOString() } : l
            ),
          },
        }));
      },

      deleteLesson: (id) => {
        set((s) => ({ state: { ...s.state, lessons: s.state.lessons.filter((l) => l.id !== id) } }));
      },

      addHabit: (habit) => {
        const newHabit: Habit = {
          id: uuidv4(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          version: 1,
          type: 'habit',
          title: habit.title || 'New Habit',
          frequency: habit.frequency || 'daily',
          targetCount: habit.targetCount || 1,
          completedDates: [],
          projectId: habit.projectId,
        };
        set((s) => ({ state: { ...s.state, habits: [...s.state.habits, newHabit] } }));
        return newHabit;
      },

      toggleHabit: (id, date) => {
        set((s) => ({
          state: {
            ...s.state,
            habits: s.state.habits.map((h) => {
              if (h.id !== id) return h;
              const exists = h.completedDates.includes(date);
              return {
                ...h,
                completedDates: exists
                  ? h.completedDates.filter((d) => d !== date)
                  : [...h.completedDates, date],
              };
            }),
          },
        }));
      },

      addAttendance: (attendance) => {
        const newAttendance: Attendance = {
          id: uuidv4(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          version: 1,
          type: 'attendance',
          lessonId: attendance.lessonId!,
          date: attendance.date || new Date().toISOString().split('T')[0],
          status: attendance.status || 'unknown',
        };
        set((s) => ({ state: { ...s.state, attendance: [...s.state.attendance, newAttendance] } }));
        return newAttendance;
      },

      addInsight: (insight) => {
        const newInsight: Insight = {
          id: uuidv4(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          version: 1,
          type: 'insight',
          title: insight.title || 'Insight',
          content: insight.content || '',
          category: insight.category || 'general',
          isRead: false,
        };
        set((s) => ({ state: { ...s.state, insights: [newInsight, ...s.state.insights] } }));
        return newInsight;
      },

      deleteInsight: (id) => {
        set((s) => ({ state: { ...s.state, insights: s.state.insights.filter((i) => i.id !== id) } }));
      },

      addGoal: (goal) => {
        const newGoal: Goal = {
          id: uuidv4(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          version: 1,
          type: 'goal',
          title: goal.title || 'Новая цель',
          description: goal.description || '',
          currentValue: goal.currentValue || 0,
          status: goal.status || 'active',
          projectId: goal.projectId,
          ...goal
        };
        set((s) => ({ state: { ...s.state, goals: [...s.state.goals, newGoal] } }));
        return newGoal;
      },

      updateGoal: (id, updates) => {
        set((s) => ({
          state: {
            ...s.state,
            goals: s.state.goals.map((g) =>
              g.id === id ? { ...g, ...updates, updatedAt: new Date().toISOString() } : g
            ),
          },
        }));
      },

      deleteGoal: (id) => {
        set((s) => ({ state: { ...s.state, goals: s.state.goals.filter((g) => g.id !== id) } }));
      },

      addProject: (project) => {
        const newProject: Project = {
          id: uuidv4(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          version: 1,
          type: 'project',
          name: project.name || 'Новый проект',
          description: project.description || '',
          color: project.color || '#f97316',
          isArchived: false,
          documents: [],
          ...project
        };
        set((s) => ({ state: { ...s.state, projects: [...s.state.projects, newProject] } }));
        return newProject;
      },

      updateProject: (id, updates) => {
        set((s) => ({
          state: {
            ...s.state,
            projects: s.state.projects.map((p) =>
              p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p
            ),
          },
        }));
      },

      deleteProject: (id) => {
        set((s) => ({ 
          state: { 
            ...s.state, 
            projects: s.state.projects.filter((p) => p.id !== id),
            tasks: s.state.tasks.filter(t => t.projectId !== id),
            lessons: s.state.lessons.filter(l => l.projectId !== id),
            notes: s.state.notes.filter(n => n.projectId !== id),
            goals: s.state.goals.filter(g => g.projectId !== id),
          } 
        }));
      },

      setState: (updater) => {
        set((s) => ({ 
          state: typeof updater === 'function' ? (updater as (prev: AppState) => AppState)(s.state) : updater 
        }));
      },
    }),
    {
      name: STORAGE_KEY,
      partialize: (s) => ({ state: s.state, selectedProjectId: s.selectedProjectId }),
      merge: (persistedState: any, currentState) => ({
        ...currentState,
        state: {
          ...currentState.state,
          ...(persistedState?.state || {}),
          settings: {
            ...currentState.state.settings,
            ...(persistedState?.state?.settings || {}),
          },
        },
        selectedProjectId: persistedState?.selectedProjectId || null,
      }),
    }
  )
);
