"use client";

import { Check, Loader2, Link2Off } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { bindFeishuWithToken } from "@/lib/bindings/client";
import { loginHref } from "@/lib/auth/return-to";
import { useT } from "@/lib/i18n";

type BindState =
  | { kind: "idle" }
  | { kind: "binding" }
  | { kind: "success"; displayName?: string }
  | { kind: "error"; key: string };

function errorMessage(t: ReturnType<typeof useT>, key: string): string {
  switch (key) {
    case "feishu_already_bound":
      return t.profile.feishuErrAlreadyBound;
    case "feishu_open_id_taken":
      return t.profile.feishuErrOpenIdTaken;
    case "feishu_bind_credential_invalid":
      return t.profile.feishuErrCredentialInvalid;
    case "unauthorized":
      return t.profile.feishuErrUnauthorized;
    default:
      return t.profile.feishuErrGeneric;
  }
}

/**
 * Path A landing page: consume `?token=` from 土地神 and bind Feishu to the
 * current SeeDAO session.
 */
export function FeishuBindView() {
  const t = useT();
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = (searchParams.get("token") || "").trim();
  const [state, setState] = useState<BindState>({ kind: "idle" });
  const started = useRef(false);

  useEffect(() => {
    if (!token || started.current) return;
    started.current = true;
    setState({ kind: "binding" });

    let cancelled = false;
    bindFeishuWithToken(token).then((result) => {
      if (cancelled) return;
      if (result.ok) {
        setState({
          kind: "success",
          displayName: result.data.display_name,
        });
        return;
      }
      if (result.error.error === "unauthorized") {
        const returnTo = `/profile/bind?token=${encodeURIComponent(token)}`;
        router.replace(loginHref(returnTo));
        return;
      }
      setState({ kind: "error", key: result.error.error });
    });

    return () => {
      cancelled = true;
    };
  }, [token, router]);

  if (!token) {
    return (
      <div className="mx-auto max-w-md px-6 py-16 text-center">
        <Link2Off className="mx-auto size-10 text-muted-foreground" />
        <h1 className="mt-4 text-xl font-bold">{t.profile.feishuBindMissingTitle}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t.profile.feishuBindMissingDesc}</p>
        <Button asChild className="mt-6">
          <Link href="/profile">{t.profile.feishuBackToProfile}</Link>
        </Button>
      </div>
    );
  }

  if (state.kind === "idle" || state.kind === "binding") {
    return (
      <div className="mx-auto flex min-h-[40vh] max-w-md flex-col items-center justify-center px-6 py-16 text-center">
        <Loader2 className="size-8 animate-spin text-primary" />
        <p className="mt-4 text-sm text-muted-foreground">{t.profile.feishuBindBinding}</p>
      </div>
    );
  }

  if (state.kind === "success") {
    return (
      <div className="mx-auto max-w-md px-6 py-16 text-center">
        <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <Check className="size-6" />
        </span>
        <h1 className="mt-4 text-xl font-bold">{t.profile.feishuBindSuccessTitle}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {state.displayName
            ? t.profile.feishuBindSuccessNamed(state.displayName)
            : t.profile.feishuBindSuccessDesc}
        </p>
        <Button asChild className="mt-6">
          <Link href="/profile">{t.profile.feishuBackToProfile}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-6 py-16 text-center">
      <h1 className="text-xl font-bold">{t.profile.feishuBindFailedTitle}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{errorMessage(t, state.key)}</p>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Button asChild variant="outline">
          <Link href="/profile">{t.profile.feishuBackToProfile}</Link>
        </Button>
      </div>
    </div>
  );
}
