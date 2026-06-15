import { cookies } from "next/headers";
import {
  isValidUsername,
  newProfile,
  randomUsername,
  snsNameFor,
  type Profile,
} from "@/lib/profile/types";

/**
 * Profile operations for the signed-in user.
 *
 *   GET   /profile/me  -> 200 Profile | 401 if no session
 *                         (new users are seeded a random, unconfirmed name)
 *   PATCH /profile/me  -> body { username?, avatarUrl? } -> 200 Profile
 *                         | 400 invalid_username | 401 | 409 username_taken
 *                         (a successful patch marks the name confirmed)
 *
 * Both require the `seedao.session` cookie set by `/auth/verify`. When
 * `SEEDAO_API_BASE` is configured they forward to the backend with the session
 * token as a Bearer credential; otherwise a cookie-backed mock persists edits
 * locally so the flow is testable end-to-end.
 */
const SESSION_COOKIE = "seedao.session";
const PROFILE_COOKIE = "seedao.profile";
const REMOTE = process.env.SEEDAO_API_BASE?.replace(/\/$/, "");

async function getToken(): Promise<string | null> {
  return (await cookies()).get(SESSION_COOKIE)?.value ?? null;
}

function normalize(data: unknown): Profile {
  const d = (data ?? {}) as Record<string, unknown>;
  const username = typeof d.username === "string" ? d.username : randomUsername();
  return {
    username,
    snsName: typeof d.snsName === "string" ? d.snsName : snsNameFor(username),
    avatarUrl: typeof d.avatarUrl === "string" ? d.avatarUrl : null,
    confirmed: d.confirmed === true,
  };
}

async function readMockProfile(): Promise<Profile | null> {
  const raw = (await cookies()).get(PROFILE_COOKIE)?.value;
  if (!raw) return null;
  try {
    return normalize(JSON.parse(raw));
  } catch {
    return null;
  }
}

async function writeMockProfile(profile: Profile): Promise<void> {
  (await cookies()).set(PROFILE_COOKIE, JSON.stringify(profile), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function GET() {
  const token = await getToken();
  if (!token) return Response.json({ error: "unauthorized" }, { status: 401 });

  if (REMOTE) {
    try {
      const res = await fetch(`${REMOTE}/profile/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok)
        return Response.json({ error: "upstream_error" }, { status: 502 });
      return Response.json(normalize(await res.json()));
    } catch {
      return Response.json({ error: "upstream_unreachable" }, { status: 502 });
    }
  }

  // mock: return the persisted profile, or seed a fresh generated one
  let profile = await readMockProfile();
  if (!profile) {
    profile = newProfile();
    await writeMockProfile(profile);
  }
  return Response.json(profile);
}

export async function PATCH(request: Request) {
  const token = await getToken();
  if (!token) return Response.json({ error: "unauthorized" }, { status: 401 });

  let patch: { username?: unknown; avatarUrl?: unknown };
  try {
    patch = (await request.json()) as typeof patch;
  } catch {
    return Response.json({ error: "bad_request" }, { status: 400 });
  }

  const nextUsername =
    typeof patch.username === "string" ? patch.username.trim() : undefined;
  const nextAvatar =
    typeof patch.avatarUrl === "string"
      ? patch.avatarUrl.trim() || null
      : patch.avatarUrl === null
        ? null
        : undefined;

  if (nextUsername !== undefined && !isValidUsername(nextUsername))
    return Response.json({ error: "invalid_username" }, { status: 400 });

  if (REMOTE) {
    try {
      const res = await fetch(`${REMOTE}/profile/me`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          username: nextUsername,
          avatarUrl: nextAvatar,
          confirmed: true,
        }),
      });
      if (res.status === 409)
        return Response.json({ error: "username_taken" }, { status: 409 });
      if (!res.ok)
        return Response.json({ error: "upstream_error" }, { status: 502 });
      return Response.json(normalize(await res.json()));
    } catch {
      return Response.json({ error: "upstream_unreachable" }, { status: 502 });
    }
  }

  // mock: merge into the persisted profile and mark the name confirmed
  const current = (await readMockProfile()) ?? newProfile();
  const username = nextUsername ?? current.username;
  const updated: Profile = {
    username,
    snsName: snsNameFor(username),
    avatarUrl: nextAvatar !== undefined ? nextAvatar : current.avatarUrl,
    confirmed: true,
  };
  await writeMockProfile(updated);
  return Response.json(updated);
}
