"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { useLocalized, useT } from "@/lib/i18n";
import {
  onboardingSteps,
  type OnboardingAnswers,
} from "@/lib/mock/onboarding";
import { cn } from "@/lib/utils";

const personalityStep = onboardingSteps.find((s) => s.id === "personality");
const interestsStep = onboardingSteps.find((s) => s.id === "interests");

/** A live, gamified preview of the agent the user is shaping, step by step. */
export function AgentPreview({
  answers,
  className,
}: {
  answers: OnboardingAnswers;
  className?: string;
}) {
  const t = useT();
  const L = useLocalized();

  const name = (answers.name as string)?.trim();
  const personality = personalityStep?.options?.find(
    (o) => o.id === answers.personality,
  );
  const interestIds = (answers.interests as string[]) ?? [];
  const interests = (interestsStep?.options ?? []).filter((o) =>
    interestIds.includes(o.id),
  );

  return (
    <div
      className={cn(
        "flex flex-col items-center gap-4 rounded-3xl border border-border bg-card p-6 text-center",
        className,
      )}
    >
      <div className="relative">
        <motion.div
          className="flex size-20 items-center justify-center rounded-full"
          style={{
            background:
              "radial-gradient(circle at 35% 30%, var(--brand-violet-soft), var(--brand-violet) 55%, var(--brand-amber) 130%)",
          }}
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        >
          <span className="text-3xl">{personality?.emoji ?? "🌱"}</span>
        </motion.div>
        <Sparkles className="absolute -right-1 -top-1 size-5 text-accent" />
      </div>

      <div className="space-y-0.5">
        <p className="text-xs text-muted-foreground">
          {t.onboarding.eyebrow}
        </p>
        <p className="text-xl font-bold">
          {name || <span className="text-muted-foreground">···</span>}
        </p>
        {personality && (
          <p className="text-sm text-muted-foreground">
            {L(personality.label)}
          </p>
        )}
      </div>

      {interests.length > 0 && (
        <div className="flex flex-wrap justify-center gap-1.5">
          {interests.map((i) => (
            <span
              key={i.id}
              className="rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground"
            >
              {i.emoji} {L(i.label)}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
