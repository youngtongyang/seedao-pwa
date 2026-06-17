"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n";
import { useHydrated } from "@/lib/use-hydrated";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
  const t = useT();
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useHydrated();

  const isDark = resolvedTheme === "dark";

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      aria-label={t.common.toggleTheme}
      title={t.common.toggleTheme}
      className={cn("text-muted-foreground", className)}
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      {/* Avoid hydration flash: render a stable icon until mounted */}
      {mounted && isDark ? (
        <Moon className="size-5" />
      ) : (
        <Sun className="size-5" />
      )}
    </Button>
  );
}
