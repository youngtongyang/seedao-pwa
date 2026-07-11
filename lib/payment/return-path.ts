import { captureReturnToFromLocation, joinHref, readReturnTo } from "@/lib/auth/return-to";
import { courseProgramPath, readPendingCoursePay } from "@/lib/course/pending-pay";
import { readPendingOrder } from "@/lib/payment/client";

/**
 * Where to send the user after an H5 pay round-trip.
 *
 * Priority: URL `?returnTo=` (from backend echo) → sessionStorage → pending flags.
 * Backend only needs one fixed `return_url`; each order carries its own `return_to`.
 */
export function resolvePostPaymentPath(searchParams?: URLSearchParams | null): string {
  if (typeof window !== "undefined") captureReturnToFromLocation();

  // Legacy optional shortcut — prefer `returnTo` query param instead.
  const slug = searchParams?.get("slug");
  if (slug && !readReturnTo()) return courseProgramPath(slug);

  const returnTo = readReturnTo();
  const pendingCourse = readPendingCoursePay();
  const pendingMembership = readPendingOrder();

  if (pendingCourse || returnTo?.startsWith("/program/")) {
    return pendingCourse ? courseProgramPath(pendingCourse.slug) : returnTo!;
  }

  // Membership H5: reopen Join tab to poll, then consumeReturnTo() on success.
  if (pendingMembership || returnTo) {
    return joinHref(returnTo ?? undefined);
  }

  return "/?join=1#membership";
}
