import React, { useState } from 'react';
import { useAuraStore } from '../hooks/useAuraStore';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Briefcase, 
  CheckSquare, 
  BookOpen, 
  Link as LinkIcon, 
  Trash2, 
  ExternalLink,
  Folder,
  Code,
  Globe,
  Music,
  Camera,
  Heart,
  Star,
  Zap,
  Coffee,
  Gamepad2,
  GraduationCap,
  Plane,
  ShoppingBag,
  Target,
  Trophy,
  X,
  StickyNote,
  LucideIcon
} from 'lucide-react';

const PROJECT_ICONS: Record<string, LucideIcon> = {
  briefcase: Briefcase,
  code: Code,
  globe: Globe,
  music: Music,
  camera: Camera,
  heart: Heart,
  star: Star,
  zap: Zap,
  coffee: Coffee,
  gamepad: Gamepad2,
  education: GraduationCap,
  plane: Plane,
  shopping: ShoppingBag,
  target: Target,
  trophy: Trophy,
  folder: Folder
};

export function ProjectsView() {
  const { state, addProject, updateProject, deleteProject, addTask, addLesson, addNote, selectedProjectId, setSelectedProjectId } = useAuraStore();
  const [isAdding, setIsAdding] = useState(false);
  const [newProject, setNewProject] = useState({ name: '', description: '', color: '#f97316', icon: 'briefcase' });

  const [isAddingTask, setIsAddingTask] = useState(false);
  const [isAddingLesson, setIsAddingLesson] = useState(false);
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [isAddingDoc, setIsAddingDoc] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [taskTitle, setTaskTitle] = useState('');
  const [lessonSubject, setLessonSubject] = useState('');
  const [noteTitle, setNoteTitle] = useState('');
  const [docTitle, setDocTitle] = useState('');
  const [docUrl, setDocUrl] = useState('');

  const handleAddTask = () => {
    if (taskTitle && selectedProjectId) {
      addTask({
        title: taskTitle,
        projectId: selectedProjectId,
        status: 'todo',
        priority: 'medium',
        estimatedDuration: 30,
        checklist: [],
        createdAt: new Date().toISOString()
      } as any);
      setTaskTitle('');
      setIsAddingTask(false);
    }
  };

  const handleAddLesson = () => {
    if (lessonSubject && selectedProjectId) {
      addLesson({
        subject: lessonSubject,
        projectId: selectedProjectId,
        startTime: '09:00',
        endTime: '10:30',
        dayOfWeek: 1,
        location: ''
      });
      setLessonSubject('');
      setIsAddingLesson(false);
    }
  };

  const handleAddNote = () => {
    if (noteTitle && selectedProjectId) {
      addNote({
        title: noteTitle,
        content: '',
        projectId: selectedProjectId,
        tags: [],
        isInbox: false
      });
      setNoteTitle('');
      setIsAddingNote(false);
    }
  };

  const handleAddDoc = () => {
    if (docTitle && docUrl && selectedProjectId) {
      updateProject(selectedProjectId, {
        documents: [...(selectedProject?.documents || []), { id: Math.random().toString(36).substr(2, 9), title: docTitle, url: docUrl }]
      });
      setDocTitle('');
      setDocUrl('');
      setIsAddingDoc(false);
    }
  };

  const handleDeleteProject = () => {
    if (selectedProjectId) {
      deleteProject(selectedProjectId);
      setSelectedProjectId(null);
      setIsDeleting(false);
    }
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    addProject(newProject);
    setIsAdding(false);
    setNewProject({ name: '', description: '', color: '#f97316', icon: 'briefcase' });
  };

  const selectedProject = state.projects.find(p => p.id === selectedProjectId);
  const projectTasks = state.tasks.filter(t => t.projectId === selectedProjectId);
  const projectLessons = state.lessons.filter(l => l.projectId === selectedProjectId);
  const projectNotes = state.notes.filter(n => n.projectId === selectedProjectId);

  const getIcon = (iconName?: string) => {
    const Icon = PROJECT_ICONS[iconName || 'briefcase'] || Briefcase;
    return <Icon size={20} />;
  };

  return (
    <div className="p-8 max-w-6xl mx-auto overflow-y-auto h-full custom-scrollbar">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Проекты</h1>
          <p className="text-foreground/50">Управление сложными целями и ресурсами</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 bg-accent text-accent-foreground px-4 py-2 rounded-none font-medium hover:opacity-90 transition-opacity border border-accent"
        >
          <Plus size={20} />
          Новый проект
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Project List */}
        <div className="md:col-span-1 space-y-4">
          {state.projects.map(project => (
            <button
              key={project.id}
              onClick={() => setSelectedProjectId(project.id)}
              className={`w-full text-left p-4 rounded-none border transition-all ${
                selectedProjectId === project.id 
                  ? 'bg-accent/10 border-accent' 
                  : 'bg-card border-border hover:border-foreground/20'
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-none border border-current/20" style={{ backgroundColor: `${project.color}20`, color: project.color }}>
                  {getIcon(project.icon)}
                </div>
                <h3 className="font-bold">{project.name}</h3>
              </div>
              <p className="text-xs text-foreground/50 line-clamp-2 mb-3">{project.description}</p>
              <div className="flex flex-wrap items-center gap-4 text-[10px] uppercase tracking-widest font-bold text-foreground/30 mt-2">
                <span className="flex items-center gap-1">
                  <CheckSquare size={12} /> 
                  {(() => {
                    const tasks = state.tasks.filter(t => t.projectId === project.id);
                    const done = tasks.filter(t => t.status === 'done').length;
                    return tasks.length > 0 ? `${Math.round((done / tasks.length) * 100)}%` : '0%';
                  })()}
                </span>
                <span className="flex items-center gap-1"><StickyNote size={12} /> {state.notes.filter(n => n.projectId === project.id).length}</span>
                <span className="flex items-center gap-1"><LinkIcon size={12} /> {project.documents?.length || 0}</span>
              </div>
            </button>
          ))}
          {state.projects.length === 0 && (
            <div className="text-center py-12 border border-dashed border-border rounded-none">
              <Briefcase size={40} className="mx-auto mb-4 text-foreground/10" />
              <p className="text-foreground/30 text-sm">Нет активных проектов</p>
            </div>
          )}
        </div>

        {/* Project Details */}
        <div className="md:col-span-2">
          <AnimatePresence mode="wait">
            {selectedProject ? (
              <motion.div
                key={selectedProject.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-4 rounded-none border border-current/20" style={{ backgroundColor: `${selectedProject.color}20`, color: selectedProject.color }}>
                      {React.cloneElement(getIcon(selectedProject.icon) as React.ReactElement, { size: 40 })}
                    </div>
                    <div>
                      <h2 className="text-4xl font-black tracking-tighter uppercase mb-2">{selectedProject.name}</h2>
                      <p className="text-foreground/60">{selectedProject.description}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setIsDeleting(true)}
                      className="p-2 hover:bg-destructive/10 hover:text-destructive rounded-none border border-transparent hover:border-destructive/20 transition-colors"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>

                {/* Delete Confirmation Modal */}
                <AnimatePresence>
                  {isDeleting && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="w-full max-w-sm bg-card border border-border rounded-none p-6 shadow-2xl text-center"
                      >
                        <h3 className="text-xl font-bold mb-2">Удалить проект?</h3>
                        <p className="text-sm text-foreground/50 mb-6">Это действие нельзя отменить. Все связанные задачи, уроки и заметки будут удалены навсегда.</p>
                        <div className="flex gap-3">
                          <button onClick={() => setIsDeleting(false)} className="flex-1 py-3 rounded-none border border-border hover:bg-foreground/5 transition-colors">Отмена</button>
                          <button onClick={handleDeleteProject} className="flex-1 bg-destructive text-destructive-foreground py-3 rounded-none font-bold border border-destructive">Удалить</button>
                        </div>
                      </motion.div>
                    </div>
                  )}
                </AnimatePresence>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* Tasks Section */}
                  <div className="bg-card border border-border rounded-none p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold flex items-center gap-2">
                        <CheckSquare size={18} className="text-accent" />
                        Задачи
                      </h3>
                      <button 
                        onClick={() => setIsAddingTask(true)}
                        className="text-xs font-bold uppercase tracking-widest text-accent hover:underline"
                      >
                        Добавить
                      </button>
                    </div>
                    <div className="space-y-2">
                      {isAddingTask && (
                        <div className="flex gap-2 mb-2">
                          <input 
                            autoFocus
                            type="text" 
                            className="flex-1 bg-foreground/5 border border-border rounded-none px-3 py-2 text-sm outline-none focus:border-accent"
                            placeholder="Название задачи..."
                            value={taskTitle}
                            onChange={e => setTaskTitle(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleAddTask()}
                          />
                          <button onClick={handleAddTask} className="p-2 bg-accent text-accent-foreground rounded-none border border-accent"><Plus size={16} /></button>
                          <button onClick={() => setIsAddingTask(false)} className="p-2 hover:bg-foreground/5 rounded-none border border-border"><X size={16} /></button>
                        </div>
                      )}
                      {projectTasks.map(task => (
                        <div key={task.id} className="flex items-center gap-3 p-2 hover:bg-foreground/5 rounded-none border border-transparent hover:border-border/20 transition-colors group">
                          <div className={`w-2 h-2 rounded-none ${task.status === 'done' ? 'bg-green-500' : 'bg-foreground/20'}`} />
                          <span className={`text-sm ${task.status === 'done' ? 'line-through text-foreground/30' : ''}`}>{task.title}</span>
                        </div>
                      ))}
                      {projectTasks.length === 0 && <p className="text-xs text-foreground/20 italic">Нет привязанных задач</p>}
                    </div>
                  </div>

                  {/* Lessons Section */}
                  <div className="bg-card border border-border rounded-none p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold flex items-center gap-2">
                        <BookOpen size={18} className="text-accent" />
                        Уроки
                      </h3>
                      <button 
                        onClick={() => setIsAddingLesson(true)}
                        className="text-xs font-bold uppercase tracking-widest text-accent hover:underline"
                      >
                        Добавить
                      </button>
                    </div>
                    <div className="space-y-2">
                      {isAddingLesson && (
                        <div className="flex gap-2 mb-2">
                          <input 
                            autoFocus
                            type="text" 
                            className="flex-1 bg-foreground/5 border border-border rounded-none px-3 py-2 text-sm outline-none focus:border-accent"
                            placeholder="Предмет..."
                            value={lessonSubject}
                            onChange={e => setLessonSubject(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleAddLesson()}
                          />
                          <button onClick={handleAddLesson} className="p-2 bg-accent text-accent-foreground rounded-none border border-accent"><Plus size={16} /></button>
                          <button onClick={() => setIsAddingLesson(false)} className="p-2 hover:bg-foreground/5 rounded-none border border-border"><X size={16} /></button>
                        </div>
                      )}
                      {projectLessons.map(lesson => (
                        <div key={lesson.id} className="flex items-center gap-3 p-2 hover:bg-foreground/5 rounded-none border border-transparent hover:border-border/20 transition-colors">
                          <div className="w-2 h-2 rounded-none bg-accent/40" />
                          <span className="text-sm">{lesson.subject}</span>
                        </div>
                      ))}
                      {projectLessons.length === 0 && <p className="text-xs text-foreground/20 italic">Нет привязанных уроков</p>}
                    </div>
                  </div>

                  {/* Notes Section */}
                  <div className="bg-card border border-border rounded-none p-6 sm:col-span-2">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold flex items-center gap-2">
                        <StickyNote size={18} className="text-accent" />
                        Заметки
                      </h3>
                      <button 
                        onClick={() => setIsAddingNote(true)}
                        className="text-xs font-bold uppercase tracking-widest text-accent hover:underline"
                      >
                        Добавить
                      </button>
                    </div>
                    <div className="space-y-3">
                      {isAddingNote && (
                        <div className="p-3 bg-foreground/5 rounded-none border border-border space-y-2">
                          <input 
                            autoFocus
                            type="text" 
                            className="w-full bg-transparent border-none outline-none font-bold text-sm"
                            placeholder="Заголовок заметки..."
                            value={noteTitle}
                            onChange={e => setNoteTitle(e.target.value)}
                          />
                          <div className="flex justify-end gap-2">
                            <button onClick={() => setIsAddingNote(false)} className="text-[10px] uppercase font-bold text-foreground/30">Отмена</button>
                            <button onClick={handleAddNote} className="text-[10px] uppercase font-bold text-accent">Создать</button>
                          </div>
                        </div>
                      )}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {projectNotes.map(note => (
                        <div key={note.id} className="p-3 bg-foreground/5 rounded-none border border-transparent hover:border-border/20 transition-colors">
                          <h4 className="text-sm font-bold truncate">{note.title}</h4>
                          <p className="text-[10px] text-foreground/40 line-clamp-2 mt-1">{note.content}</p>
                        </div>
                      ))}
                      {projectNotes.length === 0 && <p className="text-xs text-foreground/20 italic">Нет привязанных заметок</p>}
                    </div>
                  </div>
                </div>

                {/* Documents Section */}
                <div className="bg-card border border-border rounded-none p-6 sm:col-span-2">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold flex items-center gap-2">
                        <LinkIcon size={18} className="text-accent" />
                        Документы
                      </h3>
                      <button 
                        onClick={() => setIsAddingDoc(true)}
                        className="text-xs font-bold uppercase tracking-widest text-accent hover:underline"
                      >
                        Добавить
                      </button>
                    </div>
                    <div className="space-y-3">
                      {isAddingDoc && (
                        <div className="p-4 bg-foreground/5 rounded-none border border-border space-y-3">
                          <input 
                            autoFocus
                            type="text" 
                            className="w-full bg-transparent border-none outline-none font-bold text-sm"
                            placeholder="Название документа..."
                            value={docTitle}
                            onChange={e => setDocTitle(e.target.value)}
                          />
                          <input 
                            type="text" 
                            className="w-full bg-transparent border-none outline-none text-xs text-foreground/50"
                            placeholder="URL (https://...)"
                            value={docUrl}
                            onChange={e => setDocUrl(e.target.value)}
                          />
                          <div className="flex justify-end gap-2">
                            <button onClick={() => setIsAddingDoc(false)} className="text-[10px] uppercase font-bold text-foreground/30">Отмена</button>
                            <button onClick={handleAddDoc} className="text-[10px] uppercase font-bold text-accent">Добавить</button>
                          </div>
                        </div>
                      )}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {(selectedProject.documents || []).map(doc => (
                        <a 
                          key={doc.id}
                          href={doc.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between p-3 bg-foreground/5 hover:bg-foreground/10 rounded-none border border-transparent hover:border-border/20 transition-colors group"
                        >
                          <div className="flex items-center gap-3">
                            <Folder size={16} className="text-foreground/30 group-hover:text-accent transition-colors" />
                            <span className="text-sm font-medium">{doc.title}</span>
                          </div>
                          <ExternalLink size={14} className="text-foreground/20" />
                        </a>
                      ))}
                      {(!selectedProject.documents || selectedProject.documents.length === 0) && <p className="text-xs text-foreground/20 italic">Нет добавленных ссылок</p>}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-12 bg-card/50 border border-border border-dashed rounded-none">
                <Briefcase size={64} className="text-foreground/5 mb-6" />
                <h2 className="text-2xl font-bold mb-2">Выберите проект</h2>
                <p className="text-foreground/40 max-w-xs">Выберите проект из списка слева, чтобы увидеть детали, задачи и документы</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Add Project Modal */}
      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAdding(false)}
              className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="relative w-full max-w-lg bg-card border border-border rounded-none p-8 shadow-2xl overflow-y-auto max-h-[90vh] custom-scrollbar"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Новый проект</h2>
                <button onClick={() => setIsAdding(false)} className="p-2 hover:bg-foreground/5 rounded-none transition-colors border border-transparent hover:border-border/20">
                  <X size={24} />
                </button>
              </div>
              <form onSubmit={handleAdd} className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-foreground/30 mb-2">Название</label>
                    <input 
                      autoFocus
                      type="text" 
                      value={newProject.name}
                      onChange={e => setNewProject(p => ({ ...p, name: e.target.value }))}
                      className="w-full bg-foreground/5 border border-border rounded-none px-4 py-3 focus:outline-none focus:border-accent transition-colors"
                      placeholder="Напр. Дипломная работа"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-foreground/30 mb-2">Описание</label>
                    <textarea 
                      value={newProject.description}
                      onChange={e => setNewProject(p => ({ ...p, description: e.target.value }))}
                      className="w-full bg-foreground/5 border border-border rounded-none px-4 py-3 focus:outline-none focus:border-accent transition-colors h-24 resize-none"
                      placeholder="Краткое описание целей..."
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-foreground/30 mb-2">Иконка</label>
                    <div className="grid grid-cols-8 gap-2">
                      {Object.entries(PROJECT_ICONS).map(([name, Icon]) => (
                        <button
                          key={name}
                          type="button"
                          onClick={() => setNewProject(p => ({ ...p, icon: name }))}
                          className={`p-2 rounded-none flex items-center justify-center transition-all border ${newProject.icon === name ? 'bg-accent text-accent-foreground border-accent' : 'bg-foreground/5 hover:bg-foreground/10 text-foreground/40 border-transparent hover:border-border/20'}`}
                        >
                          <Icon size={16} />
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-foreground/30 mb-2">Цвет</label>
                    <div className="flex gap-2">
                      {['#f97316', '#ef4444', '#3b82f6', '#10b981', '#8b5cf6', '#ec4899', '#06b6d4', '#f59e0b'].map(c => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setNewProject(p => ({ ...p, color: c }))}
                          className={`w-8 h-8 rounded-none transition-transform border-2 ${newProject.color === c ? 'scale-110 border-accent' : 'border-transparent'}`}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <button 
                    type="button"
                    onClick={() => setIsAdding(false)}
                    className="flex-1 px-4 py-3 rounded-none font-bold border border-border hover:bg-foreground/5 transition-colors"
                  >
                    Отмена
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 bg-accent text-accent-foreground px-4 py-3 rounded-none font-bold hover:opacity-90 transition-opacity border border-accent"
                  >
                    Создать
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
