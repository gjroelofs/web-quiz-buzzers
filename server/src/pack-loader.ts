import { readdir } from "node:fs/promises";
import { basename, join } from "node:path";
import { PackSchema, type Pack } from "@shared/pack-types";

export interface LoadResult {
  packs: Map<string, Pack>;
  errors: { file: string; message: string }[];
}

// Scans `dir` for *.json files, parses + validates each via PackSchema.
// Returns successfully-loaded packs keyed by id (filename stem).
// Validation errors are collected so the boot log can list them in one place.
export async function loadAllPacks(dir: string): Promise<LoadResult> {
  const packs = new Map<string, Pack>();
  const errors: { file: string; message: string }[] = [];

  let entries: string[];
  try {
    entries = await readdir(dir);
  } catch (err) {
    errors.push({ file: dir, message: `cannot read packs dir: ${(err as Error).message}` });
    return { packs, errors };
  }

  const jsonFiles = entries.filter((f) => f.toLowerCase().endsWith(".json"));

  for (const file of jsonFiles) {
    const id = basename(file, ".json");
    const path = join(dir, file);
    try {
      const text = await Bun.file(path).text();
      const json: unknown = JSON.parse(text);
      const result = PackSchema.safeParse(json);
      if (!result.success) {
        const issues = result.error.issues
          .map((i) => `  ${i.path.join(".") || "(root)"}: ${i.message}`)
          .join("\n");
        errors.push({ file: path, message: `schema validation failed:\n${issues}` });
        continue;
      }
      packs.set(id, result.data);
    } catch (err) {
      errors.push({ file: path, message: (err as Error).message });
    }
  }

  return { packs, errors };
}
