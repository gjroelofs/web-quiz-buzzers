import type { Pack, Question, RoundQuestions } from "@shared/pack-types";

// Pack assignment knobs. Adjust here, not in callers.
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

  // Slices a pack into round buckets. The last 3 non-media questions are
  // always reserved for the final wager round. All media questions go to R3.
  // Remaining non-media questions are split evenly between R1 and R2.
  assignToRounds(id: string): RoundQuestions | null {
    const pack = this.packs.get(id);
    if (!pack) return null;

    const withMedia = pack.questions.filter((q) => q.media != null);
    const withoutMedia = pack.questions.filter((q) => q.media == null);

    const final = withoutMedia.slice(-FINAL_POOL_SIZE);
    const nonFinal = withoutMedia.slice(0, -FINAL_POOL_SIZE || undefined);

    const r3 = withMedia;
    const half = Math.ceil(nonFinal.length / 2);
    const r1 = nonFinal.slice(0, half);
    const r2 = nonFinal.slice(half);

    return { r1, r2, r3, final };
  }
}

export const packRegistry = new PackRegistry();
