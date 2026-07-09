"use client";

import { Award, CalendarDays, Crown, Loader2, Lock, LogOut, Phone } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import type { ProfileResult } from "@/lib/api/types";
import { logout } from "@/lib/auth/use-auth";
import { resetBookmarks } from "@/lib/course/bookmarks-store";
import { useT } from "@/lib/i18n";
import { fetchProfile } from "@/lib/profile/client";
import { cn } from "@/lib/utils";
import { ProfilePrograms } from "./profile-programs";
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

export function ProfileView() {
  const t = useT();
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileResult | null>(null);
  const [loading, setLoading] = useState(true);

  async function handleLogout() {
    await logout();
    resetBookmarks();
    router.push("/");
    router.refresh();
  }

  useEffect(() => {
    let active = true;
    fetchProfile().then((p) => {
      if (active) {
        setProfile(p);
        setLoading(false);
      }
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

  // created_at is RFC3339 (e.g. 2026-06-15T08:00:00Z) — show the date part as-is
  // to stay locale- and hydration-stable.
  const joined = profile.created_at?.slice(0, 10) || "—";
  // membership_expires_at is RFC3339; null when the user has never paid.
  const membershipExpires = profile.membership_expires_at?.slice(0, 10) || null;

  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-12">
      <header className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">{t.profile.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t.profile.subtitle}</p>
      </header>

      {/* Identity: avatar + SNS name, with account details folded in below. */}
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

        <div className="mt-6 grid gap-4 border-t border-border pt-6 sm:grid-cols-3">
          {profile.phone && (
            <Stat icon={<Phone className="size-4" />} label={t.profile.phoneLabel} value={profile.phone} />
          )}
          <Stat icon={<CalendarDays className="size-4" />} label={t.profile.joinedAt} value={joined} />
          <Stat
            icon={<Crown className="size-4" />}
            label={t.profile.membershipExpires}
            value={membershipExpires ?? t.profile.membershipNone}
            accent={!!membershipExpires}
          />
        </div>
      </section>

      {/* New-member checklist — first todo is adding the community assistant. */}
      <ProfileTodos />

      {/* My programs — saved + enrolled */}
      <ProfilePrograms />

      {/* Bio */}
      <section className="mt-3 rounded-2xl border border-border bg-card px-4 py-3">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {t.profile.bio}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">{profile.bio || t.profile.noBio}</p>
      </section>

      {/* Reputation — placeholder, disabled until designed */}
      <div
        aria-disabled
        className="mt-6 rounded-3xl border border-dashed border-border bg-muted/30 p-8 opacity-70"
      >
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
            <Award className="size-5" />
          </span>
          <div>
            <h2 className="flex items-center gap-2 font-semibold">
              {t.profile.reputation}
              <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                <Lock className="size-3" />
                {t.common.comingSoon}
              </span>
            </h2>
            <p className="text-sm text-muted-foreground">{t.profile.reputationDesc}</p>
          </div>
        </div>
        <p className="mt-4 text-sm text-muted-foreground">{t.profile.reputationSoon}</p>
      </div>

      {/* Logout — shared across desktop and mobile shells */}
      <div className="mt-8 flex justify-center sm:justify-end">
        <Button
          variant="outline"
          onClick={handleLogout}
          className="w-full sm:w-auto"
        >
          <LogOut className="size-4" />
          {t.nav.logout}
        </Button>
      </div>
    </div>
  );
}
