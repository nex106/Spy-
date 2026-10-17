import React, { useEffect, useRef, useState } from 'react';
import {
  Clock,
  MessageSquare,
  Pause,
  Play,
  Plus,
  Minus,
  Send,
  Shield,
  Square,
  AlertTriangle,
  History,
} from 'lucide-react';
import { useGame } from '../context/GameContext.js';
import { isUserHostOrCoHost } from '../utils/hostUtils.js';

interface RoundDiscussionViewProps {
  roundNumber: number; // 1, 2, 3
}

export function RoundDiscussionView({ roundNumber }: RoundDiscussionViewProps) {
  const { room, user, hostAction, sendRoomChat, roomChat } = useGame();
  const [inputText, setInputText] = useState('');
  const chatBottomRef = useRef<HTMLDivElement>(null);

  if (!room) return null;

  const isHost = isUserHostOrCoHost(user, room);
  const isFinalDiscussion = roundNumber === 3;
  const timerExpired = room.timerSecondsRemaining <= 0;

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [roomChat]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || timerExpired) return;
    sendRoomChat(inputText);
    setInputText('');
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleTimerAction = async (timerAction: 'ADD' | 'SUB' | 'PAUSE' | 'RESUME' | 'END') => {
    if (!isHost) return;
    await hostAction('TIMER_ADJUST', { timerAction });
  };

  const hintsSoFar = room.hints;

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 sm:py-8 space-y-6">
      {/* Header with Server Synced Timer */}
      <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 backdrop-blur-md shadow-md dark:shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6 transition-colors duration-300">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-100 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-full text-xs font-medium text-slate-600 dark:text-slate-400 mb-2 shadow-xs">
            <span>Room Frequency #{room.code}</span>
            <span aria-hidden="true">·</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-mono font-bold">
              {isFinalDiscussion ? 'FINAL DELIBERATION' : 'GROUP DEBATE'}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-slate-900 dark:text-white uppercase">
            ROUND {roundNumber} DISCUSSION
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            Debate the submitted clues. When time runs out, {isFinalDiscussion ? 'the Voting Poll will open' : `Round ${roundNumber + 1} begins`}!
          </p>
        </div>

        {/* Big Synced Countdown Timer */}
        <div className="flex flex-col items-center">
          <div
            className={`px-6 py-3 rounded-2xl border flex items-center gap-3 shadow-inner ${
              timerExpired
                ? 'bg-red-50 dark:bg-red-950/40 border-red-300 dark:border-red-800 text-red-600 dark:text-red-400'
                : room.timerSecondsRemaining <= 15
                ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-600 dark:text-amber-400 animate-pulse'
                : 'bg-slate-100 dark:bg-slate-950/90 border-slate-300 dark:border-slate-800 text-emerald-600 dark:text-emerald-400'
            }`}
          >
            <Clock className="w-6 h-6 shrink-0" />
            <span className="font-mono text-3xl sm:text-4xl font-extrabold tracking-wider tabular-nums">
              {formatTimer(room.timerSecondsRemaining)}
            </span>
          </div>
          <span className="text-[10px] text-slate-500 font-mono mt-1">
            {room.timerIsRunning ? 'SYNCHRONIZED LIVE' : 'TIMER PAUSED'}
          </span>
        </div>
      </div>

      {/* Host Timer Controls */}
      {isHost && (
        <div className="bg-slate-50 dark:bg-slate-950/80 border border-amber-300 dark:border-amber-900/40 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-xs transition-colors duration-300">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-amber-500" />
            <span className="text-xs font-bold text-amber-700 dark:text-amber-300 font-mono uppercase">
              Host Timer Command
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleTimerAction(room.timerIsRunning ? 'PAUSE' : 'RESUME')}
              className="py-1.5 px-3 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-transparent text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            >
              {room.timerIsRunning ? (
                <>
                  <Pause className="w-3.5 h-3.5" />
                  <span>Pause</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" />
                  <span>Resume</span>
                </>
              )}
            </button>
            <button
              onClick={() => handleTimerAction('ADD')}
              className="py-1.5 px-3 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-transparent text-xs font-semibold rounded-lg flex items-center gap-1 transition-colors cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+30s</span>
            </button>
            <button
              onClick={() => handleTimerAction('SUB')}
              className="py-1.5 px-3 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-transparent text-xs font-semibold rounded-lg flex items-center gap-1 transition-colors cursor-pointer shadow-xs"
            >
              <Minus className="w-3.5 h-3.5" />
              <span>-30s</span>
            </button>
            <button
              onClick={() => handleTimerAction('END')}
              className="py-1.5 px-3 bg-red-100 dark:bg-red-950/60 hover:bg-red-200 dark:hover:bg-red-900 text-red-700 dark:text-red-300 border border-red-300 dark:border-red-800/60 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Square className="w-3 h-3 fill-current" />
              <span>End Timer</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Discussion Layout: Left Clues Drawer, Right Live Chat */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Hints Sidebar */}
        <div className="lg:col-span-1 bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex flex-col max-h-[550px] overflow-hidden shadow-sm dark:shadow-xl transition-colors duration-300">
          <div className="flex items-center gap-2 pb-3 mb-3 border-b border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider font-mono">
            <History className="w-4 h-4 text-amber-500" />
            <span>Clue Dossier ({hintsSoFar.length})</span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {hintsSoFar.length === 0 ? (
              <p className="text-xs text-slate-400 dark:text-slate-500 py-6 text-center">No hints recorded.</p>
            ) : (
              hintsSoFar.map((h) => (
                <div
                  key={h.id}
                  className="p-3 bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800/80 rounded-xl space-y-1"
                >
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-amber-700 dark:text-amber-300">{h.username}</span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                      R{h.round} ·{' '}
                      {new Date(h.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-sans">{h.content}</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Shared Chat Box */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col overflow-hidden shadow-md dark:shadow-xl max-h-[550px] min-h-[400px] transition-colors duration-300">
          {/* Chat Header */}
          <div className="px-5 py-3.5 bg-slate-50 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-800 dark:text-slate-200 font-mono">
              <MessageSquare className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>ROUND {roundNumber} DEBATE CHANNEL</span>
            </div>
            {timerExpired && (
              <div className="flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400 font-semibold animate-pulse">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Timer Expired · Channel Locked</span>
              </div>
            )}
          </div>

          {/* Messages Feed */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {roomChat.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 py-12">
                <MessageSquare className="w-8 h-8 mb-2 opacity-30" />
                <p className="text-xs">
                  Discussion open! Who sounds like they don't know the word?
                </p>
              </div>
            ) : (
              roomChat.map((msg) => {
                const isMe = msg.senderId === user?.id;
                const isMsgHost = msg.senderUsername.toLowerCase() === 'nafiul';

                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                  >
                    <div className="flex items-center gap-2 mb-1 text-xs">
                      <span
                        className={`font-semibold ${
                          isMsgHost
                            ? 'text-amber-600 dark:text-amber-400'
                            : isMe
                            ? 'text-rose-600 dark:text-rose-400'
                            : 'text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {msg.senderUsername}
                        {isMsgHost && ' (Host)'}
                      </span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                        {new Date(msg.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    <div
                      className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                        isMe
                          ? 'bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800/60 text-rose-900 dark:text-rose-50 rounded-tr-none'
                          : isMsgHost
                          ? 'bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50 text-amber-900 dark:text-amber-50 rounded-tl-none'
                          : 'bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 text-slate-800 dark:text-slate-100 rounded-tl-none'
                      }`}
                    >
                      <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={chatBottomRef} />
          </div>

          {/* Chat Input */}
          <form
            onSubmit={handleSendMessage}
            className="p-3 sm:p-4 bg-slate-50 dark:bg-slate-950/90 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              disabled={timerExpired}
              placeholder={
                timerExpired
                  ? 'Discussion time has ended. Channel locked.'
                  : 'Debate with other agents in this room...'
              }
              className="flex-1 px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 disabled:opacity-40 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
            />
            <button
              type="submit"
              disabled={!inputText.trim() || timerExpired}
              className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white rounded-xl font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">SEND</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
