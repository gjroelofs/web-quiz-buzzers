import { useEffect, useState } from "react";
import { gameSession } from "@client/state/game-session";

export function ConnectionPill() {
  const [status, setStatus] = useState<"connected" | "disconnected">("disconnected");
  useEffect(() => gameSession.onStatus(setStatus), []);
  const connected = status === "connected";
  return (
    <div
      className={`fixed top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider z-50 ${
        connected ? "bg-green-500 text-black" : "bg-red-500 text-white"
      }`}
      aria-live="polite"
    >
      {connected ? "ONLINE" : "OFFLINE"}
    </div>
  );
}
