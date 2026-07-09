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
  // 结果按 courseId 打标：courseId 切换后旧结果在派生时自动视为 "unknown"，
  // 无需在 effect 里同步重置状态。
  const [loaded, setLoaded] = useState<{
    courseId: string;
    state: EnrollmentState;
    orderNo?: string;
  } | null>(null);

  useEffect(() => {
    if (!courseId) return;
    let stale = false;

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
          setLoaded({ courseId, state: "enrolled", orderNo: hit.order_no });
          return;
        }
      }

      const orderNo = readCourseOrderNo(courseId);
      if (orderNo) {
        const q = await queryCourseOrder(orderNo);
        if (stale) return;
        if (q.ok && q.data.status === "paid") {
          setLoaded({ courseId, state: "enrolled", orderNo });
          return;
        }
      }

      setLoaded({
        courseId,
        state: list.ok ? "none" : list.status === 401 ? "anonymous" : "none",
      });
    })();

    return () => {
      stale = true;
    };
  }, [courseId]);

  if (!loaded || loaded.courseId !== courseId) return { state: "unknown" };
  return { state: loaded.state, orderNo: loaded.orderNo };
}
