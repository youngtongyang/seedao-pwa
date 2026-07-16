"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { joinHref, readReturnTo } from "@/lib/auth/return-to";
import { courseProgramPath, readPendingCoursePay } from "@/lib/course/pending-pay";
import { readPendingOrder } from "@/lib/payment/client";
import { useHydrated } from "@/lib/use-hydrated";

/**
 * Only runs when an H5 payment is genuinely in flight (pending flags in
 * sessionStorage). Must NOT redirect on a stale `returnTo` alone.
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

    const pendingMembership = readPendingOrder();
    if (pendingMembership && pathname !== "/") {
      router.replace(joinHref(readReturnTo() ?? undefined));
    }
  }, [hydrated, pathname, router]);

  return null;
}
