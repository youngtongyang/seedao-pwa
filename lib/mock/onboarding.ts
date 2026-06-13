import type { Localized } from "@/lib/i18n/config";

export type StepType = "text" | "choice" | "multi" | "chat";

export type StepOption = { id: string; label: Localized; emoji?: string };

/** The running answers, keyed by step id. */
export type OnboardingAnswers = Record<string, string | string[]>;

export type OnboardingStep = {
  id: string;
  type: StepType;
  title: Localized;
  instruction: Localized;
  hint: Localized;
  placeholder?: Localized;
  options?: StepOption[];
  /** Returns true when the user's answer for this step is acceptable. */
  validate: (answer: string | string[] | undefined, answers: OnboardingAnswers) => boolean;
  /** Encouraging line shown when the step passes. */
  success: Localized;
  /** For chat steps: the agent's reply, given the user's name. */
  reply?: (name: string) => Localized;
};

const nonEmpty = (a: string | string[] | undefined) =>
  typeof a === "string" ? a.trim().length > 0 : Array.isArray(a) && a.length > 0;

export const onboardingSteps: OnboardingStep[] = [
  {
    id: "name",
    type: "text",
    title: { zh: "给它起个名字", en: "Give it a name" },
    instruction: {
      zh: "你的智能体还没有名字。想一个你喜欢的名字，写在下面吧。",
      en: "Your agent has no name yet. Think of one you like and type it below.",
    },
    hint: {
      zh: "任何名字都可以——可以是一个词、一个昵称，甚至一个表情。",
      en: "Any name works — a word, a nickname, even an emoji.",
    },
    placeholder: { zh: "比如：小芽、Aria…", en: "e.g. Sprout, Aria…" },
    validate: (a) => nonEmpty(a),
    success: { zh: "好名字！它已经记住了。", en: "Lovely name! It will remember." },
  },
  {
    id: "personality",
    type: "choice",
    title: { zh: "选择它的性格", en: "Choose its personality" },
    instruction: {
      zh: "你希望它是怎样的伙伴？选一个最贴近的性格。",
      en: "What kind of companion do you want? Pick the closest personality.",
    },
    hint: {
      zh: "没有对错，凭直觉选一个就好，之后还能改。",
      en: "No right answer — go with your gut, you can change it later.",
    },
    options: [
      { id: "warm", emoji: "🤗", label: { zh: "温暖体贴", en: "Warm & caring" } },
      { id: "rational", emoji: "🧠", label: { zh: "理性清晰", en: "Clear & rational" } },
      { id: "playful", emoji: "✨", label: { zh: "幽默有趣", en: "Playful & fun" } },
      { id: "calm", emoji: "🌙", label: { zh: "沉静治愈", en: "Calm & soothing" } },
    ],
    validate: (a) => nonEmpty(a),
    success: { zh: "已经设定好性格啦。", en: "Personality set." },
  },
  {
    id: "interests",
    type: "multi",
    title: { zh: "告诉它你的兴趣", en: "Tell it your interests" },
    instruction: {
      zh: "选择你感兴趣的方向（至少一个），它会更懂你。",
      en: "Pick what you're into (at least one) so it understands you better.",
    },
    hint: {
      zh: "可以多选。选得越贴近你，它给的陪伴越合拍。",
      en: "Choose as many as you like — the truer to you, the better the fit.",
    },
    options: [
      { id: "reading", emoji: "📚", label: { zh: "阅读", en: "Reading" } },
      { id: "writing", emoji: "✍️", label: { zh: "创作", en: "Creating" } },
      { id: "tech", emoji: "💡", label: { zh: "科技", en: "Tech" } },
      { id: "art", emoji: "🎨", label: { zh: "艺术", en: "Art" } },
      { id: "wellbeing", emoji: "🌱", label: { zh: "自我探索", en: "Self-growth" } },
      { id: "people", emoji: "🤝", label: { zh: "结识朋友", en: "Meeting people" } },
    ],
    validate: (a) => Array.isArray(a) && a.length >= 1,
    success: { zh: "它记下了你的喜好。", en: "It noted what you love." },
  },
  {
    id: "first-task",
    type: "text",
    title: { zh: "交给它第一件事", en: "Give it a first task" },
    instruction: {
      zh: "写下你想让它帮你做的第一件小事，比如「每天提醒我读十分钟书」。",
      en: "Write the first little thing you'd like its help with, e.g. “remind me to read for ten minutes a day”.",
    },
    hint: {
      zh: "尽量具体一点（至少几个字），它就能更好地帮你。",
      en: "Be a bit specific (a few words at least) so it can help well.",
    },
    placeholder: {
      zh: "我想让它帮我…",
      en: "I'd like it to help me…",
    },
    validate: (a) => typeof a === "string" && a.trim().length >= 4,
    success: { zh: "收到！它会记住这件事。", en: "Got it — it will remember this." },
  },
  {
    id: "greet",
    type: "chat",
    title: { zh: "和它打个招呼", en: "Say hello" },
    instruction: {
      zh: "在下面对它说一声「你好」，看看它怎么回应你。",
      en: "Say “hello” to it below and see how it responds.",
    },
    hint: {
      zh: "输入「你好」或「hello」就可以了。",
      en: "Just type “hello” (or “你好”).",
    },
    placeholder: { zh: "你好…", en: "hello…" },
    validate: (a) =>
      typeof a === "string" &&
      /(你好|您好|hi|hello|hey)/i.test(a.trim()),
    success: { zh: "它回应你了——你们的故事开始了！", en: "It replied — your story begins!" },
    reply: (name) => ({
      zh: `你好呀！我是${name}，很高兴遇见你。从现在起，我会陪着你一起探索。`,
      en: `Hello! I'm ${name}, so glad to meet you. From now on, I'll explore alongside you.`,
    }),
  },
];
