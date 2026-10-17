import React, { useState } from 'react';
import {
  MessageSquare,
  Send,
  Shield,
  UserCheck,
  UserX,
  AlertCircle,
  Eye,
  History,
  CheckCircle,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { useGame } from '../context/GameContext.js';
import { isUserHostOrCoHost } from '../utils/hostUtils.js';

interface RoundHintsViewProps {
  roundNumber: number; // 1, 2, 3
}

export function RoundHintsView({ roundNumber }: RoundHintsViewProps) {
  const { room, user, hostAction, submitHint } = useGame();
  const [hintInput, setHintInput] = useState('');
  const [isSubmittingHint, setIsSubmittingHint] = useState(false);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [showHistoryDrawer, setShowHistoryDrawer] = useState(false);

  if (!room) return null;

  const isHost = isUserHostOrCoHost(user, room);
  const isMyTurn = room.activeHintTurnUserId === user?.id;
  const me = room.players.find((p) => p.userId === user?.id);

  // Filter hints for current round
  const currentRoundHints = room.hints.filter((h) => h.round === roundNumber);
  const previousHints = room.hints.filter((h) => h.round < roundNumber);

  // Active / eligible players
  const eligiblePlayers = room.players.filter((p) => !p.isDisqualified);
  const allHintsSubmitted =
    eligiblePlayers.length > 0 &&
    eligiblePlayers.every((p) => p.hasSubmittedHintCurrentRound);

  const handleSelectPlayerCard = (playerId: string) => {
    if (!isHost) return;
    if (selectedPlayerId === playerId) {
      setSelectedPlayerId(null);
    } else {
      setSelectedPlayerId(playerId);
    }
  };

  const handleOpenHintBox = async () => {
    if (!isHost || !selectedPlayerId) return;
    await hostAction('SELECT_HINT_PLAYER', { targetUserId: selectedPlayerId });
  };

  const handleDeselect = async () => {
    if (!isHost) return;
    setSelectedPlayerId(null);
    await hostAction('SELECT_HINT_PLAYER', { targetUserId: null });
  };

  const handleNextPlayer = async () => {
    if (!isHost) return;
    // Find next player who hasn't submitted
    const unsubmitted = eligiblePlayers.filter((p) => !p.hasSubmittedHintCurrentRound);
    if (unsubmitted.length > 0) {
      const nextP = unsubmitted[0];
      setSelectedPlayerId(nextP.userId);
      await hostAction('SELECT_HINT_PLAYER', { targetUserId: nextP.userId });
    }
  };

  const handleMarkSubmitted = async (targetUserId: string) => {
    if (!isHost) return;
    await hostAction('MARK_HINT_SUBMITTED', { targetUserId });
  };

  const handleToggleDisqualification = async (targetUserId: string, currentlyDisqualified: boolean) => {
    if (!isHost) return;
    await hostAction('SET_DISQUALIFICATION', {
      targetUserId,
      disqualified: !currentlyDisqualified,
    });
  };

  const handleSubmitMyHint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hintInput.trim()) return;

    setIsSubmittingHint(true);
    const result = await submitHint(hintInput.trim());
    setIsSubmittingHint(false);

    if (result.success) {
      setHintInput('');
    } else {
      alert(result.error || 'Failed to submit hint');
    }
  };

  const handleStartDiscussionManual = async () => {
    if (!isHost) return;
    const nextDiscussionPhase =
      roundNumber === 1
        ? 'ROUND_1_DISCUSSION'
        : roundNumber === 2
        ? 'ROUND_2_DISCUSSION'
        : 'ROUND_3_DISCUSSION';
    await hostAction('TRIGGER_PHASE', { phase: nextDiscussionPhase });
  };

  const roundTitles: Record<number, string> = {
    1: 'ROUND ONE',
    2: 'ROUND TWO',
    3: 'ROUND THREE',
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 sm:py-8 space-y-6">
      {/* Animated Round Title Banner */}
      <div className="text-center py-5 bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl backdrop-blur-md shadow-md dark:shadow-xl relative overflow-hidden transition-colors duration-300">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-100 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-full text-xs font-medium text-slate-600 dark:text-slate-400 mb-2 shadow-xs">
          <span>Tactical Intel Phase</span>
          <span aria-hidden="true">·</span>
          <span className="text-amber-600 dark:text-amber-400 font-mono font-bold">HINT SUBMISSION</span>
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black font-mono tracking-tight uppercase bg-clip-text text-transparent bg-gradient-to-r from-red-600 via-rose-500 to-amber-500">
          {roundTitles[roundNumber] || `ROUND ${roundNumber}`}
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
          Players take turns submitting hints. Give clues without exposing the word to the Spy!
        </p>

        {/* Private Role Display Banner */}
        <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800/80 max-w-lg mx-auto px-4">
          {isHost ? (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800/80 rounded-xl text-center">
              <span className="block text-xs uppercase tracking-wider text-amber-700 dark:text-amber-300 font-bold mb-0.5">
                HOST GAME DIRECTOR · SECRET WORD
              </span>
              <span className="font-mono text-xl sm:text-2xl font-black tracking-widest text-amber-600 dark:text-amber-400">
                {room.secretWord || 'CLASSIFIED'}
              </span>
              <p className="mt-1 text-[11px] text-amber-700/80 dark:text-amber-300/80">
                You are directing the mission. Select players to open their hint boxes and manage rounds.
              </p>
            </div>
          ) : room.myRole === 'SPY' ? (
            <div className="p-3 bg-red-50 dark:bg-red-950/50 border border-red-300 dark:border-red-800/80 rounded-xl text-center">
              <span className="block text-xs uppercase tracking-wider text-red-700 dark:text-red-300 font-bold mb-0.5">
                CLASSIFIED STATUS
              </span>
              <span className="font-mono text-xl sm:text-2xl font-black tracking-widest text-red-600 dark:text-red-400">
                YOU ARE THE SPY
              </span>
              <p className="mt-1 text-[11px] text-red-700/80 dark:text-red-300/80">
                You do not know the Secret Word. Analyze hints, blend in, and survive the vote!
              </p>
            </div>
          ) : room.myRole === 'PLAYER' ? (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800/80 rounded-xl text-center">
              <span className="block text-xs uppercase tracking-wider text-emerald-700 dark:text-emerald-300 font-bold mb-0.5">
                YOUR SECRET WORD
              </span>
              <span className="font-mono text-xl sm:text-2xl font-black tracking-widest text-emerald-600 dark:text-emerald-400">
                {room.myWord || 'CLASSIFIED'}
              </span>
              <p className="mt-1 text-[11px] text-emerald-700/80 dark:text-emerald-300/80">
                The Spy does NOT know this word. Craft clever hints to prove you know it!
              </p>
            </div>
          ) : null}
        </div>
      </div>

      {/* Selected Player's Active Hint Submission Box */}
      {isMyTurn && !me?.hasSubmittedHintCurrentRound && !me?.isDisqualified && (
        <div className="p-6 bg-gradient-to-br from-amber-50 dark:from-amber-950/50 via-white dark:via-slate-900 to-slate-50 dark:to-slate-950 border-2 border-amber-500 rounded-2xl shadow-xl dark:shadow-2xl animate-pulse-subtle transition-colors duration-300">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-5 h-5 text-amber-500 dark:text-amber-400" />
            <h2 className="text-base sm:text-lg font-bold text-amber-700 dark:text-amber-300 uppercase tracking-wider font-mono">
              IT IS YOUR TURN TO SUBMIT A HINT!
            </h2>
          </div>
          <p className="text-xs text-slate-700 dark:text-slate-300 mb-4">
            Type your hint below. There is no word limit; be subtle, crafty, and informative.
          </p>

          <form onSubmit={handleSubmitMyHint} className="space-y-3">
            <textarea
              value={hintInput}
              onChange={(e) => setHintInput(e.target.value)}
              placeholder="e.g., It can be eaten and may taste sweet, often found in tropical climates..."
              rows={3}
              autoFocus
              className="w-full p-4 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
            />
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSubmittingHint || !hintInput.trim()}
                className="py-3 px-6 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 font-black text-xs tracking-widest uppercase rounded-xl transition-all shadow-md dark:shadow-amber-950/40 flex items-center gap-2 cursor-pointer active:scale-95"
              >
                <Send className="w-4 h-4" />
                <span>{isSubmittingHint ? 'SENDING...' : 'SEND HINT'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Host Controls Section */}
      {isHost && (
        <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-md dark:shadow-xl space-y-4 transition-colors duration-300">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-amber-500 dark:text-amber-400" />
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider font-mono">
                Host Hint Turn Director
              </h3>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {selectedPlayerId && (
                <>
                  <button
                    onClick={handleOpenHintBox}
                    className="py-1.5 px-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg transition-colors cursor-pointer"
                  >
                    OPEN HINT BOX
                  </button>
                  <button
                    onClick={handleDeselect}
                    className="py-1.5 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs rounded-lg transition-colors cursor-pointer"
                  >
                    Cancel Selection
                  </button>
                </>
              )}
              <button
                onClick={handleNextPlayer}
                className="py-1.5 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs rounded-lg transition-colors cursor-pointer flex items-center gap-1"
              >
                <span>Next Unsubmitted</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Click any player card below to select them. Then click &quot;OPEN HINT BOX&quot; to prompt their turn.
          </p>
        </div>
      )}

      {/* Active Players Cards Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider font-mono">
            Active Players & Hint Status
          </h3>
          <span className="text-[11px] text-slate-500">
            {eligiblePlayers.filter((p) => p.hasSubmittedHintCurrentRound).length} /{' '}
            {eligiblePlayers.length} Submitted
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {room.players.map((p) => {
            const isSelected = selectedPlayerId === p.userId;
            const isTurnActive = room.activeHintTurnUserId === p.userId;
            const hasSubmitted = p.hasSubmittedHintCurrentRound;
            const isDisqualified = p.isDisqualified;

            return (
              <div
                key={p.userId}
                onClick={() => isHost && handleSelectPlayerCard(p.userId)}
                className={`p-4 rounded-xl border transition-all ${
                  isHost ? 'cursor-pointer' : ''
                } ${
                  isSelected
                    ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/20 shadow-md ring-1 ring-amber-400'
                    : isTurnActive
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 shadow-sm animate-pulse-subtle'
                    : hasSubmitted
                    ? 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60'
                    : isDisqualified
                    ? 'border-red-200 dark:border-red-900/40 bg-red-50 dark:bg-red-950/10 opacity-60'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/70 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded bg-slate-200 dark:bg-slate-800 flex items-center justify-center font-mono font-bold text-xs text-slate-800 dark:text-slate-200">
                      {p.username.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <span className="text-sm font-bold text-slate-900 dark:text-white block">
                        {p.username}
                      </span>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div>
                    {isDisqualified ? (
                      <span className="text-[10px] text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-950/60 border border-red-300 dark:border-red-800/60 px-1.5 py-0.5 rounded">
                        DISQUALIFIED
                      </span>
                    ) : hasSubmitted ? (
                      <span className="text-[10px] text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800/60 px-1.5 py-0.5 rounded flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        SUBMITTED
                      </span>
                    ) : isTurnActive ? (
                      <span className="text-[10px] text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800/60 px-1.5 py-0.5 rounded animate-pulse">
                        WRITING...
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-1.5 py-0.5 rounded">
                        WAITING
                      </span>
                    )}
                  </div>
                </div>

                {/* Host Card Actions */}
                {isHost && (
                  <div className="mt-3 pt-2.5 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between text-xs">
                    {!hasSubmitted && !isDisqualified && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMarkSubmitted(p.userId);
                        }}
                        className="text-[10px] text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer"
                      >
                        Mark Submitted
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleDisqualification(p.userId, isDisqualified);
                      }}
                      className={`text-[10px] ml-auto transition-colors cursor-pointer ${
                        isDisqualified
                          ? 'text-emerald-600 dark:text-emerald-400 hover:text-emerald-500'
                          : 'text-red-600 dark:text-red-400 hover:text-red-500'
                      }`}
                    >
                      {isDisqualified ? 'Undo Disqualify' : 'Disqualify'}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Submitted Hints Feed */}
      <div className="bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 backdrop-blur-md shadow-md dark:shadow-xl space-y-4 transition-colors duration-300">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider font-mono">
            <MessageSquare className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Round {roundNumber} Submissions Feed ({currentRoundHints.length})</span>
          </div>

          {previousHints.length > 0 && (
            <button
              onClick={() => setShowHistoryDrawer(!showHistoryDrawer)}
              className="text-xs text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <History className="w-3.5 h-3.5" />
              <span>{showHistoryDrawer ? 'Hide Previous Hints' : 'View Previous Hints'}</span>
            </button>
          )}
        </div>

        {/* Previous Hints collapsible */}
        {showHistoryDrawer && previousHints.length > 0 && (
          <div className="p-4 bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 rounded-xl space-y-3">
            <h4 className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider font-mono">
              Intel Archive (Rounds 1–{roundNumber - 1})
            </h4>
            <div className="divide-y divide-slate-200 dark:divide-slate-800/80 space-y-2">
              {previousHints.map((ph) => (
                <div key={ph.id} className="pt-2 text-xs">
                  <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
                    <span className="font-semibold text-slate-800 dark:text-slate-300">
                      {ph.username}{' '}
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                        (Round {ph.round})
                      </span>
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">
                      {new Date(ph.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <p className="text-slate-700 dark:text-slate-300 italic">{ph.content}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Current Round Hints List */}
        {currentRoundHints.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400 dark:text-slate-500">
            No hints submitted for Round {roundNumber} yet. Awaiting players...
          </div>
        ) : (
          <div className="space-y-3">
            {currentRoundHints.map((hint) => (
              <div
                key={hint.id}
                className="p-4 bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 rounded-xl space-y-1.5"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-amber-700 dark:text-amber-300">{hint.username}</span>
                  <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">
                    {new Date(hint.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <p className="text-sm text-slate-800 dark:text-slate-100 leading-relaxed font-sans">
                  {hint.content}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Discussion Trigger Button */}
        {(allHintsSubmitted || isHost) && (
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end">
            <button
              onClick={handleStartDiscussionManual}
              className="py-3 px-6 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs tracking-wider rounded-xl shadow-md dark:shadow-emerald-950/40 transition-all flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <MessageSquare className="w-4 h-4" />
              <span>START GROUP DISCUSSION</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
