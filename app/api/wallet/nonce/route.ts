import { jsonError, readJson } from "@/lib/api/http";
import { walletNonce } from "@/lib/api/server";

/** POST /api/wallet/nonce — issue a SIWE nonce + message for a wallet to sign. */
export async function POST(request: Request) {
  const body = await readJson<{ wallet?: unknown; domain?: unknown }>(request);
  const wallet = typeof body?.wallet === "string" ? body.wallet.trim() : "";
  const domain = typeof body?.domain === "string" ? body.domain.trim() : "";
  if (!wallet || !domain) return Response.json({ error: "invalid_param" }, { status: 400 });

  const result = await walletNonce({ wallet, domain });
  if (!result.ok) return jsonError(result);
  return Response.json(result.data);
}
