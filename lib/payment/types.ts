export type PaymentStatus = "pending" | "paid" | "failed";

export interface PaymentOrder {
  id: string;
  amount: number;
  currency: string;
  /**
   * URL of a QR code the user scans to pay. For real WeChat native pay this is
   * the QR rendered from the returned `code_url`.
   */
  qrCodeUrl: string;
  createdAt: number;
}

export interface PaymentResult {
  status: PaymentStatus;
  orderId: string;
}

/**
 * The seam between the UI and a payment backend. Swapping the mock for real
 * WeChat Pay means providing another object with this exact shape — no UI
 * changes required. See {@link ./index.ts}.
 */
export interface PaymentProvider {
  readonly name: string;
  /** Create an order and obtain a QR code for the user to scan. */
  createOrder(input: { amount: number; currency?: string }): Promise<PaymentOrder>;
  /** Resolve once the order is paid. A real impl polls the order status. */
  confirmPayment(orderId: string): Promise<PaymentResult>;
}
