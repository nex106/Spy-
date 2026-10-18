import React from 'react';
import { LogOut, Shield, Crown, ArrowLeft, Gamepad2, Sparkles } from 'lucide-react';
import { useGame } from '../context/GameContext.js';
import { HorrorAudioButton } from './HorrorAudioButton.js';
import { ThemeToggle } from './ThemeToggle.js';

interface NavbarProps {
  onOpenHostDashboard?: () => void;
}

export function Navbar({ onOpenHostDashboard }: NavbarProps) {
  const { user, logout, room, leaveRoom } = useGame();

  if (!user) return null;

  const isHost =
    user.role === 'HOST' ||
    user.role === 'ADMIN' ||
    user.username.toLowerCase() === 'admin' ||
    user.username.toLowerCase() === 'nafiul';

  // Deterministic playful avatar color from username
  const avatarColors = [
    'bg-rose-500 text-white',
    'bg-amber-400 text-slate-900',
    'bg-cyan-400 text-slate-900',
    'bg-violet-500 text-white',
    'bg-emerald-400 text-slate-900',
    'bg-fuchsia-500 text-white',
  ];
  const colorIndex =
    user.username.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) %
    avatarColors.length;
  const userAvatarColor = avatarColors[colorIndex];

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-[#0F1426]/95 backdrop-blur-md border-b-2 border-indigo-100 dark:border-indigo-950/80 shadow-xs transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3 sm:gap-6">
        {/* Zone 1: Cartoon Game Wordmark */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-rose-500 to-amber-500 flex items-center justify-center text-white shadow-sm border-2 border-white/40 dark:border-white/20 transform -rotate-3 hover:rotate-0 transition-transform">
            <Gamepad2 className="w-5 h-5" />
          </div>

          <div className="flex items-center gap-2">
            <span className="font-game text-xl sm:text-2xl font-black tracking-wide uppercase bg-clip-text text-transparent bg-gradient-to-r from-rose-500 via-amber-400 to-cyan-400 drop-shadow-xs">
              SPY GAME
            </span>

            {isHost && (
              <button
                type="button"
                onClick={onOpenHostDashboard}
                className="hidden sm:inline-flex items-center gap-1 text-[11px] font-game font-bold tracking-wider text-amber-900 dark:text-amber-300 bg-amber-300 hover:bg-amber-200 dark:bg-amber-950/80 dark:hover:bg-amber-900/90 border-2 border-amber-400 dark:border-amber-700/80 px-2.5 py-0.5 rounded-full cursor-pointer shadow-xs active:scale-95 transition-all"
                title="Open Host & Admin Dashboard"
              >
                <Crown className="w-3 h-3 text-amber-600 dark:text-amber-400 fill-current" />
                <span>HOST PANEL</span>
              </button>
            )}
          </div>
        </div>

        {/* Zone 2: Room Game Status / Center Display */}
        <div className="flex items-center gap-3">
          {room ? (
            <div className="flex items-center gap-2 bg-indigo-50 dark:bg-[#161C33] border-2 border-indigo-200 dark:border-indigo-800/80 px-3 py-1 rounded-2xl shadow-xs">
              <span className="text-[10px] font-game uppercase font-bold text-indigo-500 dark:text-indigo-400">
                ROOM
              </span>
              <span className="font-mono text-xs sm:text-sm font-extrabold tracking-widest text-emerald-600 dark:text-emerald-400 bg-emerald-100/80 dark:bg-emerald-950/80 px-2 py-0.5 rounded-lg border border-emerald-300 dark:border-emerald-700">
                {room.code}
              </span>
              <button
                onClick={leaveRoom}
                className="inline-flex items-center gap-1 text-slate-500 hover:text-rose-500 dark:text-slate-400 dark:hover:text-rose-400 transition-colors p-1 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer ml-1 text-xs font-semibold"
                title="Leave Room"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Exit</span>
              </button>
            </div>
          ) : (
            <div className="hidden md:flex items-center gap-1.5 text-xs font-game font-semibold text-indigo-600/80 dark:text-indigo-400/80 bg-indigo-50 dark:bg-indigo-950/40 px-3 py-1 rounded-full border border-indigo-100 dark:border-indigo-900/50">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Multiplayer Party Lobby</span>
            </div>
          )}
        </div>

        {/* Zone 3: Audio + Theme + Player Avatar + Logout */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <HorrorAudioButton />
          <ThemeToggle />

          {/* Player Avatar Token */}
          <div className="flex items-center gap-2 bg-slate-100 dark:bg-[#161C33] border border-slate-200 dark:border-slate-800/80 pl-1 pr-2.5 py-1 rounded-full">
            <div
              className={`w-6 h-6 rounded-full ${userAvatarColor} font-game font-bold text-xs flex items-center justify-center border border-white/50 shadow-xs`}
            >
              {user.username.charAt(0).toUpperCase()}
            </div>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-100 max-w-[90px] sm:max-w-[120px] truncate">
              {user.username}
            </span>
          </div>

          <button
            onClick={logout}
            className="p-2 sm:px-3 sm:py-1.5 text-xs font-game font-bold text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 bg-slate-100 hover:bg-rose-50 dark:bg-[#161C33] dark:hover:bg-rose-950/40 border border-slate-200 dark:border-slate-800 rounded-xl transition-all cursor-pointer shadow-xs"
            title="Log out of game"
          >
            <LogOut className="w-3.5 h-3.5 inline sm:mr-1.5" />
            <span className="hidden sm:inline">Exit</span>
          </button>
        </div>
      </div>
    </header>
  );
}
