import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { ChatMessage, UserProfile, UserRole } from '../src/types.js';

interface StoredUser {
  id: string;
  username: string;
  role: UserRole;
  salt: string;
  hash: string;
  createdAt: number;
}

interface DatabaseSchema {
  users: StoredUser[];
  globalChat: ChatMessage[];
  roomHistory: {
    roomCode: string;
    completedAt: number;
    winnerTeam: string;
    spyUsername: string;
  }[];
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'database.json');

function hashPassword(password: string, salt: string): string {
  return crypto.scryptSync(password, salt, 64).toString('hex');
}

function generateSalt(): string {
  return crypto.randomBytes(16).toString('hex');
}

class Database {
  private data: DatabaseSchema = {
    users: [],
    globalChat: [],
    roomHistory: [],
  };

  constructor() {
    this.init();
  }

  private init() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.data = JSON.parse(raw);
      } catch (err) {
        console.error('Failed to parse database file, resetting', err);
      }
    }

    // Ensure Host Account "Nafiul" exists
    let host = this.data.users.find(
      (u) => u.username.toLowerCase() === 'nafiul'
    );
    if (!host) {
      const salt = generateSalt();
      const hash = hashPassword('8762gdjr', salt);
      host = {
        id: 'host-nafiul-001',
        username: 'Nafiul',
        role: 'HOST',
        salt,
        hash,
        createdAt: Date.now(),
      };
      this.data.users.unshift(host);
    } else {
      host.role = 'HOST';
      host.username = 'Nafiul';
    }

    // Ensure Admin Account "Admin" exists
    let admin = this.data.users.find(
      (u) => u.username.toLowerCase() === 'admin'
    );
    if (!admin) {
      const salt = generateSalt();
      const hash = hashPassword('admin123', salt);
      admin = {
        id: 'admin-001',
        username: 'Admin',
        role: 'HOST',
        salt,
        hash,
        createdAt: Date.now(),
      };
      this.data.users.unshift(admin);
    } else {
      admin.role = 'HOST';
    }

    // Pre-seed convenient sample players for immediate multi-window/multi-phone play
    const samplePlayers = [
      { username: 'Player1', password: 'player123' },
      { username: 'Player2', password: 'player123' },
      { username: 'Player3', password: 'player123' },
      { username: 'Player4', password: 'player123' },
    ];

    for (const sp of samplePlayers) {
      if (!this.data.users.find((u) => u.username.toLowerCase() === sp.username.toLowerCase())) {
        const salt = generateSalt();
        const hash = hashPassword(sp.password, salt);
        this.data.users.push({
          id: `user-${sp.username.toLowerCase()}-${Date.now().toString(36)}`,
          username: sp.username,
          role: 'PLAYER',
          salt,
          hash,
          createdAt: Date.now(),
        });
      }
    }

    // Seed welcoming global chat message if empty
    if (!this.data.globalChat || this.data.globalChat.length === 0) {
      this.data.globalChat = [
        {
          id: 'welcome-msg-1',
          roomId: 'global',
          senderId: host.id,
          senderUsername: 'Nafiul',
          content: 'Welcome to SPY GAME! Join a room or wait for a match to start.',
          timestamp: Date.now() - 3600000,
        },
      ];
    }

    this.save();
  }

  private save() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Database write error:', err);
    }
  }

  public verifyUser(username: string, password: string): UserProfile | null {
    const trimmed = username.trim();
    const user = this.data.users.find(
      (u) => u.username.toLowerCase() === trimmed.toLowerCase()
    );
    
    // Auto-provision admin if missing
    if (!user) {
      if (trimmed.toLowerCase() === 'admin') {
        const salt = generateSalt();
        const hash = hashPassword(password, salt);
        const newAdmin: StoredUser = {
          id: 'admin-001',
          username: 'Admin',
          role: 'HOST',
          salt,
          hash,
          createdAt: Date.now(),
        };
        this.data.users.unshift(newAdmin);
        this.save();
        return {
          id: newAdmin.id,
          username: newAdmin.username,
          role: newAdmin.role,
          createdAt: newAdmin.createdAt,
        };
      }
      return null;
    }

    const testHash = hashPassword(password, user.salt);
    const matches = crypto.timingSafeEqual(Buffer.from(testHash, 'hex'), Buffer.from(user.hash, 'hex'));

    // If user is admin or nafiul, allow flexible admin passwords (admin123, 8762gdjr, admin)
    if (!matches && (user.username.toLowerCase() === 'admin' || user.username.toLowerCase() === 'nafiul')) {
      const allowedAdminPasswords = ['admin123', 'admin', '8762gdjr'];
      if (allowedAdminPasswords.includes(password)) {
        user.salt = generateSalt();
        user.hash = hashPassword(password, user.salt);
        user.role = 'HOST';
        this.save();
        return {
          id: user.id,
          username: user.username,
          role: 'HOST',
          createdAt: user.createdAt,
        };
      }
    }

    if (matches) {
      if (user.username.toLowerCase() === 'admin' || user.username.toLowerCase() === 'nafiul') {
        user.role = 'HOST';
      }
      return {
        id: user.id,
        username: user.username,
        role: user.role,
        createdAt: user.createdAt,
      };
    }
    return null;
  }

  public getUserById(id: string): UserProfile | null {
    const user = this.data.users.find((u) => u.id === id);
    if (!user) return null;
    return {
      id: user.id,
      username: user.username,
      role: user.role,
      createdAt: user.createdAt,
    };
  }

  public getUserByUsername(username: string): UserProfile | null {
    const trimmed = username.trim().toLowerCase();
    const user = this.data.users.find((u) => u.username.toLowerCase() === trimmed);
    if (!user) return null;
    return {
      id: user.id,
      username: user.username,
      role: user.role,
      createdAt: user.createdAt,
    };
  }

  public createUser(username: string, password: string): { user?: UserProfile; error?: string } {
    const trimmed = username.trim();
    if (!trimmed || trimmed.length < 2) {
      return { error: 'Username must be at least 2 characters long' };
    }
    if (!password || password.length < 4) {
      return { error: 'Password must be at least 4 characters long' };
    }
    if (this.getUserByUsername(trimmed)) {
      return { error: 'Username already exists' };
    }

    const salt = generateSalt();
    const hash = hashPassword(password, salt);
    const id = `user-${Date.now().toString(36)}-${crypto.randomBytes(3).toString('hex')}`;
    const newUser: StoredUser = {
      id,
      username: trimmed,
      role: 'PLAYER',
      salt,
      hash,
      createdAt: Date.now(),
    };

    this.data.users.push(newUser);
    this.save();

    return {
      user: {
        id: newUser.id,
        username: newUser.username,
        role: newUser.role,
        createdAt: newUser.createdAt,
      },
    };
  }

  public deleteUser(userId: string): boolean {
    const user = this.data.users.find((u) => u.id === userId);
    if (!user) return false;
    // Primary host Nafiul cannot be deleted
    const lowerName = user.username.toLowerCase();
    if (lowerName === 'nafiul' || user.id === 'host-nafiul-001') {
      return false;
    }
    this.data.users = this.data.users.filter((u) => u.id !== userId);
    this.save();
    return true;
  }

  public updateUserRole(userId: string, role: UserRole): boolean {
    const user = this.data.users.find((u) => u.id === userId);
    if (!user) return false;
    // Primary host Nafiul cannot have role demoted
    const lowerName = user.username.toLowerCase();
    if (lowerName === 'nafiul' || user.id === 'host-nafiul-001') {
      return false;
    }
    user.role = role;
    this.save();
    return true;
  }

  public getAllUsers(): { id: string; username: string; role: UserRole; createdAt: number }[] {
    return this.data.users.map((u) => ({
      id: u.id,
      username: u.username,
      role: u.role,
      createdAt: u.createdAt,
    }));
  }

  // Global Chat
  public getGlobalChat(limit = 100): ChatMessage[] {
    return this.data.globalChat.slice(-limit);
  }

  public addGlobalChatMessage(sender: UserProfile, content: string): ChatMessage {
    const message: ChatMessage = {
      id: `msg-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
      roomId: 'global',
      senderId: sender.id,
      senderUsername: sender.username,
      content: content.trim(),
      timestamp: Date.now(),
    };
    this.data.globalChat.push(message);
    // Keep last 500 messages
    if (this.data.globalChat.length > 500) {
      this.data.globalChat = this.data.globalChat.slice(-500);
    }
    this.save();
    return message;
  }

  public deleteGlobalChatMessage(messageId: string): boolean {
    const prevLen = this.data.globalChat.length;
    this.data.globalChat = this.data.globalChat.filter((m) => m.id !== messageId);
    if (this.data.globalChat.length !== prevLen) {
      this.save();
      return true;
    }
    return false;
  }

  public clearGlobalChat(): boolean {
    this.data.globalChat = [];
    this.save();
    return true;
  }
}

export const db = new Database();
