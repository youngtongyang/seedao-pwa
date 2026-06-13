import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "SEEDAO · 共在 涌现 逍遥",
    short_name: "SEEDAO",
    description:
      "一个让人认识自己、认识彼此，与 AI 共学共建的社区。A community to know yourself, know each other, and co-create with AI.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#6d5ae6",
    orientation: "portrait",
    lang: "zh-CN",
    categories: ["social", "education", "lifestyle"],
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
    ],
  };
}
