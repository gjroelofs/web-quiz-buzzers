# Codebase Summary

## Top-level layout

```
server/        Bun WebSocket server, room/state machine, pack loader
client/        Vite + React frontend (host + phone routes)
shared/        TS types + pure logic (scoring, schemas) used by both
packs/         JSON question packs (drop-in)
public/        Static assets: audio (manifest + mp3s), media files
docs/          Developer + user docs (this dir)
plans/         Implementation plan and per-phase reports
```

Path aliases (configured in `tsconfig.json` + `vite.config.ts`):
- `@shared/*` → `shared/src/*`
- `@server/*` → `server/src/*`
- `@client/*` → `client/src/*`

## Key files

### Server (`server/src/`)

- `index.ts` — Bun.serve entrypoint: HTTP, WS upgrade, /api/server-info, prod static serving.
- `websocket-handler.ts` — thin Bun WebSocketHandler that defers to message-router.
- `message-router.ts` — Zod-validates inbound messages, dispatches to Room methods.
- `room.ts` — per-room state container; runs round-engine, broadcasts STATE_UPDATE, owns timers + sockets.
- `rooms.ts` — RoomRegistry singleton with empty-room GC.
- `reducer.ts` — pure state transitions for JOIN_ROOM / LEAVE / START_GAME.
- `round-engine.ts` — pure-ish state machine for rounds (handleBuzz, handleAnswer, handleWager, handleTimerExpired).
- `timer-manager.ts` — per-room named-timer registry.
- `pack-loader.ts` — scans /packs, validates against PackSchema.
- `pack-registry.ts` — holds loaded packs, assignToRounds().
- `socket-data.ts` — per-WS data shape (playerId, roomCode).
- `api-routes.ts` — GET /api/server-info → { lanIps, packs }.

### Shared (`shared/src/`)

- `messages.ts` — ClientMessage + ServerMessage discriminated unions.
- `messages-zod.ts` — Zod schemas mirroring messages.ts; runtime validation.
- `game-state.ts` — GameState, Player, QuestionPublic, RevealResult types.
- `pack-types.ts` — Zod schemas for Pack/Question/Media + RoundQuestions type.
- `scoring.ts` — round constants (R1 +150/-50, R2 decay, etc.) + computeR2Score().
- `room-code.ts` — 4-char Crockford-ish room code generator.
- `buzz-constants.ts` — VID/PID, BUTTON_NAMES, ANSWER_BUTTON_TO_CHOICE map.

### Client — host (`client/src/host/`)

- `host-client.tsx` — root for `/host`. Auto-CREATE_ROOM on connect, gates Setup→Lobby.
  Hosts BuzzGameInputs (translates HID events into game actions) + audio + screen routing.
- `screen-router.tsx` — AnimatePresence wrapper picking the screen for current phase.
- `screens/lobby-screen.tsx` — main pre-game lobby (slots + QR + pack picker).
- `screens/setup-screen.tsx` — initial WebHID grant.
- `screens/{round-intro,question-reveal,buzz-in,answer-lock,reveal,round-scoreboard,final-wager,winner}-screen.tsx` — one per game phase.
- `components/{player-avatar,score-badge,countdown-bar,media-player,score-delta-popup,host-controls}.tsx`
- `components/{buzz-pad-slot,alphabet-wheel,qr-code,pack-picker}.tsx` — lobby-specific.

### Client — phone (`client/src/phone/`)

- `phone-client.tsx` — root for `/play`. Routes by phase, prevents zoom, shows ConnectionPill.
- `screens/{join,waiting,buzz,answer,wager}-screen.tsx`.
- `components/connection-pill.tsx`, `use-prevent-zoom.ts`, `phone-styles.css`.

### Client — shared (`client/src/`)

- `App.tsx` — routes `?debug=hid` / `/play` / default.
- `main.tsx` — React mount + SettingsProvider + ScanlineOverlay.
- `router.ts` — getCurrentRoute() + getRoomCodeFromUrl().
- `lib/ws-client.ts` — auto-reconnecting typed WS wrapper.
- `lib/use-confetti.ts`, `lib/use-screen-shake.ts`, `lib/settings-context.tsx`.
- `state/game-store.ts` — useSyncExternalStore over latest GameState.
- `state/game-session.ts` — wraps WSClient; persists (roomCode, playerId) for reconnect.
- `hid/{buzz-controller,buzz-manager,buzz-bit-layout,buzz-types,buzz-debug-overlay}.tsx`
- `hooks/use-buzz-events.ts` — subscribe to BuzzManager from React.
- `audio/{audio-manager,use-audio,use-phase-audio}.ts` — Howler-backed.
- `components/style/{neon-button,neon-text,glow-card,scanline-overlay}.tsx`

## Data flow (typical buzz event)

```
Buzz controller hardware
  → BuzzController parses 6-byte HID input report → diff → press event
  → BuzzManager re-emits with dongleId
  → BuzzGameInputs (in HostClient) routes to game action
  → gameSession.send({ type: "BUZZ" })
  → WSClient ws.send(JSON.stringify(...))
  → Bun.serve message handler
  → message-router parses + Zod-validates
  → Room.handleBuzz(playerId)
  → round-engine.handleBuzz(state, playerId) → { state, schedule }
  → Room.applyEngine: timer scheduled, state set, broadcast()
  → All connected clients receive STATE_UPDATE
  → setGameState(...) → React useSyncExternalStore re-renders
  → ScreenRouter swaps to AnswerLockScreen (or steal-mode BuzzInScreen)
```
