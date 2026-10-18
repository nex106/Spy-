import React, { useState } from 'react';
import {
  Copy,
  Check,
  Users,
  Shield,
  UserX,
  Play,
  Lock,
  Unlock,
  Key,
  Dices,
  AlertCircle,
  Crown,
  ShieldCheck,
  ShieldAlert,
  Sparkles,
  Gamepad2,
} from 'lucide-react';
import { useGame } from '../context/GameContext.js';
import { PlayerGameRole } from '../types.js';
import { isUserHostOrCoHost, isUserSecondHost } from '../utils/hostUtils.js';

export function RoomLobbyView() {
  const { room, user, hostAction, leaveRoom } = useGame();
  const [copied, setCopied] = useState(false);
  const [secretWordInput, setSecretWordInput] = useState(room?.secretWord || 'MANGO');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);

  if (!room) return null;

  const isHost = isUserHostOrCoHost(user, room);
  const isSecondHost = isUserSecondHost(user, room);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(room.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleToggleSecondHost = async (targetUserId: string, makeSecondHost: boolean) => {
    setErrorMsg(null);
    const result = await hostAction('SET_SECOND_HOST', {
      targetUserId,
      isSecondHost: makeSecondHost,
    });
    if (!result.success) {
      setErrorMsg(result.error || 'Failed to update 2nd host');
    }
  };

  const handleRoleChange = async (targetUserId: string, role: PlayerGameRole) => {
    if (!isHost) return;
    await hostAction('SET_ROLE', { targetUserId, role });
  };

  const handleAutoAssignSpy = async () => {
    if (!isHost || room.players.length === 0) return;
    const randomIndex = Math.floor(Math.random() * room.players.length);
    const chosenPlayer = room.players[randomIndex];

    for (const p of room.players) {
      const role = p.userId === chosenPlayer.userId ? 'SPY' : 'PLAYER';
      await hostAction('SET_ROLE', { targetUserId: p.userId, role });
    }
  };

  const handleSecretWordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toUpperCase();
    setSecretWordInput(val);
  };

  const handleApplySecretWord = async () => {
    if (!secretWordInput.trim()) return;
    await hostAction('SET_WORD', { word: secretWordInput.trim() });
  };

  const handleStartGame = async () => {
    if (!isHost) return;
    setErrorMsg(null);

    // Save secret word first
    await hostAction('SET_WORD', { word: secretWordInput.trim() });

    setIsStarting(true);
    const result = await hostAction('START_GAME');
    setIsStarting(false);

    if (!result.success) {
      setErrorMsg(result.error || 'Failed to start game.');
    }
  };

  const handleToggleJoining = async () => {
    await hostAction('SET_JOINING', { isOpen: !room.isOpenJoining });
  };

  const handleRemovePlayer = async (targetUserId: string) => {
    if (!confirm('Remove this player from the room?')) return;
    await hostAction('REMOVE_PLAYER', { targetUserId });
  };

  const handleCloseRoom = async () => {
    if (!confirm('Are you sure you want to close this room?')) return;
    await hostAction('CLOSE_ROOM');
    leaveRoom();
  };

  const WORD_SUGGESTIONS = ['MANGO', 'AIRPLANE', 'TELESCOPE', 'PYRAMID', 'GUITAR', 'SUBMARINE'];

  const avatarColors = [
    'bg-rose-500 text-white',
    'bg-amber-400 text-slate-900',
    'bg-cyan-400 text-slate-900',
    'bg-violet-500 text-white',
    'bg-emerald-400 text-slate-900',
    'bg-fuchsia-500 text-white',
  ];

  const getAvatarColor = (name: string) => {
    const idx =
      name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % avatarColors.length;
    return avatarColors[idx];
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8 space-y-6 animate-pop-in">
      {/* Cartoon Room Code Ticket Header */}
      <div className="bg-white dark:bg-[#151B33] border-2 border-indigo-100 dark:border-indigo-900/70 rounded-3xl p-6 sm:p-8 text-center relative overflow-hidden shadow-[0_12px_24px_rgba(15,23,42,0.06)] dark:shadow-[0_16px_32px_rgba(0,0,0,0.35)] transition-colors duration-300">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 dark:bg-[#1C2344] border-2 border-indigo-200 dark:border-indigo-800 rounded-full text-xs font-game font-bold text-indigo-600 dark:text-indigo-300 mb-3 shadow-xs">
          <Gamepad2 className="w-3.5 h-3.5 text-cyan-500" />
          <span>Party Room Lobby</span>
          <span aria-hidden="true">·</span>
          <span className="text-emerald-500 font-bold">READY</span>
        </div>

        <h2 className="text-xs uppercase tracking-widest font-game font-bold text-slate-500 dark:text-slate-400">
          ROOM PASSCODE
        </h2>

        {/* Big 5-Character Code Ticket */}
        <div className="mt-2 inline-flex items-center gap-3 bg-indigo-50/80 dark:bg-[#0E1326] border-2 border-indigo-200 dark:border-indigo-950 rounded-2xl px-6 py-3 shadow-inner">
          <span className="font-mono text-3xl sm:text-5xl font-black tracking-[0.25em] text-cyan-600 dark:text-cyan-400 drop-shadow-xs">
            {room.code}
          </span>
          <button
            onClick={handleCopyCode}
            className="p-3 btn-game-cyan font-bold rounded-xl transition-all cursor-pointer shadow-xs"
            title="Copy Room Code"
          >
            {copied ? (
              <Check className="w-5 h-5 text-slate-950 stroke-[3]" />
            ) : (
              <Copy className="w-5 h-5 stroke-[2.5]" />
            )}
          </button>
        </div>

        {copied && (
          <p className="mt-2 text-xs font-game font-bold text-emerald-500 animate-bounce-subtle">
            Room Code copied to clipboard!
          </p>
        )}

        <p className="mt-3 text-xs text-slate-500 dark:text-slate-400 font-medium">
          Share this 5-character passcode with your party friends to jump in!
        </p>

        {/* Host Status Indicators */}
        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-indigo-950 flex flex-wrap items-center justify-center gap-4 text-xs font-game">
          <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
            <Crown className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
            <span className="text-slate-400">Host:</span>
            <span className="font-bold text-amber-500">{room.hostUsername}</span>
          </div>
          <span className="text-slate-300 dark:text-slate-700">·</span>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">Status:</span>
            <span
              className={`font-bold ${
                room.isOpenJoining ? 'text-emerald-500' : 'text-rose-500'
              }`}
            >
              {room.isOpenJoining ? 'Open for Friends' : 'Room Locked'}
            </span>
          </div>
        </div>
      </div>

      {/* Error Notice */}
      {errorMsg && (
        <div className="flex items-start gap-2.5 p-4 bg-rose-50 dark:bg-rose-950/60 border-2 border-rose-200 dark:border-rose-800 rounded-2xl text-rose-700 dark:text-rose-200 text-xs font-medium animate-shake">
          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Host Controls Panel: Role Assignment & Secret Word */}
      {isHost ? (
        <div className="bg-white dark:bg-[#151B33] border-2 border-amber-300 dark:border-amber-900/60 rounded-3xl p-6 shadow-[0_12px_24px_rgba(245,158,11,0.06)] dark:shadow-[0_16px_32px_rgba(0,0,0,0.35)] space-y-5 transition-colors duration-300">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-indigo-950">
            <div className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-amber-500 fill-amber-400" />
              <h3 className="text-sm font-game font-black text-slate-900 dark:text-white uppercase tracking-wider">
                HOST GAME SETUP
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleToggleJoining}
                className="py-2 px-3 btn-game-slate text-xs font-game font-bold rounded-xl flex items-center gap-1.5 cursor-pointer"
              >
                {room.isOpenJoining ? (
                  <>
                    <Lock className="w-3.5 h-3.5 text-rose-500" />
                    <span>Lock Room</span>
                  </>
                ) : (
                  <>
                    <Unlock className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Unlock Room</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleCloseRoom}
                className="py-2 px-3 bg-rose-100 dark:bg-rose-950/60 hover:bg-rose-200 dark:hover:bg-rose-900 text-rose-700 dark:text-rose-300 border-b-2 border-rose-300 dark:border-rose-800 text-xs font-game font-bold rounded-xl transition-all cursor-pointer"
              >
                Close Room
              </button>
            </div>
          </div>

          {/* Secret Word Setup */}
          <div className="space-y-2">
            <label className="block text-xs font-game font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Secret Word (Citizens see this, Spy gets NO word!)
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={secretWordInput}
                onChange={handleSecretWordChange}
                onBlur={handleApplySecretWord}
                placeholder="e.g. MANGO"
                className="flex-1 px-4 py-2.5 bg-slate-50 dark:bg-[#0E1326] border-2 border-slate-200 dark:border-indigo-950 rounded-2xl text-base font-game font-bold tracking-widest text-slate-900 dark:text-white uppercase focus:outline-none focus:border-amber-400 transition-colors"
              />
            </div>

            {/* Quick Word Suggestions */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[11px] font-game font-bold text-slate-500">Quick Picks:</span>
              {WORD_SUGGESTIONS.map((w) => (
                <button
                  key={w}
                  type="button"
                  onClick={() => {
                    setSecretWordInput(w);
                    hostAction('SET_WORD', { word: w });
                  }}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-amber-100 dark:bg-[#1E2545] dark:hover:bg-amber-950/60 border border-slate-200 dark:border-indigo-900/60 rounded-xl text-xs font-game font-bold text-slate-700 dark:text-slate-300 transition-all cursor-pointer active:scale-95"
                >
                  {w}
                </button>
              ))}
            </div>
          </div>

          {/* Role Assignment helper */}
          <div className="pt-2 flex items-center justify-between">
            <span className="text-xs font-game font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Player Secret Roles
            </span>
            <button
              type="button"
              onClick={handleAutoAssignSpy}
              className="text-xs font-game font-bold text-amber-600 dark:text-amber-400 hover:text-amber-500 flex items-center gap-1.5 transition-colors cursor-pointer bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-900 px-3 py-1.5 rounded-xl shadow-xs active:scale-95"
            >
              <Dices className="w-4 h-4 text-amber-500" />
              <span>Auto-Pick 1 Random Spy</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="p-4 bg-white dark:bg-[#151B33] border-2 border-indigo-100 dark:border-indigo-900/60 rounded-3xl text-center shadow-xs">
          <p className="text-xs font-game font-medium text-slate-600 dark:text-slate-400">
            Waiting for Host <span className="text-amber-500 font-bold">{room.hostUsername}</span>
            {room.secondHostUsername && (
              <> & 2nd Host <span className="text-violet-400 font-bold">{room.secondHostUsername}</span></>
            )}{' '}
            to assign roles and start the party round!
          </p>
        </div>
      )}

      {/* Players List Grid */}
      <div className="bg-white dark:bg-[#151B33] border-2 border-indigo-100 dark:border-indigo-900/60 rounded-3xl p-6 shadow-[0_12px_24px_rgba(15,23,42,0.06)] dark:shadow-[0_16px_32px_rgba(0,0,0,0.35)] transition-colors duration-300">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-xs font-game font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
            <Users className="w-4 h-4 text-indigo-400" />
            <span>Players in Room ({room.players.length})</span>
          </div>
          <div className="flex items-center gap-2">
            {room.secondHostUsername && (
              <span className="text-[10px] font-game font-bold text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-950/60 border border-purple-300 dark:border-purple-800 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-purple-500" />
                2nd Host: {room.secondHostUsername}
              </span>
            )}
            <span className="text-[11px] font-game font-bold text-slate-500">
              {room.players.length < 2 ? 'At least 2 players needed' : `${room.players.length} players ready`}
            </span>
          </div>
        </div>

        {room.players.length === 0 ? (
          <div className="py-10 text-center border-2 border-dashed border-slate-200 dark:border-indigo-950 rounded-2xl space-y-2">
            <Users className="w-8 h-8 mx-auto text-indigo-300 dark:text-indigo-600" />
            <p className="text-xs font-game font-bold text-slate-600 dark:text-slate-400">
              Waiting for friends to join...
            </p>
            <p className="text-[11px] text-slate-500">
              Share passcode <span className="font-mono text-cyan-500 font-bold">{room.code}</span> to bring everyone into this lobby!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {room.players.map((p) => {
              const isTargetSecondHost = Boolean(p.isSecondHost || room.secondHostId === p.userId);
              const isTargetHost = p.isHost && !isTargetSecondHost;
              const isMe = p.userId === user?.id;
              const avatarColor = getAvatarColor(p.username);

              return (
                <div
                  key={p.userId}
                  className={`p-4 rounded-2xl border-2 transition-all flex flex-col justify-between gap-3 shadow-xs ${
                    p.assignedRole === 'SPY' && isHost
                      ? 'bg-rose-50/70 dark:bg-rose-950/20 border-rose-300 dark:border-rose-800/80'
                      : isTargetSecondHost
                      ? 'bg-purple-50/50 dark:bg-purple-950/20 border-purple-300 dark:border-purple-800/80'
                      : 'bg-slate-50/80 dark:bg-[#0E1326] border-slate-200 dark:border-indigo-950'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-9 h-9 rounded-full shrink-0 flex items-center justify-center font-game font-bold text-xs border border-white/50 shadow-xs ${avatarColor}`}
                      >
                        {p.username.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-sm font-game font-bold text-slate-900 dark:text-white">
                            {p.username}
                          </span>
                          {isMe && (
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-game font-bold">(You)</span>
                          )}
                          {isTargetSecondHost && (
                            <span className="text-[10px] font-game font-bold text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-950/50 border border-purple-300 dark:border-purple-800/60 px-2 py-0.5 rounded-full flex items-center gap-1">
                              <ShieldCheck className="w-2.5 h-2.5 text-purple-500" />
                              2ND HOST
                            </span>
                          )}
                          {isTargetHost && (
                            <span className="text-[10px] font-game font-bold text-amber-900 dark:text-amber-300 bg-amber-300 dark:bg-amber-950/60 border border-amber-400 dark:border-amber-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                              <Crown className="w-2.5 h-2.5 text-amber-600 fill-amber-500" />
                              HOST
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <span className={`w-1.5 h-1.5 rounded-full ${p.isOnline ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                          {p.isOnline ? 'Ready in Lobby' : 'Reconnecting...'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {/* Host action: Make / Revoke 2nd Host */}
                      {isHost && (
                        <button
                          type="button"
                          onClick={() => handleToggleSecondHost(p.userId, !isTargetSecondHost)}
                          className={`px-2 py-1 text-[10px] font-game font-bold tracking-wider rounded-xl border transition-all flex items-center gap-1 cursor-pointer active:scale-95 ${
                            isTargetSecondHost
                              ? 'bg-purple-100 hover:bg-purple-200 dark:bg-purple-950/80 text-purple-800 dark:text-purple-200 border-purple-300'
                              : 'bg-white hover:bg-amber-50 dark:bg-[#1E2545] dark:hover:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-800'
                          }`}
                          title={isTargetSecondHost ? 'Revoke 2nd Host privileges' : 'Appoint player as 2nd Host'}
                        >
                          <Shield className="w-3 h-3 text-amber-500" />
                          <span>{isTargetSecondHost ? 'REVOKE 2ND' : 'MAKE 2ND'}</span>
                        </button>
                      )}

                      {isHost && !isTargetHost && (
                        <button
                          onClick={() => handleRemovePlayer(p.userId)}
                          className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors cursor-pointer"
                          title="Remove player"
                        >
                          <UserX className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Host Role Controls for this player */}
                  {isHost && (
                    <div className="pt-2 border-t border-slate-200 dark:border-indigo-950 flex items-center justify-between">
                      <span className="text-[11px] font-game font-bold text-slate-500 dark:text-slate-400">Role:</span>
                      <div className="flex items-center gap-1 p-0.5 bg-slate-100 dark:bg-[#080B17] border border-slate-200 dark:border-indigo-950 rounded-xl">
                        <button
                          type="button"
                          onClick={() => handleRoleChange(p.userId, 'PLAYER')}
                          className={`px-3 py-1 text-xs font-game font-bold rounded-lg transition-colors cursor-pointer ${
                            p.assignedRole !== 'SPY'
                              ? 'bg-emerald-500 text-white shadow-xs'
                              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                          }`}
                        >
                          PLAYER
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRoleChange(p.userId, 'SPY')}
                          className={`px-3 py-1 text-xs font-game font-bold rounded-lg transition-colors cursor-pointer ${
                            p.assignedRole === 'SPY'
                              ? 'bg-rose-500 text-white shadow-xs'
                              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                          }`}
                        >
                          SPY
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Start Game Action Bar (Host Only) */}
      {isHost && (
        <div className="flex justify-end pt-2">
          <button
            onClick={handleStartGame}
            disabled={isStarting || room.players.length < 2}
            className="w-full sm:w-auto py-4 px-8 btn-game-coral font-game font-black text-sm tracking-wider uppercase rounded-2xl shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40"
          >
            <Play className="w-5 h-5 fill-current" />
            <span>{isStarting ? 'STARTING PARTY GAME...' : 'START GAME NOW'}</span>
          </button>
        </div>
      )}
    </div>
  );
}
