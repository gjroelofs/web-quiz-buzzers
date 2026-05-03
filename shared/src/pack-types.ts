import { z } from "zod";

// Pack JSON authoring format. Single source of truth for both the
// server-side loader (Zod runtime validation) and the TS types used
// throughout the codebase.

export const MediaSchema = z
  .object({
    type: z.enum(["image", "audio"]),
    // Block path-traversal in pack-supplied paths. Paths starting with /
    // are resolved relative to the static /public dir; bare names are
    // resolved relative to /public/media/{packId}/ at render time.
    src: z
      .string()
      .min(1)
      .max(500)
      .refine((s) => !s.includes(".."), {
        message: "media src must not contain '..'",
      }),
  })
  .nullable();

export const QuestionSchema = z.object({
  text: z.string().min(1).max(500),
  answers: z.tuple([
    z.string().min(1).max(120),
    z.string().min(1).max(120),
    z.string().min(1).max(120),
    z.string().min(1).max(120),
  ]),
  correct: z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3)]),
  category: z.string().min(1).max(60),
  difficulty: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  media: MediaSchema.optional().default(null),
});

export const PackSchema = z.object({
  name: z.string().min(1).max(80),
  description: z.string().min(1).max(400),
  questions: z.array(QuestionSchema).min(1).max(500),
});

export type Question = z.infer<typeof QuestionSchema>;
export type Pack = z.infer<typeof PackSchema>;
export type Media = z.infer<typeof MediaSchema>;

// Round bucketing produced by pack-registry.assignToRounds().
export interface RoundQuestions {
  r1: Question[]; // classic buzz
  r2: Question[]; // speed
  r3: Question[]; // picture/audio (prefers media-bearing)
  final: Question[]; // wager pool
}
