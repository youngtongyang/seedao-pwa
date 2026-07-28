"use client";

import { CalendarDays, Crown, Loader2, LogOut, Phone } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import type { BindingItem, ProfileResult } from "@/lib/api/types";
import { logout } from "@/lib/auth/use-auth";
import { fetchFeishuBinding } from "@/lib/bindings/client";
import { resetBookmarks } from "@/lib/course/bookmarks-store";
import { useT } from "@/lib/i18n";
import { fetchProfile } from "@/lib/profile/client";
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
