import { generateRoomCode } from "@shared/room-code";
import { Room } from "./room";

export class RoomRegistry {
  private rooms = new Map<string, Room>();
  private gcInterval: ReturnType<typeof setInterval> | null = null;

  create(hostId: string): Room {
    let code = generateRoomCode();
    // Vanishingly improbable but handle the collision anyway.
    while (this.rooms.has(code)) code = generateRoomCode();
    const room = new Room(code, hostId);
    this.rooms.set(code, room);
    return room;
  }

  get(code: string): Room | undefined {
    return this.rooms.get(code.toUpperCase());
  }

  delete(code: string): void {
    const room = this.rooms.get(code.toUpperCase());
    if (room) {
      room.destroy();
      this.rooms.delete(code.toUpperCase());
    }
  }

  size(): number {
    return this.rooms.size;
  }

  startGcLoop(intervalMs = 60_000): void {
    if (this.gcInterval) return;
    this.gcInterval = setInterval(() => {
      for (const [code, room] of this.rooms.entries()) {
        if (room.isEmpty()) {
          this.rooms.delete(code);
          console.log(`[rooms] pruned empty room ${code}`);
        }
      }
    }, intervalMs);
  }

  stopGcLoop(): void {
    if (this.gcInterval) {
      clearInterval(this.gcInterval);
      this.gcInterval = null;
    }
  }
}

export const rooms = new RoomRegistry();
