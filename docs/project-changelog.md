# Changelog

## v1.0.0 — Initial release

First playable cut.

### Features
- Bun + Vite + React + TS + Tailwind monorepo-style layout.
- WebHID PlayStation Buzz USB controller support (1-2 dongles, 8 controllers).
- Real-time multiplayer over LAN WebSocket; phones join via QR code.
- Server-authoritative state machine with Zod runtime validation of all inbound messages.
- 4 round formats: classic buzz-in (lock + steal), speed (time-decay scoring), picture/audio, final wager.
- 2 sample question packs (general trivia + 90s neon).
- Retro neon gameshow aesthetic: hot pink + cyan + gold palette, Bungee + Space Grotesk fonts, scanlines, screen shake, confetti.
- Howler-based audio system with phase-driven music + SFX (assets dropped in by host).
- Auto-reconnect with 60s grace period; tab refresh / wifi drop reclaim same player slot.
- Settings persisted to localStorage (scanlines toggle, music + sfx volume).
- Host can manually advance phases via on-screen NEXT button; physical buzz LED feedback.

### Known limitations
- Audio asset MP3s ship as placeholders — system runs silently until host downloads from Pixabay (search terms in `public/audio/CURATION.md`).
- Bit layout for Buzz HID input report is taken from published reverse-engineering and has not been hardware-verified in this session.
- Per-player buzz sound presets, in-app pack editor, replay export, alternate themes — see `docs/development-roadmap.md`.
