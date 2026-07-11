"use client";

import { Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import { ReturnToCapture } from "@/components/auth/return-to-capture";
import { resolvePostPaymentPath } from "@/lib/payment/return-path";
import { useT } from "@/lib/i18n";

/**
 * Alipay / WeChat H5 return landing. Backend `return_url` should point here
 * (e.g. `https://pay.seedao.xyz/pay/return?slug=ecommerce` for course).
 */
function PayReturnRedirect() {
  const router = useRouter();
  const params = useSearchParams();
  const t = useT();

  useEffect(() => {
    router.replace(resolvePostPaymentPath(params));
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
