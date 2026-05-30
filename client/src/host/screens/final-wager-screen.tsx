import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { GameState } from "@shared/game-state";
import { PlayerAvatar } from "../components/player-avatar";
import { CountdownBar } from "../components/countdown-bar";
import { FINAL_WAGER_WINDOW_MS } from "@shared/scoring";
import { AnimatedBg, CountUp, SlamIn, flashScreen } from "@client/anim";

interface Props {
  state: GameState;
}

export function FinalWagerScreen({ state }: Props) {
  const wagered = Object.keys(state.wagers ?? {}).length;
  const total = state.players.length;

  useEffect(() => {
    flashScreen("gold", 0.55, 0.7);
  }, []);

  return (
    <div className="min-h-screen text-cyan-100 px-8 py-6 flex flex-col items-center relative overflow-hidden">
      <AnimatedBg variant="danger" />

      <SlamIn flash="gold" scaleFrom={3.5}>
        <h1 className="text-7xl md:text-8xl font-display text-neon-gold tracking-wider mt-6 text-glow-gold animate-chromatic-shake">
          FINAL WAGER
        </h1>
      </SlamIn>

      <motion.p
        initial={{ y: 18, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="mt-2 opacity-90 text-center max-w-md text-cyan-200"
      >
        Each player chooses how much to wager. After everyone locks in, the
        question reveals. No input = 20% wager.
      </motion.p>

      <motion.div
        initial={{ y: 12, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="mt-4 flex flex-col items-center gap-3 font-display"
      >
        {/* Buzz controller mockup */}
        <div className="flex flex-col items-center bg-gradient-to-b from-gray-700 to-gray-900 rounded-2xl px-7 pt-5 pb-6 border border-gray-600 shadow-[0_8px_32px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.1)] w-52">
          {/* Red buzzer button */}
          <div className="w-24 h-24 rounded-full bg-gradient-to-b from-red-400 to-red-700 flex items-center justify-center text-white font-bold text-2xl shadow-[0_4px_0_#7f1d1d,0_6px_16px_rgba(220,38,38,0.5)] border-2 border-red-900/50">
            100%
          </div>
          {/* Colored answer buttons */}
          <div className="flex flex-col gap-2 mt-5 w-full">
            <div className="h-11 rounded-md bg-gradient-to-b from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-[0_3px_0_#1e3a5f,inset_0_1px_0_rgba(255,255,255,0.3)] border border-blue-800/50">80%</div>
            <div className="h-11 rounded-md bg-gradient-to-b from-orange-400 to-orange-600 flex items-center justify-center text-black font-bold text-lg shadow-[0_3px_0_#7c2d12,inset_0_1px_0_rgba(255,255,255,0.3)] border border-orange-800/50">60%</div>
            <div className="h-11 rounded-md bg-gradient-to-b from-green-400 to-green-600 flex items-center justify-center text-black font-bold text-lg shadow-[0_3px_0_#14532d,inset_0_1px_0_rgba(255,255,255,0.3)] border border-green-800/50">40%</div>
            <div className="h-11 rounded-md bg-gradient-to-b from-yellow-300 to-yellow-500 flex items-center justify-center text-black font-bold text-lg shadow-[0_3px_0_#713f12,inset_0_1px_0_rgba(255,255,255,0.3)] border border-yellow-700/50">20%</div>
          </div>
        </div>
      </motion.div>

      <motion.p
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.8, ease: [0.34, 1.56, 0.64, 1] }}
        className="mt-8 text-3xl font-display"
      >
        <CountUp
          value={wagered}
          className="text-neon-gold text-4xl text-glow-gold"
        />{" "}
        / {total} wagered
      </motion.p>

      {state.buzzWindowEndsAt && (
        <div className="mt-6 w-80">
          <CountdownBar endsAt={state.buzzWindowEndsAt} totalMs={FINAL_WAGER_WINDOW_MS} paused={state.paused} />
        </div>
      )}

      <ul className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-2 max-w-4xl w-full">
        <AnimatePresence>
          {state.players.map((p, idx) => {
            const w = state.wagers?.[p.id];
            const locked = w != null;
            return (
              <motion.li
                key={p.id}
                layout
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 + idx * 0.06, type: "spring", stiffness: 240, damping: 18 }}
                className={`flex items-center gap-3 rounded p-2 border-2 transition-colors ${
                  locked
                    ? "border-neon-green bg-green-950/40 shadow-[0_0_24px_rgba(124,252,0,0.45)]"
                    : "border-cyan-800 bg-cyan-950/40"
                }`}
              >
                <PlayerAvatar player={p} size="sm" highlight={locked} />
                <div className="flex-1 min-w-0">
                  <p className="font-display tracking-wider truncate">{p.name}</p>
                  <p className="text-xs opacity-70 tabular-nums">{p.score} pts</p>
                </div>
                {locked ? (
                  <span className="text-sm font-display text-neon-green">⚡{w}</span>
                ) : (
                  <span className="text-sm font-display opacity-40 animate-pulse">…</span>
                )}
              </motion.li>
            );
          })}
        </AnimatePresence>
      </ul>
    </div>
  );
}
