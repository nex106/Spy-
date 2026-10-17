import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Home, Trophy, Skull, Users, Shield, ArrowRight, Vote, CheckCircle2, XCircle } from 'lucide-react';
import { useGame } from '../context/GameContext.js';
import { isUserHostOrCoHost } from '../utils/hostUtils.js';

export function WinnerResultView() {
  const { room, leaveRoom, user } = useGame();

  if (!room || !room.winner) return null;

  const winner = room.winner;
  const isCitizenWin = winner.team === 'CITIZENS';
  const isHost = isUserHostOrCoHost(user, room);

  // Trigger confetti burst on victory
  useEffect(() => {
    try {
      const duration = 2.5 * 1000;
      const animationEnd = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: isCitizenWin ? ['#10B981', '#3B82F6', '#F59E0B'] : ['#EF4444', '#DC2626', '#991B1B'],
        });
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: isCitizenWin ? ['#10B981', '#3B82F6', '#F59E0B'] : ['#EF4444', '#DC2626', '#991B1B'],
        });

        if (Date.now() < animationEnd) {
          requestAnimationFrame(frame);
        }
      };
      frame();
    } catch {
      // Confetti fallback
    }
  }, [isCitizenWin]);

  const handleBackToHome = () => {
    leaveRoom();
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 sm:py-12 space-y-6">
      <div
        className={`rounded-3xl p-6 sm:p-10 border backdrop-blur-xl shadow-xl dark:shadow-2xl text-center space-y-6 relative overflow-hidden transition-colors duration-300 ${
          isCitizenWin
            ? 'bg-gradient-to-b from-emerald-50 via-white to-emerald-50/30 dark:from-emerald-950/40 dark:via-slate-900 dark:to-slate-950 border-emerald-300 dark:border-emerald-500/50 shadow-emerald-100 dark:shadow-emerald-950/30'
            : 'bg-gradient-to-b from-red-50 via-white to-red-50/30 dark:from-red-950/50 dark:via-slate-900 dark:to-slate-950 border-red-300 dark:border-red-600/60 shadow-red-100 dark:shadow-red-950/40'
        }`}
      >
        {/* Victory Emblem */}
        <div
          className={`w-20 h-20 mx-auto rounded-3xl flex items-center justify-center border shadow-lg ${
            isCitizenWin
              ? 'bg-emerald-100 dark:bg-emerald-950 border-emerald-300 dark:border-emerald-500 text-emerald-600 dark:text-emerald-400'
              : 'bg-red-100 dark:bg-red-950 border-red-300 dark:border-red-600 text-red-600 dark:text-red-400'
          }`}
        >
          {isCitizenWin ? (
            <Trophy className="w-10 h-10 animate-bounce-subtle" />
          ) : (
            <Skull className="w-10 h-10 animate-pulse" />
          )}
        </div>

        {/* Big Verdict Headline */}
        <div>
          <span
            className={`text-xs uppercase tracking-widest font-mono font-bold block mb-1.5 ${
              isCitizenWin ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
            }`}
          >
            Mission Debrief Complete
          </span>

          <h1
            className={`text-4xl sm:text-5xl md:text-6xl font-black font-mono tracking-tight uppercase ${
              isCitizenWin ? 'text-emerald-600 dark:text-emerald-300' : 'text-red-600 dark:text-red-500'
            }`}
          >
            {isCitizenWin ? 'CITIZENS WIN!' : 'SPY WINS!'}
          </h1>

          <p className="mt-3 text-sm sm:text-base text-slate-700 dark:text-slate-300 max-w-lg mx-auto font-sans leading-relaxed">
            {winner.reason}
          </p>
        </div>

        {/* Revealed Intel Box */}
        <div className="bg-white/90 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 text-left max-w-lg mx-auto space-y-4 shadow-sm transition-colors duration-300">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
            <span className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold">
              The Impostor Spy Was:
            </span>
            <span className="text-base font-mono font-extrabold text-red-600 dark:text-red-400">
              {winner.spyUsername}
            </span>
          </div>

          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
            <span className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold">
              Secret Word Was:
            </span>
            <span className="text-base font-mono font-extrabold text-emerald-600 dark:text-emerald-400">
              {room.secretWord || room.myWord || 'CLASSIFIED'}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold">
              Total Ballots Cast:
            </span>
            <span className="text-sm font-mono font-bold text-slate-900 dark:text-white">
              {winner.totalVotes} Votes
            </span>
          </div>

          {/* Vote Counts Breakdown */}
          {winner.voteCounts && (
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800/80 space-y-2">
              <span className="text-[11px] uppercase tracking-wider text-slate-500 font-mono block">
                Tally Breakdown
              </span>
              <div className="space-y-1.5">
                {Object.entries(winner.voteCounts).map(([uid, item]) => (
                  <div key={uid} className="flex items-center justify-between text-xs">
                    <span className="text-slate-800 dark:text-slate-300 font-medium">
                      {item.username}
                      {item.username === winner.spyUsername && (
                        <span className="text-red-600 dark:text-red-400 font-mono text-[10px] ml-1.5 font-bold">
                          (Spy)
                        </span>
                      )}
                    </span>
                    <span className="text-slate-500 dark:text-slate-400 font-mono tabular-nums">
                      {item.count} {item.count === 1 ? 'vote' : 'votes'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* WHO VOTED FOR WHOM - PROMINENT BALLOT AUDIT */}
        <div className="bg-white/95 dark:bg-slate-950/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 text-left max-w-lg mx-auto space-y-3 shadow-md transition-colors duration-300">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Vote className="w-4 h-4 text-red-500" />
              <span className="text-xs uppercase tracking-wider text-slate-900 dark:text-white font-mono font-bold">
                WHO VOTED FOR WHOM
              </span>
            </div>
            <span className="text-[10px] font-mono text-slate-500">
              Verified Ballot Records
            </span>
          </div>

          {winner.voteAudit && winner.voteAudit.length > 0 ? (
            <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {winner.voteAudit.map((vote, index) => {
                const isTargetSpy = vote.targetUsername === winner.spyUsername;
                return (
                  <div key={index} className="py-2.5 flex items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-bold text-slate-900 dark:text-slate-100 truncate">
                        {vote.voterUsername}
                      </span>
                      <span className="text-slate-400 dark:text-slate-500 text-[11px] shrink-0">
                        ➔ voted for
                      </span>
                      <span
                        className={`font-mono font-bold truncate ${
                          isTargetSpy
                            ? 'text-red-600 dark:text-red-400'
                            : 'text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {vote.targetUsername}
                      </span>
                    </div>

                    <div className="shrink-0 flex items-center gap-1">
                      {isTargetSpy ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                          <span>Caught Spy</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-2 py-0.5 rounded-full">
                          <XCircle className="w-3 h-3 text-slate-400" />
                          <span>Citizen</span>
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-4 text-center text-xs text-slate-400">
              No ballots were recorded in this match.
            </div>
          )}
        </div>

        {/* Navigation Action */}
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={handleBackToHome}
            className="w-full sm:w-auto py-3.5 px-8 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-black text-xs tracking-widest uppercase rounded-xl shadow-xl shadow-red-950/40 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
          >
            <Home className="w-4 h-4" />
            <span>BACK TO HOME</span>
          </button>
        </div>
      </div>
    </div>
  );
}
