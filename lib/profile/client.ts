import type { ProfileResult } from "@/lib/api/types";
import { apiFetch } from "@/lib/auth/api-fetch";

/**
 * Client entry point for the profile API. Calls our `/api/profile` BFF route
 * (which attaches the session JWT). The backend profile is read-only — there is
 * no update endpoint — so this is fetch-only aside from application submit.
 */
export async function fetchProfile(): Promise<ProfileResult | null> {
  try {
    const res = await apiFetch("/api/profile", { cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as ProfileResult;
  } catch {
    return null;
  }
}

export type SubmitApplicationOutcome =
  | { ok: true; data: ProfileResult }
  | { ok: false; error?: string };

/** Confirm the membership application form was submitted. */
export async function submitMembershipApplication(): Promise<SubmitApplicationOutcome> {
  try {
    const res = await apiFetch("/api/profile/application/submit", { method: "POST" });
    const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    if (!res.ok) {
      return {
        ok: false,
        error: typeof data.error === "string" ? data.error : undefined,
      };
    }
    return { ok: true, data: data as unknown as ProfileResult };
  } catch {
    return { ok: false, error: "upstream_unreachable" };
  }
}
