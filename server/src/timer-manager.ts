// Minimal per-room timer registry. Names are identity strings so callers can
// re-schedule (clear + set) atomically and clear them on phase exit.

export class TimerManager {
  private timers = new Map<string, ReturnType<typeof setTimeout>>();

  schedule(name: string, delayMs: number, cb: () => void): void {
    this.clear(name);
    const t = setTimeout(() => {
      this.timers.delete(name);
      cb();
    }, delayMs);
    this.timers.set(name, t);
  }

  clear(name: string): void {
    const t = this.timers.get(name);
    if (t) {
      clearTimeout(t);
      this.timers.delete(name);
    }
  }

  has(name: string): boolean {
    return this.timers.has(name);
  }

  clearAll(): void {
    for (const t of this.timers.values()) clearTimeout(t);
    this.timers.clear();
  }
}
