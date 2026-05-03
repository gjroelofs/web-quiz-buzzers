import { useState } from "react";
import { buzzManager } from "@client/hid/buzz-manager";

interface Props {
  onContinue: () => void;
}

// Pre-lobby: prompts host to grant WebHID and connect at least one Buzz dongle.
// Continues to LobbyScreen once 1+ dongles are attached, OR allows skipping
// (phone-only games are valid).
export function SetupScreen({ onContinue }: Props) {
  const [error, setError] = useState<string | null>(null);
  const supported = buzzManager.isSupported();

  const onConnectDongle = async () => {
    setError(null);
    try {
      const c = await buzzManager.requestDongle();
      if (c) onContinue();
    } catch (e) {
      setError(String(e));
    }
  };

  return (
    <div className="min-h-screen bg-black text-cyan-200 p-10 font-mono flex flex-col items-center justify-center">
      <h1 className="text-6xl font-black tracking-widest text-pink-400">BUZZ QUIZ</h1>
      <p className="mt-2 text-sm opacity-60 uppercase tracking-widest">host setup</p>

      <div className="mt-12 max-w-xl text-center space-y-6">
        {supported ? (
          <>
            <p>
              Plug in a PlayStation Buzz USB dongle (one dongle = 4 controllers),
              then click below to grant browser access.
            </p>
            <button
              type="button"
              onClick={onConnectDongle}
              className="px-8 py-4 bg-cyan-500 text-black font-black uppercase tracking-wider rounded text-xl"
            >
              Connect Buzz Dongle
            </button>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <p className="text-xs opacity-60">
              No buzzers? You can play with phones only —{" "}
              <button type="button" onClick={onContinue} className="underline">
                skip to lobby
              </button>
              .
            </p>
          </>
        ) : (
          <>
            <p className="text-red-400">
              WebHID is not supported in this browser. Buzz controllers require Chrome or Edge.
            </p>
            <button
              type="button"
              onClick={onContinue}
              className="px-6 py-3 bg-cyan-700 text-black font-bold rounded"
            >
              Continue with phones only
            </button>
          </>
        )}
      </div>
    </div>
  );
}
