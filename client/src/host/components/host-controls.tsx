import { useEffect, useState } from "react";
import { gameSession } from "@client/state/game-session";
import type { GameState } from "@shared/game-state";
import { MagneticButton } from "@client/anim";
import {
  ROUND_INTRO_AUTO_ADVANCE_MS,
  REVEAL_AUTO_ADVANCE_MS,
  SCOREBOARD_AUTO_ADVANCE_MS,
} from "@shared/scoring";

interface Props {
  state: GameState;
}

function autoAdvanceDuration(state: GameState): number {
  switch (state.phase) {
    case "ROUND_INTRO": return ROUND_INTRO_AUTO_ADVANCE_MS;
    case "REVEAL": return REVEAL_AUTO_ADVANCE_MS;
    case "SCOREBOARD": return SCOREBOARD_AUTO_ADVANCE_MS;
    default: return 0;
  }
}

export function HostControls({ state }: Props) {
  const label = nextLabel(state);
  const showPause = state.phase !== "LOBBY" && state.phase !== "WINNER";
  const totalMs = autoAdvanceDuration(state);
  const [progress, setProgress] = useState(1);

  useEffect(() => {
    if (!state.autoAdvanceAt || state.paused || !totalMs) {
      setProgress(1);
      return;
    }
    const tick = () => {
      const remaining = state.autoAdvanceAt! - Date.now();
      setProgress(Math.max(0, Math.min(1, remaining / totalMs)));
    };
    tick();
    const id = setInterval(tick, 50);
    return () => clearInterval(id);
  }, [state.autoAdvanceAt, state.paused, totalMs]);

  return (
    <div className="fixed bottom-4 right-4 z-50 flex gap-2">
      {showPause && (
        <MagneticButton
          onClick={() => gameSession.send({ type: "TOGGLE_PAUSE" })}
          strength={0.35}
          className={`relative px-4 py-3 font-display uppercase tracking-[0.2em] rounded overflow-hidden ${
            state.paused
              ? "bg-neon-green text-black shadow-[0_0_20px_rgba(124,252,0,0.6)]"
              : "bg-cyan-800 text-cyan-100 hover:bg-cyan-700"
          }`}
        >
          <span className="relative z-10">{state.paused ? "▶ Resume" : "⏸ Pause"}</span>
        </MagneticButton>
      )}
      {label && (
        <MagneticButton
          onClick={() => gameSession.send({ type: "NEXT_QUESTION" })}
          strength={0.35}
          className="relative px-6 py-3 bg-neon-pink hover:bg-pink-400 text-black font-display uppercase tracking-[0.25em] rounded shadow-neon overflow-hidden"
        >
          {totalMs > 0 && !state.paused && (
            <span
              className="absolute inset-0 bg-black/30 origin-right"
              style={{ transform: `scaleX(${1 - progress})` }}
            />
          )}
          <span className="relative z-10">{label} →</span>
        </MagneticButton>
      )}
    </div>
  );
}

function nextLabel(state: GameState): string | null {
  switch (state.phase) {
    case "ROUND_INTRO":
      return state.currentRound === 2
        ? "Start Speed Round"
        : state.currentRound === 4
        ? "Begin Final"
        : "Show Question";
    case "BUZZ_OPEN":
      return state.currentRound === 1 || state.currentRound === 3
        ? "Skip Question"
        : null;
    case "REVEAL":
      return "Continue";
    case "SCOREBOARD":
      return state.currentRound === 3 ? "Final Round!" : "Next Round";
    default:
      return null;
  }
}
