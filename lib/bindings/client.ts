import type {
  BindingItem,
  BindingListResult,
  FeishuBindResult,
  FeishuChallengeResult,
} from "@/lib/api/types";

export type BindingsClientError = {
  error: string;
  message?: string;
};

function feishuFromList(data: BindingListResult | null): BindingItem | null {
  if (!data?.items?.length) return null;
  return data.items.find((item) => item.provider === "feishu") ?? data.items[0] ?? null;
}

/** `GET /api/user/bindings` — returns the Feishu row (or a default unbound stub). */
export async function fetchFeishuBinding(): Promise<BindingItem | null> {
  try {
    const res = await fetch("/api/user/bindings", { cache: "no-store" });
    if (!res.ok) return null;
    const data = (await res.json()) as BindingListResult;
    return (
      feishuFromList(data) ?? {
        provider: "feishu",
        bound: false,
      }
    );
  } catch {
    return null;
  }
}

export async function bindFeishuWithToken(
  bindToken: string,
): Promise<{ ok: true; data: FeishuBindResult } | { ok: false; error: BindingsClientError }> {
  try {
    const res = await fetch("/api/user/bindings/feishu/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bind_token: bindToken }),
    });
    const body = (await res.json().catch(() => null)) as
      | FeishuBindResult
      | BindingsClientError
      | null;
    if (!res.ok) {
      const err = (body ?? {}) as BindingsClientError;
      return {
        ok: false,
        error: {
          error: err.error || "unknown_error",
          message: err.message,
        },
      };
    }
    return { ok: true, data: body as FeishuBindResult };
  } catch {
    return { ok: false, error: { error: "upstream_unreachable" } };
  }
}

export async function createFeishuChallenge(): Promise<
  { ok: true; data: FeishuChallengeResult } | { ok: false; error: BindingsClientError }
> {
  try {
    const res = await fetch("/api/user/bindings/feishu/challenge", { method: "POST" });
    const body = (await res.json().catch(() => null)) as
      | FeishuChallengeResult
      | BindingsClientError
      | null;
    if (!res.ok) {
      const err = (body ?? {}) as BindingsClientError;
      return {
        ok: false,
        error: {
          error: err.error || "unknown_error",
          message: err.message,
        },
      };
    }
    return { ok: true, data: body as FeishuChallengeResult };
  } catch {
    return { ok: false, error: { error: "upstream_unreachable" } };
  }
}

export async function unbindFeishuBinding(): Promise<
  { ok: true; data: FeishuBindResult } | { ok: false; error: BindingsClientError }
> {
  try {
    const res = await fetch("/api/user/bindings/feishu", { method: "DELETE" });
    const body = (await res.json().catch(() => null)) as
      | FeishuBindResult
      | BindingsClientError
      | null;
    if (!res.ok) {
      const err = (body ?? {}) as BindingsClientError;
      return {
        ok: false,
        error: {
          error: err.error || "unknown_error",
          message: err.message,
        },
      };
    }
    return { ok: true, data: body as FeishuBindResult };
  } catch {
    return { ok: false, error: { error: "upstream_unreachable" } };
  }
}
