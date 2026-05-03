# Authoring Question Packs

Drop a `.json` file into `packs/`. The server scans this directory at boot,
validates each pack against the Zod schema, and exposes valid packs in the
host lobby's pack picker. Failed packs print clear errors to the server log
and are skipped — they don't crash the server.

## Schema

```json
{
  "name": "Pack Name",
  "description": "Short subtitle, shown under the pack name in the picker",
  "questions": [
    {
      "text": "Question text shown to all players",
      "answers": ["Answer A", "Answer B", "Answer C", "Answer D"],
      "correct": 0,
      "category": "Free-form category tag",
      "difficulty": 1,
      "media": null
    }
  ]
}
```

### Required fields

| Field | Constraint |
|-------|------------|
| `name` | 1–80 chars |
| `description` | 1–400 chars |
| `questions` | 1–500 items |
| `text` | 1–500 chars |
| `answers` | exactly 4 strings, each 1–120 chars |
| `correct` | one of `0`, `1`, `2`, `3` (zero-indexed) |
| `category` | 1–60 chars |
| `difficulty` | one of `1`, `2`, `3` |
| `media` | `null` OR `{ "type": "image"|"audio", "src": "..." }` |

### Media

- `media.src` may be a relative filename (e.g. `"flag.png"`) or absolute path
  (e.g. `"/media/global-flag.png"`).
- Relative names are resolved to `/public/media/{packId}/{src}` where `packId`
  is the JSON filename without extension.
- `..` segments are rejected (path traversal guard).

Example with media:

```json
{
  "text": "Which arcade fighter featured 'Finish Him!'?",
  "answers": ["Street Fighter II", "Mortal Kombat", "Tekken", "Killer Instinct"],
  "correct": 1,
  "category": "Games",
  "difficulty": 1,
  "media": { "type": "image", "src": "mk-flyer.png" }
}
```

Drop `mk-flyer.png` into `public/media/{packId}/mk-flyer.png`.

## Round assignment

The pack loader splits questions into rounds automatically:
- **R3 (picture/audio)** takes up to 4 media-bearing questions first.
- **R1 (classic)** takes the next 4 non-media questions.
- **R2 (speed)** takes the next 4.
- **Final** takes the next 3.

For a complete game you want **at least ~15 questions**, with 3+ media-bearing
ones for the picture/audio round.

## Validation errors

If a pack fails validation, the server logs at boot:

```
[packs] 1 pack(s) failed to load:
  packs/broken.json:
schema validation failed:
  questions.0.correct: Invalid input
```

The path tells you exactly which question + field failed. Fix and restart.
