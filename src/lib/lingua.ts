export const LEVELS = ["A0", "A1", "A2", "B1", "B2", "C1", "C2"] as const;
export type LevelCode = (typeof LEVELS)[number];

export const LEVEL_META: Record<
  LevelCode,
  { name: string; blurb: string; can: string }
> = {
  A0: { name: "Absolute Beginner", blurb: "Mulai dari nol", can: "I can say hello and introduce myself." },
  A1: { name: "Beginner", blurb: "Kalimat sehari-hari", can: "I can order food and talk about my day." },
  A2: { name: "Elementary", blurb: "Cerita & waktu", can: "I can tell a simple story about the past." },
  B1: { name: "Intermediate", blurb: "Ide yang kompleks", can: "I can have a 5-minute conversation." },
  B2: { name: "Upper Intermediate", blurb: "Nuansa & debat", can: "I can discuss and defend an opinion." },
  C1: { name: "Advanced", blurb: "Bahasa yang halus", can: "I can switch register naturally." },
  C2: { name: "Mastery", blurb: "Setara penutur asli", can: "I can discuss complex topics with ease." },
};

export const SKILLS = [
  "vocabulary",
  "grammar",
  "listening",
  "speaking",
  "reading",
  "writing",
  "pronunciation",
] as const;
export type Skill = (typeof SKILLS)[number];

export const XP_LEVELS = [
  { level: 1, title: "New Learner", min: 0 },
  { level: 2, title: "Explorer", min: 150 },
  { level: 3, title: "Beginner", min: 400 },
  { level: 4, title: "Communicator", min: 900 },
  { level: 5, title: "Confident Speaker", min: 1800 },
  { level: 6, title: "Fluent Learner", min: 3200 },
  { level: 7, title: "Real Talker", min: 5200 },
  { level: 8, title: "Wordsmith", min: 8000 },
];

export function xpLevel(xp: number) {
  let current = XP_LEVELS[0]!;
  for (const l of XP_LEVELS) if (xp >= l.min) current = l;
  const next = XP_LEVELS.find((l) => l.min > xp);
  const span = (next?.min ?? current.min + 2000) - current.min;
  const progress = Math.min(100, Math.round(((xp - current.min) / span) * 100));
  return { ...current, next, progress, toNext: (next?.min ?? current.min) - xp };
}

export const MILESTONES = [
  "I can introduce myself.",
  "I can order food.",
  "I can ask for directions.",
  "I can understand simple conversations.",
  "I can talk about my daily life.",
  "I can tell a story.",
  "I can have a 5-minute conversation.",
  "I can have a 15-minute conversation.",
  "I can discuss complex topics.",
];

export const STREAK_MILESTONES = [3, 7, 14, 30, 60, 100, 365];

/** How much Indonesian support the interface should give at each level. */
export function immersion(level: LevelCode) {
  const idx = LEVELS.indexOf(level);
  if (idx <= 0) return { indonesian: "full", label: "Bahasa Indonesia penuh" } as const;
  if (idx === 1) return { indonesian: "high", label: "Indonesia + English sederhana" } as const;
  if (idx === 2) return { indonesian: "some", label: "Mostly simple English" } as const;
  if (idx === 3) return { indonesian: "little", label: "Mostly English" } as const;
  return { indonesian: "none", label: "English first" } as const;
}

export function showIndonesian(level: LevelCode) {
  return ["full", "high", "some"].includes(immersion(level).indonesian);
}

export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function greeting(name: string) {
  const h = new Date().getHours();
  const part = h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
  return `${part}, ${name}`;
}

export function normalize(text: string) {
  return text
    .toLowerCase()
    .replace(/[.,!?;:'"’]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function answersMatch(given: string, expected: string) {
  return normalize(given) === normalize(expected);
}

/** SM-2 style spaced repetition. Grade: 0 forgot, 1 hard, 2 good, 3 easy. */
export function scheduleReview(
  grade: 0 | 1 | 2 | 3,
  prev: { ease: number; interval_days: number; reps: number; lapses: number },
) {
  let { ease, interval_days: interval, reps, lapses } = prev;
  if (grade === 0) {
    lapses += 1;
    reps = 0;
    interval = 0;
    ease = Math.max(1.3, ease - 0.25);
  } else {
    reps += 1;
    if (grade === 1) {
      ease = Math.max(1.3, ease - 0.15);
      interval = interval <= 1 ? 1 : interval * 1.2;
    } else if (grade === 2) {
      interval = reps === 1 ? 1 : reps === 2 ? 3 : interval * ease;
    } else {
      ease = Math.min(3.0, ease + 0.12);
      interval = reps === 1 ? 3 : interval * ease * 1.3;
    }
  }
  interval = Math.min(365, Math.round(interval * 10) / 10);
  const status =
    grade === 0 ? "learning" : interval >= 21 ? "mastered" : interval >= 5 ? "familiar" : "learning";
  const due = new Date(Date.now() + Math.max(0.007, interval) * 86400000).toISOString();
  return { ease, interval_days: interval, reps, lapses, status, due_at: due };
}

export const VOCAB_CATEGORIES = [
  "Food",
  "Travel",
  "School",
  "Work",
  "Technology",
  "Family",
  "Sports",
  "Daily Life",
  "Emotions",
  "Nature",
  "Business",
  "Entertainment",
  "Health",
  "Shopping",
  "Transportation",
];

/** Browser text-to-speech with graceful fallback. */
export function speak(text: string, rate = 1) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return false;
  try {
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "en-US";
    utter.rate = rate;
    window.speechSynthesis.speak(utter);
    return true;
  } catch {
    return false;
  }
}

export function speechSupported() {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}
