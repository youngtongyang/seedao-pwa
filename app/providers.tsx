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
 *
 * Web3 providers (wagmi/RainbowKit) are intentionally NOT here — they load only
 * inside the login page's "I have an on-chain SNS" tab (see `wallet-login.tsx`),
 * so the rest of the app never pulls in the wallet stack.
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
