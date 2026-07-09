import type { SnsByWalletResult, SnsCheckResult } from "@/lib/api/types";

export type ApiOutcome<T> =
  | { ok: true; data: T }
  | { ok: false; error?: string; message?: string };

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

/** Resolve a wallet address to its registered SNS via `/api/sns/by-wallet`. */
export async function fetchSnsByWallet(wallet: string): Promise<ApiOutcome<SnsByWalletResult>> {
  try {
    const params = new URLSearchParams({ wallet });
    const res = await fetch(`/api/sns/by-wallet?${params}`, { cache: "no-store" });
    const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    if (!res.ok) {
      return {
        ok: false,
        error: typeof data.error === "string" ? data.error : undefined,
        message: typeof data.message === "string" ? data.message : undefined,
      };
    }
    return { ok: true, data: data as SnsByWalletResult };
  } catch {
    return { ok: false, error: "upstream_unreachable" };
  }
}
