"use client";

import { motion } from "framer-motion";
import { Bot, HeartHandshake, Sparkles, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type Chip = { icon: LucideIcon; label: string; className: string; delay: number };

const chips: Chip[] = [
  { icon: Users, label: "共在", className: "left-[2%] top-[14%]", delay: 0 },
  { icon: Bot, label: "AI", className: "right-[0%] top-[30%]", delay: 0.8 },
  { icon: Sparkles, label: "涌现", className: "right-[6%] bottom-[14%]", delay: 1.4 },
  {
    icon: HeartHandshake,
    label: "共建",
    className: "left-[4%] bottom-[20%]",
    delay: 0.4,
  },
];

/**
 * An abstract "agent + community" visual: a glowing seed-orb with soft orbits
 * and floating facet chips. Tasteful and brand-led, not a flat gradient fill.
 */
export function HeroVisual({ className }: { className?: string }) {
  return (
    <div className={cn("relative aspect-square select-none", className)}>
      {/* orbit rings */}
      <motion.div
        className="absolute inset-[8%] rounded-full border border-border/60"
        animate={{ rotate: 360 }}
        transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
      />
      <div className="absolute inset-[22%] rounded-full border border-dashed border-border/50" />

      {/* glowing core orb */}
      <motion.div
        className="absolute inset-[30%] rounded-full blur-md"
        style={{
          background:
            "radial-gradient(circle at 35% 30%, var(--brand-violet-soft), var(--brand-violet) 45%, var(--brand-amber) 120%)",
        }}
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />
      <div className="absolute inset-[34%] rounded-full bg-white/10 ring-1 ring-white/20 backdrop-blur-sm" />
      <div className="absolute inset-0 flex items-center justify-center">
        <Sparkles className="size-10 text-white drop-shadow" />
      </div>

      {/* floating facet chips */}
      {chips.map((chip) => (
        <motion.div
          key={chip.label}
          className={cn("absolute", chip.className)}
          animate={{ y: [0, -10, 0] }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: chip.delay,
          }}
        >
          <div className="flex items-center gap-2 rounded-full border border-border bg-card/90 px-3 py-1.5 backdrop-blur">
            <chip.icon className="size-4 text-primary" />
            <span className="text-xs font-semibold">{chip.label}</span>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
