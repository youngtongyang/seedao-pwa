import "server-only";

import type { ApiResult } from "./server";

type Fail = Extract<ApiResult<unknown>, { ok: false }>;

/** Prefer backend validation detail over generic message text. */
export function apiErrorText(r: Fail): string | undefined {
  return r.detail?.trim() || r.message?.trim() || undefined;
}

/**
 * Turn a failed `ApiResult` into a client-facing JSON error response, carrying
 * the stable error key (and message) and a sane HTTP status.
 */
export function jsonError(r: Fail): Response {
  const status = r.status >= 400 && r.status <= 599 ? r.status : 400;
  const message = apiErrorText(r);
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
