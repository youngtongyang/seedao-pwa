"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { courseProgramPath, readPendingCoursePay } from "@/lib/course/pending-pay";
import { resolvePostPaymentPath } from "@/lib/payment/return-path";
import { useHydrated } from "@/lib/use-hydrated";

/**
 * After Alipay returns to the site root (or any page), forward in-flight course
 * or membership payments to the right resume point.
 */
export function PaymentResumeRedirect() {
  const router = useRouter();
  const pathname = usePathname();
  const hydrated = useHydrated();

  useEffect(() => {
    if (!hydrated) return;

    const pendingCourse = readPendingCoursePay();
    if (pendingCourse) {
      const target = courseProgramPath(pendingCourse.slug);
      if (pathname !== target) router.replace(target);
      return;
    }

    // Membership pending on a non-home route — send to join tab.
    const target = resolvePostPaymentPath(null);
    if (target.startsWith("/?join=1") && pathname !== "/") {
      router.replace(target);
    }
  }, [hydrated, pathname, router]);

  return null;
}
