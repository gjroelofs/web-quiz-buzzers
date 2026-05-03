import { useSyncExternalStore } from "react";
import type { GameState } from "@shared/game-state";

// Tiny external store holding the latest server-broadcast GameState.
// React components subscribe via useGameState(); non-React code can call
// getGameState() / setGameState().

let state: GameState | null = null;
const listeners = new Set<() => void>();

export function setGameState(next: GameState | null): void {
  state = next;
  for (const l of listeners) l();
}

export function getGameState(): GameState | null {
  return state;
}

export function useGameState(): GameState | null {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => {
        listeners.delete(cb);
      };
    },
    () => state,
    () => null,
  );
}
