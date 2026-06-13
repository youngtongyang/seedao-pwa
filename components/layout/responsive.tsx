"use client";

import type { ReactNode } from "react";
import { useDevice } from "@/lib/device";

/**
 * Renders the desktop or mobile component system based on the active device.
 * The initial device comes from the server UA guess, so the first paint
 * matches; it then self-corrects to the real viewport after mount.
 *
 * This is the deliberate alternative to responsive CSS: each device gets its
 * own purpose-built tree, mounted one at a time.
 */
export function Responsive({
  desktop,
  mobile,
}: {
  desktop: ReactNode;
  mobile: ReactNode;
}) {
  const { device } = useDevice();
  return <>{device === "mobile" ? mobile : desktop}</>;
}
