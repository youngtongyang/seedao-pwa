"use client";

import { useSyncExternalStore } from "react";

/**
 * Reactive client view of login state.
 *
 * The real session is an httpOnly cookie the client can't read, so `/auth/verify`
 * also sets a readable `seedao.authed` hint cookie. This hook reads that hint via
 * `useSyncExternalStore` (SSR-safe: the server snapshot is always `false`, so
 * there's no hydration mismatch) and re-reads when `refreshAuth`/`logout` fire.
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

/** Clear the session on the server, then update the UI. */
export async function logout() {
  try {
    await fetch("/auth/logout", { method: "POST" });
  } catch {
    /* ignore — clear the UI regardless */
  }
  notify();
}

/** `true` once the user has an active session. Reactive across the app. */
export function useAuthed(): boolean {
  return useSyncExternalStore(subscribe, hasAuthCookie, () => false);
}
