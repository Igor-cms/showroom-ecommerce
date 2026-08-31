// Shared CORS helpers for Customer Account API edge functions.
// Cookies require a specific origin (not "*") plus Allow-Credentials: true.

export function buildCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("origin") ?? "*";
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type, cookie, x-session-id",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Vary": "Origin",
  };
}

export function parseCookie(header: string | null, name: string): string | null {
  if (!header) return null;
  for (const part of header.split(/;\s*/)) {
    const [k, ...rest] = part.split("=");
    if (k === name) return decodeURIComponent(rest.join("="));
  }
  return null;
}

// The session id can arrive either as the httpOnly cookie (works when the
// browser allows it) or via the x-session-id header (localStorage fallback for
// browsers that block third-party cookies — Safari/ITP and incognito windows).
export function getSessionId(req: Request): string | null {
  const header = req.headers.get("x-session-id");
  if (header) return header.trim();
  return parseCookie(req.headers.get("cookie"), "session_id");
}

export function sessionCookie(sessionId: string, maxAgeSec: number): string {
  // Cross-site cookie: must be SameSite=None + Secure for cross-origin fetches.
  return `session_id=${sessionId}; HttpOnly; Secure; SameSite=None; Path=/; Max-Age=${maxAgeSec}`;
}

export function clearCookie(): string {
  return `session_id=; HttpOnly; Secure; SameSite=None; Path=/; Max-Age=0`;
}
