import type { ServerWebSocket } from "bun";
import type { ServerMessage } from "@shared/messages";
import type { GameState } from "@shared/game-state";
import { reduce, initialState, type Action } from "./reducer";
import type { SocketData } from "./socket-data";

// How long a disconnected player remains in the room before being auto-removed.
// Allows tab refresh / phone backgrounding to seamlessly reconnect.
export const RECONNECT_GRACE_MS = 60_000;

export class Room {
  state: GameState;
  private sockets = new Map<string, ServerWebSocket<SocketData>>();
  private disconnectTimers = new Map<string, ReturnType<typeof setTimeout>>();

  constructor(roomCode: string, hostId: string) {
    this.state = initialState(roomCode, hostId);
  }

  attachSocket(playerId: string, ws: ServerWebSocket<SocketData>): void {
    // Replace any prior socket for this player (older tab takes the loss).
    const prev = this.sockets.get(playerId);
    if (prev && prev !== ws) {
      try {
        prev.close(1000, "replaced");
      } catch {
        /* swallow */
      }
    }
    this.sockets.set(playerId, ws);

    const t = this.disconnectTimers.get(playerId);
    if (t) {
      clearTimeout(t);
      this.disconnectTimers.delete(playerId);
    }

    this.state = {
      ...this.state,
      players: this.state.players.map((p) =>
        p.id === playerId ? { ...p, connected: true } : p,
      ),
    };
  }

  detachSocket(ws: ServerWebSocket<SocketData>): void {
    const playerId = ws.data.playerId;
    if (!playerId) return;
    // Only react if this is still the active socket for that player
    // (a reconnect could have replaced it before close fired).
    if (this.sockets.get(playerId) !== ws) return;

    this.sockets.delete(playerId);
    this.state = {
      ...this.state,
      players: this.state.players.map((p) =>
        p.id === playerId ? { ...p, connected: false } : p,
      ),
    };

    const t = setTimeout(() => {
      this.disconnectTimers.delete(playerId);
      const player = this.state.players.find((p) => p.id === playerId);
      if (!player || player.connected) return;
      this.dispatch({ type: "LEAVE", playerId, payload: {} } as Action);
    }, RECONNECT_GRACE_MS);
    this.disconnectTimers.set(playerId, t);

    this.broadcast();
  }

  dispatch(action: Action): GameState {
    const prev = this.state;
    this.state = reduce(prev, action);
    if (this.state !== prev) this.broadcast();
    return this.state;
  }

  send(playerId: string, msg: ServerMessage): void {
    const ws = this.sockets.get(playerId);
    if (!ws) return;
    try {
      ws.send(JSON.stringify(msg));
    } catch {
      /* swallow */
    }
  }

  broadcast(): void {
    const msg: ServerMessage = {
      type: "STATE_UPDATE",
      payload: { state: this.state },
    };
    const json = JSON.stringify(msg);
    for (const ws of this.sockets.values()) {
      try {
        ws.send(json);
      } catch {
        /* swallow */
      }
    }
  }

  hasPlayer(playerId: string): boolean {
    return this.state.players.some((p) => p.id === playerId);
  }

  isEmpty(): boolean {
    return this.state.players.length === 0 && this.sockets.size === 0;
  }

  destroy(): void {
    for (const t of this.disconnectTimers.values()) clearTimeout(t);
    this.disconnectTimers.clear();
    for (const ws of this.sockets.values()) {
      try {
        ws.close(1000, "room destroyed");
      } catch {
        /* swallow */
      }
    }
    this.sockets.clear();
  }
}
