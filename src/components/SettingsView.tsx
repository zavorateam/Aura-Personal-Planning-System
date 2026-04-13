import React, { useState } from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Shield, Zap, Settings as SettingsIcon, Github, Moon, Sun, RefreshCw, Check, AlertCircle, Lock, X, ArrowUp, ArrowDown } from 'lucide-react';
import { AppState } from '../types';
import { GitHubSyncService } from '../services/github';
import { SecurityService } from '../services/security';
import { motion, AnimatePresence } from 'motion/react';

interface SettingsViewProps {
  state: AppState;
  setState: (state: AppState) => void;
  onPush: () => void;
  onPull: () => void;
  syncStatus: 'idle' | 'syncing' | 'success' | 'error';
  syncMessage: string;
}

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function SettingsView({ state, setState, onPush, onPull, syncStatus, syncMessage }: SettingsViewProps) {
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isTotpModalOpen, setIsTotpModalOpen] = useState(false);
  const [isImportConfirmOpen, setIsImportConfirmOpen] = useState(false);
  const [importData, setImportData] = useState<any>(null);
  const [notification, setNotification] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [newPasswordReset, setNewPasswordReset] = useState('');
  const [confirmPasswordReset, setConfirmPasswordReset] = useState('');
  const [totpResetError, setTotpResetError] = useState('');
  const [totpResetSuccess, setTotpResetSuccess] = useState('');

  const accentColors = [
    { name: 'Orange', value: '#f97316' },
    { name: 'Blue', value: '#3b82f6' },
    { name: 'Green', value: '#22c55e' },
    { name: 'Purple', value: '#a855f7' },
    { name: 'Pink', value: '#ec4899' },
    { name: 'Red', value: '#ef4444' },
  ];

  const updateSettings = (updates: Partial<AppState['settings']>) => {
    setState({
      ...state,
      settings: {
        ...state.settings,
        ...updates
      }
    });
  };

  const handlePasswordChange = async () => {
    if (newPassword !== confirmPassword) {
      setPasswordError('Пароли не совпадают');
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError('Пароль должен быть не менее 8 символов');
      return;
    }

    const hash = await SecurityService.hashPassword(newPassword);
    updateSettings({ masterPasswordHash: hash }); 
    setIsPasswordModalOpen(false);
    setNewPassword('');
    setConfirmPassword('');
    setPasswordError('');
  };

  const handleExport = () => {
    const data = JSON.stringify(state, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aura_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const importedState = JSON.parse(event.target?.result as string);
        setImportData(importedState);
        setIsImportConfirmOpen(true);
      } catch (err) {
        setNotification({ message: 'Ошибка при импорте: неверный формат файла', type: 'error' });
        setTimeout(() => setNotification(null), 3000);
      }
    };
    reader.readAsText(file);
  };

  const confirmImport = () => {
    if (importData) {
      setState(importData);
      setNotification({ message: 'Данные успешно импортированы', type: 'success' });
      setTimeout(() => setNotification(null), 3000);
    }
    setIsImportConfirmOpen(false);
    setImportData(null);
  };

  return (
    <div className="max-w-2xl space-y-8 pb-20">
      <h1 className="text-3xl font-bold tracking-tighter">Настройки системы</h1>
      
      <section className="space-y-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Github className="w-5 h-5 text-foreground" />
          Синхронизация GitHub
        </h2>
        <div className="bg-card border border-border p-6 rounded-none space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold">Автосинхронизация</p>
              <p className="text-xs text-foreground/40">Автоматически при запуске (раз в день)</p>
            </div>
            <button 
              onClick={() => updateSettings({ syncEnabled: !state.settings.syncEnabled })}
              className={cn(
                "w-12 h-6 rounded-none transition-all relative border border-border",
                state.settings.syncEnabled ? "bg-accent border-accent" : "bg-foreground/10"
              )}
            >
              <div className={cn(
                "absolute top-1 w-4 h-4 bg-white rounded-none transition-all",
                state.settings.syncEnabled ? "left-7" : "left-1"
              )} />
            </button>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button 
              onClick={onPull}
              disabled={syncStatus === 'syncing'}
              className="flex-1 bg-foreground/5 hover:bg-foreground/10 text-foreground px-4 py-4 rounded-none font-bold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50 border border-border/20"
            >
              <ArrowDown className="w-4 h-4" />
              Вытянуть данные (Pull)
            </button>
            <button 
              onClick={onPush}
              disabled={syncStatus === 'syncing'}
              className="flex-1 bg-accent text-accent-foreground px-4 py-4 rounded-none font-bold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-lg shadow-accent/20 disabled:opacity-50 border border-accent"
            >
              <ArrowUp className="w-4 h-4" />
              Отправить данные (Push)
            </button>
          </div>

          {syncStatus !== 'idle' && (
            <div className={cn(
              "p-4 rounded-none flex items-center gap-3 text-sm border",
              syncStatus === 'success' ? "bg-green-500/10 text-green-500 border-green-500/20" : 
              syncStatus === 'error' ? "bg-destructive/10 text-destructive border-destructive/20" :
              "bg-accent/10 text-accent border-accent/20"
            )}>
              {syncStatus === 'syncing' ? <RefreshCw className="w-4 h-4 animate-spin" /> : 
               syncStatus === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              {syncMessage}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] text-foreground/30 uppercase tracking-widest font-bold">GitHub Пользователь</label>
              <input 
                type="text" 
                className="w-full bg-foreground/5 border border-border rounded-none p-4 text-sm focus:border-accent outline-none transition-all" 
                placeholder="username" 
                value={state.settings.githubUser || ''}
                onChange={e => updateSettings({ githubUser: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] text-foreground/30 uppercase tracking-widest font-bold">Репозиторий</label>
              <input 
                type="text" 
                className="w-full bg-foreground/5 border border-border rounded-none p-4 text-sm focus:border-accent outline-none transition-all" 
                placeholder="aura-data" 
                value={state.settings.githubRepo || ''}
                onChange={e => updateSettings({ githubRepo: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] text-foreground/30 uppercase tracking-widest font-bold">GitHub Personal Access Token</label>
            <input 
              type="password" 
              className="w-full bg-foreground/5 border border-border rounded-none p-4 text-sm focus:border-accent outline-none transition-all" 
              placeholder="ghp_xxxxxxxxxxxx" 
              value={state.settings.githubToken || ''}
              onChange={e => updateSettings({ githubToken: e.target.value })}
            />
            <p className="text-[10px] text-foreground/20 px-2 italic">Токен должен иметь права на работу с репозиториями (repo scope).</p>
          </div>
          
          {state.settings.lastSync && (
            <div className="pt-4 border-t border-border flex items-center justify-between text-[10px] text-foreground/30 uppercase tracking-widest font-bold">
              <span>Последняя синхронизация</span>
              <span>{new Date(state.settings.lastSync).toLocaleString('ru-RU')}</span>
            </div>
          )}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <SettingsIcon className="w-5 h-5 text-blue-500" />
          Внешний вид
        </h2>
        <div className="bg-card border border-border p-6 rounded-none space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold">Тема оформления</p>
              <p className="text-xs text-foreground/40">Переключение между светлой и темной темой</p>
            </div>
            <div className="flex bg-foreground/5 p-1 rounded-none border border-border">
              <button 
                onClick={() => updateSettings({ theme: 'light' })}
                className={cn(
                  "flex items-center gap-2 px-6 py-3 rounded-none transition-all border border-transparent",
                  state.settings.theme === 'light' ? "bg-background shadow-sm text-accent border-border/20" : "text-foreground/40 hover:text-foreground"
                )}
              >
                <Sun className="w-4 h-4" />
                <span className="text-sm font-bold">Светлая</span>
              </button>
              <button 
                onClick={() => updateSettings({ theme: 'dark' })}
                className={cn(
                  "flex items-center gap-2 px-6 py-3 rounded-none transition-all border border-transparent",
                  state.settings.theme === 'dark' ? "bg-background shadow-sm text-accent border-border/20" : "text-foreground/40 hover:text-foreground"
                )}
              >
                <Moon className="w-4 h-4" />
                <span className="text-sm font-bold">Темная</span>
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <p className="font-bold">Акцентный цвет</p>
              <p className="text-xs text-foreground/40">Выберите основной цвет интерфейса</p>
            </div>
            <div className="flex flex-wrap gap-4">
              {accentColors.map(color => (
                <button
                  key={color.value}
                  onClick={() => updateSettings({ accentColor: color.value })}
                  className={cn(
                    "w-12 h-12 rounded-none border-2 transition-all relative flex items-center justify-center",
                    state.settings.accentColor === color.value ? "border-accent scale-110 shadow-lg shadow-accent/20" : "border-transparent hover:scale-105"
                  )}
                  style={{ backgroundColor: color.value }}
                  title={color.name}
                >
                  {state.settings.accentColor === color.value && (
                    <div className="w-2 h-2 bg-white rounded-none shadow-sm" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Shield className="w-5 h-5 text-green-500" />
          Безопасность
        </h2>

        <div className="bg-card border border-border p-6 rounded-none space-y-4">
          <div className="flex items-center justify-between p-4 hover:bg-foreground/5 rounded-none transition-colors border border-border/20">
            <div>
              <p className="font-bold">ИИ Модуль</p>
              <p className="text-[10px] text-foreground/40 uppercase tracking-widest font-bold">Использовать ИИ для разбора задач и инсайтов</p>
            </div>
            <button 
              onClick={() => updateSettings({ aiEnabled: !state.settings.aiEnabled })}
              className={cn(
                "w-12 h-6 rounded-none transition-all relative border border-border",
                state.settings.aiEnabled ? "bg-accent border-accent" : "bg-foreground/10"
              )}
            >
              <div className={cn(
                "absolute top-1 w-4 h-4 bg-white rounded-none transition-all",
                state.settings.aiEnabled ? "left-7" : "left-1"
              )} />
            </button>
          </div>

          {state.settings.aiEnabled && (
            <div className="space-y-4 p-4 animate-in fade-in duration-300">
              <div className="space-y-2">
                <label className="text-[10px] text-foreground/30 uppercase tracking-widest font-bold px-1">Провайдер ИИ</label>
                <select 
                  className="w-full bg-foreground/5 border border-border rounded-none p-4 text-sm focus:border-accent outline-none transition-all appearance-none cursor-pointer"
                  value={state.settings.aiProvider}
                  onChange={e => updateSettings({ aiProvider: e.target.value as any })}
                >
                  <option value="gemini">Google Gemini (Облако)</option>
                  <option value="openai-compatible">OpenAI Compatible (Ollama, Local, etc.)</option>
                </select>
              </div>

              {state.settings.aiProvider === 'openai-compatible' && (
                <div className="space-y-4 animate-in slide-in-from-top-2 duration-200">
                  <div className="space-y-2">
                    <label className="text-[10px] text-foreground/30 uppercase tracking-widest font-bold px-1">Base URL</label>
                    <input 
                      type="text" 
                      className="w-full bg-foreground/5 border border-border rounded-none p-4 text-sm focus:border-accent outline-none transition-all" 
                      placeholder="http://localhost:11434/v1" 
                      value={state.settings.aiBaseUrl || ''}
                      onChange={e => updateSettings({ aiBaseUrl: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] text-foreground/30 uppercase tracking-widest font-bold px-1">API Key</label>
                    <input 
                      type="password" 
                      className="w-full bg-foreground/5 border border-border rounded-none p-4 text-sm focus:border-accent outline-none transition-all" 
                      placeholder="ollama / sk-..." 
                      value={state.settings.aiApiKey || ''}
                      onChange={e => updateSettings({ aiApiKey: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] text-foreground/30 uppercase tracking-widest font-bold px-1">Модель</label>
                    <input 
                      type="text" 
                      className="w-full bg-foreground/5 border border-border rounded-none p-4 text-sm focus:border-accent outline-none transition-all" 
                      placeholder="llama3" 
                      value={state.settings.aiModel || ''}
                      onChange={e => updateSettings({ aiModel: e.target.value })}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
          <button 
            onClick={() => setIsPasswordModalOpen(true)}
            className="w-full text-left p-4 hover:bg-foreground/5 rounded-none transition-colors flex items-center justify-between border border-border/20"
          >
            <span className="text-sm font-bold">Изменить мастер-пароль</span>
            <span className="text-foreground/20">→</span>
          </button>
          <button
            onClick={() => setIsTotpModalOpen(true)}
            className="w-full text-left p-4 hover:bg-foreground/5 rounded-none transition-colors flex items-center justify-between border border-border/20"
          >
            <span className="text-sm font-bold">Настроить 2FA (TOTP)</span>
            <span className="text-accent text-xs font-bold">
              {state.settings.totpSecret ? 'АКТИВНО' : 'НЕ НАСТРОЕНО'}
            </span>
          </button>

          <div className="pt-4 border-t border-border mt-4">
            <p className="text-xs font-bold uppercase tracking-widest text-foreground/30 mb-4 px-4">Локальное управление данными</p>
            <div className="grid grid-cols-2 gap-3 px-2">
              <button
                onClick={handleExport}
                className="flex items-center justify-center gap-2 p-4 bg-foreground/5 hover:bg-foreground/10 rounded-none transition-colors font-bold text-sm border border-border/20"
              >
                <ArrowDown size={14} />
                Экспорт JSON
              </button>
              <div className="relative">
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <button
                  className="w-full h-full flex items-center justify-center gap-2 p-4 bg-foreground/5 hover:bg-foreground/10 rounded-none transition-colors font-bold text-sm border border-border/20"
                >
                  <ArrowUp size={14} />
                  Импорт JSON
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Notifications */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className={cn(
              "fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-none shadow-2xl flex items-center gap-3 font-bold text-sm border",
              notification.type === 'success' ? "bg-green-500 text-white border-green-600" : "bg-red-500 text-white border-red-600"
            )}
          >
            {notification.type === 'success' ? <Check size={18} /> : <AlertCircle size={18} />}
            {notification.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Import Confirmation Modal */}
      <AnimatePresence>
        {isImportConfirmOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-background/80 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-card border border-border rounded-none p-8 space-y-6 shadow-2xl"
            >
              <div className="flex items-center gap-4 text-red-500">
                <AlertCircle size={32} />
                <h3 className="text-2xl font-bold">Подтверждение импорта</h3>
              </div>
              
              <p className="text-foreground/60 leading-relaxed">
                Это действие перезапишет все текущие данные. Вы уверены, что хотите продолжить?
              </p>

              <div className="flex gap-3 pt-4">
                <button 
                  onClick={() => {
                    setIsImportConfirmOpen(false);
                    setImportData(null);
                  }}
                  className="flex-1 px-4 py-4 rounded-none font-bold hover:bg-foreground/5 transition-colors border border-border/20"
                >
                  Отмена
                </button>
                <button 
                  onClick={confirmImport}
                  className="flex-1 bg-red-500 text-white px-4 py-4 rounded-none font-bold hover:opacity-90 transition-opacity border border-red-600"
                >
                  Импортировать
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isPasswordModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-background/80 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-card border border-border rounded-none p-8 space-y-6 shadow-2xl"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold">Смена пароля</h3>
                <button onClick={() => setIsPasswordModalOpen(false)} className="p-2 hover:bg-foreground/5 rounded-none border border-transparent hover:border-border/20 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs text-foreground/30 uppercase tracking-widest font-bold">Новый пароль</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/20" />
                    <input 
                      type="password" 
                      className="w-full bg-foreground/5 border border-border rounded-none p-3 pl-12 text-sm focus:border-accent outline-none transition-colors" 
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-foreground/30 uppercase tracking-widest font-bold">Подтвердите пароль</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/20" />
                    <input 
                      type="password" 
                      className="w-full bg-foreground/5 border border-border rounded-none p-3 pl-12 text-sm focus:border-accent outline-none transition-colors" 
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                    />
                  </div>
                </div>
                {passwordError && (
                  <p className="text-xs text-red-500 flex items-center gap-2">
                    <AlertCircle className="w-3 h-3" />
                    {passwordError}
                  </p>
                )}
              </div>

              <button 
                onClick={handlePasswordChange}
                className="w-full bg-accent text-accent-foreground font-bold py-4 rounded-none hover:opacity-90 transition-colors border border-accent"
              >
                Сохранить новый пароль
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isTotpModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-background/80 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-card border border-border rounded-none p-8 space-y-6 shadow-2xl"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold">Управление 2FA</h3>
                <button onClick={() => setIsTotpModalOpen(false)} className="p-2 hover:bg-foreground/5 rounded-none border border-transparent hover:border-border/20 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4 p-4 bg-foreground/5 rounded-none border border-border/20">
                <p className="font-bold">Секрет 2FA</p>
                <p className="text-sm text-foreground/40 break-all font-mono">{state.settings.totpSecret || 'Не настроен'}</p>
                <button
                  type="button"
                  onClick={async () => {
                    if (state.settings.totpSecret) {
                      await navigator.clipboard.writeText(state.settings.totpSecret);
                      setNotification({ message: 'Секрет скопирован в буфер обмена', type: 'success' });
                      setTimeout(() => setNotification(null), 3000);
                    }
                  }}
                  disabled={!state.settings.totpSecret}
                  className="w-full bg-accent text-accent-foreground py-3 rounded-none font-bold hover:opacity-90 transition-colors disabled:opacity-50"
                >
                  Скопировать секрет
                </button>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs text-foreground/30 uppercase tracking-widest font-bold">Код 2FA</label>
                  <input
                    type="text"
                    maxLength={6}
                    className="w-full bg-foreground/5 border border-border rounded-none p-3 text-sm outline-none focus:border-accent transition-colors"
                    placeholder="Введите код 2FA"
                    value={totpCode}
                    onChange={e => {
                      setTotpCode(e.target.value.replace(/[^0-9]/g, ''));
                      setTotpResetError('');
                      setTotpResetSuccess('');
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-foreground/30 uppercase tracking-widest font-bold">Новый мастер-пароль</label>
                  <input
                    type="password"
                    className="w-full bg-foreground/5 border border-border rounded-none p-3 text-sm outline-none focus:border-accent transition-colors"
                    placeholder="Новый пароль"
                    value={newPasswordReset}
                    onChange={e => {
                      setNewPasswordReset(e.target.value);
                      setTotpResetError('');
                      setTotpResetSuccess('');
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-foreground/30 uppercase tracking-widest font-bold">Подтверждение пароля</label>
                  <input
                    type="password"
                    className="w-full bg-foreground/5 border border-border rounded-none p-3 text-sm outline-none focus:border-accent transition-colors"
                    placeholder="Повторите пароль"
                    value={confirmPasswordReset}
                    onChange={e => {
                      setConfirmPasswordReset(e.target.value);
                      setTotpResetError('');
                      setTotpResetSuccess('');
                    }}
                  />
                </div>

                {totpResetError && <p className="text-sm text-destructive">{totpResetError}</p>}
                {totpResetSuccess && <p className="text-sm text-emerald-500">{totpResetSuccess}</p>}

                <button
                  type="button"
                  onClick={async () => {
                    setTotpResetError('');
                    setTotpResetSuccess('');

                    if (!state.settings.totpSecret) {
                      setTotpResetError('TOTP не настроен для этого пользователя.');
                      return;
                    }
                    if (totpCode.length !== 6 || !SecurityService.verifyTOTP(totpCode, state.settings.totpSecret)) {
                      setTotpResetError('Неверный код 2FA');
                      return;
                    }
                    if (newPasswordReset.length < 8) {
                      setTotpResetError('Пароль должен быть не менее 8 символов');
                      return;
                    }
                    if (newPasswordReset !== confirmPasswordReset) {
                      setTotpResetError('Пароли не совпадают');
                      return;
                    }

                    const hash = await SecurityService.hashPassword(newPasswordReset);
                    updateSettings({ masterPasswordHash: hash });
                    setNewPasswordReset('');
                    setConfirmPasswordReset('');
                    setTotpCode('');
                    setTotpResetSuccess('Мастер-пароль успешно сброшен');
                  }}
                  className="w-full bg-accent text-accent-foreground py-3 rounded-none font-bold hover:opacity-90 transition-colors"
                >
                  Сбросить пароль по 2FA
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
