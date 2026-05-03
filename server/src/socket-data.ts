// Per-WebSocket data tracked by Bun.serve via the `data` field on upgrade().
// Used by the message router to identify which player a given socket belongs to.

export interface SocketData {
  playerId: string | null;
  roomCode: string | null;
}

export function emptySocketData(): SocketData {
  return { playerId: null, roomCode: null };
}
