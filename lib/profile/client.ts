import type { Profile, ProfilePatch } from "./types";

/**
 * Client entry points for the profile API. They call our own Route Handlers:
 *   GET   /profile/me           -> view the signed-in user's profile
 *   PATCH /profile/me { ... }   -> edit avatar / username
 * which forward to the real backend (or a mock) — see `app/profile/me/route.ts`.
 */

/** View the signed-in user's profile. Returns null if unauthenticated/unreachable. */
export async function fetchProfile(): Promise<Profile | null> {
  try {
    const res = await fetch("/profile/me", { cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as Profile;
  } catch {
    return null;
  }
}

export type UpdateResult =
  | { ok: true; profile: Profile }
  | { ok: false; error?: string };

/** Edit the avatar and/or username. */
export async function updateProfile(patch: ProfilePatch): Promise<UpdateResult> {
  try {
    const res = await fetch("/profile/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    if (!res.ok)
      return { ok: false, error: typeof data.error === "string" ? data.error : undefined };
    return { ok: true, profile: data as unknown as Profile };
  } catch {
    return { ok: false };
  }
}
