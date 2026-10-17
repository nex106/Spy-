import React, { useState } from 'react';
import { AlertTriangle, RotateCcw, Check, X } from 'lucide-react';
import { useGame } from '../context/GameContext.js';
import { isUserHostOrCoHost } from '../utils/hostUtils.js';

export function TieResultView() {
  const { room, user, hostAction, castVote } = useGame();
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!room) return null;

  const isHost = isUserHostOrCoHost(user, room);
  const me = room.players.find((p) => p.userId === user?.id);
  const hasVoted = me?.hasVoted;
  const tieCandidates = room.tieCandidates || [];

  const handleStartTiebreaker = async () => {
    if (!isHost) return;
    await hostAction('START_TIEBREAKER');
  };

  const handleSelectCandidate = (candidateId: string) => {
    if (hasVoted || me?.isDisqualified || candidateId === user?.id || isHost) return;
    setSelectedCandidateId(candidateId);
  };

  const handleConfirmVote = async () => {
    if (!selectedCandidateId) return;
    setIsSubmitting(true);
    await castVote(selectedCandidateId);
    setIsSubmitting(false);
  };

  const candidatePlayers = room.players.filter((p) => tieCandidates.includes(p.userId));

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800/80 rounded-2xl p-6 sm:p-8 text-center backdrop-blur-md shadow-md dark:shadow-2xl space-y-4 transition-colors duration-300">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-100 dark:bg-amber-950 border border-amber-400 dark:border-amber-600/80 flex items-center justify-center text-amber-600 dark:text-amber-400">
          <AlertTriangle className="w-8 h-8" />
        </div>

        <h1 className="text-3xl sm:text-4xl font-black font-mono tracking-tight text-amber-700 dark:text-amber-300 uppercase">
          TIEBREAKER ROUND REQUIRED
        </h1>

        <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 max-w-md mx-auto">
          The vote has resulted in a deadlock! The following candidates are tied for the highest number of suspicion votes:
        </p>

        {/* Tied Candidates List */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-md mx-auto pt-2">
          {candidatePlayers.map((p) => {
            const isSelected = selectedCandidateId === p.userId;
            const isMe = p.userId === user?.id;

            return (
              <div
                key={p.userId}
                onClick={() => !isMe && !hasVoted && !isHost && handleSelectCandidate(p.userId)}
                className={`p-4 rounded-xl border text-left transition-all ${
                  isMe || isHost
                    ? 'border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950/40 opacity-50 cursor-not-allowed'
                    : isSelected
                    ? 'border-amber-500 bg-amber-100 dark:bg-amber-950/60 ring-2 ring-amber-400'
                    : hasVoted
                    ? 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60'
                    : 'border-amber-200 dark:border-amber-900/40 bg-white dark:bg-slate-900/80 hover:border-amber-400 cursor-pointer shadow-xs'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-white text-base">{p.username}</span>
                  {isSelected && !hasVoted && !isHost && (
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedCandidateId(null);
                        }}
                        className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        disabled={isSubmitting}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleConfirmVote();
                        }}
                        className="py-1 px-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-lg flex items-center gap-1 cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>VOTE</span>
                      </button>
                    </div>
                  )}
                </div>
                <span className="text-[11px] text-amber-600 dark:text-amber-400 font-mono">Tied Candidate</span>
              </div>
            );
          })}
        </div>

        {/* Who Voted for Whom in Previous Round */}
        {room.tieVoteAudit && room.tieVoteAudit.length > 0 && (
          <div className="mt-4 pt-4 border-t border-amber-200 dark:border-amber-900/60 text-left max-w-md mx-auto">
            <span className="text-[11px] uppercase tracking-wider text-amber-700 dark:text-amber-400 font-mono font-bold block mb-2">
              Who Voted For Whom (Deadlock Audit):
            </span>
            <div className="space-y-1.5 bg-white/70 dark:bg-slate-900/70 p-3 rounded-xl border border-amber-200/80 dark:border-amber-900/40">
              {room.tieVoteAudit.map((audit, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs py-1 border-b last:border-b-0 border-slate-100 dark:border-slate-800">
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{audit.voterUsername}</span>
                  <div className="flex items-center gap-1 text-[11px] text-slate-400">
                    <span>➔ voted for</span>
                    <span className="font-bold text-amber-600 dark:text-amber-400 font-mono">{audit.targetUsername}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {hasVoted && (
          <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium pt-2">
            ✓ Your tiebreaker vote has been cast. Waiting for resolution...
          </p>
        )}

        {/* Host Re-vote Button */}
        {isHost && (
          <div className="pt-6 border-t border-amber-200 dark:border-amber-900/60 flex justify-center">
            <button
              onClick={handleStartTiebreaker}
              className="py-3.5 px-6 bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 text-slate-950 font-black text-xs tracking-widest uppercase rounded-xl shadow-md dark:shadow-amber-950/40 flex items-center gap-2 cursor-pointer transition-all active:scale-95"
            >
              <RotateCcw className="w-4 h-4" />
              <span>START TIEBREAKER ROUND</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
