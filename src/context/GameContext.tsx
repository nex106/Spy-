import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import {
  ChatMessage,
  GamePhase,
  PlayerGameRole,
  RoomState,
  UserProfile,
  WebSocketServerMessage,
} from '../types.js';
import { soundFX } from '../utils/sound.js';

interface GameContextType {
  user: UserProfile | null;
  token: string | null;
  isLoading: boolean;
  globalChat: ChatMessage[];
  room: RoomState | null;
  roomChat: ChatMessage[];
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  sendGlobalChat: (content: string) => void;
  deleteGlobalChat: (messageId: string) => Promise<boolean>;
  clearGlobalChat: () => Promise<boolean>;
  deleteUserAccount: (userId: string) => Promise<{ success: boolean; error?: string }>;
  updateUserRole: (userId: string, role: 'HOST' | 'ADMIN' | 'PLAYER') => Promise<{ success: boolean; error?: string }>;
  createRoom: (roomCode: string) => Promise<{ success: boolean; error?: string }>;
  joinRoom: (roomCode: string) => Promise<{ success: boolean; error?: string }>;
  leaveRoom: () => void;
  sendRoomChat: (content: string) => void;
  submitHint: (content: string) => Promise<{ success: boolean; error?: string }>;
  castVote: (targetUserId: string) => Promise<{ success: boolean; error?: string }>;
  hostAction: (action: string, payload?: any) => Promise<{ success: boolean; error?: string }>;
  fetchRoomState: () => Promise<void>;
}

const GameContext = createContext<GameContextType | null>(null);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('spy_game_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [globalChat, setGlobalChat] = useState<ChatMessage[]>([]);
  const [room, setRoom] = useState<RoomState | null>(null);
  const [roomChat, setRoomChat] = useState<ChatMessage[]>([]);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Authenticate session on boot
  useEffect(() => {
    async function verifyToken() {
      if (!token) {
        setIsLoading(false);
        return;
      }
      try {
        const res = await fetch('/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        } else {
          localStorage.removeItem('spy_game_token');
          setToken(null);
          setUser(null);
        }
      } catch (err) {
        console.error('Failed to authenticate token', err);
      } finally {
        setIsLoading(false);
      }
    }
    verifyToken();
  }, [token]);

  // Load initial global chat
  useEffect(() => {
    if (!user) return;
    fetch('/api/global-chat', {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.messages) {
          setGlobalChat(data.messages);
        }
      })
      .catch((e) => console.error('Error fetching global chat:', e));
  }, [user, token]);

  // WebSocket Connection
  useEffect(() => {
    if (!token || !user) {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      return;
    }

    function connectWs() {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        ws.send(JSON.stringify({ type: 'AUTH', token }));
        if (room?.code) {
          ws.send(JSON.stringify({ type: 'JOIN_ROOM', roomCode: room.code }));
        }
      };

      ws.onmessage = (event) => {
        try {
          const data: WebSocketServerMessage = JSON.parse(event.data);

          if (data.type === 'GLOBAL_CHAT_MESSAGE') {
            setGlobalChat((prev) => {
              if (prev.some((m) => m.id === data.message.id)) return prev;
              return [...prev, data.message];
            });
            soundFX.playMessage();
          } else if (data.type === 'GLOBAL_CHAT_DELETED') {
            setGlobalChat((prev) => prev.filter((m) => m.id !== data.messageId));
          } else if (data.type === 'GLOBAL_CHAT_CLEARED') {
            setGlobalChat([]);
          } else if (data.type === 'FORCE_LOGOUT') {
            alert(data.reason || 'Your account was deleted by the host.');
            localStorage.removeItem('spy_game_token');
            setUser(null);
            setToken(null);
            setRoom(null);
          } else if (data.type === 'ROOM_STATE') {
            setRoom((prev) => {
              // Trigger audio/visual cues on state changes
              if (prev?.phase !== data.room.phase) {
                if (data.room.phase === 'RESULTS') {
                  soundFX.playVictory();
                } else if (
                  data.room.phase.startsWith('ROUND_') ||
                  data.room.phase === 'VOTING'
                ) {
                  soundFX.playRoundTransition();
                }
              }
              if (
                user &&
                data.room.activeHintTurnUserId === user.id &&
                prev?.activeHintTurnUserId !== user.id
              ) {
                soundFX.playTurnAlert();
              }
              return data.room;
            });
          } else if (data.type === 'ROOM_CHAT_MESSAGE') {
            setRoomChat((prev) => {
              if (prev.some((m) => m.id === data.message.id)) return prev;
              return [...prev, data.message];
            });
            soundFX.playMessage();
          } else if (data.type === 'ROOM_CLOSED') {
            alert(data.message);
            setRoom(null);
          }
        } catch (err) {
          console.error('Error handling WS event', err);
        }
      };

      ws.onclose = () => {
        wsRef.current = null;
        reconnectTimeoutRef.current = setTimeout(connectWs, 3000);
      };

      ws.onerror = () => {
        ws.close();
      };
    }

    connectWs();

    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [token, user]);

  // Polling fallback sync for rooms (ensures 100% reliability)
  useEffect(() => {
    if (!room?.code || !token) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/rooms/${room.code}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setRoom(data.room);
        }
      } catch (err) {
        // quiet fallback
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [room?.code, token]);

  const login = async (username: string, password: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Login failed' };
      }

      localStorage.setItem('spy_game_token', data.token);
      setToken(data.token);
      setUser(data.user);
      soundFX.playClick();
      return { success: true };
    } catch (err) {
      return { success: false, error: 'Network error. Please try again.' };
    }
  };

  const logout = () => {
    localStorage.removeItem('spy_game_token');
    setToken(null);
    setUser(null);
    setRoom(null);
    if (wsRef.current) {
      wsRef.current.close();
    }
  };

  const sendGlobalChat = (content: string) => {
    if (!content.trim()) return;
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'GLOBAL_CHAT_SEND', content }));
    } else {
      // HTTP fallback
      fetch('/api/global-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content }),
      });
    }
  };

  const deleteGlobalChat = async (messageId: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/global-chat/${messageId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.ok;
    } catch {
      return false;
    }
  };

  const clearGlobalChat = async (): Promise<boolean> => {
    // Notify via WS first for immediate response
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'GLOBAL_CHAT_CLEAR' }));
    }
    try {
      const res = await fetch('/api/global-chat/clear', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setGlobalChat([]);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const deleteUserAccount = async (userId: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch(`/api/host/users/${userId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Failed to delete user' };
      }
      return { success: true };
    } catch {
      return { success: false, error: 'Network error deleting user' };
    }
  };

  const updateUserRole = async (
    userId: string,
    role: 'HOST' | 'ADMIN' | 'PLAYER'
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch(`/api/host/users/${userId}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ role }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Failed to update user role' };
      }
      return { success: true };
    } catch {
      return { success: false, error: 'Network error updating user role' };
    }
  };

  const createRoom = async (roomCode: string) => {
    try {
      const res = await fetch('/api/rooms/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ roomCode }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Failed to create room' };
      }
      setRoom(data.room);
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'JOIN_ROOM', roomCode: data.room.code }));
      }
      return { success: true };
    } catch {
      return { success: false, error: 'Network error creating room' };
    }
  };

  const joinRoom = async (roomCode: string) => {
    try {
      const code = roomCode.trim().toUpperCase();
      const res = await fetch(`/api/rooms/${code}/join`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Failed to join room' };
      }
      setRoom(data.room);
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'JOIN_ROOM', roomCode: code }));
      }
      // Load room chat
      const chatRes = await fetch(`/api/rooms/${code}/chat`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (chatRes.ok) {
        const chatData = await chatRes.json();
        setRoomChat(chatData.messages || []);
      }
      return { success: true };
    } catch {
      return { success: false, error: 'Network error joining room' };
    }
  };

  const leaveRoom = () => {
    if (room && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'LEAVE_ROOM', roomCode: room.code }));
    }
    setRoom(null);
    setRoomChat([]);
  };

  const sendRoomChat = (content: string) => {
    if (!room || !content.trim()) return;
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({ type: 'ROOM_CHAT_SEND', roomCode: room.code, content })
      );
    }
  };

  const submitHint = async (content: string) => {
    if (!room) return { success: false, error: 'No active room' };
    try {
      const res = await fetch(`/api/rooms/${room.code}/submit-hint`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Failed to submit hint' };
      }
      return { success: true };
    } catch {
      return { success: false, error: 'Network error submitting hint' };
    }
  };

  const castVote = async (targetUserId: string) => {
    if (!room) return { success: false, error: 'No active room' };
    try {
      const res = await fetch(`/api/rooms/${room.code}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ targetUserId }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Failed to cast vote' };
      }
      return { success: true };
    } catch {
      return { success: false, error: 'Network error submitting vote' };
    }
  };

  const hostAction = async (action: string, payload?: any) => {
    if (!room) return { success: false, error: 'No active room' };
    try {
      const res = await fetch(`/api/rooms/${room.code}/host-action`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action, payload }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Host action failed' };
      }
      return { success: true };
    } catch {
      return { success: false, error: 'Network error executing host action' };
    }
  };

  const fetchRoomState = async () => {
    if (!room?.code || !token) return;
    try {
      const res = await fetch(`/api/rooms/${room.code}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setRoom(data.room);
      }
    } catch {}
  };

  return (
    <GameContext.Provider
      value={{
        user,
        token,
        isLoading,
        globalChat,
        room,
        roomChat,
        login,
        logout,
        sendGlobalChat,
        deleteGlobalChat,
        clearGlobalChat,
        deleteUserAccount,
        updateUserRole,
        createRoom,
        joinRoom,
        leaveRoom,
        sendRoomChat,
        submitHint,
        castVote,
        hostAction,
        fetchRoomState,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used within GameProvider');
  return ctx;
}
