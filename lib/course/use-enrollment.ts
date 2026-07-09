"use client";

import { useEffect, useState } from "react";
import { listCourseOrders, queryCourseOrder, readCourseOrderNo } from "./client";

/**
 * 某课程的报名状态。数据源优先级：
 * 1. `GET /api/course/orders` 列表中有已支付订单 → `enrolled`；
 * 2. 兜底：本标签页会话内的匿名下单（claim 前不在列表中）——
 *    用 sessionStorage 里的课程→订单号映射单独查一次订单；
 * 3. 其余：有会话为 `none`，401 为 `anonymous`。
 */
export type EnrollmentState = "unknown" | "anonymous" | "none" | "enrolled";

export function useEnrollment(courseId: string): { state: EnrollmentState; orderNo?: string } {
  const [result, setResult] = useState<{ state: EnrollmentState; orderNo?: string }>({
    state: "unknown",
  });

  useEffect(() => {
    if (!courseId) return;
    let stale = false;
    setResult({ state: "unknown" });

    void (async () => {
      const list = await listCourseOrders();
      if (stale) return;

      if (list.ok) {
        const hit = list.data.orders.find(
          (o) =>
            o.course_id === courseId &&
            (o.status === "paid" || o.enrollment_status === "active"),
        );
        if (hit) {
          setResult({ state: "enrolled", orderNo: hit.order_no });
          return;
        }
      }

      const orderNo = readCourseOrderNo(courseId);
      if (orderNo) {
        const q = await queryCourseOrder(orderNo);
        if (stale) return;
        if (q.ok && q.data.status === "paid") {
          setResult({ state: "enrolled", orderNo });
          return;
        }
      }

      setResult({ state: list.ok ? "none" : list.status === 401 ? "anonymous" : "none" });
    })();

    return () => {
      stale = true;
    };
  }, [courseId]);

  return result;
}
