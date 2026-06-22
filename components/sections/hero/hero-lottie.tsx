"use client";

import Lottie from "lottie-react";
import { cn } from "@/lib/utils";
import animationData from "./home-banner.json";

/**
 * The hero's right-side visual: the brand Home-banner Lottie. Imported as a
 * default export so it can be `next/dynamic`-loaded with `ssr: false` from the
 * hero shells — that keeps `lottie-web` (which touches `document`) and the
 * sizeable animation JSON out of the server render and the main client bundle.
 */
export default function HeroLottie({ className }: { className?: string }) {
  return (
    <Lottie
      animationData={animationData}
      loop
      autoplay
      className={cn("aspect-square w-full select-none", className)}
      // The seed orb it replaces was decorative; keep it out of the a11y tree.
      aria-hidden
    />
  );
}
