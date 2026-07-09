import "server-only";

import { cookies } from "next/headers";

/**
 * Mock 态的跨请求持久化（仅 `SEEDAO_USE_MOCK=1` 时被调用）。
 *
 * 路由处理器之间不共享内存（dev HMR 重编译、serverless 多实例都会丢），
 * 因此把 mock 的「列表成员关系」记在 httpOnly Cookie 里 —— 每个浏览器
 * 天然对应一个 mock 用户；清除 Cookie 即重置 mock 数据。
 * 订单的 pending→paid 状态本身仍由 order_no 内嵌时间戳推导（与既有
 * mock 约定一致），Cookie 只记录成员关系、归属与关闭标记。
 *
 * 写入只发生在变更型路由（POST/PUT/DELETE）中，`cookies().set()`
 * 在路由处理器里是合法的。
 */

const BOOKMARKS_COOKIE = "seedao.mock.bookmarks";
const ORDERS_COOKIE = "seedao.mock.course_orders";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

/** 收藏记录：course_id + created_at */
export type MockBookmarkRec = { c: string; t: string };

/** 订单记录：order_no / course_id / sku_id / amount(分) / owned / closed */
export type MockOrderRec = {
  n: string;
  c: string;
  s: string;
  a: number;
  /** 创建时带 JWT，或事后被 claim */
  o: boolean;
  /** 支付前被主动关闭 */
  x?: boolean;
};

async function readJsonCookie<T>(name: string): Promise<T[]> {
  const raw = (await cookies()).get(name)?.value;
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

async function writeJsonCookie(name: string, items: unknown[]): Promise<void> {
  (await cookies()).set(name, JSON.stringify(items), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export function readMockBookmarks(): Promise<MockBookmarkRec[]> {
  return readJsonCookie<MockBookmarkRec>(BOOKMARKS_COOKIE);
}

export function writeMockBookmarks(items: MockBookmarkRec[]): Promise<void> {
  return writeJsonCookie(BOOKMARKS_COOKIE, items);
}

export function readMockOrders(): Promise<MockOrderRec[]> {
  return readJsonCookie<MockOrderRec>(ORDERS_COOKIE);
}

export async function appendMockOrder(rec: MockOrderRec): Promise<void> {
  const items = await readMockOrders();
  items.push(rec);
  await writeJsonCookie(ORDERS_COOKIE, items);
}

export async function updateMockOrder(
  orderNo: string,
  patch: Partial<Pick<MockOrderRec, "o" | "x">>,
): Promise<void> {
  const items = await readMockOrders();
  const rec = items.find((r) => r.n === orderNo);
  if (!rec) return;
  Object.assign(rec, patch);
  await writeJsonCookie(ORDERS_COOKIE, items);
}
