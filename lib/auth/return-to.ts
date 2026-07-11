/**
 * Post-auth / post-payment return path. Stored in sessionStorage so it survives
 * H5 pay round-trips; also accepted via `?returnTo=` on login / join entry URLs.
 * Only same-origin relative paths are allowed (open-redirect safe).
 */

const STORAGE_KEY = "seedao.return_to";

/** Allow internal app paths only — blocks protocol-relative and off-site URLs. */
export function normalizeReturnTo(raw: string | null | undefined): string | null {
  if (!raw || typeof raw !== "string") return null;
  const path = raw.trim();
  if (!path.startsWith("/") || path.startsWith("//")) return null;
  if (path.includes("://") || path.includes("\\")) return null;
  if (path.startsWith("/login")) return null;
  return path;
}

export function saveReturnTo(path: string): void {
  const normalized = normalizeReturnTo(path);
  if (!normalized) return;
  try {
    sessionStorage.setItem(STORAGE_KEY, normalized);
  } catch {
    /* storage unavailable */
  }
}

export function readReturnTo(): string | null {
  try {
    return normalizeReturnTo(sessionStorage.getItem(STORAGE_KEY));
  } catch {
    return null;
  }
}

export function clearReturnTo(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

/** Read `?returnTo=` from the current URL and persist when valid. */
export function captureReturnToFromLocation(): void {
  if (typeof window === "undefined") return;
  const raw = new URLSearchParams(window.location.search).get("returnTo");
  const normalized = normalizeReturnTo(raw);
  if (normalized) saveReturnTo(normalized);
}

/** Return path and clear storage — call once when auth/payment succeeds. */
export function consumeReturnTo(fallback = "/profile"): string {
  const path = readReturnTo() ?? normalizeReturnTo(fallback) ?? "/profile";
  clearReturnTo();
  return path;
}

export function loginHref(returnTo: string): string {
  const path = normalizeReturnTo(returnTo);
  if (!path) return "/login";
  return `/login?returnTo=${encodeURIComponent(path)}`;
}

export function joinHref(returnTo?: string | null): string {
  const path = normalizeReturnTo(returnTo ?? readReturnTo());
  if (!path) return "/?join=1#membership";
  return `/?join=1&returnTo=${encodeURIComponent(path)}#membership`;
}

/** Server-side gate: session exists but not a paying member → finish on Join tab. */
export function joinRedirectPath(returnTo: string): string {
  return joinHref(returnTo);
}

/** Server-side gate: no session → login, preserving the intended destination. */
export function loginRedirectPath(returnTo: string): string {
  return loginHref(returnTo);
}

/** Client: login link for the current page (or an explicit path). */
export function loginHrefForCurrentPage(pathname?: string): string {
  if (pathname) return loginHref(pathname);
  if (typeof window === "undefined") return "/login";
  return loginHref(`${window.location.pathname}${window.location.search}`);
}
