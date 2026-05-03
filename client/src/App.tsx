import { useEffect, useState } from "react";
import { gameSession } from "./state/game-session";
import { useGameState } from "./state/game-store";
import { BuzzDebugOverlay } from "./hid/buzz-debug-overlay";
import { PhoneClient } from "./phone/phone-client";
import { getCurrentRoute } from "./router";
import type { Player } from "@shared/game-state";

export function App() {
  const route = getCurrentRoute();
  if (route === "debug-hid") return <BuzzDebugOverlay />;
  if (route === "phone") return <PhoneClient />;
  return <Lobby />;
}

function Lobby() {
  const state = useGameState();
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    gameSession.start();
    const offStatus = gameSession.onStatus((s) => setConnected(s === "connected"));
    const offError = gameSession.onError((e) => setError(`${e.code}: ${e.message}`));
    return () => {
      offStatus();
      offError();
    };
  }, []);

  return (
    <div className="min-h-screen bg-black text-cyan-300 p-8 font-mono">
      <header className="flex items-baseline gap-4">
        <h1 className="text-4xl font-bold tracking-wider">BUZZ QUIZ</h1>
        <span className="text-xs opacity-50">phase 3 lobby smoke</span>
      </header>
      <p className="mt-2 text-sm">
        WS:{" "}
        <span className={connected ? "text-green-400" : "text-red-400"}>
          {connected ? "connected" : "offline"}
        </span>
      </p>
      {error && (
        <p className="mt-2 text-sm text-red-400">
          {error}{" "}
          <button
            type="button"
            className="underline"
            onClick={() => setError(null)}
          >
            dismiss
          </button>
        </p>
      )}
      {state ? <RoomPanel /> : <NoRoomPanel />}
      <p className="mt-10 text-xs opacity-40">
        WebHID debug: <a className="underline" href="?debug=hid">/?debug=hid</a>
      </p>
    </div>
  );
}

function NoRoomPanel() {
  const [hostName, setHostName] = useState("");
  const [joinName, setJoinName] = useState("");
  const [joinCode, setJoinCode] = useState("");

  return (
    <section className="mt-8 grid gap-6 md:grid-cols-2 max-w-3xl">
      <div className="border border-cyan-800 p-4 rounded">
        <h2 className="font-bold mb-3">Create Room</h2>
        <input
          className="w-full bg-black border border-cyan-700 px-2 py-1 text-cyan-200 mb-2"
          placeholder="host name"
          value={hostName}
          onChange={(e) => setHostName(e.target.value)}
        />
        <button
          type="button"
          className="px-4 py-2 bg-cyan-700 text-black font-bold rounded disabled:opacity-40"
          disabled={hostName.trim().length === 0}
          onClick={() =>
            gameSession.send({ type: "CREATE_ROOM", payload: { hostName: hostName.trim() } })
          }
        >
          Create Room
        </button>
      </div>
      <div className="border border-cyan-800 p-4 rounded">
        <h2 className="font-bold mb-3">Join Room</h2>
        <input
          className="w-full bg-black border border-cyan-700 px-2 py-1 text-cyan-200 mb-2 uppercase"
          placeholder="ROOM CODE (4 chars)"
          value={joinCode}
          maxLength={4}
          onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
        />
        <input
          className="w-full bg-black border border-cyan-700 px-2 py-1 text-cyan-200 mb-2"
          placeholder="player name"
          value={joinName}
          onChange={(e) => setJoinName(e.target.value)}
        />
        <button
          type="button"
          className="px-4 py-2 bg-cyan-700 text-black font-bold rounded disabled:opacity-40"
          disabled={joinCode.length !== 4 || joinName.trim().length === 0}
          onClick={() =>
            gameSession.send({
              type: "JOIN_ROOM",
              payload: {
                roomCode: joinCode,
                playerName: joinName.trim(),
                deviceType: "phone",
              },
            })
          }
        >
          Join Room
        </button>
      </div>
    </section>
  );
}

function RoomPanel() {
  const state = useGameState();
  if (!state) return null;
  const stored = gameSession.getStored();
  const me = stored ? state.players.find((p) => p.id === stored.playerId) : null;
  const isHost = me?.id === state.hostId;

  return (
    <section className="mt-8 max-w-3xl">
      <div className="flex items-baseline gap-3">
        <h2 className="text-2xl font-bold">
          Room <span className="text-yellow-300">{state.roomCode}</span>
        </h2>
        <span className="text-sm opacity-60">phase: {state.phase}</span>
      </div>
      <p className="text-sm mt-1 opacity-70">
        {state.players.length} player{state.players.length === 1 ? "" : "s"}{" "}
        {isHost && <span className="text-yellow-300">(you are host)</span>}
      </p>
      <ul className="mt-3 space-y-1">
        {state.players.map((p) => (
          <PlayerRow key={p.id} player={p} isMe={p.id === me?.id} isHost={p.id === state.hostId} />
        ))}
      </ul>
      <div className="mt-6 flex gap-2">
        {isHost && state.phase === "LOBBY" && (
          <button
            type="button"
            className="px-4 py-2 bg-yellow-400 text-black font-bold rounded"
            onClick={() =>
              gameSession.send({ type: "START_GAME", payload: { packId: "demo" } })
            }
          >
            Start Game
          </button>
        )}
        <button
          type="button"
          className="px-4 py-2 bg-red-700 text-white rounded"
          onClick={() => {
            gameSession.send({ type: "LEAVE" });
            gameSession.clearStored();
            location.reload();
          }}
        >
          Leave
        </button>
      </div>
    </section>
  );
}

function PlayerRow({ player, isMe, isHost }: { player: Player; isMe: boolean; isHost: boolean }) {
  return (
    <li className="text-sm flex items-center gap-2">
      <span
        className={`inline-block w-2 h-2 rounded-full ${
          player.connected ? "bg-green-400" : "bg-gray-500"
        }`}
      />
      <span className="font-bold">{player.name}</span>
      {isMe && <span className="text-xs opacity-60">(you)</span>}
      {isHost && <span className="text-xs text-yellow-300">[host]</span>}
      <span className="text-xs opacity-40">
        {player.deviceType === "buzz"
          ? `🎮 buzz d${player.buzzSlot?.dongleId}c${player.buzzSlot?.controllerIndex}`
          : "📱 phone"}
      </span>
      <span className="ml-auto text-xs opacity-60">{player.score} pts</span>
    </li>
  );
}
