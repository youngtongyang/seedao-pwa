import { redirect } from "next/navigation";

/**
 * Legacy route — the cross-border course page now lives at /program/ecommerce.
 * Kept as a redirect so previously shared links keep working.
 */
export default function CrossBorderPage() {
  redirect("/program/ecommerce");
}
