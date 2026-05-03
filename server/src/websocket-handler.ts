import type { WebSocketHandler } from "bun";
import { handleClientMessage, handleSocketClose } from "./message-router";
import type { SocketData } from "./socket-data";

export const websocketHandler: WebSocketHandler<SocketData> = {
  open(_ws) {
    // ws.data was initialized by `server.upgrade(req, { data: ... })`.
  },
  message(ws, raw) {
    let parsed: unknown;
    try {
      const text = typeof raw === "string" ? raw : new TextDecoder().decode(raw);
      parsed = JSON.parse(text);
    } catch {
      console.warn("[ws] dropping invalid JSON");
      return;
    }
    handleClientMessage(ws, parsed);
  },
  close(ws, code, reason) {
    handleSocketClose(ws);
    if (code !== 1000 && code !== 1001) {
      console.log(`[ws] close code=${code} reason="${reason}"`);
    }
  },
};
