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

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8 space-y-6">
      {/* Prominent Room Code Header */}
      <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 backdrop-blur-md shadow-md dark:shadow-2xl text-center relative overflow-hidden transition-colors duration-300">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-100 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-full text-xs font-medium text-slate-600 dark:text-slate-400 mb-3 shadow-xs">
          <span>Mission Operations Center</span>
          <span aria-hidden="true">·</span>
          <span className="text-emerald-600 dark:text-emerald-400 font-mono font-bold">LOBBY</span>
        </div>

        <h2 className="text-xs uppercase tracking-widest font-semibold text-slate-500 dark:text-slate-400">
          Room Code
        </h2>

        {/* Big 5-Character Code */}
        <div className="mt-2 inline-flex items-center gap-3 bg-slate-50 dark:bg-slate-950/90 border border-slate-300 dark:border-slate-800/90 rounded-2xl px-6 py-3 shadow-inner">
          <span className="font-mono text-3xl sm:text-4xl font-extrabold tracking-[0.3em] text-emerald-600 dark:text-emerald-400">
            {room.code}
          </span>
          <button
            onClick={handleCopyCode}
            className="p-2.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 active:scale-95 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-transparent rounded-xl transition-all cursor-pointer shadow-xs"
            title="Copy Room Code"
          >
            {copied ? (
              <Check className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <Copy className="w-5 h-5" />
            )}
          </button>
        </div>

        {copied && (
          <p className="mt-2 text-xs font-medium text-emerald-600 dark:text-emerald-400 animate-fade-in">
            Room Code copied to clipboard!
          </p>
        )}

        <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
          Share this 5-character code with other players to join the lobby.
        </p>

        {/* Host Status Indicators */}
        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800/60 flex flex-wrap items-center justify-center gap-4 text-xs">
          <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
            <span className="text-slate-400 dark:text-slate-500">Host:</span>
            <span className="font-semibold text-amber-600 dark:text-amber-400">{room.hostUsername}</span>
          </div>
          <span className="text-slate-300 dark:text-slate-700">|</span>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 dark:text-slate-500">Joining Status:</span>
            <span
              className={`font-semibold ${
                room.isOpenJoining ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {room.isOpenJoining ? 'Open to New Players' : 'Joining Locked'}
            </span>
          </div>
        </div>
      </div>

      {/* Error Notice */}
      {errorMsg && (
        <div className="flex items-start gap-2.5 p-4 bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800/80 rounded-xl text-red-700 dark:text-red-200 text-xs">
          <AlertCircle className="w-4 h-4 text-red-500 dark:text-red-400 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Host Controls Panel: Role Assignment & Secret Word */}
      {isHost ? (
        <div className="bg-white dark:bg-slate-900/70 border border-amber-300 dark:border-amber-900/40 rounded-2xl p-6 backdrop-blur-md shadow-md dark:shadow-xl space-y-6 transition-colors duration-300">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-amber-500" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider font-mono">
                Host Mission Configuration
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleToggleJoining}
                className="py-1.5 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {room.isOpenJoining ? (
                  <>
                    <Lock className="w-3.5 h-3.5 text-rose-500" />
                    <span>Stop Joining</span>
                  </>
                ) : (
                  <>
                    <Unlock className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Open Joining</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleCloseRoom}
                className="py-1.5 px-3 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/60 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800/50 text-xs font-medium rounded-lg transition-colors cursor-pointer"
              >
                Close Room
              </button>
            </div>
          </div>

          {/* Secret Word Setup */}
          <div className="space-y-3">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Secret Word (Citizens see this, Spy does NOT)
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={secretWordInput}
                onChange={handleSecretWordChange}
                onBlur={handleApplySecretWord}
                placeholder="e.g. MANGO"
                className="flex-1 px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-mono font-bold tracking-widest text-slate-900 dark:text-white uppercase focus:outline-none focus:border-amber-500 transition-colors"
              />
            </div>

            {/* Quick Word Suggestions */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[11px] text-slate-500">Suggestions:</span>
              {WORD_SUGGESTIONS.map((w) => (
                <button
                  key={w}
                  type="button"
                  onClick={() => {
                    setSecretWordInput(w);
                    hostAction('SET_WORD', { word: w });
                  }}
                  className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded text-[11px] font-mono text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                >
                  {w}
                </button>
              ))}
            </div>
          </div>

          {/* Role Assignment helper */}
          <div className="pt-2 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Assign Player Roles
            </span>
            <button
              type="button"
              onClick={handleAutoAssignSpy}
              className="text-xs text-amber-600 dark:text-amber-400 hover:text-amber-500 flex items-center gap-1 font-medium transition-colors cursor-pointer"
            >
              <Dices className="w-3.5 h-3.5" />
              <span>Auto-Assign 1 Random Spy</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="p-4 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl text-center shadow-xs">
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Waiting for Host <span className="text-amber-600 dark:text-amber-400 font-bold">{room.hostUsername}</span>
            {room.secondHostUsername && (
              <> & 2nd Host <span className="text-purple-600 dark:text-purple-400 font-bold">{room.secondHostUsername}</span></>
            )}{' '}
            to configure secret roles and initiate the mission...
          </p>
        </div>
      )}

      {/* Players List Grid */}
      <div className="bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 backdrop-blur-md shadow-md dark:shadow-xl transition-colors duration-300">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
            <Users className="w-4 h-4 text-slate-400" />
            <span>Players in Lobby ({room.players.length})</span>
          </div>
          <div className="flex items-center gap-2">
            {room.secondHostUsername && (
              <span className="text-[10px] font-bold text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-950/60 border border-purple-300 dark:border-purple-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-purple-500" />
                2nd Host: {room.secondHostUsername}
              </span>
            )}
            <span className="text-[11px] text-slate-500">
              {room.players.length < 2 ? 'At least 2 players needed (Host directs)' : `${room.players.length} players ready`}
            </span>
          </div>
        </div>

        {room.players.length === 0 ? (
          <div className="py-10 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl space-y-2">
            <Users className="w-8 h-8 mx-auto text-slate-400 dark:text-slate-600" />
            <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
              Waiting for players to join...
            </p>
            <p className="text-[11px] text-slate-500">
              Share code <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">{room.code}</span> with players to enter this mission.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {room.players.map((p) => {
              const isTargetSecondHost = Boolean(p.isSecondHost || room.secondHostId === p.userId);
              const isTargetHost = p.isHost && !isTargetSecondHost;
              const isMe = p.userId === user?.id;

              return (
                <div
                  key={p.userId}
                  className={`p-4 rounded-xl border transition-all flex flex-col justify-between gap-3 ${
                    p.assignedRole === 'SPY' && isHost
                      ? 'bg-red-50 dark:bg-red-950/20 border-red-300 dark:border-red-800/60 shadow-sm'
                      : isTargetSecondHost
                      ? 'bg-purple-50/50 dark:bg-purple-950/20 border-purple-300 dark:border-purple-800/60 shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center font-mono font-bold text-xs ${
                          p.assignedRole === 'SPY' && isHost
                            ? 'bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400 border border-red-300 dark:border-red-800'
                            : isTargetSecondHost
                            ? 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-800'
                            : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {p.username.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-sm font-bold text-slate-900 dark:text-white">
                            {p.username}
                          </span>
                          {isMe && (
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">(You)</span>
                          )}
                          {isTargetSecondHost && (
                            <span className="text-[10px] font-bold text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-950/50 border border-purple-300 dark:border-purple-800/60 px-1.5 py-0.5 rounded flex items-center gap-1">
                              <ShieldCheck className="w-2.5 h-2.5 text-purple-500" />
                              2ND HOST
                            </span>
                          )}
                          {isTargetHost && (
                            <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800/60 px-1.5 py-0.5 rounded">
                              HOST
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-500">
                          {p.isOnline ? 'Online' : 'Reconnecting...'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {/* Host action: Make / Revoke 2nd Host */}
                      {isHost && (
                        <button
                          type="button"
                          onClick={() => handleToggleSecondHost(p.userId, !isTargetSecondHost)}
                          className={`px-2 py-1 text-[10px] font-bold tracking-wider rounded-lg border transition-all flex items-center gap-1 cursor-pointer active:scale-95 ${
                            isTargetSecondHost
                              ? 'bg-purple-100 hover:bg-purple-200 dark:bg-purple-950/80 dark:hover:bg-purple-900 text-purple-800 dark:text-purple-200 border-purple-300 dark:border-purple-700 shadow-xs'
                              : 'bg-white hover:bg-amber-50 dark:bg-slate-900 dark:hover:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-800/70 shadow-xs'
                          }`}
                          title={isTargetSecondHost ? 'Revoke 2nd Host privileges' : 'Appoint player as 2nd Host'}
                        >
                          <Shield className="w-3 h-3 text-amber-500" />
                          <span>{isTargetSecondHost ? 'REVOKE 2ND HOST' : 'MAKE 2ND HOST'}</span>
                        </button>
                      )}

                      {isHost && !isTargetHost && (
                        <button
                          onClick={() => handleRemovePlayer(p.userId)}
                          className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors cursor-pointer"
                          title="Kick player"
                        >
                          <UserX className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Host Role Controls for this player */}
                  {isHost && (
                    <div className="pt-2 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between">
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Role:</span>
                      <div className="flex items-center gap-1 p-0.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg">
                        <button
                          type="button"
                          onClick={() => handleRoleChange(p.userId, 'PLAYER')}
                          className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                            p.assignedRole !== 'SPY'
                              ? 'bg-emerald-600 text-white shadow-sm'
                              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                          }`}
                        >
                          PLAYER
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRoleChange(p.userId, 'SPY')}
                          className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                            p.assignedRole === 'SPY'
                              ? 'bg-red-600 text-white shadow-sm'
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
            className="w-full sm:w-auto py-4 px-8 bg-gradient-to-r from-red-600 via-rose-600 to-amber-500 hover:from-red-500 hover:to-amber-400 disabled:opacity-40 text-white font-black text-sm tracking-widest uppercase rounded-2xl shadow-lg dark:shadow-xl dark:shadow-red-950/40 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
          >
            <Play className="w-5 h-5 fill-current" />
            <span>{isStarting ? 'STARTING MISSION...' : 'CONFIRM & START GAME'}</span>
          </button>
        </div>
      )}
    </div>
  );
}
