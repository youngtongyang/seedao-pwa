"use client";

import { Loader2 } from "lucide-react";
import QRCode from "qrcode";
import { useEffect, useState } from "react";
import { QRFrame } from "./qr-frame";

/**
 * Renders an arbitrary string as a scannable QR, framed like {@link QRFrame}.
 * Used for the WeChat Pay Native `code_url` (a `weixin://…` string the backend
 * returns) — we generate the QR in the browser rather than having the backend
 * render an image. Generation is async, so a placeholder shows until it's ready.
 */
export function QrCode({ value, alt, size = 172 }: { value: string; alt: string; size?: number }) {
  // Reset on a new `value` is handled by remounting (the caller keys this
  // component on the code_url), so the effect only setStates asynchronously.
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    QRCode.toDataURL(value, {
      errorCorrectionLevel: "M",
      margin: 1,
      width: size * 2, // 2× for crispness on hi-dpi screens
      color: { dark: "#1a1726", light: "#ffffff" }, // brand ink, matches static QRs
    })
      .then((url) => {
        if (active) setDataUrl(url);
      })
      .catch(() => {
        /* leave the placeholder; the pay step still shows the status + retry */
      });
    return () => {
      active = false;
    };
  }, [value, size]);

  if (!dataUrl) {
    return (
      <div
        className="flex items-center justify-center rounded-2xl bg-white ring-1 ring-black/5"
        style={{ width: size + 32, height: size + 32 }}
      >
        <Loader2 className="size-6 animate-spin text-muted-foreground/40" />
      </div>
    );
  }

  return <QRFrame src={dataUrl} alt={alt} size={size} withBadge={false} />;
}
