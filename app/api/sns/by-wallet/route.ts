import { jsonError } from "@/lib/api/http";
import { snsByWallet } from "@/lib/api/server";

/** GET /api/sns/by-wallet?wallet=0x… — resolve wallet address to SNS name. No auth. */
export async function GET(request: Request) {
  const wallet = new URL(request.url).searchParams.get("wallet")?.trim() ?? "";
  if (!wallet) return Response.json({ error: "invalid_param" }, { status: 400 });

  const result = await snsByWallet(wallet);
  if (!result.ok) return jsonError(result);
  return Response.json(result.data);
}
