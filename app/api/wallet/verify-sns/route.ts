import { jsonError, readJson } from "@/lib/api/http";
import { walletVerifySns } from "@/lib/api/server";

/**
 * POST /api/wallet/verify-sns — verify a wallet signature and preview the
 * on-chain SNS name it can claim. Consumes the nonce, so registering afterwards
 * needs a fresh nonce + signature.
 */
export async function POST(request: Request) {
  const body = await readJson<Record<string, unknown>>(request);
  if (!body) return Response.json({ error: "invalid_param" }, { status: 400 });

  const str = (k: string) => (typeof body[k] === "string" ? (body[k] as string) : "");
  const wallet = str("wallet");
  const message = str("message");
  const signature = str("signature");
  if (!wallet || !message || !signature)
    return Response.json({ error: "invalid_param" }, { status: 400 });

  const result = await walletVerifySns({
    wallet,
    wallet_type: str("wallet_type") || "EOA",
    domain: str("domain"),
    message,
    signature,
  });
  if (!result.ok) return jsonError(result);
  return Response.json(result.data);
}
