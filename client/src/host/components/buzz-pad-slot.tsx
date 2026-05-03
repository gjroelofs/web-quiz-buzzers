import { useEffect } from "react";
import type { Player } from "@shared/game-state";
import type { ControllerSlot } from "@client/hid/buzz-types";
import type { BuzzController } from "@client/hid/buzz-controller";
import { AlphabetWheel } from "./alphabet-wheel";

type SlotMode = "unclaimed" | "naming" | "claimed";

interface Props {
  dongle: BuzzController;
  controllerIndex: ControllerSlot;
  player: Player | null; // matched buzz player or null
  isNaming: boolean; // true when this slot is currently in name-entry
  onSubmitName: (name: string) => void;
  onCancelName: () => void;
}

const COLORS = ["bg-red-500", "bg-yellow-400", "bg-green-500", "bg-orange-500"];

// Renders one of the 4 controllers on a dongle in 1 of 3 visual states.
export function BuzzPadSlot({
  dongle,
  controllerIndex,
  player,
  isNaming,
  onSubmitName,
  onCancelName,
}: Props) {
  const mode: SlotMode = player ? "claimed" : isNaming ? "naming" : "unclaimed";
  const accent = COLORS[controllerIndex];

  // Drive LED: claimed = on (subtle confirmation), naming = on (active),
  // unclaimed = off.
  useEffect(() => {
    const on = mode !== "unclaimed";
    dongle.setLed(controllerIndex, on).catch(() => {});
  }, [dongle, controllerIndex, mode]);

  return (
    <div
      className={`border-2 rounded p-3 ${
        mode === "claimed"
          ? "border-cyan-400 bg-cyan-950/40"
          : mode === "naming"
          ? "border-pink-400"
          : "border-gray-700"
      }`}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className={`inline-block w-3 h-3 rounded-full ${accent}`} />
        <span className="font-bold text-sm">
          Slot {controllerIndex + 1}
        </span>
      </div>
      {mode === "unclaimed" && (
        <p className="text-xs opacity-60">Press the big red button to claim</p>
      )}
      {mode === "naming" && (
        <AlphabetWheel
          dongleId={dongle.dongleId}
          controllerIndex={controllerIndex}
          onSubmit={onSubmitName}
          onCancel={onCancelName}
        />
      )}
      {mode === "claimed" && player && (
        <p className="text-lg font-black text-cyan-100">{player.name}</p>
      )}
    </div>
  );
}
