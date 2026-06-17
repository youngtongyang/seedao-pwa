/**
 * SNS-name validation, shared by the Join form's name picker.
 *
 * A SeeDAO identity is shaped `{username}.seedao`, where `username` is 3–20
 * lowercase letters, digits or underscores — matching the backend's
 * `^[a-z0-9_]{3,20}\.seedao$` rule (`internal/pkg/snsutil`). The user enters the
 * `username`; `snsNameFor` appends the suffix before calling the API.
 *
 * The read-only profile shape itself lives in `@/lib/api/types` (`ProfileResult`).
 */

/** Username rules: 3–20 lowercase letters, digits or underscores. */
export const USERNAME_RE = /^[a-z0-9_]{3,20}$/;

export function isValidUsername(username: string): boolean {
  return USERNAME_RE.test(username);
}

export function snsNameFor(username: string): string {
  return `${username}.seedao`;
}
