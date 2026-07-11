import { captureReturnToFromLocation, joinHref, readReturnTo } from "@/lib/auth/return-to";
import { courseProgramPath, readPendingCoursePay } from "@/lib/course/pending-pay";
import { readPendingOrder } from "@/lib/payment/client";

/**
 * Where to send the user after an H5 pay round-trip. Course pays resume on the
 * program page; membership pays reopen the Join tab to poll.
 */
export function resolvePostPaymentPath(searchParams?: URLSearchParams | null): string {
  if (typeof window !== "undefined") captureReturnToFromLocation();

  const slug = searchParams?.get("slug");
  if (slug) return courseProgramPath(slug);

  const pendingCourse = readPendingCoursePay();
  if (pendingCourse) return courseProgramPath(pendingCourse.slug);

  const returnTo = readReturnTo();
  if (returnTo?.startsWith("/program/")) return returnTo;

  if (readPendingOrder()) return joinHref(returnTo ?? undefined);

  if (returnTo) return returnTo;

  return "/?join=1#membership";
}
