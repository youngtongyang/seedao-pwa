"use client";

import { useSyncExternalStore } from "react";
import { clearAccount } from "@/lib/account";

/**
 * Reactive client view of login state. "Logged in" means **active paid member**:
 * the auth routes set the readable `seedao.authed` cookie only for members (a
 * registered-but-unpaid user holds the httpOnly session token but no `authed`).
 * This hook reads that hint via `useSyncExternalStore` (SSR-safe: the server
 * snapshot is always `false`, so no hydration mismatch) and re-reads when
 * `refreshAuth`/`logout` fire.
 */
const AUTHED_COOKIE = "seedao.authed";
const listeners = new Set<() => void>();

function hasAuthCookie(): boolean {
  if (typeof document === "undefined") return false;
  return document.cookie
    .split("; ")
    .some((c) => c.startsWith(`${AUTHED_COOKIE}=`));
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

function notify() {
  for (const l of listeners) l();
}

/** Re-read auth state from cookies — call once a login response has landed. */
export function refreshAuth() {
  notify();
}

/** Drop the readable authed hint + local account cache and notify subscribers. */
export function syncAuthUi() {
  if (typeof document !== "undefined") {
    // Match Path/SameSite/Secure variants so the readable hint actually clears.
    const expire = `${AUTHED_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
    document.cookie = expire;
    document.cookie = `${expire}; Secure`;
  }
  clearAccount();
  notify();
}

/**
 * Call after any authenticated `/api/*` response with status 401.
 * Server should already have cleared cookies via Set-Cookie; this syncs React UI.
 */
export function handleUnauthorizedResponse(res: Response): void {
  if (res.status === 401) syncAuthUi();
}

/** Clear the session on the server, then update the UI. */
export async function logout() {
  try {
    await fetch("/api/auth/logout", { method: "POST" });
  } catch {
    /* ignore — clear the UI regardless */
  }
  syncAuthUi();
}

/** `true` once the user has an active session. Reactive across the app. */
export function useAuthed(): boolean {
  return useSyncExternalStore(subscribe, hasAuthCookie, () => false);
}
