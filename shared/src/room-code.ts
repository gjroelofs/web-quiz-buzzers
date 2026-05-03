// Crockford-ish alphabet: 32 chars, no I/O/0/1 (avoid confusion when read aloud
// or typed on a phone keyboard). 32^4 = 1,048,576 combinations.
const ROOM_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateRoomCode(rng: () => number = Math.random): string {
  let out = "";
  for (let i = 0; i < 4; i++) {
    out += ROOM_CODE_ALPHABET[Math.floor(rng() * ROOM_CODE_ALPHABET.length)];
  }
  return out;
}

export function isValidRoomCode(code: string): boolean {
  return /^[A-Z0-9]{4}$/.test(code);
}
