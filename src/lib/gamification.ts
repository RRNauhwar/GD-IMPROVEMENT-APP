import type { CoachReport, GamificationState, Session } from "../types";
import { loadGamification, saveGamification } from "./storage";

/** XP required to reach the *next* level grows linearly. */
export function xpForLevel(level: number): number {
  return level * 100;
}

export function levelProgress(state: GamificationState): {
  current: number;
  needed: number;
  pct: number;
} {
  const needed = xpForLevel(state.level);
  const intoLevel = state.xp % needed;
  return { current: intoLevel, needed, pct: Math.round((intoLevel / needed) * 100) };
}

function daysBetween(a: Date, b: Date): number {
  const ms = 24 * 60 * 60 * 1000;
  const da = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const db = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.round((db - da) / ms);
}

const BADGE_RULES: { id: string; test: (ctx: BadgeContext) => boolean }[] = [
  { id: "First Steps", test: (c) => c.totalSessions >= 1 },
  { id: "Consistency: 3-day streak", test: (c) => c.streakDays >= 3 },
  { id: "On Fire: 7-day streak", test: (c) => c.streakDays >= 7 },
  { id: "Grammar Master", test: (c) => c.report.scores.grammar >= 90 },
  { id: "Vocabulary Ninja", test: (c) => c.report.scores.vocabulary >= 85 },
  { id: "Public Speaker", test: (c) => c.report.scores.confidence >= 85 },
  { id: "Debate Champion", test: (c) => c.report.debate.persuasiveness >= 85 },
  { id: "Interview Ready", test: (c) => c.report.interview.bigTech >= 80 },
  { id: "Fluency Pro", test: (c) => c.report.fluency.totalFillers === 0 && c.report.fluency.totalWords > 40 },
  { id: "High Scorer", test: (c) => c.report.overallScore >= 85 },
  { id: "Marathon: 10 sessions", test: (c) => c.totalSessions >= 10 },
];

interface BadgeContext {
  totalSessions: number;
  streakDays: number;
  report: CoachReport;
}

export interface XpResult {
  state: GamificationState;
  xpGained: number;
  leveledUp: boolean;
  newBadges: string[];
}

/**
 * Award XP for a completed session, update the streak, and unlock badges.
 * XP = overall score scaled + bonuses for structure and low fillers.
 */
export function awardForSession(report: CoachReport, totalSessions: number): XpResult {
  const prev = loadGamification();
  const state: GamificationState = { ...prev, badges: [...prev.badges] };

  const base = Math.round(report.overallScore / 2); // up to 50
  const structureBonus = Math.round(report.structure.score / 10); // up to 10
  const fillerBonus = report.fluency.totalFillers === 0 ? 15 : 0;
  const xpGained = base + structureBonus + fillerBonus + 10; // +10 just for showing up

  // Streak handling.
  const today = new Date();
  if (state.lastSessionDate) {
    const gap = daysBetween(new Date(state.lastSessionDate), today);
    if (gap === 0) {
      // same day, streak unchanged
    } else if (gap === 1) {
      state.streakDays += 1;
    } else {
      state.streakDays = 1;
    }
  } else {
    state.streakDays = 1;
  }
  state.lastSessionDate = today.toISOString();

  // XP / level.
  const beforeLevel = state.level;
  state.xp += xpGained;
  while (state.xp >= xpForLevel(state.level)) {
    state.xp -= xpForLevel(state.level);
    state.level += 1;
  }
  const leveledUp = state.level > beforeLevel;

  // Badges.
  const ctx: BadgeContext = { totalSessions, streakDays: state.streakDays, report };
  const newBadges: string[] = [];
  for (const rule of BADGE_RULES) {
    if (!state.badges.includes(rule.id) && rule.test(ctx)) {
      state.badges.push(rule.id);
      newBadges.push(rule.id);
    }
  }

  saveGamification(state);
  return { state, xpGained, leveledUp, newBadges };
}

/** Compare current session scores against the average of previous sessions. */
export function buildInsights(current: Session, previous: Session[]): string[] {
  if (previous.length === 0) {
    return ["This is your first session - it becomes your baseline. Every future report compares against it."];
  }
  const avg = (pick: (s: Session) => number) =>
    previous.reduce((sum, s) => sum + pick(s), 0) / previous.length;

  const insights: string[] = [];
  const compare = (label: string, cur: number, prevAvg: number, unit = "") => {
    const diff = Math.round(cur - prevAvg);
    if (Math.abs(diff) < 2) return;
    const dir = diff > 0 ? "improved" : "dropped";
    insights.push(`${label} ${dir} by ${Math.abs(diff)}${unit} vs your average.`);
  };

  compare("Overall score", current.report.overallScore, avg((s) => s.report.overallScore));
  compare("Grammar", current.report.scores.grammar, avg((s) => s.report.scores.grammar));
  compare("Vocabulary", current.report.scores.vocabulary, avg((s) => s.report.scores.vocabulary));
  compare("Confidence", current.report.scores.confidence, avg((s) => s.report.scores.confidence));
  compare(
    "Speaking speed",
    current.report.fluency.wordsPerMinute,
    avg((s) => s.report.fluency.wordsPerMinute),
    " wpm"
  );

  const curFillerRate =
    current.report.fluency.totalFillers / Math.max(current.report.fluency.totalWords, 1);
  const prevFillerRate = avg(
    (s) => s.report.fluency.totalFillers / Math.max(s.report.fluency.totalWords, 1)
  );
  if (curFillerRate < prevFillerRate - 0.01)
    insights.push("You are using noticeably fewer filler words than before.");

  if (insights.length === 0)
    insights.push("Your performance is steady. Push into a harder difficulty to keep growing.");
  return insights;
}
