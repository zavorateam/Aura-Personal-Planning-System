import React, { useState, useEffect } from 'react';
import { useAuraStore } from './hooks/useAuraStore';
import { parseNaturalLanguage, generateInsights } from './services/ai';
import { format } from 'date-fns';
import { 
  LayoutDashboard, 
  CheckSquare, 
  Calendar as CalendarIcon, 
  BookOpen, 
  BarChart3, 
  Settings, 
  Plus, 
  Inbox, 
  Shield,
  Search,
  StickyNote,
  Zap,
  Sparkles,
  Lock,
  RefreshCw,
  ArrowUp,
  ArrowDown,
  Briefcase
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

import { Dashboard } from './components/Dashboard';
import { TasksView } from './components/TasksView';
import { SettingsView } from './components/SettingsView';
import { SetupFlow } from './components/SetupFlow';
import { LessonsView } from './components/LessonsView';
import { ProjectsView } from './components/ProjectsView';
import { NotesView } from './components/NotesView';
import { AnalyticsView } from './components/AnalyticsView';
import { CalendarView } from './components/CalendarView';
import { InboxView } from './components/InboxView';
import { SecurityService } from './services/security';
import { GitHubSyncService } from './services/github';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function App() {
  const { 
    state, 
    addTask, 
    updateTask, 
    deleteTask,
    addLesson,
    updateLesson,
    deleteLesson,
    addNote, 
    updateNote,
    deleteNote,
    addAttendance,
    addInsight,
    deleteInsight,
    setState 
  } = useAuraStore();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isReplanning, setIsReplanning] = useState(false);
  const [quickInput, setQuickInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  
  // Security & Sync State
  const [encryptionKey, setEncryptionKey] = useState<CryptoKey | null>(null);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [totpAuthInput, setTotpAuthInput] = useState('');
  const [authMode, setAuthMode] = useState<'password' | 'totp'>('password');
  const [passwordError, setPasswordError] = useState('');
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [syncMessage, setSyncMessage] = useState('');

  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickInput.trim()) return;
    
    // 1. Try Pre-AI Parsing
    const parseQuickInput = (input: string) => {
      const items = input.split(',').map(s => s.trim()).filter(Boolean);
      const results: any[] = [];
      const regex = /^(.+)\s+(задача|заметка)\s+(низкий|средний|высокий|критический)\s+до\s+(.+)$/i;
      
      for (const item of items) {
        const match = item.match(regex);
        if (match) {
          const [_, title, typeStr, priorityStr, deadline] = match;
          const type = typeStr.toLowerCase() === 'задача' ? 'task' : 'note';
          const priorityMap: Record<string, string> = {
            'низкий': 'low',
            'средний': 'medium',
            'высокий': 'high',
            'критический': 'critical'
          };
          results.push({
            title: title.trim(),
            type,
            priority: priorityMap[priorityStr.toLowerCase()] || 'medium',
            deadline: deadline.trim(),
            status: 'todo',
            estimatedDuration: 30,
            energyCost: 3,
          });
        } else {
          return null;
        }
      }
      return results;
    };

    const preParsed = parseQuickInput(quickInput);
    if (preParsed) {
      preParsed.forEach(item => {
        if (item.type === 'task') {
          addTask(item as any);
        } else if (item.type === 'note') {
          addNote(item as any);
        }
      });
      setQuickInput('');
      return;
    }

    // 2. AI Parsing (if enabled)
    if (!state.settings.aiEnabled) {
      alert('AI модуль отключен. Используйте формат: Название тип приоритет до дедлайн');
      return;
    }

    setIsAiLoading(true);
    try {
      const parsedItems = await parseNaturalLanguage(quickInput, state.settings);
      parsedItems.forEach(item => {
        if (item.type === 'task') {
          addTask(item as any);
        } else if (item.type === 'note') {
          addNote(item as any);
        }
      });
      setQuickInput('');
    } catch (err) {
      console.error(err);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleReplanner = async () => {
    setIsReplanning(true);
    try {
      const { generateAndAddInsights } = useAuraStore.getState();
      await generateAndAddInsights();
      setActiveTab('inbox');
    } catch (err) {
      console.error(err);
    } finally {
      setIsReplanning(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    try {
      let key: CryptoKey | null = null;

      if (authMode === 'totp') {
        if (!state.settings.totpSecret) {
          setPasswordError('TOTP не настроен. Используйте пароль.');
          return;
        }

        if (!SecurityService.verifyTOTP(totpAuthInput, state.settings.totpSecret)) {
          setPasswordError('Неверный код 2FA');
          return;
        }

        console.debug('[App] TOTP verified, deriving key from totp secret');
        key = await SecurityService.deriveKeyFromSecret(state.settings.totpSecret);
      } else {
        const hash = await SecurityService.hashPassword(passwordInput);
        console.debug('[App] hash password start', { hashPrefix: hash.slice(0, 8), storedHashPrefix: state.settings.masterPasswordHash?.slice(0, 8) });

        if (state.settings.masterPasswordHash && hash !== state.settings.masterPasswordHash) {
          setPasswordError('Неверный пароль');
          return;
        }

        if (!state.settings.masterPasswordHash) {
          console.debug('[App] masterPasswordHash missing, storing new hash');
          setState(prev => ({
            ...prev,
            settings: { ...prev.settings, masterPasswordHash: hash }
          }));
        }

        key = await SecurityService.deriveKey(passwordInput);
      }

      if (!key) {
        setPasswordError('Не удалось получить ключ для синхронизации');
        return;
      }

      setEncryptionKey(key);
      setIsPasswordModalOpen(false);
      setPasswordInput('');
      setTotpAuthInput('');
    } catch (err) {
      console.error('[App] handlePasswordSubmit error', err);
      setPasswordError('Ошибка при проверке пароля или TOTP');
    }
  };

  const performSync = async (type: 'push' | 'pull') => {
    if (!state.settings.githubToken || !state.settings.githubUser || !state.settings.githubRepo) {
      setSyncStatus('error');
      setSyncMessage('Настройки GitHub не заполнены');
      return;
    }

    if (!encryptionKey) {
      setIsPasswordModalOpen(true);
      return;
    }

    setSyncStatus('syncing');
    setSyncMessage(type === 'push' ? 'Отправка данных...' : 'Получение данных...');

    try {
      const syncService = new GitHubSyncService(
        state.settings.githubToken,
        state.settings.githubUser,
        state.settings.githubRepo
      );

      let fallbackKey: CryptoKey | undefined;
      if (state.settings.totpSecret) {
        fallbackKey = await SecurityService.deriveKeyFromSecret(state.settings.totpSecret);
      }

      if (type === 'push') {
        await syncService.pushState(state, encryptionKey);
        setState(prev => ({
          ...prev,
          settings: { ...prev.settings, lastSync: new Date().toISOString() }
        }));
      } else {
        const remoteState = await syncService.pullState(encryptionKey, fallbackKey);
        console.debug('[App] performSync pull result', { hasRemoteState: !!remoteState, usingFallback: !!fallbackKey });
        if (remoteState) {
          setState(prev => ({
            ...prev,
            ...remoteState,
            settings: { 
              ...prev.settings, 
              ...remoteState.settings,
              lastSync: new Date().toISOString() 
            }
          }));
        }
      }

      setSyncStatus('success');
      setSyncMessage('Синхронизация завершена');
      setTimeout(() => setSyncStatus('idle'), 3000);
    } catch (err) {
      console.error(err);
      setSyncStatus('error');
      setSyncMessage('Ошибка синхронизации');
    }
  };

  useEffect(() => {
    // Auto-sync check
    const checkAutoSync = async () => {
      if (!state.settings.syncEnabled || !state.settings.isSetupComplete) return;

      const lastSync = state.settings.lastSync;
      const today = new Date().toISOString().split('T')[0];
      
      if (!lastSync || !lastSync.startsWith(today)) {
        // First launch of the day
        if (!encryptionKey) {
          setIsPasswordModalOpen(true);
        } else {
          await performSync('pull');
        }
      }
    };

    checkAutoSync();
  }, [state.settings.syncEnabled, state.settings.isSetupComplete]);

  useEffect(() => {
    if (state.settings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    // Apply accent color
    const accent = state.settings.accentColor || '#f97316';
    document.documentElement.style.setProperty('--accent', accent);
    
    // Calculate a good foreground color for the accent (black or white)
    // Simple luminance check
    const r = parseInt(accent.slice(1, 3), 16);
    const g = parseInt(accent.slice(3, 5), 16);
    const b = parseInt(accent.slice(5, 7), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    document.documentElement.style.setProperty('--accent-foreground', luminance > 0.5 ? '#000000' : '#ffffff');
  }, [state.settings.theme, state.settings.accentColor]);

  if (!state.settings.isSetupComplete) {
    return (
      <SetupFlow 
        onComplete={(data) => {
          setState(prev => ({
            ...prev,
            settings: {
              ...prev.settings,
              userName: data.userName,
              masterPasswordHash: data.masterPasswordHash,
              totpSecret: data.totpSecret,
              isSetupComplete: true
            }
          }));
        }} 
      />
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard state={state} />;
      case 'tasks': return <TasksView state={state} addTask={addTask} updateTask={updateTask} deleteTask={deleteTask} />;
      case 'projects': return <ProjectsView />;
      case 'lessons': return <LessonsView state={state} addLesson={addLesson} updateLesson={updateLesson} deleteLesson={deleteLesson} />;
      case 'notes': return <NotesView state={state} addNote={addNote} updateNote={updateNote} deleteNote={deleteNote} />;
      case 'inbox': return <InboxView state={state} updateNote={updateNote} deleteNote={deleteNote} deleteInsight={deleteInsight} />;
      case 'analytics': return <AnalyticsView state={state} />;
      case 'calendar': return <CalendarView state={state} />;
      case 'settings': return <SettingsView 
        state={state} 
        setState={setState} 
        onPush={() => performSync('push')}
        onPull={() => performSync('pull')}
        syncStatus={syncStatus}
        syncMessage={syncMessage}
      />;
      default: return <Dashboard state={state} />;
    }
  };

  const filteredItems = searchQuery.trim() ? [
    ...state.tasks.filter(t => t.title.toLowerCase().includes(searchQuery.toLowerCase())),
    ...state.notes.filter(n => n.title.toLowerCase().includes(searchQuery.toLowerCase()) || n.content.toLowerCase().includes(searchQuery.toLowerCase())),
    ...state.lessons.filter(l => l.subject.toLowerCase().includes(searchQuery.toLowerCase()))
  ] : [];

  return (
    <div className="flex h-screen bg-background text-foreground font-sans selection:bg-accent/30">
      {/* Sidebar */}
      <nav className="w-20 md:w-64 border-r border-border flex flex-col px-4 pt-6 pb-4 gap-2 bg-card">
        <NavItem icon={<LayoutDashboard />} label="Дашборд" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
        <NavItem icon={<Inbox />} label="Входящие" active={activeTab === 'inbox'} onClick={() => setActiveTab('inbox')} />
        <NavItem icon={<CheckSquare />} label="Задачи" active={activeTab === 'tasks'} onClick={() => setActiveTab('tasks')} />
        <NavItem icon={<Briefcase />} label="Проекты" active={activeTab === 'projects'} onClick={() => setActiveTab('projects')} />
        <NavItem icon={<CalendarIcon />} label="Календарь" active={activeTab === 'calendar'} onClick={() => setActiveTab('calendar')} />
        <NavItem icon={<BookOpen />} label="Расписание" active={activeTab === 'lessons'} onClick={() => setActiveTab('lessons')} />
        <NavItem icon={<StickyNote />} label="Заметки" active={activeTab === 'notes'} onClick={() => setActiveTab('notes')} />
        <NavItem icon={<BarChart3 />} label="Аналитика" active={activeTab === 'analytics'} onClick={() => setActiveTab('analytics')} />
        
        <div className="mt-auto pt-4 border-t border-border">
          <NavItem icon={<Settings />} label="Настройки" active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className="p-6 border-b border-border flex items-center justify-between bg-background/80 backdrop-blur-xl sticky top-0 z-10">
          <form onSubmit={handleQuickAdd} className="flex-1 max-w-2xl relative group">
            <Plus className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/30 group-focus-within:text-accent transition-colors" />
            <input 
              type="text" 
              placeholder="Быстрое добавление (напр. 'ДЗ по матану до пятницы 17:00, выс. приоритет')"
              className="w-full bg-foreground/5 border border-border rounded-none py-3 pl-12 pr-4 focus:outline-none focus:border-accent transition-all text-sm"
              value={quickInput}
              onChange={e => setQuickInput(e.target.value)}
              disabled={isAiLoading}
            />
            {isAiLoading && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2">
                <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-none animate-spin" />
              </div>
            )}
          </form>
          
          <div className="flex items-center gap-4 ml-6">
            {state.settings.aiEnabled && (
              <button 
                onClick={handleReplanner}
                disabled={isReplanning}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 border border-border rounded-none text-xs font-bold uppercase tracking-widest transition-all",
                  isReplanning ? "bg-foreground/5 text-foreground/20" : "bg-accent text-accent-foreground hover:bg-accent/90"
                )}
              >
                <Sparkles className={cn("w-4 h-4", isReplanning && "animate-pulse")} />
                <span className="hidden lg:block">{isReplanning ? 'Анализ...' : 'Перепланировщик'}</span>
              </button>
            )}

            <div className="relative">
              <button 
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                className={cn("p-2 border border-border hover:bg-foreground/5 rounded-none transition-colors", isSearchOpen && "bg-foreground/10 text-accent")}
              >
                <Search className="w-5 h-5" />
              </button>
              
              <AnimatePresence>
                {isSearchOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute right-0 mt-2 w-80 bg-card border border-border rounded-none shadow-2xl z-50 p-4"
                  >
                    <input 
                      autoFocus
                      type="text" 
                      placeholder="Поиск по задачам, заметкам..."
                      className="w-full bg-foreground/5 border border-border rounded-none p-3 text-sm focus:border-accent outline-none mb-4"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                    />
                    <div className="max-h-60 overflow-y-auto space-y-2 custom-scrollbar">
                      {filteredItems.length > 0 ? (
                        filteredItems.map(item => (
                          <button 
                            key={item.id}
                            onClick={() => {
                              if (item.type === 'task') setActiveTab('tasks');
                              if (item.type === 'note') setActiveTab('notes');
                              if (item.type === 'lesson') setActiveTab('lessons');
                              setIsSearchOpen(false);
                            }}
                            className="w-full text-left p-3 border border-transparent hover:border-border hover:bg-foreground/5 rounded-none transition-colors flex flex-col gap-1"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold uppercase tracking-widest text-foreground/20">{item.type}</span>
                              <span className="text-[10px] text-foreground/10">{format(new Date(item.createdAt), 'd MMM')}</span>
                            </div>
                            <span className="text-sm font-medium">{'title' in item ? item.title : item.subject}</span>
                          </button>
                        ))
                      ) : searchQuery ? (
                        <p className="text-center py-4 text-foreground/20 text-xs">Ничего не найдено</p>
                      ) : (
                        <p className="text-center py-4 text-foreground/20 text-xs">Начните вводить для поиска</p>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Password Modal */}
      <AnimatePresence>
        {isPasswordModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full max-w-md bg-card border border-border rounded-none p-8 shadow-2xl"
            >
              <div className="flex flex-col items-center text-center gap-4 mb-8">
                <div className="w-16 h-16 bg-accent/10 rounded-none flex items-center justify-center border border-accent/20">
                  <Lock className="w-8 h-8 text-accent" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold tracking-tight">
                    {authMode === 'password' ? 'Требуется пароль' : 'Требуется код 2FA'}
                  </h2>
                  <p className="text-sm text-foreground/50">
                    {authMode === 'password'
                      ? 'Введите мастер-пароль для расшифровки данных и синхронизации.'
                      : 'Введите код из приложения аутентификатора для доступа без пароля.'}
                  </p>
                </div>
              </div>

              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAuthMode('password')}
                    className={cn(
                      "py-3 rounded-none border text-sm font-bold transition-all",
                      authMode === 'password'
                        ? 'bg-accent text-accent-foreground border-accent'
                        : 'bg-foreground/5 text-foreground border-border hover:bg-foreground/10'
                    )}
                  >
                    По паролю
                  </button>
                  <button
                    type="button"
                    onClick={() => setAuthMode('totp')}
                    className={cn(
                      "py-3 rounded-none border text-sm font-bold transition-all",
                      authMode === 'totp'
                        ? 'bg-accent text-accent-foreground border-accent'
                        : 'bg-foreground/5 text-foreground border-border hover:bg-foreground/10'
                    )}
                  >
                    По 2FA
                  </button>
                </div>

                <div className="space-y-2">
                  {authMode === 'password' ? (
                    <>
                      <input 
                        autoFocus
                        type="password" 
                        placeholder="Ваш мастер-пароль"
                        className={cn(
                          "w-full bg-foreground/5 border border-border rounded-none p-4 outline-none focus:border-accent transition-all",
                          passwordError && "border-destructive focus:border-destructive"
                        )}
                        value={passwordInput}
                        onChange={e => setPasswordInput(e.target.value)}
                      />
                      <p className="text-xs text-foreground/50">Введите мастер-пароль, который вы задали при настройке.</p>
                    </>
                  ) : (
                    <>
                      <input 
                        autoFocus
                        type="text" 
                        placeholder="6-значный код 2FA"
                        maxLength={6}
                        className={cn(
                          "w-full bg-foreground/5 border border-border rounded-none p-4 outline-none focus:border-accent transition-all",
                          passwordError && "border-destructive focus:border-destructive"
                        )}
                        value={totpAuthInput}
                        onChange={e => setTotpAuthInput(e.target.value)}
                      />
                      <p className="text-xs text-foreground/50">Используйте код из приложения аутентификатора.</p>
                    </>
                  )}

                  {passwordError && <p className="text-xs text-destructive px-2">{passwordError}</p>}
                </div>

                <button 
                  type="submit"
                  className="w-full bg-accent text-accent-foreground font-bold py-4 rounded-none hover:opacity-90 transition-all shadow-lg shadow-accent/20"
                >
                  Подтвердить
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Sync Status Overlay */}
      <AnimatePresence>
        {syncStatus !== 'idle' && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-8 right-8 z-50 flex items-center gap-3 px-6 py-3 bg-card border border-border rounded-none shadow-2xl"
          >
            {syncStatus === 'syncing' && <RefreshCw className="w-4 h-4 text-accent animate-spin" />}
            {syncStatus === 'success' && <div className="w-2 h-2 bg-green-500" />}
            {syncStatus === 'error' && <div className="w-2 h-2 bg-destructive" />}
            <span className="text-sm font-medium">{syncMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Logo */}
      <div className="fixed bottom-4 right-4 flex items-center gap-2 opacity-10 hover:opacity-40 transition-opacity pointer-events-none select-none z-0">
        <div className="w-6 h-6 bg-accent rounded-none flex items-center justify-center shrink-0 border border-accent">
          <Zap className="w-4 h-4 text-accent-foreground fill-accent-foreground" />
        </div>
        <span className="font-bold text-sm tracking-tighter">AURA OS</span>
      </div>
    </div>
  );
}

function NavItem({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-3 py-3 rounded-none transition-all duration-200 group border border-transparent",
        active ? "bg-accent text-accent-foreground font-semibold border-border shadow-lg shadow-accent/20" : "text-foreground/50 hover:text-foreground hover:bg-foreground/5 hover:border-border/20"
      )}
    >
      <span className={cn("w-5 h-5", active ? "text-accent-foreground" : "text-foreground/40 group-hover:text-foreground")}>{icon}</span>
      <span className="hidden md:block text-sm">{label}</span>
    </button>
  );
}
