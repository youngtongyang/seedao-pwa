import { normalizeReturnTo } from "@/lib/auth/return-to";

/** Parse optional `return_to` from a create-order request body (BFF). */
export function parseReturnTo(body: Record<string, unknown>): string | undefined {
  const raw = body.return_to;
  return normalizeReturnTo(typeof raw === "string" ? raw : undefined) ?? undefined;
}
