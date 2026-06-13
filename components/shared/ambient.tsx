import { cn } from "@/lib/utils";

/**
 * Soft, tasteful brand glows for hero/section backgrounds.
 * Uses large blurred radial fields at low opacity — not a hard gradient fill.
 */
export function AmbientGlow({
  className,
  variant = "hero",
}: {
  className?: string;
  variant?: "hero" | "soft";
}) {
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-0 -z-10 overflow-hidden",
        className,
      )}
    >
      <div
        className="absolute -top-32 left-1/2 size-[42rem] -translate-x-1/2 rounded-full blur-3xl"
        style={{ background: "var(--glow-violet)" }}
      />
      {variant === "hero" && (
        <div
          className="absolute -bottom-40 right-[-6rem] size-[34rem] rounded-full blur-3xl"
          style={{ background: "var(--glow-amber)" }}
        />
      )}
    </div>
  );
}
