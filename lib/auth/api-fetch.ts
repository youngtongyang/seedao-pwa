"use client";

import { handleUnauthorizedResponse } from "@/lib/auth/use-auth";

/**
 * `fetch` wrapper for authenticated BFF calls.
 * On 401, syncs client auth UI (clears `seedao.authed` hint + account cache).
 */
export async function apiFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const res = await fetch(input, init);
  handleUnauthorizedResponse(res);
  return res;
}
