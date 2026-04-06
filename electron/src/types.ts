export type EntityType = 
  | 'task' 
  | 'subtask' 
  | 'deadline' 
  | 'lesson' 
  | 'attendance' 
  | 'habit' 
  | 'note' 
  | 'goal' 
  | 'event' 
  | 'tag' 
  | 'project'
  | 'insight';

export type Priority = 'low' | 'medium' | 'high' | 'critical';
export type EnergyLevel = 1 | 2 | 3 | 4 | 5; // 1: Low, 5: High
export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused' | 'unknown';
export type TaskStatus = 'todo' | 'in-progress' | 'done' | 'archived' | 'dropped';

export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface Project extends BaseEntity {
  type: 'project';
  name: string;
  description?: string;
  color: string;
  icon?: string;
  isArchived: boolean;
  documents: { id: string; title: string; url: string }[];
}

export interface Goal extends BaseEntity {
  type: 'goal';
  title: string;
  description?: string;
  deadline?: string;
  targetValue?: number;
  currentValue: number;
  unit?: string;
  status: 'active' | 'completed' | 'abandoned';
  projectId?: string;
}

export interface Task extends BaseEntity {
  type: 'task';
  title: string;
  description?: string;
  shortNote?: string;
  deadline?: string;
  dueWindow?: { start: string; end: string };
  estimatedDuration: number; // in minutes
  priority: Priority;
  urgency: number; // 0-10
  energyCost: EnergyLevel;
  projectId?: string;
  lessonId?: string;
  dependencies: string[];
  recurrence?: string;
  isPinned: boolean;
  isOptional: boolean;
  status: TaskStatus;
  date?: string; // YYYY-MM-DD
  startTime?: string; // HH:mm
  checklist: { 
    id: string; 
    text: string; 
    completed: boolean;
    date?: string; // YYYY-MM-DD
    startTime?: string; // HH:mm
  }[];
  tags: string[];
}

export interface Lesson extends BaseEntity {
  type: 'lesson';
  subject: string;
  teacher?: string;
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  location?: string;
  dayOfWeek: number; // 0-6
  isFixed: boolean;
  hasFreeWindow: boolean;
  onlyRecommendations: boolean;
  notes?: string;
  projectId?: string;
}

export interface Attendance extends BaseEntity {
  type: 'attendance';
  lessonId: string;
  date: string; // YYYY-MM-DD
  status: AttendanceStatus;
  note?: string;
}

export interface Habit extends BaseEntity {
  type: 'habit';
  title: string;
  frequency: 'daily' | 'weekly' | 'custom';
  targetCount: number;
  completedDates: string[]; // YYYY-MM-DD
  projectId?: string;
}

export interface Note extends BaseEntity {
  type: 'note';
  title: string;
  content: string;
  tags: string[];
  isInbox: boolean;
  projectId?: string;
}

export interface Insight extends BaseEntity {
  type: 'insight';
  title: string;
  content: string;
  category: 'productivity' | 'health' | 'learning' | 'general';
  isRead: boolean;
}

export type AiProvider = 'gemini' | 'openai-compatible';

export interface AppState {
  tasks: Task[];
  lessons: Lesson[];
  attendance: Attendance[];
  habits: Habit[];
  notes: Note[];
  projects: Project[];
  goals: Goal[];
  insights: Insight[];
  settings: {
    userName: string;
    theme: 'light' | 'dark' | 'system';
    accentColor: string;
    syncEnabled: boolean;
    githubRepo?: string;
    githubToken?: string;
    githubUser?: string;
    lastSync?: string;
    isSetupComplete: boolean;
    totpSecret?: string;
    masterPasswordHash?: string;
    aiEnabled: boolean;
    aiProvider: AiProvider;
    aiBaseUrl?: string;
    aiApiKey?: string;
    aiModel?: string;
  };
}
