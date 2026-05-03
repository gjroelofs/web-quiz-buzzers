import type { Pack, Question, RoundQuestions } from "@shared/pack-types";

// Pack assignment knobs. Adjust here, not in callers.
const QUESTIONS_PER_ROUND = 4;
const FINAL_POOL_SIZE = 3;

export class PackRegistry {
  private packs = new Map<string, Pack>();

  register(id: string, pack: Pack): void {
    this.packs.set(id, pack);
  }

  registerAll(map: Map<string, Pack>): void {
    for (const [id, p] of map.entries()) this.packs.set(id, p);
  }

  getPack(id: string): Pack | undefined {
    return this.packs.get(id);
  }

  listPacks(): { id: string; name: string; description: string; questionCount: number }[] {
    return Array.from(this.packs.entries()).map(([id, p]) => ({
      id,
      name: p.name,
      description: p.description,
      questionCount: p.questions.length,
    }));
  }

  // Slices a pack into round buckets. R3 prefers media-bearing questions;
  // remaining questions feed R1, R2, then the wager pool.
  // No shuffling: keeps replays deterministic within a session.
  assignToRounds(id: string): RoundQuestions | null {
    const pack = this.packs.get(id);
    if (!pack) return null;

    const all: Question[] = [...pack.questions];
    const withMedia = all.filter((q) => q.media != null);
    const withoutMedia = all.filter((q) => q.media == null);

    const r3 = withMedia.slice(0, QUESTIONS_PER_ROUND);
    const remainingMedia = withMedia.slice(QUESTIONS_PER_ROUND);
    const remaining = [...withoutMedia, ...remainingMedia];

    const r1 = remaining.slice(0, QUESTIONS_PER_ROUND);
    const r2 = remaining.slice(QUESTIONS_PER_ROUND, QUESTIONS_PER_ROUND * 2);
    const final = remaining.slice(
      QUESTIONS_PER_ROUND * 2,
      QUESTIONS_PER_ROUND * 2 + FINAL_POOL_SIZE,
    );

    return { r1, r2, r3, final };
  }
}

export const packRegistry = new PackRegistry();
