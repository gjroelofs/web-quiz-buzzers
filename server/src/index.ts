import { networkInterfaces } from "node:os";
import { websocketHandler } from "./websocket-handler";
import { rooms } from "./rooms";
import { emptySocketData } from "./socket-data";
import { loadAllPacks } from "./pack-loader";
import { packRegistry } from "./pack-registry";
import { handleApiServerInfo } from "./api-routes";

const PORT = Number(process.env.PORT ?? 3000);
const IS_PROD = process.env.NODE_ENV === "production";
const DIST_DIR = "client/dist";

// Load packs synchronously at boot. Errors are reported but do not abort —
// the server stays usable even if some packs fail to validate.
{
  const { packs, errors } = await loadAllPacks("./packs");
  packRegistry.registerAll(packs);
  if (errors.length) {
    console.warn(`[packs] ${errors.length} pack(s) failed to load:`);
    for (const e of errors) console.warn(`  ${e.file}:\n${e.message}`);
  }
  console.log(`[packs] ${packs.size} pack(s) loaded: ${[...packs.keys()].join(", ") || "(none)"}`);
}

rooms.startGcLoop();

const server = Bun.serve({
  port: PORT,
  hostname: "0.0.0.0",
  fetch(req, server) {
    const url = new URL(req.url);
    if (url.pathname === "/ws") {
      // Initialize per-socket data; the message router populates playerId/roomCode on join.
      if (server.upgrade(req, { data: emptySocketData() })) return;
      return new Response("WebSocket upgrade failed", { status: 400 });
    }
    if (url.pathname === "/api/server-info") return handleApiServerInfo();
    return handleHttp(url);
  },
  websocket: websocketHandler,
});

logBootInfo(server.port ?? PORT);

async function handleHttp(url: URL): Promise<Response> {
  if (!IS_PROD) {
    return new Response(
      "Dev mode: open http://localhost:5173 (Vite serves the client)",
      { status: 200 },
    );
  }
  const path = url.pathname === "/" ? "/index.html" : url.pathname;
  // Reject path traversal attempts before touching the filesystem.
  if (path.includes("..")) return new Response("not found", { status: 404 });
  const file = Bun.file(`${DIST_DIR}${path}`);
  if (await file.exists()) return new Response(file);
  // SPA fallback only for routes that look like HTML pages (no file extension).
  // A missing /assets/foo.js must 404, not silently return index.html with the wrong MIME.
  const lastSegment = path.split("/").pop() ?? "";
  if (lastSegment.includes(".")) return new Response("not found", { status: 404 });
  return new Response(Bun.file(`${DIST_DIR}/index.html`));
}

function logBootInfo(port: number) {
  const lanIps = getLanIps();
  console.log("");
  console.log("  Buzz Quiz server running");
  console.log("");
  console.log(`    Local:    http://localhost:${port}`);
  for (const ip of lanIps) {
    console.log(`    Network:  http://${ip}:${port}`);
  }
  console.log("");
  if (!IS_PROD) {
    console.log("    Dev: open Vite at http://localhost:5173 (HTTP) — WS proxied to this server");
    console.log("");
  }
}

function getLanIps(): string[] {
  const out: string[] = [];
  const ifaces = networkInterfaces();
  for (const name of Object.keys(ifaces)) {
    for (const iface of ifaces[name] ?? []) {
      if (iface.family === "IPv4" && !iface.internal) out.push(iface.address);
    }
  }
  return out;
}
