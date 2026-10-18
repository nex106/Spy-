import React, { useState } from 'react';
import { Eye, EyeOff, Lock, Sparkles, User, AlertCircle, ShieldAlert, Gamepad2, Search } from 'lucide-react';
import { useGame } from '../context/GameContext.js';
import { HorrorAudioButton } from './HorrorAudioButton.js';
import { ThemeToggle } from './ThemeToggle.js';

export function LoginView() {
  const { login } = useGame();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError('Please provide both username and password.');
      return;
    }

    setError(null);
    setIsSubmitting(true);
    const result = await login(username, password);
    setIsSubmitting(false);

    if (!result.success) {
      setError(result.error || 'Invalid credentials. Please verify your username and password.');
    }
  };

  return (
    <div className="min-h-screen bg-[#EEF2FF] dark:bg-[#0C1021] text-slate-900 dark:text-slate-100 flex flex-col justify-center items-center px-4 py-8 sm:py-12 relative overflow-hidden transition-colors duration-300">
      {/* Top Right Controls (Preserving Horror Audio & Theme) */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
        <HorrorAudioButton />
        <ThemeToggle />
      </div>

      {/* Playful background ambient glow */}
      <div className="absolute top-1/4 -left-32 w-80 h-80 bg-rose-400/15 dark:bg-rose-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-80 h-80 bg-cyan-400/15 dark:bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-violet-400/10 dark:bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10 animate-pop-in">
        {/* Cartoon Game Logo & Kicker */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/90 dark:bg-[#161B33] border-2 border-indigo-200 dark:border-indigo-800/80 rounded-full text-xs font-game font-bold text-indigo-600 dark:text-indigo-300 mb-3 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
            <span>Multiplayer Party Game</span>
          </div>

          {/* Big Cartoon Game Title with Icon */}
          <div className="flex items-center justify-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-500 via-amber-400 to-cyan-400 flex items-center justify-center text-white shadow-md border-2 border-white/60 dark:border-white/20 transform -rotate-6">
              <Gamepad2 className="w-7 h-7" />
            </div>
            <h1 className="text-4xl sm:text-5xl font-black font-game tracking-wider uppercase bg-clip-text text-transparent bg-gradient-to-r from-rose-500 via-amber-400 to-cyan-400 drop-shadow-xs">
              SPY GAME
            </h1>
          </div>

          <p className="mt-2 text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400 max-w-xs mx-auto">
            Find the secret impostor before the final vote!
          </p>
        </div>

        {/* Tactile Game Login Card */}
        <div className="bg-white dark:bg-[#151B33] border-2 border-indigo-100 dark:border-indigo-900/60 rounded-3xl p-6 sm:p-8 shadow-[0_12px_24px_rgba(15,23,42,0.08)] dark:shadow-[0_16px_32px_rgba(0,0,0,0.4)] transition-colors duration-300">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-start gap-3 p-3.5 bg-rose-50 dark:bg-rose-950/60 border-2 border-rose-200 dark:border-rose-800 rounded-2xl text-rose-700 dark:text-rose-200 text-xs leading-relaxed animate-shake">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-game font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Player Nickname
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your nickname"
                  autoComplete="username"
                  required
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-[#0E1326] border-2 border-slate-200 dark:border-indigo-950 rounded-2xl text-sm font-medium text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-game font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Passcode
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter passcode"
                  autoComplete="current-password"
                  required
                  className="w-full pl-10 pr-11 py-3 bg-slate-50 dark:bg-[#0E1326] border-2 border-slate-200 dark:border-indigo-950 rounded-2xl text-sm font-medium text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* 3D Tactile Action Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 px-4 btn-game-coral font-game font-extrabold text-sm sm:text-base tracking-wider rounded-2xl shadow-md cursor-pointer flex items-center justify-center gap-2"
              >
                <span>{isSubmitting ? 'CONNECTING...' : 'JOIN THE GAME'}</span>
              </button>
            </div>
          </form>

          {/* Host Managed Notice */}
          <div className="mt-5 pt-4 border-t border-slate-100 dark:border-indigo-950/80 text-center">
            <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center justify-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span>Accounts are managed by the Room Host</span>
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="mt-5 text-center text-xs font-mono text-slate-400 dark:text-slate-600">
          SPY GAME · Multiplayer Party Edition
        </p>
      </div>
    </div>
  );
}
