/**
 * Client helper for the public member count. Calls our `/api/stats/members` BFF
 * route, which returns the seed base plus the live backend user count.
 */
export async function fetchMemberCount(): Promise<number | null> {
  try {
    const res = await fetch("/api/stats/members", { cache: "no-store" });
    if (!res.ok) return null;
    const data = (await res.json()) as { count?: number };
    return typeof data.count === "number" ? data.count : null;
  } catch {
    return null;
  }
}
