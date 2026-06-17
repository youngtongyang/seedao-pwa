/**
 * Backend connection config, read once on the server.
 *
 * - `SEEDAO_API_BASE` overrides the host (no trailing slash); defaults to the
 *   production API. All endpoints live under `API_PREFIX`.
 * - `SEEDAO_USE_MOCK=1` forces the in-process mock branch in `lib/api/server`,
 *   so the full UI flow is exercisable locally without sending real SMS or
 *   reaching the network. Mock is also implied when the base is blanked out.
 */
const DEFAULT_BASE = "https://api.seedao.xyz";

export const API_BASE = (process.env.SEEDAO_API_BASE ?? DEFAULT_BASE).replace(/\/$/, "");

export const API_PREFIX = "/v1";

export const USE_MOCK = process.env.SEEDAO_USE_MOCK === "1" || API_BASE === "";

/** Build a fully-qualified backend URL for a `/v1`-relative path. */
export function apiUrl(path: string): string {
  return `${API_BASE}${API_PREFIX}${path.startsWith("/") ? path : `/${path}`}`;
}
