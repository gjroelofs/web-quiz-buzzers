import { randomUUID } from "node:crypto";
import type { ServerWebSocket } from "bun";
import { parseClientMessage } from "@shared/messages-zod";
import type { ServerMessage } from "@shared/messages";
import { rooms } from "./rooms";
import type { Action } from "./reducer";
import type { SocketData } from "./socket-data";

// Single entry point for all WS messages. Validates with Zod, resolves the
// player from the socket, and dispatches to the room reducer.
export function handleClientMessage(
  ws: ServerWebSocket<SocketData>,
  raw: unknown,
): void {
  const msg = parseClientMessage(raw);
  if (!msg) {
    sendError(ws, "INVALID_MESSAGE", "message failed schema validation");
    return;
  }

  switch (msg.type) {
    case "PING":
      send(ws, { type: "PONG", payload: { at: Date.now() } });
      return;

    case "CREATE_ROOM": {
      const playerId = randomUUID();
      const room = rooms.create(playerId);
      ws.data.playerId = playerId;
      ws.data.roomCode = room.state.roomCode;
      room.attachSocket(playerId, ws);
      room.dispatch({
        type: "JOIN_ROOM",
        playerId,
        payload: {
          roomCode: room.state.roomCode,
          playerName: msg.payload.hostName,
          deviceType: "phone",
        },
      });
      send(ws, {
        type: "ROOM_CREATED",
        payload: { roomCode: room.state.roomCode, playerId },
      });
      return;
    }

    case "JOIN_ROOM": {
      const room = rooms.get(msg.payload.roomCode);
      if (!room) {
        sendError(ws, "ROOM_NOT_FOUND", `no room ${msg.payload.roomCode}`);
        return;
      }
      if (room.state.phase !== "LOBBY") {
        sendError(ws, "GAME_IN_PROGRESS", "cannot join after game started");
        return;
      }
      const bs = msg.payload.buzzSlot;
      if (
        bs &&
        room.state.players.some(
          (p) =>
            p.buzzSlot?.dongleId === bs.dongleId &&
            p.buzzSlot?.controllerIndex === bs.controllerIndex,
        )
      ) {
        sendError(ws, "SLOT_TAKEN", "buzz slot already claimed");
        return;
      }
      const playerId = randomUUID();
      ws.data.playerId = playerId;
      ws.data.roomCode = room.state.roomCode;
      room.attachSocket(playerId, ws);
      room.dispatch({ type: "JOIN_ROOM", playerId, payload: msg.payload });
      send(ws, {
        type: "JOIN_ACK",
        payload: { roomCode: room.state.roomCode, playerId },
      });
      return;
    }

    case "RECONNECT": {
      const room = rooms.get(msg.payload.roomCode);
      if (!room) {
        sendError(ws, "ROOM_NOT_FOUND", "no such room");
        return;
      }
      const player = room.state.players.find(
        (p) => p.id === msg.payload.playerId,
      );
      if (!player) {
        sendError(ws, "PLAYER_NOT_FOUND", "no such player in this room");
        return;
      }
      ws.data.playerId = player.id;
      ws.data.roomCode = room.state.roomCode;
      room.attachSocket(player.id, ws);
      send(ws, {
        type: "JOIN_ACK",
        payload: { roomCode: room.state.roomCode, playerId: player.id },
      });
      room.broadcast();
      return;
    }

    case "START_GAME": {
      if (!ws.data.playerId || !ws.data.roomCode) {
        sendError(ws, "NOT_IN_ROOM", "join a room first");
        return;
      }
      const room = rooms.get(ws.data.roomCode);
      if (!room) {
        sendError(ws, "ROOM_NOT_FOUND", "your room no longer exists");
        return;
      }
      const err = room.startGame(msg.payload.packId, ws.data.playerId);
      if (err === "PACK_NOT_FOUND") {
        sendError(ws, "PACK_NOT_FOUND", `pack '${msg.payload.packId}' not loaded`);
      } else if (err === "NOT_HOST") {
        sendError(ws, "NOT_HOST", "only the host can start the game");
      } else if (err === "BAD_PHASE") {
        sendError(ws, "BAD_PHASE", "game already started");
      }
      return;
    }

    case "LEAVE":
    case "BUZZ":
    case "ANSWER":
    case "WAGER":
    case "NEXT_QUESTION": {
      if (!ws.data.playerId || !ws.data.roomCode) {
        sendError(ws, "NOT_IN_ROOM", "join a room first");
        return;
      }
      const room = rooms.get(ws.data.roomCode);
      if (!room) {
        sendError(ws, "ROOM_NOT_FOUND", "your room no longer exists");
        return;
      }
      const action = { ...msg, playerId: ws.data.playerId } as Action;
      room.dispatch(action);
      // LEAVE specifically: drop the socket's room association after dispatch.
      if (msg.type === "LEAVE") {
        ws.data.playerId = null;
        ws.data.roomCode = null;
      }
      return;
    }
  }
}

export function handleSocketClose(ws: ServerWebSocket<SocketData>): void {
  if (!ws.data.roomCode) return;
  const room = rooms.get(ws.data.roomCode);
  if (!room) return;
  room.detachSocket(ws);
}

function send(ws: ServerWebSocket<SocketData>, msg: ServerMessage): void {
  try {
    ws.send(JSON.stringify(msg));
  } catch {
    /* swallow */
  }
}

function sendError(
  ws: ServerWebSocket<SocketData>,
  code: string,
  message: string,
): void {
  send(ws, { type: "ERROR", payload: { code, message } });
}
