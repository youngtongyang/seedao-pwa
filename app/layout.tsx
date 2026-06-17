import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
// Self-hosted Noto Sans SC (@font-face with unicode-range chunks under
// /public/fonts/noto-sans-sc). Declares the `Noto Sans SC` family referenced by
// the --font-sans stack in globals.css. No build-time fetch from Google.
import "./fonts/noto-sans-sc.css";
import { Providers } from "./providers";
import { getInitialDevice } from "@/lib/device/server";

// Self-hosted Geist variable fonts (woff2 colocated in ./fonts). Replaces the
// next/font/google loaders so the build never reaches out to Google.
const geistSans = localFont({
  variable: "--font-geist-sans",
  src: "./fonts/Geist-Variable.woff2",
  weight: "100 900",
  display: "swap",
});

const geistMono = localFont({
  variable: "--font-geist-mono",
  src: "./fonts/GeistMono-Variable.woff2",
  weight: "100 900",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "SEEDAO · 共在 · 涌现 · 逍遥",
    template: "%s · SEEDAO",
  },
  description:
    "SEEDAO —— 一个让人认识自己、认识彼此，与 AI 共学共建的社区。A community to know yourself, know each other, and co-create with AI.",
  applicationName: "SEEDAO",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "SEEDAO",
  },
  icons: {
    icon: "/icon.svg",
    apple: "/icon-192.png",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#14121c" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const initialDevice = await getInitialDevice();

  return (
    <html
      lang="zh-CN"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full`}
    >
      <body className="min-h-full bg-background text-foreground antialiased">
        <Providers initialDevice={initialDevice}>{children}</Providers>
      </body>
    </html>
  );
}
