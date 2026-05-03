import { networkInterfaces } from "node:os";
import { packRegistry } from "./pack-registry";

let cachedLanIps: string[] | null = null;

function detectLanIps(): string[] {
  if (cachedLanIps) return cachedLanIps;
  const out: string[] = [];
  const ifaces = networkInterfaces();
  for (const name of Object.keys(ifaces)) {
    for (const iface of ifaces[name] ?? []) {
      if (iface.family === "IPv4" && !iface.internal) out.push(iface.address);
    }
  }
  cachedLanIps = out;
  return out;
}

// GET /api/server-info → { lanIps, packs }. Used by host UI to render the
// QR code (with the host's LAN IP) and the pack picker.
export function handleApiServerInfo(): Response {
  const body = JSON.stringify({
    lanIps: detectLanIps(),
    packs: packRegistry.listPacks(),
  });
  return new Response(body, {
    headers: { "content-type": "application/json" },
  });
}
