export interface AuthUser {
  id: string;
  name: string;
  avatarUrl?: string;
  provider: "feishu";
}

/**
 * The seam between the UI and an auth backend. Swapping the mock for real
 * Feishu (Lark) OAuth means providing another object with this shape.
 */
export interface AuthProvider {
  readonly name: string;
  /** Begin sign-in. Real impl redirects to Feishu OAuth and returns the user. */
  signIn(): Promise<AuthUser>;
  signOut?(): Promise<void>;
}
