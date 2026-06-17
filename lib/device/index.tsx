"use client";

import { createContext, useContext, useSyncExternalStore } from "react";
import { useHydrated } from "@/lib/use-hydrated";

export type Device = "mobile" | "desktop";

/** Viewport width (px) at and below which we serve the mobile system. */
export const MOBILE_BREAKPOINT = 768;

type DeviceContextValue = {
  /** The active device system. Hydrates from the server UA guess, then
   *  self-corrects to the real viewport after mount and on resize. */
  device: Device;
  /** True once the client has measured the real viewport. */
  ready: boolean;
};

const DeviceContext = createContext<DeviceContextValue | null>(null);

function mediaQuery(): MediaQueryList {
  return window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
}

function subscribe(onChange: () => void) {
  const mq = mediaQuery();
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

export function DeviceProvider({
  children,
  initialDevice,
}: {
  children: React.ReactNode;
  initialDevice: Device;
}) {
  // Read the real viewport via an external store; fall back to the server's
  // UA guess for SSR + the first hydration render (so there's no mismatch).
  const device = useSyncExternalStore<Device>(
    subscribe,
    () => (mediaQuery().matches ? "mobile" : "desktop"),
    () => initialDevice,
  );
  const ready = useHydrated();

  return (
    <DeviceContext.Provider value={{ device, ready }}>
      {children}
    </DeviceContext.Provider>
  );
}

export function useDevice() {
  const ctx = useContext(DeviceContext);
  if (!ctx) throw new Error("useDevice must be used within a DeviceProvider");
  return ctx;
}
