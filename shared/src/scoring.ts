// All scoring math + round timing constants. Pure functions so the round
// engine and any future unit tests share one source of truth.

// R1 — Classic Buzz-In
export const R1_BASELINE = 100;
export const R1_STEAL_BONUS_MULTIPLIER = 1.5; // stealer earns 1.5× baseline = 150
export const R1_ORIGINAL_PENALTY_ON_STEAL = 50; // taken from original buzzer when steal succeeds
export const R1_STEAL_WRONG_PENALTY = 50; // stealer loses on wrong steal

// R3 — Picture/Audio reuses R1 mechanics with a 2× baseline.
export const R3_BASELINE = 200;
export const R3_STEAL_BONUS_MULTIPLIER = 1.5; // 200 × 1.5 = 300
export const R3_ORIGINAL_PENALTY_ON_STEAL = 100;
export const R3_STEAL_WRONG_PENALTY = 100;

// R2 — Speed Round
export const R2_BASELINE = 100;
export const R2_WINDOW_MS = 10_000;
export const R2_MIN_CORRECT_REWARD = 10;

// Final — Wager Round
export const FINAL_WAGER_WINDOW_MS = 20_000;
export const FINAL_ANSWER_WINDOW_MS = 15_000;

// Phase windows
export const BUZZ_ANSWER_WINDOW_MS = 5_000;
export const STEAL_ANSWER_WINDOW_MS = 3_000;
export const QUESTION_REVEAL_AUTO_ADVANCE_MS = 3_000;
export const ROUND_INTRO_AUTO_ADVANCE_MS = 3_000;
export const SCOREBOARD_AUTO_ADVANCE_MS = 20_000;
export const REVEAL_AUTO_ADVANCE_MS = 6_000;

// Buzz-open windows (max idle wait before auto-reveal). For R1/R3 this lets
// us not stall forever if nobody buzzes; clients may also trigger via host.
export const BUZZ_OPEN_IDLE_MS = 15_000;

export interface RoundParams {
  baseline: number;
  stealMultiplier: number;
  originalPenaltyOnSteal: number;
  stealWrongPenalty: number;
}

export const R1_PARAMS: RoundParams = {
  baseline: R1_BASELINE,
  stealMultiplier: R1_STEAL_BONUS_MULTIPLIER,
  originalPenaltyOnSteal: R1_ORIGINAL_PENALTY_ON_STEAL,
  stealWrongPenalty: R1_STEAL_WRONG_PENALTY,
};

export const R3_PARAMS: RoundParams = {
  baseline: R3_BASELINE,
  stealMultiplier: R3_STEAL_BONUS_MULTIPLIER,
  originalPenaltyOnSteal: R3_ORIGINAL_PENALTY_ON_STEAL,
  stealWrongPenalty: R3_STEAL_WRONG_PENALTY,
};

// Computes a Speed Round answer score. Linear decay from baseline at t=0
// to MIN_CORRECT_REWARD as the window approaches the cap. Wrong = 0.
export function computeR2Score(correct: boolean, elapsedMs: number): number {
  if (!correct) return 0;
  const clampedElapsed = Math.max(0, Math.min(elapsedMs, R2_WINDOW_MS));
  const ratio = 1 - clampedElapsed / R2_WINDOW_MS;
  return Math.max(R2_MIN_CORRECT_REWARD, Math.round(R2_BASELINE * ratio));
}

// Resolves the "what does each round play like" config for a given round index.
// Returns null for round 4 (Final) which uses its own wager logic.
export function paramsForRound(round: 1 | 2 | 3 | 4): RoundParams | null {
  if (round === 1) return R1_PARAMS;
  if (round === 3) return R3_PARAMS;
  return null;
}
