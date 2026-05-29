import type { GameState, QuestionPublic } from "@shared/game-state";

// Privacy-preserving projection applied to GameState before any client
// broadcast. Strips per-player private values that the room knows internally
// but must not leak to other players via STATE_UPDATE / devtools.
//
// The shape stays identical to GameState — values are zeroed, keys preserved
// — so client UIs can still count "X of N answered/wagered" without seeing
// what each player actually picked.

const HIDDEN_QUESTION: QuestionPublic = {
  text: "",
  answers: ["?", "?", "?", "?"],
  category: "",
  media: null,
};

export function projectStateForBroadcast(state: GameState): GameState {
  // Wagers are visible to all players (shared screen party game).
  let out: GameState = { ...state, answerMap: undefined };

  // Strip per-player speed-round picks (and timestamps) until reveal — keep
  // keys for "X/N answered" counter UI on the host screen.
  if (state.speedRoundAnswers && state.phase !== "REVEAL") {
    const ids = Object.keys(state.speedRoundAnswers);
    if (ids.length > 0) {
      const stripped: Record<string, { choice: number; timestamp: number }> = {};
      for (const id of ids) stripped[id] = { choice: -1, timestamp: 0 };
      out = { ...out, speedRoundAnswers: stripped };
    }
  }

  // During FINAL_WAGER the question must stay hidden — wagers are placed
  // sight-unseen. The full question reveals when ANSWER_LOCK opens.
  if (state.phase === "FINAL_WAGER" && state.currentQuestion) {
    out = { ...out, currentQuestion: HIDDEN_QUESTION };
  }

  return out;
}
