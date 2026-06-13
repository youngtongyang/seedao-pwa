import { mockFeishuAuth } from "./mock";
import type { AuthProvider } from "./types";

/**
 * The active auth provider. To go live, replace this binding with a real
 * Feishu OAuth provider implementing {@link AuthProvider}.
 */
export const authProvider: AuthProvider = mockFeishuAuth;

export type { AuthProvider, AuthUser } from "./types";
