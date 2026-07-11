import { captureReturnToFromLocation, joinHref, readReturnTo } from "@/lib/auth/return-to";
import { courseProgramPath, readPendingCoursePay } from "@/lib/course/pending-pay";
import { readPendingOrder } from "@/lib/payment/client";

/**
 * Where to send the user when they land on `/pay/return` after an H5 round-trip.
 * Only used by the pay-return page — not on every route.
 */
export function resolvePostPaymentPath(searchParams?: URLSearchParams | null): string {
  if (typeof window !== "undefined") captureReturnToFromLocation();

  const slug = searchParams?.get("slug");
  const returnTo = readReturnTo();
  const pendingCourse = readPendingCoursePay();
  const pendingMembership = readPendingOrder();

  if (pendingCourse) return courseProgramPath(pendingCourse.slug);

  if (slug) return courseProgramPath(slug);

  if (returnTo?.startsWith("/program/")) return returnTo;

  if (pendingMembership) return joinHref(returnTo ?? undefined);

  if (returnTo) return joinHref(returnTo);

  return "/?join=1#membership";
}
