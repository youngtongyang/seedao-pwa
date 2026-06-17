import type { SnsCheckResult } from "@/lib/api/types";

/**
 * Client helper for SNS-name availability. Calls our `/api/sns/check` BFF route
 * (no auth, no side effects) — used by the Join form to live-check a name.
 */
export async function checkSns(snsName: string): Promise<SnsCheckResult | null> {
  try {
    const res = await fetch(`/api/sns/check?sns_name=${encodeURIComponent(snsName)}`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    return (await res.json()) as SnsCheckResult;
  } catch {
    return null;
  }
}
