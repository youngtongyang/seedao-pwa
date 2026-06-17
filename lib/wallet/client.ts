import type { VerifySnsResult, WalletNonceResult } from "@/lib/api/types";

/**
 * Client helpers for the wallet (SIWE) flow, calling our `/api/wallet/*` BFF
 * routes. The backend builds the message to sign and verifies the signature.
 *
 * Note: the nonce is single-use (45s TTL), consumed by both `verifySns` and
 * `registerExistingSns`. Preview-then-register therefore needs two signatures,
 * each over its own freshly-issued message.
 */
export type NonceOutcome =
  | { ok: true; data: WalletNonceResult }
  | { ok: false; error?: string };

export type VerifyOutcome =
  | { ok: true; data: VerifySnsResult }
  | { ok: false; error?: string };

async function postJson(url: string, body: unknown) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  return { res, data };
}

/** Request a SIWE nonce + message for `wallet` bound to `domain`. */
export async function getNonce(wallet: string, domain: string): Promise<NonceOutcome> {
  try {
    const { res, data } = await postJson("/api/wallet/nonce", { wallet, domain });
    if (!res.ok) return { ok: false, error: typeof data.error === "string" ? data.error : undefined };
    return { ok: true, data: data as unknown as WalletNonceResult };
  } catch {
    return { ok: false, error: "upstream_unreachable" };
  }
}

export type VerifySnsPayload = {
  wallet: string;
  walletType?: string;
  domain: string;
  message: string;
  signature: string;
};

/** Verify a signature and preview the claimable on-chain SNS name. */
export async function verifySns(payload: VerifySnsPayload): Promise<VerifyOutcome> {
  try {
    const { res, data } = await postJson("/api/wallet/verify-sns", {
      wallet: payload.wallet,
      wallet_type: payload.walletType ?? "EOA",
      domain: payload.domain,
      message: payload.message,
      signature: payload.signature,
    });
    if (!res.ok) return { ok: false, error: typeof data.error === "string" ? data.error : undefined };
    return { ok: true, data: data as unknown as VerifySnsResult };
  } catch {
    return { ok: false, error: "upstream_unreachable" };
  }
}
