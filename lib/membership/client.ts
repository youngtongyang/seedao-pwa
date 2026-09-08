import { fenToYuanAmount, type MembershipFee } from "@/lib/membership";

export type MembershipFeeOutcome =
  | { ok: true; data: MembershipFee; displayYuan: number }
  | { ok: false; error?: string };

function errorOf(data: Record<string, unknown>): string | undefined {
  return typeof data.error === "string" ? data.error : undefined;
}

/** Annual membership list price via BFF `GET /api/membership/fee`. */
export async function fetchMembershipFee(): Promise<MembershipFeeOutcome> {
  try {
    const res = await fetch("/api/membership/fee", { cache: "no-store" });
    const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    if (!res.ok) return { ok: false, error: errorOf(data) };
    const fee = data as unknown as MembershipFee;
    if (typeof fee.amount !== "number" || !Number.isFinite(fee.amount)) {
      return { ok: false, error: "invalid_param" };
    }
    return { ok: true, data: fee, displayYuan: fenToYuanAmount(fee.amount) };
  } catch {
    return { ok: false, error: "upstream_unreachable" };
  }
}
