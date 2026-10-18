import React, { useState } from 'react';
import { X, PlusCircle, AlertCircle, Dices, Sparkles, Gamepad2 } from 'lucide-react';
import { useGame } from '../context/GameContext.js';

interface CreateRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateRoomModal({ isOpen, onClose }: CreateRoomModalProps) {
  const { createRoom } = useGame();
  const [roomCode, setRoomCode] = useState('SPY01');
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  if (!isOpen) return null;

  const handleGenerateRandom = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let res = '';
    for (let i = 0; i < 5; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setRoomCode(res);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = roomCode.trim().toUpperCase();
    if (cleanCode.length !== 5) {
      setError('Room code must be exactly 5 alphanumeric characters.');
      return;
    }

    setError(null);
    setIsCreating(true);
    const result = await createRoom(cleanCode);
    setIsCreating(false);

    if (result.success) {
      onClose();
    } else {
      setError(result.error || 'Failed to create room. Room code may already exist.');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 5);
    setRoomCode(val);
    if (error) setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-sm animate-pop-in transition-colors duration-300">
      <div className="w-full max-w-md bg-white dark:bg-[#151B33] border-3 border-amber-300 dark:border-amber-900/80 rounded-3xl shadow-2xl overflow-hidden transition-colors duration-300">
        {/* Header */}
        <div className="px-6 py-4 bg-amber-50/70 dark:bg-[#10152B] border-b-2 border-amber-200 dark:border-indigo-950 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-game font-black text-amber-700 dark:text-amber-300 uppercase tracking-wider">
            <PlusCircle className="w-4 h-4 text-amber-500 fill-amber-400" />
            <span>CREATE PARTY ROOM</span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="flex items-start gap-2.5 p-3.5 bg-rose-50 dark:bg-rose-950/60 border-2 border-rose-200 dark:border-rose-800 rounded-2xl text-rose-700 dark:text-rose-200 text-xs font-medium animate-shake">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-game font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Assign 5-Character Room Code
              </label>
              <button
                type="button"
                onClick={handleGenerateRandom}
                className="text-xs font-game font-bold text-amber-600 dark:text-amber-400 hover:text-amber-500 flex items-center gap-1 cursor-pointer"
              >
                <Dices className="w-4 h-4" />
                <span>Random Code</span>
              </button>
            </div>

            <input
              type="text"
              value={roomCode}
              onChange={handleChange}
              placeholder="e.g. SPY01"
              maxLength={5}
              autoFocus
              className="w-full px-4 py-3 bg-slate-50 dark:bg-[#0E1326] border-2 border-slate-200 dark:border-indigo-950 rounded-2xl text-center font-mono text-3xl font-black tracking-[0.25em] text-amber-600 dark:text-amber-400 placeholder-slate-400 dark:placeholder-slate-700 focus:outline-none focus:border-amber-400 transition-colors uppercase shadow-inner"
            />
            <p className="mt-2 text-xs font-medium text-slate-500 text-center">
              Players will type this 5-letter code to join your lobby.
            </p>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 btn-game-slate font-game font-bold text-xs tracking-wider rounded-2xl cursor-pointer"
            >
              CANCEL
            </button>
            <button
              type="submit"
              disabled={roomCode.length !== 5 || isCreating}
              className="flex-1 py-3 px-4 btn-game-amber font-game font-black text-xs tracking-wider rounded-2xl shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40"
            >
              <PlusCircle className="w-4 h-4 stroke-[2.5]" />
              <span>{isCreating ? 'CREATING...' : 'CREATE ROOM'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
