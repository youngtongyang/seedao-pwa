"use client";

import { createContext, useContext, useEffect, useState } from "react";

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

export function DeviceProvider({
  children,
  initialDevice,
}: {
  children: React.ReactNode;
  initialDevice: Device;
}) {
  const [device, setDevice] = useState<Device>(initialDevice);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const update = () => setDevice(mq.matches ? "mobile" : "desktop");
    update();
    setReady(true);
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

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
