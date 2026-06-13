import { mockPaymentProvider } from "./mock";
import type { PaymentProvider } from "./types";

/**
 * The active payment provider. To go live, replace this single binding with a
 * real WeChat Pay provider implementing {@link PaymentProvider}.
 */
export const paymentProvider: PaymentProvider = mockPaymentProvider;

export type {
  PaymentOrder,
  PaymentProvider,
  PaymentResult,
  PaymentStatus,
} from "./types";
