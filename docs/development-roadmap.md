# Development Roadmap

## v1.0 — Initial Release (current)

All 11 phases complete:
1. Foundation & Tooling — Bun + Vite + React + TS + Tailwind
2. WebHID Buzz Controller Layer
3. Game State Server & Rooms — server-authoritative state machine, Zod-validated WS protocol
4. Question Pack System — JSON packs with Zod schema, 2 sample packs
5. Phone Client & Join Flow — mobile-responsive `/play` route
6. Setup & Lobby Screens — claim-a-slot via big-red press, alphabet name entry, QR code
7. Round Mechanics — R1/R2/R3 + Final Wager with locked scoring constants
8. Game Screens & Flow — 8 host screens, Framer Motion transitions, confetti, screen shake
9. Visual Style System — neon palette, Bungee + Space Grotesk, glow utilities, scanlines
10. Audio System — Howler-backed manager, manifest-driven, missing-file resilient
11. Polish & Testing — README, docs/, settings panel, codebase summary

## Future ideas (not committed)

- **Pack editor UI** — in-app authoring instead of editing JSON
- **More round types** — categories pick, "lightning" rapid-fire, audience predict
- **Per-player buzz sound presets** — picked during name entry
- **Replay export** — JSON log of an entire game for sharing
- **Custom themes** — alternate palettes (synthwave, neon noir, retro green CRT)
- **Spectator mode** — non-playing observers via separate URL
- **Pack sharing index** — community-contributed packs in a registry
- **Internationalization** — UI strings + per-pack locale
- **Cloud-hosted variant** — optional deployment for remote play (would need account model)
