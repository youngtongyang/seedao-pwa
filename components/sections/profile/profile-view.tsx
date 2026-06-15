"use client";

import { Award, Loader2, Lock, Pencil } from "lucide-react";
import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useT } from "@/lib/i18n";
import { fetchProfile, updateProfile } from "@/lib/profile/client";
import { isValidUsername, type Profile } from "@/lib/profile/types";

function Avatar({ profile, size = 96 }: { profile: Profile; size?: number }) {
  const initial = profile.username.slice(0, 1).toUpperCase();
  return (
    <span
      className="flex items-center justify-center overflow-hidden rounded-full bg-primary/10 bg-cover bg-center text-3xl font-bold text-primary ring-1 ring-border"
      style={{
        width: size,
        height: size,
        backgroundImage: profile.avatarUrl ? `url(${profile.avatarUrl})` : undefined,
      }}
      aria-hidden={!!profile.avatarUrl}
    >
      {!profile.avatarUrl && initial}
    </span>
  );
}

export function ProfileView() {
  const t = useT();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);

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

  // Keep the generated name as-is (just confirm it).
  async function handleKeep(current: Profile) {
    setConfirming(true);
    try {
      const result = await updateProfile({ username: current.username });
      if (result.ok) setProfile(result.profile);
    } finally {
      setConfirming(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-12">
      <header className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">{t.profile.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t.profile.subtitle}</p>
      </header>

      {/* Identity: avatar + SNS name */}
      <section className="flex flex-col items-center gap-5 rounded-3xl border border-border bg-card p-8 text-center sm:flex-row sm:text-left">
        <Avatar profile={profile} />
        <div className="flex-1">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {t.profile.snsName}
          </p>
          <p className="text-xl font-bold">{profile.snsName}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {t.profile.snsNameHint}
          </p>
        </div>
        <Button variant="outline" onClick={() => setEditing(true)}>
          <Pencil className="size-4" />
          {t.profile.edit}
        </Button>
      </section>

      {/* New users: keep the generated name, or change it */}
      {!profile.confirmed && (
        <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-primary/30 bg-primary/5 p-5 sm:flex-row sm:items-center">
          <p className="flex-1 text-sm text-muted-foreground">
            {t.profile.generatedHint}
          </p>
          <div className="flex shrink-0 gap-2">
            <Button size="sm" onClick={() => handleKeep(profile)} disabled={confirming}>
              {confirming && <Loader2 className="size-4 animate-spin" />}
              {t.profile.keepName}
            </Button>
            <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
              {t.profile.changeName}
            </Button>
          </div>
        </div>
      )}

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
            <p className="text-sm text-muted-foreground">
              {t.profile.reputationDesc}
            </p>
          </div>
        </div>
        <p className="mt-4 text-sm text-muted-foreground">
          {t.profile.reputationSoon}
        </p>
      </div>

      {/* Mounted only while editing, so fields seed from the latest profile. */}
      {editing && (
        <EditDialog
          profile={profile}
          onClose={() => setEditing(false)}
          onSaved={setProfile}
        />
      )}
    </div>
  );
}

function EditDialog({
  profile,
  onClose,
  onSaved,
}: {
  profile: Profile;
  onClose: () => void;
  onSaved: (p: Profile) => void;
}) {
  const t = useT();
  const [username, setUsername] = useState(profile.username);
  const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const usernameOk = isValidUsername(username);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!usernameOk) {
      setError(t.profile.invalidUsername);
      return;
    }
    setSaving(true);
    try {
      const result = await updateProfile({
        username,
        avatarUrl: avatarUrl.trim() || null,
      });
      if (result.ok) {
        onSaved(result.profile);
        onClose();
      } else {
        setError(t.profile.saveFailed);
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{t.profile.edit}</DialogTitle>
          <DialogDescription>{t.profile.snsNameHint}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSave} className="flex flex-col gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="profile-username">{t.profile.username}</Label>
            <div className="flex items-center gap-2">
              <Input
                id="profile-username"
                value={username}
                onChange={(e) =>
                  setUsername(
                    e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 20),
                  )
                }
                placeholder={t.profile.usernamePlaceholder}
                autoComplete="off"
              />
              <span className="shrink-0 text-sm text-muted-foreground">.seedao</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="profile-avatar">{t.profile.avatarUrl}</Label>
            <Input
              id="profile-avatar"
              type="url"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder={t.profile.avatarUrlPlaceholder}
              autoComplete="off"
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>
              {t.profile.cancel}
            </Button>
            <Button type="submit" disabled={saving || !usernameOk}>
              {saving ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  {t.profile.saving}
                </>
              ) : (
                t.profile.save
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
