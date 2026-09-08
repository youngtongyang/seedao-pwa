import "server-only";

import { USE_MOCK } from "@/lib/api/config";
import { type ApiResult, call } from "@/lib/api/server";
import type { MembershipFee } from "@/lib/membership";

const MOCK_FEE: MembershipFee = {
  amount: 29900,
  currency: "CNY",
  days: 365,
};

/** `GET /v1/membership/fee` — anonymous list price (amount in 分). */
export function getMembershipFee(): Promise<ApiResult<MembershipFee>> {
  if (USE_MOCK) {
    return Promise.resolve({ ok: true, data: MOCK_FEE });
  }
  return call<MembershipFee>("/membership/fee");
}
