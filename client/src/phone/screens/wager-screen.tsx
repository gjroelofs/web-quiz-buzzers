import { useState } from "react";
import { gameSession } from "@client/state/game-session";
import type { GameState, Player } from "@shared/game-state";

interface Props {
  state: GameState;
  me: Player;
}

// Phone wager UI: continuous slider 0..score, with three quick presets.
// Buzz-controller wagers (Y/G/O/B = 25/50/75/100%) handled in phase 6 lobby + phase 7.
export function WagerScreen({ me }: Props) {
  const max = Math.max(0, me.score);
  const [amount, setAmount] = useState(Math.floor(max / 2));
  const [submitted, setSubmitted] = useState(false);

  const onConfirm = () => {
    if (submitted) return;
    setSubmitted(true);
    gameSession.send({ type: "WAGER", payload: { amount } });
  };

  return (
    <div className="phone-root flex flex-col items-center justify-center px-6 bg-black text-cyan-100">
      <p className="text-xs uppercase opacity-70 tracking-widest">Final wager</p>
      <p className="mt-1 text-sm opacity-80">
        Score: <span className="font-bold">{me.score}</span>
      </p>
      <div className="mt-8 w-full max-w-sm">
        <p className="text-center text-5xl font-black text-yellow-300">{amount}</p>
        <input
          type="range"
          min={0}
          max={max}
          step={1}
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value))}
          disabled={submitted}
          className="w-full mt-4 accent-pink-500"
        />
        <div className="flex justify-between mt-3 gap-2">
          {[25, 50, 75, 100].map((pct) => (
            <button
              key={pct}
              type="button"
              disabled={submitted}
              onClick={() => setAmount(Math.floor((max * pct) / 100))}
              className="flex-1 bg-cyan-800 disabled:opacity-40 text-cyan-100 text-xs py-2 rounded font-bold"
            >
              {pct}%
            </button>
          ))}
        </div>
      </div>
      <button
        type="button"
        onClick={onConfirm}
        disabled={submitted}
        className="mt-10 px-8 py-4 bg-pink-500 disabled:bg-gray-700 text-black font-black uppercase tracking-wider rounded text-xl"
      >
        {submitted ? "Locked" : "Lock In"}
      </button>
    </div>
  );
}
