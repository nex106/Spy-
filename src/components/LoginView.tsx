import React, { useState } from 'react';
import { Eye, EyeOff, Lock, Sparkles, User, AlertCircle, ShieldAlert } from 'lucide-react';
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
    <div className="min-h-screen bg-slate-50 dark:bg-[#070A10] text-slate-900 dark:text-slate-100 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden transition-colors duration-300">
      {/* Top Right Controls */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
        <HorrorAudioButton />
        <ThemeToggle />
      </div>

      {/* Background radial ambient lighting */}
      <div className="absolute top-1/4 -left-40 w-96 h-96 bg-red-400/10 dark:bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-40 w-96 h-96 bg-blue-400/10 dark:bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Brand Kicker & Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-full text-xs font-medium text-slate-600 dark:text-slate-400 mb-3 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Secure Tactical Multiplayer</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight uppercase font-mono text-slate-900 dark:text-white">
            SPY GAME
          </h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Uncover the impostor before the final vote.
          </p>
        </div>

        {/* Card Box */}
        <div className="bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 backdrop-blur-xl shadow-xl dark:shadow-2xl transition-colors duration-300">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="flex items-start gap-3 p-3.5 bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800/80 rounded-xl text-red-700 dark:text-red-200 text-xs leading-relaxed animate-shake">
                <AlertCircle className="w-4 h-4 text-red-500 dark:text-red-400 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Username"
                  autoComplete="username"
                  required
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-950/80 border border-slate-300 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-red-500/80 focus:ring-1 focus:ring-red-500/80 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  autoComplete="current-password"
                  required
                  className="w-full pl-10 pr-11 py-3 bg-slate-50 dark:bg-slate-950/80 border border-slate-300 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-red-500/80 focus:ring-1 focus:ring-red-500/80 transition-colors"
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

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-sm tracking-wide rounded-xl shadow-md dark:shadow-lg dark:shadow-red-950/50 transition-all duration-200 active:scale-[0.99] disabled:opacity-60 cursor-pointer"
            >
              {isSubmitting ? 'Authenticating...' : 'ENTER THE MISSION'}
            </button>
          </form>

          {/* Security Policy Reminder */}
          <div className="mt-6 pt-5 border-t border-slate-200 dark:border-slate-800/80 text-center">
            <p className="text-xs text-slate-500 flex items-center justify-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span>Accounts are managed exclusively by the Host / Admin</span>
            </p>
          </div>
        </div>

        {/* Footer info */}
        <p className="mt-6 text-center text-xs text-slate-400 dark:text-slate-600">
          SPY GAME v1.0 · Server-Authoritative Real-Time Architecture
        </p>
      </div>
    </div>
  );
}
