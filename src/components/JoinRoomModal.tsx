import React, { useState } from 'react';
import { X, LogIn, AlertCircle, Key } from 'lucide-react';
import { useGame } from '../context/GameContext.js';

interface JoinRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function JoinRoomModal({ isOpen, onClose }: JoinRoomModalProps) {
  const { joinRoom } = useGame();
  const [roomCode, setRoomCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = roomCode.trim().toUpperCase();
    if (cleanCode.length !== 5) {
      setError('Room code must be exactly 5 alphanumeric characters.');
      return;
    }

    setError(null);
    setIsJoining(true);
    const result = await joinRoom(cleanCode);
    setIsJoining(false);

    if (result.success) {
      onClose();
    } else {
      setError(result.error || 'Failed to join room. Verify the code.');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 5);
    setRoomCode(val);
    if (error) setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-sm animate-fade-in transition-colors duration-300">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden transition-colors duration-300">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider font-mono">
            <Key className="w-4 h-4 text-red-500" />
            <span>JOIN ROOM</span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="flex items-start gap-2.5 p-3 bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800/80 rounded-xl text-red-700 dark:text-red-200 text-xs">
              <AlertCircle className="w-4 h-4 text-red-500 dark:text-red-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              Enter 5-Character Room Code
            </label>
            <input
              type="text"
              value={roomCode}
              onChange={handleChange}
              placeholder="e.g. SPY01"
              maxLength={5}
              autoFocus
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-center font-mono text-2xl font-bold tracking-[0.25em] text-emerald-600 dark:text-emerald-400 placeholder-slate-400 dark:placeholder-slate-700 focus:outline-none focus:border-red-500 transition-colors uppercase"
            />
            <p className="mt-1.5 text-[11px] text-slate-500 text-center">
              Ask Host Nafiul for the 5-character mission code.
            </p>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs tracking-wider rounded-xl transition-colors cursor-pointer"
            >
              CANCEL
            </button>
            <button
              type="submit"
              disabled={roomCode.length !== 5 || isJoining}
              className="flex-1 py-3 px-4 bg-red-600 hover:bg-red-500 disabled:opacity-40 text-white font-bold text-xs tracking-wider rounded-xl shadow-md dark:shadow-red-950/40 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>{isJoining ? 'JOINING...' : 'JOIN ROOM'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
