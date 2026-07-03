/**
 * 优惠码验证逻辑。
 * 当前为本地模拟验证；接入真实后端时只需替换 validatePromoCode 的实现。
 */

import { VALID_PROMO_CODES } from "@/lib/mock/cross-border";

export type PromoValidationResult =
  | { valid: true; code: string; deduction: number }
  | { valid: false; code: string; reason: "unknown" | "expired" | "used" };

/**
 * 验证优惠码是否有效。
 * 大小写不敏感，去除首尾空白。
 */
export function validatePromoCode(input: string): PromoValidationResult {
  const code = input.trim().toUpperCase();
  if (!code) return { valid: false, code: "", reason: "unknown" };

  const deduction = VALID_PROMO_CODES[code];
  if (deduction !== undefined) {
    return { valid: true, code, deduction };
  }

  return { valid: false, code, reason: "unknown" };
}
