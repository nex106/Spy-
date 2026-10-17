import crypto from 'node:crypto';
import http from 'node:http';
import path from 'node:path';
import express, { Request, Response } from 'express';
import { WebSocket, WebSocketServer } from 'ws';
import { UserProfile, WebSocketClientMessage, WebSocketServerMessage } from './src/types.js';
import { db } from './server/db.js';
import { gameManager } from './server/gameManager.js';

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

app.use(express.json());

// In-memory active session tokens -> UserProfile
const activeSessions = new Map<string, UserProfile>();

function createSession(user: UserProfile): string {
  const token = `tok_${crypto.randomBytes(24).toString('hex')}`;
  activeSessions.set(token, user);
  return token;
}

function getUserFromReq(req: Request): UserProfile | null {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;
  const token = authHeader.replace(/^Bearer\s+/, '').trim();
  return activeSessions.get(token) || null;
}

export function isHostOrAdmin(user?: UserProfile | null): boolean {
  if (!user) return false;
  const role = (user.role || '').toUpperCase();
  const username = (user.username || '').toLowerCase();
  return role === 'HOST' || role === 'ADMIN' || username === 'nafiul' || username === 'admin';
}

// Map of WebSocket client to user and current joined room
interface ClientSession {
  ws: WebSocket;
  user?: UserProfile;
  roomCode?: string;
}

const clients = new Set<ClientSession>();

// Helper to broadcast room state to all clients connected to that room
function broadcastRoomState(roomCode: string) {
  const code = roomCode.toUpperCase();
  for (const client of clients) {
    if (client.roomCode === code && client.ws.readyState === WebSocket.OPEN && client.user) {
      const maskedState = gameManager.getMaskedRoomState(
        code,
        client.user.id,
        isHostOrAdmin(client.user)
      );
      if (maskedState) {
        client.ws.send(JSON.stringify({ type: 'ROOM_STATE', room: maskedState }));
      }
    }
  }
}

// Hook game manager state changes to WebSocket broadcast
gameManager.setOnStateChange((roomCode) => {
  broadcastRoomState(roomCode);
});

// Broadcast global chat update
function broadcastGlobalChat(message: any) {
  const payload = JSON.stringify({ type: 'GLOBAL_CHAT_MESSAGE', message });
  for (const client of clients) {
    if (client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(payload);
    }
  }
}

function broadcastGlobalChatDelete(messageId: string) {
  const payload = JSON.stringify({ type: 'GLOBAL_CHAT_DELETED', messageId });
  for (const client of clients) {
    if (client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(payload);
    }
  }
}

function broadcastGlobalChatClear() {
  const payload = JSON.stringify({ type: 'GLOBAL_CHAT_CLEARED' });
  for (const client of clients) {
    if (client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(payload);
    }
  }
}

// WebSocket Connection handling
wss.on('connection', (ws) => {
  const session: ClientSession = { ws };
  clients.add(session);

  ws.on('message', (data) => {
    try {
      const parsed: WebSocketClientMessage = JSON.parse(data.toString());

      if (parsed.type === 'AUTH') {
        const user = activeSessions.get(parsed.token);
        if (user) {
          session.user = user;
          ws.send(JSON.stringify({ type: 'AUTH_SUCCESS', user }));
        } else {
          ws.send(JSON.stringify({ type: 'ERROR', message: 'Invalid session token' }));
        }
      } else if (parsed.type === 'JOIN_ROOM') {
        if (!session.user) return;
        session.roomCode = parsed.roomCode.toUpperCase();
        gameManager.joinRoom(session.roomCode, session.user);
        broadcastRoomState(session.roomCode);
      } else if (parsed.type === 'LEAVE_ROOM') {
        if (session.roomCode && session.user) {
          gameManager.leaveRoom(session.roomCode, session.user.id);
          session.roomCode = undefined;
        }
      } else if (parsed.type === 'GLOBAL_CHAT_SEND') {
        if (!session.user) return;
        const msg = db.addGlobalChatMessage(session.user, parsed.content);
        broadcastGlobalChat(msg);
      } else if (parsed.type === 'GLOBAL_CHAT_DELETE') {
        if (!session.user || !isHostOrAdmin(session.user)) return;
        const deleted = db.deleteGlobalChatMessage(parsed.messageId);
        if (deleted) {
          broadcastGlobalChatDelete(parsed.messageId);
        }
      } else if (parsed.type === 'GLOBAL_CHAT_CLEAR') {
        if (!session.user || !isHostOrAdmin(session.user)) return;
        db.clearGlobalChat();
        broadcastGlobalChatClear();
      } else if (parsed.type === 'ROOM_CHAT_SEND') {
        if (!session.user || !parsed.roomCode) return;
        const msg = gameManager.addRoomChatMessage(parsed.roomCode, session.user, parsed.content);
        if (msg) {
          // Broadcast room chat message
          for (const client of clients) {
            if (
              client.roomCode === parsed.roomCode.toUpperCase() &&
              client.ws.readyState === WebSocket.OPEN
            ) {
              client.ws.send(
                JSON.stringify({
                  type: 'ROOM_CHAT_MESSAGE',
                  roomCode: parsed.roomCode,
                  message: msg,
                })
              );
            }
          }
        }
      } else if (parsed.type === 'SUBMIT_HINT') {
        if (!session.user || !parsed.roomCode) return;
        gameManager.submitHint(parsed.roomCode, session.user.id, parsed.content);
      } else if (parsed.type === 'CAST_VOTE') {
        if (!session.user || !parsed.roomCode) return;
        gameManager.castVote(parsed.roomCode, session.user.id, parsed.targetUserId);
      }
    } catch (e) {
      console.error('WS message error:', e);
    }
  });

  ws.on('close', () => {
    if (session.roomCode && session.user) {
      gameManager.leaveRoom(session.roomCode, session.user.id);
    }
    clients.delete(session);
  });
});

// REST API ROUTES

// 1. Auth Login
app.post('/api/auth/login', (req: Request, res: Response): void => {
  const { username, password } = req.body;
  if (!username || !password) {
    res.status(400).json({ error: 'Username and password are required' });
    return;
  }

  const user = db.verifyUser(username, password);
  if (!user) {
    res.status(401).json({ error: 'Invalid username or password' });
    return;
  }

  const token = createSession(user);
  res.json({ user, token });
});

// Current User Me
app.get('/api/auth/me', (req: Request, res: Response): void => {
  const user = getUserFromReq(req);
  if (!user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  res.json({ user });
});

// Host User Management
app.get('/api/host/users', (req: Request, res: Response): void => {
  const user = getUserFromReq(req);
  if (!user || !isHostOrAdmin(user)) {
    res.status(403).json({ error: 'Forbidden: Host access only' });
    return;
  }
  const users = db.getAllUsers();
  res.json({ users });
});

app.post('/api/host/create-user', (req: Request, res: Response): void => {
  const user = getUserFromReq(req);
  if (!user || !isHostOrAdmin(user)) {
    res.status(403).json({ error: 'Forbidden: Host access only' });
    return;
  }

  const { username, password } = req.body;
  const result = db.createUser(username, password);
  if (result.error) {
    res.status(400).json({ error: result.error });
    return;
  }
  res.json({ user: result.user });
});

app.delete('/api/host/users/:id', (req: Request, res: Response): void => {
  const user = getUserFromReq(req);
  if (!user || !isHostOrAdmin(user)) {
    res.status(403).json({ error: 'Forbidden: Host access only' });
    return;
  }

  const targetId = req.params.id;
  const success = db.deleteUser(targetId);
  if (!success) {
    res.status(400).json({ error: 'Could not delete user. Primary host account cannot be deleted.' });
    return;
  }

  // Remove player from all active game rooms
  gameManager.removeUserFromAllRooms(targetId);

  // Invalidate any active sessions
  for (const [token, sessUser] of activeSessions.entries()) {
    if (sessUser.id === targetId) {
      activeSessions.delete(token);
    }
  }

  // Terminate any connected sockets for this user
  for (const client of clients) {
    if (client.user?.id === targetId) {
      if (client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(JSON.stringify({ type: 'FORCE_LOGOUT', reason: 'Account deleted by host' }));
        client.ws.close();
      }
    }
  }

  res.json({ success: true });
});

app.put('/api/host/users/:id/role', (req: Request, res: Response): void => {
  const user = getUserFromReq(req);
  if (!user || !isHostOrAdmin(user)) {
    res.status(403).json({ error: 'Forbidden: Host access only' });
    return;
  }

  const { role } = req.body;
  if (!role || (role !== 'HOST' && role !== 'ADMIN' && role !== 'PLAYER')) {
    res.status(400).json({ error: 'Invalid role specified' });
    return;
  }

  const targetId = req.params.id;
  const success = db.updateUserRole(targetId, role);
  if (!success) {
    res.status(400).json({ error: 'Could not update user role. Primary host account cannot be modified.' });
    return;
  }

  // Update active sessions and connected sockets for this user
  for (const [, sessUser] of activeSessions.entries()) {
    if (sessUser.id === targetId) {
      sessUser.role = role;
    }
  }

  for (const client of clients) {
    if (client.user?.id === targetId) {
      client.user.role = role;
      if (client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(JSON.stringify({ type: 'AUTH_SUCCESS', user: client.user }));
      }
    }
  }

  res.json({ success: true, role });
});

// Global Chat
app.get('/api/global-chat', (_req: Request, res: Response): void => {
  const messages = db.getGlobalChat();
  res.json({ messages });
});

app.post('/api/global-chat', (req: Request, res: Response): void => {
  const user = getUserFromReq(req);
  if (!user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const { content } = req.body;
  if (!content || !content.trim()) {
    res.status(400).json({ error: 'Content cannot be empty' });
    return;
  }

  const message = db.addGlobalChatMessage(user, content);
  broadcastGlobalChat(message);
  res.json({ message });
});

app.delete('/api/global-chat/:id', (req: Request, res: Response): void => {
  const user = getUserFromReq(req);
  if (!user || !isHostOrAdmin(user)) {
    res.status(403).json({ error: 'Forbidden: Host or Admin access only' });
    return;
  }

  const success = db.deleteGlobalChatMessage(req.params.id);
  if (success) {
    broadcastGlobalChatDelete(req.params.id);
    res.json({ success: true });
  } else {
    res.status(404).json({ error: 'Message not found' });
  }
});

// Clear entire global chat history (Host or Admin)
app.post('/api/global-chat/clear', (req: Request, res: Response): void => {
  const user = getUserFromReq(req);
  if (!user || !isHostOrAdmin(user)) {
    res.status(403).json({ error: 'Forbidden: Host or Admin access only' });
    return;
  }

  db.clearGlobalChat();
  broadcastGlobalChatClear();
  res.json({ success: true });
});

app.delete('/api/global-chat', (req: Request, res: Response): void => {
  const user = getUserFromReq(req);
  if (!user || !isHostOrAdmin(user)) {
    res.status(403).json({ error: 'Forbidden: Host or Admin access only' });
    return;
  }

  db.clearGlobalChat();
  broadcastGlobalChatClear();
  res.json({ success: true });
});

// Rooms
app.post('/api/rooms/create', (req: Request, res: Response): void => {
  const user = getUserFromReq(req);
  if (!user || !isHostOrAdmin(user)) {
    res.status(403).json({ error: 'Host or Admin permissions required to create rooms' });
    return;
  }

  const { roomCode } = req.body;
  const result = gameManager.createRoom(user, roomCode);
  if (result.error) {
    res.status(400).json({ error: result.error });
    return;
  }
  res.json({ room: result.room });
});

app.post('/api/rooms/:code/join', (req: Request, res: Response): void => {
  const user = getUserFromReq(req);
  if (!user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const result = gameManager.joinRoom(req.params.code, user);
  if (!result.success) {
    res.status(400).json({ error: result.error });
    return;
  }

  const masked = gameManager.getMaskedRoomState(req.params.code, user.id, isHostOrAdmin(user));
  res.json({ room: masked });
});

app.get('/api/rooms/:code', (req: Request, res: Response): void => {
  const user = getUserFromReq(req);
  if (!user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const masked = gameManager.getMaskedRoomState(req.params.code, user.id, isHostOrAdmin(user));
  if (!masked) {
    res.status(404).json({ error: 'Room not found' });
    return;
  }
  res.json({ room: masked });
});

app.get('/api/rooms/:code/chat', (req: Request, res: Response): void => {
  const user = getUserFromReq(req);
  if (!user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const messages = gameManager.getRoomChat(req.params.code);
  res.json({ messages });
});

// Host Actions on Room
app.post('/api/rooms/:code/host-action', (req: Request, res: Response): void => {
  const user = getUserFromReq(req);
  if (!user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const roomCode = req.params.code;
  const room = gameManager.getRoom(roomCode);
  if (!room) {
    res.status(404).json({ error: 'Room not found' });
    return;
  }

  const isRoomHost = isHostOrAdmin(user) || gameManager.canActAsHost(room, user.id);
  if (!isRoomHost) {
    res.status(403).json({ error: 'Host permissions required' });
    return;
  }

  const { action, payload } = req.body;

  switch (action) {
    case 'SET_SECOND_HOST': {
      const resHost = gameManager.setSecondHost(
        roomCode,
        user.id,
        payload?.targetUserId,
        Boolean(payload?.isSecondHost)
      );
      if (!resHost.success) {
        res.status(400).json({ error: resHost.error });
        return;
      }
      break;
    }
    case 'SET_JOINING':
      gameManager.setJoiningStatus(roomCode, user.id, Boolean(payload?.isOpen));
      break;
    case 'CLOSE_ROOM':
      gameManager.closeRoom(roomCode, user.id);
      break;
    case 'REMOVE_PLAYER':
      gameManager.removePlayer(roomCode, user.id, payload?.targetUserId);
      break;
    case 'SET_ROLE':
      gameManager.updatePlayerRole(roomCode, user.id, payload?.targetUserId, payload?.role);
      break;
    case 'SET_WORD':
      gameManager.setSecretWord(roomCode, user.id, payload?.word);
      break;
    case 'START_GAME': {
      const startRes = gameManager.startGame(roomCode, user.id);
      if (!startRes.success) {
        res.status(400).json({ error: startRes.error });
        return;
      }
      break;
    }
    case 'SELECT_HINT_PLAYER':
      gameManager.selectPlayerForHint(roomCode, user.id, payload?.targetUserId ?? null);
      break;
    case 'MARK_HINT_SUBMITTED':
      gameManager.markHintSubmitted(roomCode, user.id, payload?.targetUserId);
      break;
    case 'SET_DISQUALIFICATION':
      gameManager.setPlayerDisqualification(
        roomCode,
        user.id,
        payload?.targetUserId,
        Boolean(payload?.disqualified)
      );
      break;
    case 'TRIGGER_PHASE':
      gameManager.hostTriggerPhase(roomCode, user.id, payload?.phase);
      break;
    case 'TIMER_ADJUST':
      gameManager.adjustTimer(roomCode, user.id, payload?.timerAction);
      break;
    case 'CLOSE_VOTING':
      gameManager.hostCloseVoting(roomCode, user.id);
      break;
    case 'START_TIEBREAKER':
      gameManager.startTiebreaker(roomCode, user.id);
      break;
    default:
      res.status(400).json({ error: `Unknown host action: ${action}` });
      return;
  }

  res.json({ success: true });
});

// Submit Hint
app.post('/api/rooms/:code/submit-hint', (req: Request, res: Response): void => {
  const user = getUserFromReq(req);
  if (!user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const { content } = req.body;
  const result = gameManager.submitHint(req.params.code, user.id, content);
  if (!result.success) {
    res.status(400).json({ error: result.error });
    return;
  }
  res.json({ success: true });
});

// Cast Vote
app.post('/api/rooms/:code/vote', (req: Request, res: Response): void => {
  const user = getUserFromReq(req);
  if (!user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const { targetUserId } = req.body;
  const result = gameManager.castVote(req.params.code, user.id, targetUserId);
  if (!result.success) {
    res.status(400).json({ error: result.error });
    return;
  }
  res.json({ success: true });
});

// Vite dev server integration
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';
  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(port, '0.0.0.0', () => {
    console.log(`Server listening on port ${port} (mode: ${isProduction ? 'prod' : 'dev'})`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
