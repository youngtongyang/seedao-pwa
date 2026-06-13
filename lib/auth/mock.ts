import type { AuthProvider } from "./types";

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Mock Feishu (飞书) login. Returns a demo user after a short delay.
 *
 * ── Swapping in real Feishu OAuth ──────────────────────────────────────────
 *  signIn → redirect to Feishu's authorize URL with your app_id & redirect_uri;
 *  on callback, exchange the code for an access token on your backend and map
 *  the Feishu profile to {@link AuthUser}. The component code never changes.
 */
export const mockFeishuAuth: AuthProvider = {
  name: "mock-feishu",

  async signIn() {
    await delay(900);
    return {
      id: "u_demo_seedao",
      name: "云游",
      provider: "feishu",
    };
  },

  async signOut() {
    await delay(120);
  },
};
