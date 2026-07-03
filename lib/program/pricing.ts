/**
 * 计算活动付费项目的最终价格。
 *
 * 逻辑：
 *  1. 从 earlyBirdPrice（早鸟价 299）开始计算
 *  2. 如果是 SEEDAO 会员，打 8 折（memberDiscountRate = 0.8）
 *  3. 如果优惠码有效，再减 promoCodeDeduction 元
 *  4. 不低于 0
 *
 * basePrice（原价 399）仅用于展示划线，不参与计算。
 */

import { programPricing } from "@/lib/mock/program";

export type PriceBreakdown = {
  basePrice: number;       // 原价，仅展示
  earlyBirdPrice: number;  // 早鸟价（计算起点）
  earlyBirdSaving: number; // 早鸟比原价节省的金额
  memberDiscount: number;  // 会员折扣金额（正数）
  promoDeduction: number;  // 优惠码减免（正数）
  finalPrice: number;      // 最终结算价
  isMember: boolean;
  promoApplied: boolean;
};

export function computePrice(isMember: boolean, promoValid: boolean): PriceBreakdown {
  const { basePrice, earlyBirdPrice, memberDiscountRate, promoCodeDeduction } =
    programPricing;

  const earlyBirdSaving = basePrice - earlyBirdPrice;
  let price = earlyBirdPrice;
  let memberDiscount = 0;

  if (isMember) {
    memberDiscount = Math.round(earlyBirdPrice * (1 - memberDiscountRate));
    price = Math.round(earlyBirdPrice * memberDiscountRate);
  }

  let promoDeduction = 0;
  if (promoValid) {
    promoDeduction = Math.min(promoCodeDeduction, price);
    price -= promoDeduction;
  }

  return {
    basePrice,
    earlyBirdPrice,
    earlyBirdSaving,
    memberDiscount,
    promoDeduction,
    finalPrice: Math.max(price, 0),
    isMember,
    promoApplied: promoValid && promoDeduction > 0,
  };
}
