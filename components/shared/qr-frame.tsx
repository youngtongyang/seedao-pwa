import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * An elegantly framed QR code: white plate, brand corner brackets, and an
 * optional centered brand badge. Reused by payment and help.
 */
export function QRFrame({
  src,
  alt,
  size = 200,
  className,
  withBadge = true,
}: {
  src: string;
  alt: string;
  size?: number;
  className?: string;
  withBadge?: boolean;
}) {
  return (
    <div
      className={cn(
        "relative inline-flex items-center justify-center rounded-2xl bg-white p-4 ring-1 ring-black/5",
        className,
      )}
    >
      {/* brand corner brackets */}
      <span className="pointer-events-none absolute left-2 top-2 size-5 rounded-tl-lg border-l-2 border-t-2 border-brand-violet/70" />
      <span className="pointer-events-none absolute right-2 top-2 size-5 rounded-tr-lg border-r-2 border-t-2 border-brand-amber/70" />
      <span className="pointer-events-none absolute bottom-2 left-2 size-5 rounded-bl-lg border-b-2 border-l-2 border-brand-amber/70" />
      <span className="pointer-events-none absolute bottom-2 right-2 size-5 rounded-br-lg border-b-2 border-r-2 border-brand-violet/70" />

      <div className="relative" style={{ width: size, height: size }}>
        <Image
          src={src}
          alt={alt}
          width={size}
          height={size}
          className="size-full rounded-lg"
          unoptimized
        />
        {withBadge && (
          <span className="absolute left-1/2 top-1/2 flex size-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-lg bg-white shadow ring-1 ring-black/5">
            <svg viewBox="0 0 32 32" className="size-6" aria-hidden>
              <defs>
                <linearGradient id="qr-mark" x1="4" y1="4" x2="28" y2="28">
                  <stop offset="0%" stopColor="#6d5ae6" />
                  <stop offset="100%" stopColor="#f4a93c" />
                </linearGradient>
              </defs>
              <circle cx="16" cy="11" r="5" fill="url(#qr-mark)" />
              <path
                d="M16 29c0-7-4-11-11-11 0 7 4 11 11 11Z"
                fill="url(#qr-mark)"
                opacity="0.85"
              />
              <path
                d="M16 29c0-7 4-11 11-11 0 7-4 11-11 11Z"
                fill="url(#qr-mark)"
                opacity="0.5"
              />
            </svg>
          </span>
        )}
      </div>
    </div>
  );
}
