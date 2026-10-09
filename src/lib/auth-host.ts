// Where is the app running? The managed sign-in broker route (/~oauth/initiate)
// exists on Lovable-hosted surfaces, including custom domains connected through
// Lovable. On other hosts (Vercel, a custom server, or a static export), that
// route does not exist, so those hosts must talk to the auth service directly.
const LOVABLE_ZONES = [
  "lovable.app",
  "lovableproject.com",
  "lovable.dev",
  "gptengineer.app",
  "gptengineer.run",
];

const LOVABLE_CUSTOM_HOSTS = new Set([
  "terrabangla.yasar.earth",
]);

export function usesLovableAuthBroker(): boolean {
  if (typeof window === "undefined") return true;
  const host = window.location.hostname;
  if (host === "localhost" || host === "127.0.0.1") return true;
  if (LOVABLE_CUSTOM_HOSTS.has(host)) return true;
  return LOVABLE_ZONES.some((zone) => host === zone || host.endsWith("." + zone));
}

export function safeAuthNext(value: string | null | undefined): "/admin" | "/chat" | "/reference" {
  if (value === "/admin" || value === "/reference") return value;
  return "/chat";
}
