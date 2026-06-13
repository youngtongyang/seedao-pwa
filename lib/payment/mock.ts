import type { PaymentProvider } from "./types";

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Mock WeChat-style payment. `createOrder` returns a decorative QR asset and
 * `confirmPayment` pretends the user scanned & paid after a short delay.
 *
 * ── Swapping in real WeChat Pay ────────────────────────────────────────────
 *  1. createOrder → call your backend's unified order API, render the returned
 *     `code_url` into a QR (e.g. with `qrcode`) and return its data URL.
 *  2. confirmPayment → poll your backend (which queries WeChat order status)
 *     until it reports SUCCESS, then resolve with `{ status: "paid" }`.
 *  The component code never changes.
 */
export const mockPaymentProvider: PaymentProvider = {
  name: "mock-wechat",

  async createOrder({ amount, currency = "CNY" }) {
    await delay(180);
    return {
      id: `mock_order_${Date.now()}`,
      amount,
      currency,
      qrCodeUrl: "/qr/wechat-pay.svg",
      createdAt: Date.now(),
    };
  },

  async confirmPayment(orderId) {
    await delay(1200);
    return { status: "paid", orderId };
  },
};
