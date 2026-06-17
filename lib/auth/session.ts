import "server-only";

import { cookies } from "next/headers";

/**
 * Session cookie management, shared by the auth route handlers.
 *
 * The backend-issued JWT is kept in an httpOnly cookie the client JS can't read
 * (`seedao.session`); a readable hint cookie (`seedao.authed`) lets the UI
 * reflect login state without exposing the token (see `lib/auth/use-auth`).
 */
export const SESSION_COOKIE = "seedao.session";
export const AUTHED_COOKIE = "seedao.authed";

const FALLBACK_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

/** Persist the JWT + readable hint. `tokenExp` is the backend's unix expiry. */
export async function setSession(token: string, tokenExp?: number): Promise<void> {
  const store = await cookies();
  const fromExp = tokenExp ? tokenExp - Math.floor(Date.now() / 1000) : 0;
  const maxAge = fromExp > 0 ? fromExp : FALLBACK_MAX_AGE;
  const secure = process.env.NODE_ENV === "production";

  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge,
  });
  store.set(AUTHED_COOKIE, "1", {
    httpOnly: false,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge,
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
