import { useEffect } from "react";

// Suppresses iOS double-tap zoom (which fires on .25-.5s repeated taps)
// and pinch zoom. Pairs with the viewport meta in index.html.
export function usePreventZoom(): void {
  useEffect(() => {
    let lastTap = 0;
    const onTouchEnd = (e: TouchEvent) => {
      const now = Date.now();
      if (now - lastTap < 350) e.preventDefault();
      lastTap = now;
    };
    const onGestureStart = (e: Event) => e.preventDefault();
    document.addEventListener("touchend", onTouchEnd, { passive: false });
    document.addEventListener("gesturestart", onGestureStart);
    return () => {
      document.removeEventListener("touchend", onTouchEnd);
      document.removeEventListener("gesturestart", onGestureStart);
    };
  }, []);
}
