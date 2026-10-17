import React, { useState } from 'react';
import {
  Check,
  X,
  Shield,
  Vote,
  AlertCircle,
} from 'lucide-react';
import { useGame } from '../context/GameContext.js';
import { isUserHostOrCoHost } from '../utils/hostUtils.js';

export function VotingView() {
  const { room, user, castVote, hostAction } = useGame();
  const [selectedTargetId, setSelectedTargetId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!room) return null;

  const isHost = isUserHostOrCoHost(user, room);
  const me = room.players.find((p) => p.userId === user?.id);
  const hasVoted = me?.hasVoted;
  const isDisqualified = me?.isDisqualified;

  // Eligible targets: all players in room except yourself (and non-disqualified)
  const eligibleCandidates = room.players.filter((p) => !p.isDisqualified);
  const totalVotes = room.totalVotesCast || 0;
  const totalEligible = room.eligibleVotersCount || eligibleCandidates.length;

  const handleSelectCandidate = (candidateId: string) => {
    if (hasVoted || isDisqualified) return;
    if (candidateId === user?.id) {
      setErrorMsg('You cannot vote for yourself!');
      return;
    }
    setErrorMsg(null);
    setSelectedTargetId(candidateId);
  };

  const handleCancelSelection = () => {
    setSelectedTargetId(null);
  };

  const handleConfirmVote = async () => {
    if (!selectedTargetId) return;
    setIsSubmitting(true);
    setErrorMsg(null);
    const result = await castVote(selectedTargetId);
    setIsSubmitting(false);

    if (!result.success) {
      setErrorMsg(result.error || 'Failed to submit vote');
    }
  };

  const handleHostCloseVoting = async () => {
    if (!isHost) return;
    if (!confirm('Close voting now and calculate results based on current votes?')) return;
    await hostAction('CLOSE_VOTING');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8 space-y-6">
      {/* Title Header */}
      <div className="text-center py-6 bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl backdrop-blur-md shadow-md dark:shadow-2xl relative overflow-hidden transition-colors duration-300">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-100 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-full text-xs font-medium text-slate-600 dark:text-slate-400 mb-2 shadow-xs">
          <Vote className="w-3.5 h-3.5 text-red-500" />
          <span>Final Verdict</span>
          <span aria-hidden="true">·</span>
          <span className="text-red-600 dark:text-red-400 font-mono font-bold">CONFIDENTIAL POLL</span>
        </div>

        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black font-mono tracking-tight uppercase bg-clip-text text-transparent bg-gradient-to-r from-red-600 via-rose-500 to-amber-500">
          WHO IS THE SPY?
        </h1>
        <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto">
          Cast your vote for the agent you believe is the impostor. Votes are secret until all votes are cast.
        </p>

        {/* Voting Progress */}
        <div className="mt-5 max-w-xs mx-auto">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-mono mb-1.5">
            <span>Votes Submitted:</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400">
              {totalVotes} / {totalEligible}
            </span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-200 dark:border-slate-800">
            <div
              className="bg-gradient-to-r from-red-600 to-amber-500 h-full transition-all duration-300"
              style={{
                width: `${totalEligible > 0 ? (totalVotes / totalEligible) * 100 : 0}%`,
              }}
            />
          </div>
        </div>

        {/* Host Early Close */}
        {isHost && (
          <div className="mt-5 pt-4 border-t border-slate-200 dark:border-slate-800/80">
            <button
              onClick={handleHostCloseVoting}
              className="py-2 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-300 dark:border-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
            >
              Force Close Voting & Declare Results
            </button>
          </div>
        )}
      </div>

      {/* Error Banner */}
      {errorMsg && (
        <div className="flex items-start gap-2.5 p-4 bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800/80 rounded-xl text-red-700 dark:text-red-200 text-xs">
          <AlertCircle className="w-4 h-4 text-red-500 dark:text-red-400 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Vote State Banner */}
      {isHost ? (
        <div className="p-5 bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800/60 rounded-2xl text-center space-y-1.5 backdrop-blur-md shadow-xs transition-colors duration-300">
          <div className="flex items-center justify-center gap-2 text-amber-700 dark:text-amber-300 font-bold text-sm font-mono uppercase">
            <Shield className="w-4 h-4" />
            <span>Host Director · Supervising Vote</span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            You do not vote as the Host. Watch the ballot progress or force-close voting once deliberation is concluded.
          </p>
        </div>
      ) : hasVoted ? (
        <div className="p-6 bg-white dark:bg-slate-900/60 border border-emerald-300 dark:border-emerald-800/60 rounded-2xl text-center space-y-2 backdrop-blur-md shadow-md dark:shadow-xl transition-colors duration-300">
          <div className="w-12 h-12 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-400 dark:border-emerald-600 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <Check className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white uppercase tracking-wider font-mono">
            VOTE SUBMITTED & ENCRYPTED
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Your vote has been cast. Waiting for the remaining agents to finalize their choice...
          </p>
        </div>
      ) : isDisqualified ? (
        <div className="p-6 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 rounded-2xl text-center space-y-2">
          <h3 className="text-sm font-bold text-red-700 dark:text-red-300 font-mono">
            DISQUALIFIED FROM VOTING
          </h3>
          <p className="text-xs text-red-600 dark:text-red-200/80">
            You were disqualified by the host and cannot participate in this poll.
          </p>
        </div>
      ) : null}

      {/* Candidate Cards Grid */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider font-mono">
          Select Candidate Card
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {eligibleCandidates.map((p) => {
            const isMe = p.userId === user?.id;
            const isSelected = selectedTargetId === p.userId;

            return (
              <div
                key={p.userId}
                onClick={() => !isMe && !hasVoted && !isHost && handleSelectCandidate(p.userId)}
                className={`p-5 rounded-2xl border transition-all relative flex flex-col justify-between gap-4 ${
                  isMe || isHost
                    ? 'border-slate-200 dark:border-slate-800/50 bg-slate-100 dark:bg-slate-950/30 opacity-70 cursor-not-allowed'
                    : isSelected
                    ? 'border-red-500 bg-red-50 dark:bg-red-950/30 shadow-lg ring-2 ring-red-500 scale-[1.02]'
                    : hasVoted
                    ? 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 opacity-70'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 hover:border-slate-300 dark:hover:border-slate-600 cursor-pointer active:scale-[0.98] shadow-xs'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center font-mono font-bold text-sm ${
                        isSelected
                          ? 'bg-red-600 text-white'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {p.username.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <span className="text-base font-bold text-slate-900 dark:text-white block">
                        {p.username}
                      </span>
                      {isMe ? (
                        <span className="text-[10px] text-slate-500 font-mono">
                          (Self · Ineligible)
                        </span>
                      ) : isHost ? (
                        <span className="text-[10px] text-slate-500 font-mono">
                          (Contestant)
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-500 dark:text-slate-400">Suspect</span>
                      )}
                      {p.hasVoted && (
                        <span className="inline-flex items-center text-[10px] text-emerald-600 dark:text-emerald-400 font-mono font-semibold bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800 mt-0.5">
                          ✓ Voted
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Confirm / Cancel Icons when highlighted */}
                {isSelected && !hasVoted && !isHost && (
                  <div className="pt-3 border-t border-red-200 dark:border-red-800/80 flex items-center justify-end gap-2 animate-fade-in">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCancelSelection();
                      }}
                      className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl transition-colors cursor-pointer"
                      title="Cancel Selection"
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
                      className="py-2 px-4 bg-red-600 hover:bg-red-500 active:scale-95 text-white font-bold text-xs rounded-xl shadow-md dark:shadow-red-950/50 flex items-center gap-1.5 transition-all cursor-pointer"
                      title="Confirm Vote"
                    >
                      <Check className="w-4 h-4" />
                      <span>{isSubmitting ? 'VOTING...' : 'CONFIRM VOTE'}</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
