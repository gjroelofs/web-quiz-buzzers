# System Architecture

## Topology

LAN-only. Single host PC runs Bun (HTTP + WebSocket). Phones connect over wifi
to the host's LAN IP. Buzz USB dongles are plugged into the host PC and read
via Chrome/Edge's WebHID API in the host browser tab.

```
┌──────────────────────────── HOST PC ──────────────────────────────┐
│                                                                    │
│  Chrome tab (/host)              Bun process                       │
│   ├── React UI                    ├── HTTP (static + /api)         │
│   ├── BuzzManager (WebHID)        ├── WebSocket (/ws)              │
│   └── WSClient ◄────────────────► └── RoomRegistry                 │
│                                       └── Room                     │
│        ▲                                  ├── GameState            │
│        │ inputs                           ├── round-engine         │
│   USB dongle(s)                           ├── TimerManager         │
│   1-2 × Buzz                              └── socket map           │
│                                                                    │
└──────────────────────────────│─────────────────────────────────────┘
                               │ wifi (LAN)
                               ▼
                  ┌─────────────────────────────┐
                  │ Phone (/play?room=XXXX)     │
                  │  ├── React UI               │
                  │  ├── localStorage(session)  │
                  │  └── WSClient               │
                  └─────────────────────────────┘
                          (× N phones)
```

## State

**Server is authoritative.** Clients never modify state locally — they send
typed action messages, receive `STATE_UPDATE` broadcasts, and re-render.

The state machine lives in `server/src/round-engine.ts`. Phases:

```
LOBBY
  ↓ START_GAME (host only, with packId)
ROUND_INTRO
  ↓ NEXT_QUESTION (host)
QUESTION_REVEAL
  ↓ NEXT_QUESTION (host)
BUZZ_OPEN ─────► [R2: timer expires → REVEAL]
  ↓ BUZZ                    [R1/R3: someone buzzes]
ANSWER_LOCK
  ├─ correct ──► REVEAL ──► (NEXT_QUESTION) ──► QUESTION_REVEAL or SCOREBOARD
  ├─ wrong (R1/R3) ──► BUZZ_OPEN (steal mode, original locked out)
  └─ timeout (R1/R3) ──► BUZZ_OPEN (steal mode)
SCOREBOARD
  ↓ NEXT_QUESTION (host)
ROUND_INTRO (round+1)  OR  FINAL_WAGER (after R3)
  ...
FINAL_WAGER → ANSWER_LOCK (R4) → REVEAL → WINNER
```

Round 4 (Final) deviates from the loop: collect wagers, then ask one question,
then one reveal that ends the game.

## Wire protocol

All WS messages are `{ type, payload }` envelopes. Inbound messages
(`ClientMessage`) are validated against a Zod discriminated union. Outbound
messages (`ServerMessage`) are server-authored and trusted.

| Direction | Type | Purpose |
|-----------|------|---------|
| → server | CREATE_ROOM | host requests a new room |
| → server | JOIN_ROOM | join existing room (phone or buzz slot) |
| → server | RECONNECT | rebind playerId after socket drop |
| → server | START_GAME | host kicks off (with packId) |
| → server | BUZZ / ANSWER / WAGER | gameplay actions |
| → server | NEXT_QUESTION | host advances state machine |
| → server | LEAVE | explicit exit |
| → server | PING | ws keepalive |
| ← server | ROOM_CREATED | acks CREATE with code + playerId |
| ← server | JOIN_ACK | acks JOIN/RECONNECT |
| ← server | STATE_UPDATE | full GameState snapshot (broadcast on every change) |
| ← server | ERROR | typed code + human message |
| ← server | PONG | echoes PING |

## Hidden state (server-only)

- `Room.roundQuestions` holds the full `Question` objects including `correct`.
- The public `GameState.currentQuestion` is a `QuestionPublic` projection that
  strips `correct` until reveal — clients can't peek by inspecting devtools.
- `RevealResult.correctIndex` is only attached during the REVEAL phase.

## Reconnect model

- On JOIN/CREATE, server returns a UUID `playerId`. Client persists
  `(roomCode, playerId)` to localStorage.
- On WS open, client auto-fires `RECONNECT { roomCode, playerId }`.
- Server detaches the player's socket on `close`, marks `connected: false`,
  and starts a 60-second grace timer. If a RECONNECT arrives in that window,
  the timer is cancelled and the same player slot is rebound.
- If the grace expires, the player is removed via the LEAVE action.

## Why Bun

- Built-in WebSocket server (no `ws` lib).
- Native TypeScript (`bun --watch server/src/index.ts` works without a build step).
- Single binary serves both `client/dist/` static + `/ws` in production.
- Fast cold start, low memory footprint — fine for a host laptop.
