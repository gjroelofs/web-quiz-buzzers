import { useEffect, useState } from "react";
import { gameSession } from "@client/state/game-session";
import type { GameState, Player } from "@shared/game-state";

interface Props {
  state: GameState;
  me: Player;
}

export function BuzzScreen({ state, me }: Props) {
  const [armed, setArmed] = useState(true);
  const lockedOut = state.lockedOutPlayerIds.includes(me.id);

  // Re-arm when entering BUZZ_OPEN fresh (e.g., next question).
  useEffect(() => {
    setArmed(true);
  }, [state.phase, state.questionIndex]);

  const onTap = () => {
    if (!armed || lockedOut) return;
    setArmed(false);
    gameSession.send({ type: "BUZZ" });
  };

  if (lockedOut) {
    return (
      <div className="phone-root flex items-center justify-center bg-gray-900 text-gray-400 text-center px-6">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-widest">Locked Out</h1>
          <p className="mt-3 opacity-70">You buzzed wrong — sit this one out.</p>
        </div>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onTap}
      className={`phone-fullscreen-button uppercase tracking-widest text-7xl ${
        armed ? "bg-pink-500 text-black active:bg-pink-400" : "bg-gray-800 text-gray-500"
      }`}
    >
      {armed ? "BUZZ" : "Buzzed"}
    </button>
  );
}
