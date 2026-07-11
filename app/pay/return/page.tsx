"use client";

import { Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import { ReturnToCapture } from "@/components/auth/return-to-capture";
import { captureReturnToFromLocation, joinHref, readReturnTo } from "@/lib/auth/return-to";
import { useT } from "@/lib/i18n";

/**
 * Alipay / WeChat H5 return landing. The backend should set the payment
 * `return_url` to this route (e.g. `https://pay.seedao.xyz/pay/return`).
 * Preserves `returnTo` so post-payment navigation resumes the user's task.
 */
function PayReturnRedirect() {
  const router = useRouter();
  const params = useSearchParams();
  const t = useT();

  useEffect(() => {
    captureReturnToFromLocation();
    const slug = params.get("slug");
    if (slug) {
      router.replace(`/program/${encodeURIComponent(slug)}`);
      return;
    }
    const returnTo = readReturnTo();
    router.replace(returnTo ? joinHref(returnTo) : "/?join=1#membership");
  }, [params, router]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 px-6 text-center">
      <Loader2 className="size-6 animate-spin text-muted-foreground" />
      <p className="text-sm text-muted-foreground">{t.membership.payWaiting}</p>
    </div>
  );
}

export default function PayReturnPage() {
  return (
    <>
      <ReturnToCapture />
      <Suspense
        fallback={
          <div className="flex min-h-[50vh] items-center justify-center">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        }
      >
        <PayReturnRedirect />
      </Suspense>
    </>
  );
}
