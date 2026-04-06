import React, { useState } from 'react';
import { Shield, Zap, Key, Lock, CheckCircle2 } from 'lucide-react';
import { SecurityService } from '../services/security';

export function SetupFlow({ onComplete }: { onComplete: (data: { userName: string, masterPasswordHash: string, totpSecret: string }) => void }) {
  const [step, setStep] = useState(1);
  const [userName, setUserName] = useState('');
  const [password, setPassword] = useState('');
  const [totpSecret] = useState(() => SecurityService.generateTOTPSecret());
  const [totpInput, setTotpInput] = useState('');
  const [error, setError] = useState('');

  const handleComplete = async () => {
    // Verify TOTP
    if (!SecurityService.verifyTOTP(totpInput, totpSecret)) {
      setError('Неверный код 2FA. Попробуйте еще раз.');
      return;
    }

    // Create a hash for storage (not the key itself)
    const hashHex = await SecurityService.hashPassword(password);

    onComplete({ userName, masterPasswordHash: hashHex, totpSecret });
  };

  return (
    <div className="fixed inset-0 bg-background z-50 flex items-center justify-center p-6 text-foreground">
      <div className="max-w-md w-full space-y-8 text-center">
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center">
            <Zap className="w-10 h-10 text-accent-foreground fill-accent-foreground" />
          </div>
        </div>

        {step === 1 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <h1 className="text-3xl font-bold tracking-tighter">Добро пожаловать в Aura</h1>
            <p className="text-foreground/40">Ваша персональная ОС для жизни. Начнем с вашего имени.</p>
            <input 
              type="text" 
              placeholder="Ваше имя"
              className="w-full bg-foreground/5 border border-border rounded-2xl p-4 text-center text-xl focus:outline-none focus:border-accent/50"
              value={userName}
              onChange={e => setUserName(e.target.value)}
            />
            <button 
              disabled={!userName}
              onClick={() => setStep(2)}
              className="w-full bg-foreground text-background font-bold py-4 rounded-2xl hover:opacity-90 transition-colors disabled:opacity-50"
            >
              Продолжить
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <h1 className="text-3xl font-bold tracking-tighter">Защитите свои данные</h1>
            <p className="text-foreground/40">Создайте мастер-пароль. Он будет использоваться для шифрования всего локально.</p>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/20" />
              <input 
                type="password" 
                placeholder="Мастер-пароль"
                className="w-full bg-foreground/5 border border-border rounded-2xl p-4 pl-12 text-xl focus:outline-none focus:border-accent/50"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>
            <button 
              disabled={password.length < 8}
              onClick={() => setStep(3)}
              className="w-full bg-foreground text-background font-bold py-4 rounded-2xl hover:opacity-90 transition-colors disabled:opacity-50"
            >
              Установить пароль
            </button>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <h1 className="text-3xl font-bold tracking-tighter">Двухфакторная аутентификация</h1>
            <p className="text-foreground/40">Отсканируйте этот секрет в приложении аутентификаторе (Google Authenticator, Authy и т.д.)</p>
            <div className="bg-white p-4 rounded-2xl inline-block">
              <div className="w-48 h-48 bg-gray-200 flex items-center justify-center text-black text-xs font-mono break-all p-4">
                {totpSecret}
              </div>
            </div>
            <input 
              type="text" 
              placeholder="6-значный код"
              className="w-full bg-foreground/5 border border-border rounded-2xl p-4 text-center text-2xl tracking-[1em] focus:outline-none focus:border-accent/50"
              maxLength={6}
              value={totpInput}
              onChange={e => {
                setTotpInput(e.target.value);
                setError('');
              }}
            />
            {error && <p className="text-red-500 text-sm font-bold">{error}</p>}
            <button 
              disabled={totpInput.length !== 6}
              onClick={handleComplete}
              className="w-full bg-foreground text-background font-bold py-4 rounded-2xl hover:opacity-90 transition-colors disabled:opacity-50"
            >
              Завершить настройку
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
