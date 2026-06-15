/**
 * Profile domain types + validation, shared by the client and the
 * `/profile/me` route handler.
 *
 * `snsName` is the user's unique identifier in the DB, shaped `xxx.seedao`,
 * where `xxx` is the editable {@link Profile.username}.
 */
export type Profile = {
  /** The `xxx` in `xxx.seedao` — the unique username. */
  username: string;
  /** Derived unique identifier: `${username}.seedao`. */
  snsName: string;
  /** Avatar image URL, or null for the initials fallback. */
  avatarUrl: string | null;
  /**
   * Whether the user has confirmed their SNS name. New users get a randomly
   * generated username with `confirmed: false`, then choose to keep it or
   * change it — either choice sets this to `true`.
   */
  confirmed: boolean;
};

/** The editable subset of a profile. */
export type ProfilePatch = {
  username?: string;
  avatarUrl?: string | null;
};

/** Username rules: 3–20 lowercase letters, digits or underscores. */
export const USERNAME_RE = /^[a-z0-9_]{3,20}$/;

export function isValidUsername(username: string): boolean {
  return USERNAME_RE.test(username);
}

export function snsNameFor(username: string): string {
  return `${username}.seedao`;
}

/** A random, valid username like `seedao_k3f9q2` for a brand-new user. */
export function randomUsername(): string {
  const suffix = Math.random().toString(36).slice(2, 8);
  return `seedao_${suffix}`;
}

/** A fresh profile with a generated, unconfirmed name. */
export function newProfile(): Profile {
  const username = randomUsername();
  return {
    username,
    snsName: snsNameFor(username),
    avatarUrl: null,
    confirmed: false,
  };
}
