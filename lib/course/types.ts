/**
 * 课程售卖支付类型（API v2.6）。
 *
 * Raw JSON 字段名保持 snake_case，与服务端返回一致。
 * 金额均为 **分 (cents)**。
 */

/** 支付渠道 */
export type PayChannel = "wechat_native" | "wechat_h5";

// ── 价格试算 ──────────────────────────────────────────────────────────────────

export type CheckoutPreviewInput = {
  course_id: string;
  sku_id: string;
  channel_code?: string;
  apply_member_discount?: boolean;
};

export type DiscountItem = {
  type: string;       // "early_bird" | "channel" | "member"
  label: string;
  amount: number;     // 分
  applied: boolean;
};

export type MemberDiscountInfo = {
  amount: number;           // 分
  applied: boolean;
  requires_login: boolean;
  hint: string;
};

export type CheckoutPreviewResult = {
  course_id: string;
  sku_id: string;
  original_amount: number;       // 分
  discounts: DiscountItem[];
  final_amount: number;          // 分（当前身份应付价）
  amount_if_member?: number;     // 分（登录会员价）
  member_discount?: MemberDiscountInfo;
  currency: string;
};

// ── 创建订单 ──────────────────────────────────────────────────────────────────

export type CreateCourseOrderInput = {
  course_id: string;
  sku_id: string;
  channel_code?: string;
  apply_member_discount?: boolean;
  pay_channel?: PayChannel;
};

export type CourseOrder = {
  order_no: string;
  order_token?: string;          // 无主订单凭证，仅响应中出现一次
  product_type: "course_purchase";
  course_id: string;
  sku_id: string;
  original_amount: number;       // 分
  discount_amount: number;       // 分
  amount: number;                // 分
  status: "pending" | "paid" | "closed";
  code_url?: string;             // Native QR
  h5_url?: string;               // H5 redirect
  expired_at?: string;           // RFC3339 UTC
};

// ── 查询订单 ──────────────────────────────────────────────────────────────────

export type CourseOrderStatus = {
  order_no: string;
  status: "pending" | "paid" | "closed";
  amount: number;
  paid_at?: string;              // RFC3339 UTC
  /** 支付成功且履约后为 "active"；未支付为空。 */
  enrollment_status?: string | null;
};

// ── 认领订单 ──────────────────────────────────────────────────────────────────

export type ClaimOrderInput = {
  order_no: string;
  order_token: string;
};
