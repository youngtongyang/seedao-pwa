import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Noto_Sans_SC } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { getInitialDevice } from "@/lib/device/server";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

// Chinese-first body font. Latin glyphs fall back to Geist (declared first in
// the --font-sans stack); CJK glyphs render with Noto Sans SC.
const notoSansSC = Noto_Sans_SC({
  variable: "--font-noto-sans-sc",
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
  display: "swap",
  preload: false,
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
      className={`${geistSans.variable} ${geistMono.variable} ${notoSansSC.variable} h-full`}
    >
      <body className="min-h-full bg-background text-foreground antialiased">
        <Providers initialDevice={initialDevice}>{children}</Providers>
      </body>
    </html>
  );
}
