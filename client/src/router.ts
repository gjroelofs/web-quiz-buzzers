// Minimal route resolver. Three routes, no react-router needed.

export type Route = "host" | "phone" | "debug-hid";

export function getCurrentRoute(): Route {
  if (typeof window === "undefined") return "host";
  const url = new URL(window.location.href);
  if (url.searchParams.get("debug") === "hid") return "debug-hid";
  if (url.pathname.startsWith("/play")) return "phone";
  return "host";
}

export function getRoomCodeFromUrl(): string {
  if (typeof window === "undefined") return "";
  return new URL(window.location.href).searchParams.get("room")?.toUpperCase() ?? "";
}
