import { useEffect, useState } from "react";
import { gameSession } from "@client/state/game-session";
import { useGameState } from "@client/state/game-store";
import { useBuzzManagerStatus } from "@client/hooks/use-buzz-events";
import { buzzManager } from "@client/hid/buzz-manager";
import { SetupScreen } from "./screens/setup-screen";
import { LobbyScreen } from "./screens/lobby-screen";

interface ServerInfo {
  lanIps: string[];
  packs: { id: string; name: string; description: string; questionCount: number }[];
}

// Root for the host route. Three stages:
// 1) connecting → wait for ws + auto-create room
// 2) setup     → user grants WebHID (or skips)
// 3) lobby     → main pre-game screen
export function HostClient() {
  const state = useGameState();
  const { dongleCount } = useBuzzManagerStatus();
  const [serverInfo, setServerInfo] = useState<ServerInfo | null>(null);
  const [skippedSetup, setSkippedSetup] = useState(false);
  const [createInFlight, setCreateInFlight] = useState(false);

  // Boot ws + restore previously-attached dongles.
  useEffect(() => {
    gameSession.start();
    if (buzzManager.isSupported()) {
      buzzManager.restoreAttached().catch(() => {});
    }
  }, []);

  // Fetch server info (LAN IP + packs) once.
  useEffect(() => {
    fetch("/api/server-info")
      .then((r) => r.json())
      .then((info: ServerInfo) => setServerInfo(info))
      .catch((e) => console.warn("[host] server-info fetch failed", e));
  }, []);

  // Auto-create a room if we don't already have one and ws is up.
  useEffect(() => {
    if (state || createInFlight) return;
    const onStatus = gameSession.onStatus((s) => {
      if (s !== "connected") return;
      // Avoid double-create if a stored session is reattaching.
      if (gameSession.getStored()) return;
      setCreateInFlight(true);
      gameSession.send({ type: "CREATE_ROOM", payload: { hostName: "Host" } });
    });
    return onStatus;
  }, [state, createInFlight]);

  // While waiting for server info / room, show a minimal connecting screen.
  if (!state || !serverInfo) {
    return (
      <div className="min-h-screen bg-black text-cyan-300 flex items-center justify-center font-mono">
        <p className="text-xl tracking-widest opacity-60">CONNECTING…</p>
      </div>
    );
  }

  // Setup → Lobby transition: if user has connected ≥1 dongle OR skipped, go to lobby.
  const inSetup = !skippedSetup && dongleCount === 0;
  if (inSetup) return <SetupScreen onContinue={() => setSkippedSetup(true)} />;

  return <LobbyScreen state={state} serverInfo={serverInfo} />;
}
