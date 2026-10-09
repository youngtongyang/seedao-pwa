import "server-only";

import { clearSession } from "@/lib/auth/session";
import type { ApiResult } from "./server";

type Fail = Extract<ApiResult<unknown>, { ok: false }>;

/** Prefer backend validation detail over generic message text. */
export function apiErrorText(r: Fail): string | undefined {
  return r.detail?.trim() || r.message?.trim() || undefined;
}

/**
 * 401 response that also clears `seedao.session` + `seedao.authed`.
 * Prevents "fake login": readable authed cookie left behind after the JWT dies.
 */
export async function unauthorizedResponse(error = "unauthorized"): Promise<Response> {
  await clearSession();
  return Response.json({ error }, { status: 401 });
}

/**
 * Turn a failed `ApiResult` into a client-facing JSON error response, carrying
 * the stable error key (and message) and a sane HTTP status.
 * Upstream/session 401 also clears cookies so the UI hint cannot linger.
 */
export async function jsonError(r: Fail): Promise<Response> {
  const status = r.status >= 400 && r.status <= 599 ? r.status : 400;
  const message = apiErrorText(r);
  if (status === 401 || r.error === "unauthorized") {
    await clearSession();
  }
  return Response.json({ error: r.error, message, detail: r.detail }, { status });
}

/** Parse a JSON request body, returning null on malformed input. */
export async function readJson<T>(request: Request): Promise<T | null> {
  try {
    return (await request.json()) as T;
  } catch {
    return null;
  }
}
