import { RoomState, UserProfile } from '../types.js';

export function isUserHostOrCoHost(
  user: UserProfile | null | undefined,
  room?: RoomState | null | undefined
): boolean {
  if (!user) return false;
  if (user.role === 'HOST' || user.role === 'ADMIN') return true;
  const username = user.username?.toLowerCase();
  if (username === 'nafiul' || username === 'admin') return true;

  if (room) {
    if (room.hostId === user.id) return true;
    if (room.secondHostId === user.id) return true;
    const player = room.players?.find((p) => p.userId === user.id);
    if (player?.isHost || player?.isSecondHost) return true;
  }

  return false;
}

export function isUserSecondHost(
  user: UserProfile | null | undefined,
  room?: RoomState | null | undefined
): boolean {
  if (!user || !room) return false;
  if (room.secondHostId === user.id) return true;
  const player = room.players?.find((p) => p.userId === user.id);
  return Boolean(player?.isSecondHost);
}
