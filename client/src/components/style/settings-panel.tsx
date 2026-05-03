import { useState } from "react";
import { useSettings } from "@client/lib/settings-context";

// Floating gear button (top-left) that opens a small settings panel.
// Available globally on host + phone routes.
export function SettingsPanel() {
  const [open, setOpen] = useState(false);
  const settings = useSettings();
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="fixed top-2 left-2 z-50 w-8 h-8 rounded-full bg-neon-dark/70 border border-neon-pink/50 text-neon-pink text-base flex items-center justify-center hover:bg-neon-dark"
        aria-label="Settings"
      >
        ⚙
      </button>
      {open && (
        <div className="fixed top-12 left-2 z-50 w-64 bg-neon-dark border-2 border-neon-pink rounded p-3 text-sm space-y-3">
          <h3 className="font-display text-neon-pink uppercase tracking-widest text-xs">
            Settings
          </h3>
          <label className="flex items-center justify-between gap-2">
            <span>Scanlines</span>
            <input
              type="checkbox"
              checked={settings.scanlines}
              onChange={(e) => settings.set("scanlines", e.target.checked)}
            />
          </label>
          <label className="flex items-center justify-between gap-2">
            <span>Reduce motion</span>
            <input
              type="checkbox"
              checked={settings.reducedMotion}
              onChange={(e) => settings.set("reducedMotion", e.target.checked)}
            />
          </label>
          <label className="block">
            <span className="text-xs opacity-70">Music volume</span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={settings.musicVolume}
              onChange={(e) => settings.set("musicVolume", Number(e.target.value))}
              className="w-full accent-pink-500"
            />
          </label>
          <label className="block">
            <span className="text-xs opacity-70">SFX volume</span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={settings.sfxVolume}
              onChange={(e) => settings.set("sfxVolume", Number(e.target.value))}
              className="w-full accent-pink-500"
            />
          </label>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="w-full px-2 py-1 bg-cyan-700 text-black rounded text-xs font-bold"
          >
            Close
          </button>
        </div>
      )}
    </>
  );
}
