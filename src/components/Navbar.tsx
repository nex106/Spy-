import React from 'react';
import { LogOut, Shield, User, ArrowLeft } from 'lucide-react';
import { useGame } from '../context/GameContext.js';
import { HorrorAudioButton } from './HorrorAudioButton.js';
import { ThemeToggle } from './ThemeToggle.js';

interface NavbarProps {
  onOpenHostDashboard?: () => void;
}

export function Navbar({ onOpenHostDashboard }: NavbarProps) {
  const { user, logout, room, leaveRoom } = useGame();

  if (!user) return null;

  return (
    <header className="sticky top-0 z-40 bg-white/85 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800/80 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4 sm:gap-8">
        {/* Zone 1: Single text element wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-xl font-extrabold tracking-tight font-mono uppercase bg-clip-text text-transparent bg-gradient-to-r from-red-600 via-rose-500 to-amber-500">
            SPY GAME
          </span>
          {(user.role === 'HOST' ||
            user.role === 'ADMIN' ||
            user.username.toLowerCase() === 'admin' ||
            user.username.toLowerCase() === 'nafiul') && (
            <button
              type="button"
              onClick={onOpenHostDashboard}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 dark:text-amber-400 bg-amber-100 hover:bg-amber-200 dark:bg-amber-950/40 dark:hover:bg-amber-900/50 border border-amber-300 dark:border-amber-800/50 px-2 py-0.5 rounded cursor-pointer transition-colors"
              title="Open Host / Admin Access Dashboard"
            >
              <Shield className="w-3 h-3" />
              HOST / ADMIN
            </button>
          )}
        </div>

        {/* Zone 2: Room Indicator / Clean Nav */}
        <div className="flex items-center gap-4 text-xs font-medium text-slate-600 dark:text-slate-400">
          {room ? (
            <div className="flex items-center gap-2">
              <span className="text-slate-500 dark:text-slate-400">ROOM:</span>
              <span className="font-mono text-emerald-700 dark:text-emerald-400 font-bold tracking-widest bg-emerald-100 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800/50 px-2 py-0.5 rounded">
                {room.code}
              </span>
              <button
                onClick={leaveRoom}
                className="inline-flex items-center gap-1 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors ml-2 py-1 px-2 hover:bg-slate-100 dark:hover:bg-slate-800/60 rounded cursor-pointer"
                title="Leave Room"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Exit Room</span>
              </button>
            </div>
          ) : (
            <span className="hidden md:inline text-slate-400 dark:text-slate-500">
              Live Multiplayer Deception & Logic
            </span>
          )}
        </div>

        {/* Zone 3: Horror Music + Theme Toggle + User profile + Logout */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <HorrorAudioButton />
          <ThemeToggle />

          <div className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300">
            <User className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-semibold text-slate-900 dark:text-white">{user.username}</span>
          </div>

          <button
            onClick={logout}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-700/80 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
            title="Log out"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Log Out</span>
          </button>
        </div>
      </div>
    </header>
  );
}
