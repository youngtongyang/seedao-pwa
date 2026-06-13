import { cn } from "@/lib/utils";

/**
 * SEEDAO brand lockup: a small "seed/spark" mark + the wordmark.
 * No standalone logo file — the mark is inline SVG so it inherits theme colors.
 */
export function SeedMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      className={cn("size-7", className)}
      aria-hidden
    >
      <defs>
        <linearGradient id="seed-mark" x1="4" y1="4" x2="28" y2="28">
          <stop offset="0%" stopColor="var(--brand-violet)" />
          <stop offset="100%" stopColor="var(--brand-amber)" />
        </linearGradient>
      </defs>
      {/* a sprouting seed — two leaves emerging from a point */}
      <path
        d="M16 29c0-7-4-11-11-11 0 7 4 11 11 11Z"
        fill="url(#seed-mark)"
        opacity="0.9"
      />
      <path
        d="M16 29c0-7 4-11 11-11 0 7-4 11-11 11Z"
        fill="url(#seed-mark)"
        opacity="0.55"
      />
      <circle cx="16" cy="9" r="5" fill="url(#seed-mark)" />
    </svg>
  );
}

export function Wordmark({
  className,
  markClassName,
  showMark = true,
}: {
  className?: string;
  markClassName?: string;
  showMark?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      {showMark && <SeedMark className={markClassName} />}
      <span className="text-lg font-extrabold tracking-tight">SEEDAO</span>
    </span>
  );
}
