"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Lightbulb,
  Loader2,
  PartyPopper,
  RotateCcw,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { AgentPreview } from "./agent-preview";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { useAccount } from "@/lib/account";
import { useLocalized, useT } from "@/lib/i18n";
import {
  onboardingSteps,
  type OnboardingAnswers,
} from "@/lib/mock/onboarding";
import { cn } from "@/lib/utils";

type Feedback = "idle" | "checking" | "correct" | "incorrect";

export function OnboardingGame({
  variant,
}: {
  variant: "desktop" | "mobile";
}) {
  const t = useT();
  const L = useLocalized();
  const account = useAccount();

  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<OnboardingAnswers>({});
  const [passed, setPassed] = useState<Record<string, boolean>>({});
  const [feedback, setFeedback] = useState<Feedback>("idle");
  const [completed, setCompleted] = useState(false);

  const step = onboardingSteps[index];
  const isLast = index === onboardingSteps.length - 1;
  const name = (answers.name as string)?.trim() || "";
  const completedCount = onboardingSteps.filter((s) => passed[s.id]).length;
  const pct = Math.round((completedCount / onboardingSteps.length) * 100);

  // Sync feedback when navigating between steps.
  useEffect(() => {
    setFeedback(passed[step.id] ? "correct" : "idle");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  function setAnswer(value: string | string[]) {
    setAnswers((a) => ({ ...a, [step.id]: value }));
    setPassed((p) => ({ ...p, [step.id]: false }));
    setFeedback("idle");
  }

  function toggleMulti(optionId: string) {
    const cur = (answers[step.id] as string[]) ?? [];
    setAnswer(
      cur.includes(optionId)
        ? cur.filter((x) => x !== optionId)
        : [...cur, optionId],
    );
  }

  function check() {
    setFeedback("checking");
    window.setTimeout(() => {
      const ok = step.validate(answers[step.id], answers);
      setPassed((p) => ({ ...p, [step.id]: ok }));
      setFeedback(ok ? "correct" : "incorrect");
    }, 480);
  }

  function next() {
    if (isLast) {
      setCompleted(true);
      account.claimAgent();
      return;
    }
    setIndex((i) => i + 1);
  }

  function restart() {
    setIndex(0);
    setAnswers({});
    setPassed({});
    setFeedback("idle");
    setCompleted(false);
  }

  // ── Completion screen ────────────────────────────────────────────────
  if (completed) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="mx-auto flex max-w-md flex-col items-center gap-6 rounded-3xl border border-border bg-card p-8 text-center"
      >
        <AgentPreview answers={answers} className="w-full border-0" />
        <PartyPopper className="size-10 text-accent" />
        <div className="space-y-2">
          <h2 className="text-2xl font-bold">{t.onboarding.completeTitle}</h2>
          <p className="text-muted-foreground">{t.onboarding.completeDesc}</p>
        </div>
        <div className="flex w-full flex-col gap-2.5">
          <Button asChild size="lg" className="w-full">
            <Link href="/">{t.onboarding.completeCta}</Link>
          </Button>
          <Button
            variant="ghost"
            onClick={restart}
            className="w-full text-muted-foreground"
          >
            <RotateCcw className="size-4" />
            {t.onboarding.restart}
          </Button>
        </div>
      </motion.div>
    );
  }

  const card = (
    <div className="flex flex-col gap-6 rounded-3xl border border-border bg-card p-6 sm:p-8">
      {/* progress */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-muted-foreground">
            {t.onboarding.stepLabel(index + 1, onboardingSteps.length)}
          </span>
          <span className="text-muted-foreground">
            {t.onboarding.progressLabel(pct)}
          </span>
        </div>
        <Progress value={pct} />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.25 }}
          className="flex flex-col gap-5"
        >
          <div className="space-y-1.5">
            <h2 className="text-xl font-bold tracking-tight sm:text-2xl">
              {L(step.title)}
            </h2>
            <p className="text-pretty leading-relaxed text-muted-foreground">
              {L(step.instruction)}
            </p>
          </div>

          <StepInput
            answers={answers}
            stepId={step.id}
            onText={setAnswer}
            onChoice={setAnswer}
            onToggleMulti={toggleMulti}
            name={name}
            feedback={feedback}
          />

          {/* hint */}
          <p className="inline-flex items-start gap-2 rounded-xl bg-muted px-3.5 py-2.5 text-sm text-muted-foreground">
            <Lightbulb className="mt-0.5 size-4 shrink-0 text-accent" />
            <span>
              <span className="font-medium text-foreground">
                {t.onboarding.hint}：
              </span>{" "}
              {L(step.hint)}
            </span>
          </p>

          {/* feedback */}
          <AnimatePresence>
            {feedback === "correct" && (
              <Feedback tone="correct" text={L(step.success)} />
            )}
            {feedback === "incorrect" && (
              <Feedback tone="incorrect" text={t.onboarding.incorrect} />
            )}
          </AnimatePresence>
        </motion.div>
      </AnimatePresence>

      {/* nav */}
      <div className="flex items-center justify-between gap-3 border-t border-border pt-5">
        <Button
          variant="ghost"
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
          disabled={index === 0}
          className={cn(index === 0 && "invisible")}
        >
          <ArrowLeft className="size-4" />
          {t.onboarding.prevStep}
        </Button>

        {feedback === "correct" ? (
          <Button onClick={next}>
            {isLast ? t.common.finish : t.onboarding.nextStep}
            <ArrowRight className="size-4" />
          </Button>
        ) : (
          <Button onClick={check} disabled={feedback === "checking"}>
            {feedback === "checking" ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                {t.onboarding.checking}
              </>
            ) : (
              <>
                <Check className="size-4" />
                {t.onboarding.checkCta}
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );

  if (variant === "mobile") {
    return (
      <div className="flex flex-col gap-5">
        <AgentPreview answers={answers} />
        {card}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-[300px_1fr] items-start gap-10">
      <AgentPreview answers={answers} className="sticky top-24" />
      {card}
    </div>
  );
}

function Feedback({
  tone,
  text,
}: {
  tone: "correct" | "incorrect";
  text: string;
}) {
  const Icon = tone === "correct" ? CheckCircle2 : XCircle;
  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className={cn(
        "flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium",
        tone === "correct"
          ? "border-success/30 bg-success/10 text-success"
          : "border-accent/40 bg-accent/10 text-accent-foreground",
      )}
    >
      <Icon className="size-5 shrink-0" />
      {text}
    </motion.div>
  );
}

function StepInput({
  answers,
  stepId,
  onText,
  onChoice,
  onToggleMulti,
  name,
  feedback,
}: {
  answers: OnboardingAnswers;
  stepId: string;
  onText: (v: string) => void;
  onChoice: (v: string) => void;
  onToggleMulti: (id: string) => void;
  name: string;
  feedback: Feedback;
}) {
  const t = useT();
  const L = useLocalized();
  const step = onboardingSteps.find((s) => s.id === stepId)!;
  const value = answers[stepId];

  if (step.type === "text" || step.type === "chat") {
    const isChat = step.type === "chat";
    const passed = feedback === "correct";
    return (
      <div className="flex flex-col gap-3">
        {isChat && passed && (
          <div className="flex flex-col gap-2">
            <div className="ml-auto max-w-[80%] rounded-2xl rounded-br-sm bg-primary px-4 py-2.5 text-sm text-primary-foreground">
              {value as string}
            </div>
            {step.reply && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mr-auto max-w-[85%] rounded-2xl rounded-bl-sm bg-muted px-4 py-2.5 text-sm"
              >
                {L(step.reply(name || "···"))}
              </motion.div>
            )}
          </div>
        )}
        {stepId === "first-task" ? (
          <textarea
            value={(value as string) ?? ""}
            onChange={(e) => onText(e.target.value)}
            placeholder={step.placeholder ? L(step.placeholder) : ""}
            rows={3}
            className="w-full resize-none rounded-xl border border-input bg-background px-4 py-3 text-base outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
          />
        ) : (
          <Input
            value={(value as string) ?? ""}
            onChange={(e) => onText(e.target.value)}
            placeholder={step.placeholder ? L(step.placeholder) : ""}
          />
        )}
      </div>
    );
  }

  if (step.type === "choice") {
    return (
      <div className="grid grid-cols-2 gap-3">
        {step.options?.map((o) => {
          const active = value === o.id;
          return (
            <button
              key={o.id}
              type="button"
              onClick={() => onChoice(o.id)}
              className={cn(
                "flex items-center gap-3 rounded-xl border p-3.5 text-left transition-colors",
                active
                  ? "border-primary bg-primary/5 ring-1 ring-primary"
                  : "border-border hover:bg-muted",
              )}
            >
              <span className="text-2xl">{o.emoji}</span>
              <span className="font-medium">{L(o.label)}</span>
            </button>
          );
        })}
      </div>
    );
  }

  // multi
  const selected = (value as string[]) ?? [];
  return (
    <div className="flex flex-wrap gap-2.5">
      {step.options?.map((o) => {
        const active = selected.includes(o.id);
        return (
          <button
            key={o.id}
            type="button"
            onClick={() => onToggleMulti(o.id)}
            className={cn(
              "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors",
              active
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border hover:bg-muted",
            )}
          >
            <span>{o.emoji}</span>
            {L(o.label)}
            {active && <Check className="size-3.5" />}
          </button>
        );
      })}
    </div>
  );
}
