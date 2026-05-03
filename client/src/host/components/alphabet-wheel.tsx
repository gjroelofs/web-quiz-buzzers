import { useEffect, useRef, useState } from "react";
import { buzzManager } from "@client/hid/buzz-manager";
import type { ButtonIndex, ControllerSlot } from "@client/hid/buzz-types";

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ _-";

interface Props {
  dongleId: number;
  controllerIndex: ControllerSlot;
  onSubmit: (name: string) => void;
  onCancel: () => void;
}

// Buzz-controller-driven name entry.
// Yellow (1) = previous letter, Green (2) = next letter,
// Orange (3) = add letter, Blue (4) = submit, Red (0) = backspace.
export function AlphabetWheel({ dongleId, controllerIndex, onSubmit, onCancel }: Props) {
  const [letterIdx, setLetterIdx] = useState(0);
  const [name, setName] = useState("");
  const nameRef = useRef(name);
  nameRef.current = name;

  useEffect(() => {
    return buzzManager.on((p, kind) => {
      if (kind !== "press") return;
      if (p.dongleId !== dongleId || p.controllerIndex !== controllerIndex) return;
      handleButton(p.buttonIndex);
    });
    function handleButton(idx: ButtonIndex) {
      switch (idx) {
        case 0: // RED = backspace, or cancel if name empty
          if (nameRef.current.length === 0) onCancel();
          else setName((n) => n.slice(0, -1));
          return;
        case 1: // YELLOW = prev letter
          setLetterIdx((i) => (i - 1 + ALPHABET.length) % ALPHABET.length);
          return;
        case 2: // GREEN = next letter
          setLetterIdx((i) => (i + 1) % ALPHABET.length);
          return;
        case 3: // ORANGE = add letter
          if (nameRef.current.length < 20) {
            setName((n) => n + ALPHABET[letterIdx]);
          }
          return;
        case 4: // BLUE = submit
          if (nameRef.current.trim().length > 0) onSubmit(nameRef.current.trim());
          return;
      }
    }
  }, [dongleId, controllerIndex, letterIdx, onSubmit, onCancel]);

  const prev = ALPHABET[(letterIdx - 1 + ALPHABET.length) % ALPHABET.length];
  const curr = ALPHABET[letterIdx];
  const next = ALPHABET[(letterIdx + 1) % ALPHABET.length];

  return (
    <div className="border-2 border-pink-500 rounded p-3 text-center">
      <div className="font-mono text-2xl mb-2 min-h-[2rem] tracking-widest">
        <span className="text-cyan-100">{name || "_"}</span>
      </div>
      <div className="flex items-center justify-center gap-3 text-3xl font-bold">
        <span className="opacity-30">{visualize(prev)}</span>
        <span className="text-pink-400 text-5xl bg-pink-500/10 px-3 rounded">
          {visualize(curr)}
        </span>
        <span className="opacity-30">{visualize(next)}</span>
      </div>
      <div className="text-[10px] uppercase tracking-widest opacity-60 mt-2 leading-tight">
        Y prev · G next · O add · B submit · RED del/cancel
      </div>
    </div>
  );
}

function visualize(c: string): string {
  if (c === " ") return "␣";
  if (c === "_") return "_";
  return c;
}
