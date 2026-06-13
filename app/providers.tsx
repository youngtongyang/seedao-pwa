"use client";

import { PWARegister } from "@/components/pwa/pwa-register";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { AccountProvider } from "@/lib/account";
import { DeviceProvider, type Device } from "@/lib/device";
import { I18nProvider } from "@/lib/i18n";

/**
 * Single client boundary that composes every app-wide context provider.
 * `initialDevice` is computed on the server from the request UA so the first
 * render already matches the user's device.
 */
export function Providers({
  children,
  initialDevice,
}: {
  children: React.ReactNode;
  initialDevice: Device;
}) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem
      disableTransitionOnChange
    >
      <I18nProvider>
        <DeviceProvider initialDevice={initialDevice}>
          <AccountProvider>
            {children}
            <PWARegister />
          </AccountProvider>
        </DeviceProvider>
      </I18nProvider>
    </ThemeProvider>
  );
}
