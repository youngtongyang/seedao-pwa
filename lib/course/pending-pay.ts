/** H5 course pay in flight — survives Alipay round-trips on the same origin. */
export type PendingCoursePay = { order_no: string; slug: string };

const KEY = "seedao.pending_course_pay";

export function courseProgramPath(slug: string): string {
  return `/program/${encodeURIComponent(slug)}`;
}

export function savePendingCoursePay(orderNo: string, slug: string): void {
  try {
    sessionStorage.setItem(KEY, JSON.stringify({ order_no: orderNo, slug }));
  } catch {
    /* storage unavailable */
  }
}

export function readPendingCoursePay(): PendingCoursePay | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as Partial<PendingCoursePay>;
    if (p && typeof p.order_no === "string" && typeof p.slug === "string") {
      return { order_no: p.order_no, slug: p.slug };
    }
  } catch {
    /* malformed */
  }
  return null;
}

export function clearPendingCoursePay(): void {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
