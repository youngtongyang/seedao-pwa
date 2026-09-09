"use client";

import { CalendarDays, Crown, ExternalLink, Loader2, LogOut, Phone } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import type { BindingItem, ProfileResult } from "@/lib/api/types";
import { logout } from "@/lib/auth/use-auth";
import { fetchFeishuBinding } from "@/lib/bindings/client";
import { resetBookmarks } from "@/lib/course/bookmarks-store";
import { useT } from "@/lib/i18n";
import { getMembershipDisplayKind } from "@/lib/membership";
import { fetchProfile, submitMembershipApplication } from "@/lib/profile/client";
import { cn } from "@/lib/utils";
import { ProfileBindings } from "./profile-bindings";
import { ProfileTodos } from "./profile-todos";

function Avatar({ profile, size = 96 }: { profile: ProfileResult; size?: number }) {
  const initial = (profile.sns_name || "?").slice(0, 1).toUpperCase();
  return (
    <span
      className="flex items-center justify-center overflow-hidden rounded-full bg-primary/10 bg-cover bg-center text-3xl font-bold text-primary ring-1 ring-border"
      style={{
        width: size,
        height: size,
        backgroundImage: profile.avatar ? `url(${profile.avatar})` : undefined,
      }}
      aria-hidden={!!profile.avatar}
    >
      {!profile.avatar && initial}
    </span>
  );
}

/** Compact label/value stat shown inside the identity card. */
function Stat({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="flex items-center gap-2.5 text-left">
      <span
        className={cn(
          "flex size-8 shrink-0 items-center justify-center rounded-lg",
          accent ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground",
        )}
      >
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <p className="truncate text-sm font-semibold">{value}</p>
      </div>
    </div>
  );
}

function MembershipStatusBlock({
  profile,
  onUpdated,
}: {
  profile: ProfileResult;
  onUpdated: (next: ProfileResult) => void;
}) {
  const t = useT();
  const kind = getMembershipDisplayKind(profile.membership_tier, profile.application_status);
  const formUrl = profile.application_form_url?.trim() || "";
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const tierLabel =
    kind === "full"
      ? t.profile.membershipTierFull
      : kind === "under_review"
        ? t.profile.membershipTierUnderReview
        : kind === "associate"
          ? t.profile.membershipTierAssociate
          : t.profile.membershipNone;

  async function handleSubmitted() {
    setError(null);
    setBusy(true);
    const r = await submitMembershipApplication();
    if (!r.ok) {
      setBusy(false);
      setError(t.profile.applicationSubmitFailed);
      return;
    }
    // Submit may return a partial profile; merge then refetch so identity fields stay visible.
    onUpdated({ ...profile, ...r.data });
    const fresh = await fetchProfile();
    setBusy(false);
    if (fresh) onUpdated(fresh);
  }

  if (kind === "none") return null;

  return (
    <div className="mt-6 rounded-2xl border border-border bg-muted/30 p-4 text-left">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <p className="text-lg font-bold tracking-tight">{tierLabel}</p>
        {kind === "associate" && formUrl ? (
          <a
            href={formUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            {t.profile.applicationSubmitCta}
            <ExternalLink className="size-3.5" />
          </a>
        ) : null}
        {kind === "associate" && !formUrl ? (
          <p className="text-sm text-muted-foreground">{t.profile.applicationFormMissing}</p>
        ) : null}
      </div>

      {kind === "associate" && formUrl ? (
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <Button type="button" size="sm" disabled={busy} onClick={handleSubmitted}>
            {busy ? t.profile.applicationSubmitting : t.profile.applicationSubmittedCta}
          </Button>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </div>
      ) : null}
    </div>
  );
}

export function ProfileView() {
  const t = useT();
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileResult | null>(null);
  const [feishu, setFeishu] = useState<BindingItem | null>(null);
  const [loading, setLoading] = useState(true);

  async function handleLogout() {
    await logout();
    resetBookmarks();
    router.push("/");
    router.refresh();
  }

  useEffect(() => {
    let active = true;
    Promise.all([fetchProfile(), fetchFeishuBinding()]).then(([p, binding]) => {
      if (!active) return;
      setProfile(p);
      setFeishu(binding);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="mx-auto max-w-md px-6 py-16 text-center text-muted-foreground">
        {t.profile.loadFailed}
      </div>
    );
  }

  const joined = profile.created_at?.slice(0, 10) || "—";
  const membershipExpires = profile.membership_expires_at?.slice(0, 10) || null;
  const displayKind = getMembershipDisplayKind(
    profile.membership_tier,
    profile.application_status,
  );
  const membershipValue =
    displayKind === "full"
      ? t.profile.membershipTierFull
      : displayKind === "under_review"
        ? t.profile.membershipTierUnderReview
        : displayKind === "associate"
          ? t.profile.membershipTierAssociate
          : (membershipExpires ?? t.profile.membershipNone);

  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-12">
      <header className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">{t.profile.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t.profile.subtitle}</p>
      </header>

      <section className="rounded-3xl border border-border bg-card p-8">
        <div className="flex flex-col items-center gap-5 text-center sm:flex-row sm:text-left">
          <Avatar profile={profile} />
          <div className="flex-1">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {t.profile.snsName}
            </p>
            <p className="text-xl font-bold">{profile.sns_name}</p>
            <p className="mt-1 text-sm text-muted-foreground">{t.profile.snsNameHint}</p>
          </div>
        </div>

        <MembershipStatusBlock profile={profile} onUpdated={setProfile} />

        <div className="mt-6 grid gap-4 border-t border-border pt-6 sm:grid-cols-3">
          {profile.phone && (
            <Stat icon={<Phone className="size-4" />} label={t.profile.phoneLabel} value={profile.phone} />
          )}
          <Stat icon={<CalendarDays className="size-4" />} label={t.profile.joinedAt} value={joined} />
          <Stat
            icon={<Crown className="size-4" />}
            label={t.profile.membershipExpires}
            value={
              displayKind === "none"
                ? membershipValue
                : (membershipExpires ?? membershipValue)
            }
            accent={!!membershipExpires || displayKind !== "none"}
          />
        </div>
      </section>

      <ProfileBindings feishu={feishu} onFeishuChange={setFeishu} />

      <ProfileTodos />

      <div className="mt-8 flex justify-center sm:justify-end">
        <Button variant="outline" onClick={handleLogout} className="w-full sm:w-auto">
          <LogOut className="size-4" />
          {t.nav.logout}
        </Button>
      </div>
    </div>
  );
}
