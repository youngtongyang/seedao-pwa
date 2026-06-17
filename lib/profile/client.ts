import type { ProfileResult } from "@/lib/api/types";

/**
 * Client entry point for the profile API. Calls our `/api/profile` BFF route
 * (which attaches the session JWT). The backend profile is read-only — there is
 * no update endpoint — so this is fetch-only.
 */
export async function fetchProfile(): Promise<ProfileResult | null> {
  try {
    const res = await fetch("/api/profile", { cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as ProfileResult;
  } catch {
    return null;
  }
}
