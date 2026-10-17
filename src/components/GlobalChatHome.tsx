import React, { useEffect, useRef, useState } from 'react';
import {
  LogIn,
  PlusCircle,
  Send,
  Shield,
  Trash2,
  Users,
  MessageSquare,
  Sparkles,
} from 'lucide-react';
import { useGame } from '../context/GameContext.js';

interface GlobalChatHomeProps {
  onOpenJoinModal: () => void;
  onOpenCreateModal: () => void;
  onOpenHostDashboard: () => void;
}

export function GlobalChatHome({
  onOpenJoinModal,
  onOpenCreateModal,
  onOpenHostDashboard,
}: GlobalChatHomeProps) {
  const { user, globalChat, sendGlobalChat, deleteGlobalChat, clearGlobalChat } = useGame();
  const [inputText, setInputText] = useState('');
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [globalChat]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    sendGlobalChat(inputText);
    setInputText('');
  };

  const handleExecuteClearChat = async () => {
    setIsClearing(true);
    await clearGlobalChat();
    setIsClearing(false);
    setShowClearConfirm(false);
  };

  const formatTime = (ts: number) => {
    const date = new Date(ts);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const isHost =
    user?.role === 'HOST' ||
    (user?.role as string) === 'ADMIN' ||
    user?.username.toLowerCase() === 'admin' ||
    user?.username.toLowerCase() === 'nafiul';

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 sm:py-8 flex flex-col gap-6 min-h-[calc(100vh-4rem)]">
      {/* Top Banner / Actions Area */}
      <div className="text-center flex flex-col items-center">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black font-mono tracking-tight uppercase bg-clip-text text-transparent bg-gradient-to-r from-red-600 via-rose-500 to-amber-500">
          SPY GAME
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-md">
          Global Operations Command & Matchmaking Lobby
        </p>

        {/* Action Buttons */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3 w-full max-w-xl">
          <button
            onClick={onOpenJoinModal}
            className="flex-1 min-w-[160px] py-3.5 px-6 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-sm tracking-wider rounded-xl shadow-md dark:shadow-lg dark:shadow-red-950/40 flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer"
          >
            <LogIn className="w-4 h-4" />
            <span>JOIN ROOM</span>
          </button>

          {isHost && (
            <>
              <button
                onClick={onOpenCreateModal}
                className="flex-1 min-w-[160px] py-3.5 px-6 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-amber-600 dark:text-amber-400 border border-amber-300 dark:border-amber-800/60 font-bold text-sm tracking-wider rounded-xl shadow-sm dark:shadow-lg dark:shadow-amber-950/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer"
              >
                <PlusCircle className="w-4 h-4 text-amber-500" />
                <span>CREATE ROOM</span>
              </button>

              <button
                onClick={onOpenHostDashboard}
                className="w-full sm:w-auto py-3 px-5 bg-white dark:bg-slate-900/90 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-300 dark:border-slate-700/70 font-semibold text-xs tracking-wider rounded-xl flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer"
              >
                <Shield className="w-3.5 h-3.5 text-amber-500" />
                <span>HOST / ADMIN DASHBOARD</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Live Chat Area */}
      <div className="flex-1 flex flex-col bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden backdrop-blur-md shadow-lg dark:shadow-2xl transition-colors duration-300">
        {/* Chat Header */}
        <div className="px-5 py-3.5 bg-slate-50 dark:bg-slate-950/70 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-200">
            <MessageSquare className="w-4 h-4 text-red-500" />
            <span>GLOBAL LIVE FREQUENCY</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
              <span>All Logged-in Players</span>
              <span aria-hidden="true">·</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-mono font-bold">LIVE</span>
            </div>

            {/* Host Clear Chat Button */}
            {isHost &&
              (showClearConfirm ? (
                <div className="flex items-center gap-1.5 animate-fade-in bg-red-100 dark:bg-red-950/80 px-2 py-1 rounded-lg border border-red-300 dark:border-red-800">
                  <span className="text-[11px] font-bold text-red-800 dark:text-red-200">
                    Wipe chat?
                  </span>
                  <button
                    type="button"
                    onClick={handleExecuteClearChat}
                    disabled={isClearing}
                    className="px-2 py-0.5 text-[11px] font-bold bg-red-600 hover:bg-red-500 text-white rounded transition-colors cursor-pointer"
                  >
                    {isClearing ? '...' : 'YES'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowClearConfirm(false)}
                    className="px-1.5 py-0.5 text-[11px] font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowClearConfirm(true)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-lg bg-red-100 hover:bg-red-200 dark:bg-red-950/70 dark:hover:bg-red-900 text-red-700 dark:text-red-300 border border-red-300 dark:border-red-800/80 transition-all cursor-pointer shadow-xs active:scale-95"
                  title="Clear all chat history for everyone now"
                >
                  <Trash2 className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
                  <span>CLEAR CHAT NOW</span>
                </button>
              ))}
          </div>
        </div>

        {/* Message List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 max-h-[500px] min-h-[350px]">
          {globalChat.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 py-12">
              <MessageSquare className="w-8 h-8 mb-2 opacity-40" />
              <p className="text-xs font-medium">Chat history is empty.</p>
              <p className="text-[11px] text-slate-400">Send a transmission to initiate communication.</p>
            </div>
          ) : (
            globalChat.map((msg) => {
              const isMe = msg.senderId === user?.id;
              const isSenderHost = msg.senderUsername.toLowerCase() === 'nafiul';

              return (
                <div
                  key={msg.id}
                  className={`group flex flex-col ${
                    isMe ? 'items-end' : 'items-start'
                  } transition-opacity duration-150`}
                >
                  {/* Sender & Timestamp Header */}
                  <div className="flex items-center gap-2 mb-1 text-xs">
                    <span
                      className={`font-semibold ${
                        isSenderHost
                          ? 'text-amber-600 dark:text-amber-400'
                          : isMe
                          ? 'text-rose-600 dark:text-rose-400'
                          : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {msg.senderUsername}
                      {isSenderHost && ' (Host)'}
                    </span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 tabular-nums font-mono">
                      {formatTime(msg.timestamp)}
                    </span>
                    {isHost && (
                      <button
                        onClick={() => deleteGlobalChat(msg.id)}
                        className="p-1 text-slate-400 hover:text-red-500 rounded hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                        title="Delete this message (Host only)"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Message Bubble */}
                  <div
                    className={`max-w-[85%] sm:max-w-[70%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-xs ${
                      isMe
                        ? 'bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800/60 text-rose-900 dark:text-rose-50 rounded-tr-none'
                        : isSenderHost
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

        {/* Chat Input Form */}
        <form
          onSubmit={handleSendMessage}
          className="p-3 sm:p-4 bg-slate-50 dark:bg-slate-950/80 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2"
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type your transmission to all players..."
            className="flex-1 px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-red-500 transition-colors"
          />
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="py-2.5 px-4 bg-red-600 hover:bg-red-500 disabled:opacity-40 text-white rounded-xl font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <Send className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">SEND</span>
          </button>
        </form>
      </div>
    </div>
  );
}
