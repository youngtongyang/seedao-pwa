import "server-only";

import { cookies } from "next/headers";

/**
 * Session cookie management, shared by the auth route handlers.
 *
 * Two cookies, deliberately split:
 * - `seedao.session` (httpOnly JWT): proves identity to the backend. It's set as
 *   soon as a user registers, because creating a WeChat order needs a token —
 *   but holding it does NOT mean the user is "logged in".
 * - `seedao.authed` (readable): set ONLY for an active **paid member**. This is
 *   what marks a user as logged in — it gates the profile and drives the header.
 *   A registered-but-unpaid user has a session token but no `authed` cookie.
 */
export const SESSION_COOKIE = "seedao.session";
export const AUTHED_COOKIE = "seedao.authed";

const FALLBACK_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

function maxAgeFor(tokenExp?: number): number {
  const fromExp = tokenExp ? tokenExp - Math.floor(Date.now() / 1000) : 0;
  return fromExp > 0 ? fromExp : FALLBACK_MAX_AGE;
}

/**
 * Persist the JWT, and set the `authed` (logged-in member) hint only when
 * `member` is true. `tokenExp` is the backend's unix expiry.
 */
export async function setSession(token: string, tokenExp: number | undefined, member: boolean): Promise<void> {
  const store = await cookies();
  const maxAge = maxAgeFor(tokenExp);
  const secure = process.env.NODE_ENV === "production";

  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge,
  });
  if (member) {
    store.set(AUTHED_COOKIE, "1", { httpOnly: false, sameSite: "lax", secure, path: "/", maxAge });
  } else {
    store.delete(AUTHED_COOKIE);
  }
}

/**
 * Promote the current session to a logged-in member — set `authed` without
 * touching the JWT (used once payment succeeds; the session was set at register).
 */
export async function markMember(tokenExp?: number): Promise<void> {
  const store = await cookies();
  store.set(AUTHED_COOKIE, "1", {
    httpOnly: false,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: maxAgeFor(tokenExp),
  });
}

/** Clear the session and the readable hint. */
export async function clearSession(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
  store.delete(AUTHED_COOKIE);
}

/** Read the current JWT, or null when unauthenticated. */
export async function getToken(): Promise<string | null> {
  return (await cookies()).get(SESSION_COOKIE)?.value ?? null;
}
