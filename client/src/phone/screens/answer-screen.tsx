import { useState } from "react";
import { gameSession } from "@client/state/game-session";
import type { GameState, Player } from "@shared/game-state";

interface Props {
  state: GameState;
  me: Player;
}

// 4 answer buttons in a 2x2 grid. Colors mirror the Buzz controller answer
// buttons: Yellow=A, Green=B, Orange=C, Blue=D.
const BUTTONS: { choice: 0 | 1 | 2 | 3; bg: string; text: string }[] = [
  { choice: 0, bg: "bg-yellow-400", text: "text-black" },
  { choice: 1, bg: "bg-green-500", text: "text-black" },
  { choice: 2, bg: "bg-orange-500", text: "text-black" },
  { choice: 3, bg: "bg-blue-500", text: "text-white" },
];

export function AnswerScreen({ state }: Props) {
  const [submitted, setSubmitted] = useState<number | null>(null);
  const q = state.currentQuestion;

  const onTap = (choice: 0 | 1 | 2 | 3) => {
    if (submitted !== null) return;
    setSubmitted(choice);
    gameSession.send({ type: "ANSWER", payload: { choice } });
  };

  return (
    <div className="phone-root flex flex-col bg-black">
      <header className="px-4 py-2 text-xs uppercase tracking-widest text-cyan-400">
        Pick an answer
      </header>
      <div className="grid grid-cols-2 grid-rows-2 gap-1 flex-1">
        {BUTTONS.map(({ choice, bg, text }) => {
          const label = q?.answers[choice] ?? letterFor(choice);
          const inactive = submitted !== null && submitted !== choice;
          return (
            <button
              key={choice}
              type="button"
              onClick={() => onTap(choice)}
              className={`${bg} ${text} text-2xl font-black px-3 ${
                inactive ? "opacity-30" : ""
              } active:brightness-110`}
            >
              <span className="block text-3xl font-black opacity-70">{letterFor(choice)}</span>
              <span className="block mt-2 text-base font-bold leading-tight break-words">
                {label}
              </span>
            </button>
          );
        })}
      </div>
      {submitted !== null && (
        <div className="px-4 py-2 text-center text-sm text-cyan-300">
          Locked: {letterFor(submitted as 0 | 1 | 2 | 3)}
        </div>
      )}
    </div>
  );
}

function letterFor(choice: 0 | 1 | 2 | 3): string {
  return ["A", "B", "C", "D"][choice];
}
