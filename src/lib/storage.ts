import type { GamificationState, Session } from "../types";

const SESSIONS_KEY = "speakx.sessions.v1";
const GAME_KEY = "speakx.gamification.v1";
const APIKEY_KEY = "speakx.openai.key.v1";

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

// ---- Sessions ------------------------------------------------------------

export function loadSessions(): Session[] {
  return safeParse<Session[]>(localStorage.getItem(SESSIONS_KEY), []);
}

export function saveSession(session: Session): Session[] {
  const all = loadSessions();
  all.unshift(session);
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(all));
  return all;
}

export function deleteSession(id: string): Session[] {
  const all = loadSessions().filter((s) => s.id !== id);
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(all));
  return all;
}

export function clearSessions(): void {
  localStorage.removeItem(SESSIONS_KEY);
}

// ---- Gamification --------------------------------------------------------

const DEFAULT_GAME: GamificationState = {
  xp: 0,
  level: 1,
  streakDays: 0,
  lastSessionDate: null,
  badges: [],
};

export function loadGamification(): GamificationState {
  return safeParse<GamificationState>(localStorage.getItem(GAME_KEY), DEFAULT_GAME);
}

export function saveGamification(state: GamificationState): void {
  localStorage.setItem(GAME_KEY, JSON.stringify(state));
}

// ---- API key (optional LLM) ---------------------------------------------

export function loadApiKey(): string {
  return localStorage.getItem(APIKEY_KEY) ?? "";
}

export function saveApiKey(key: string): void {
  if (key) localStorage.setItem(APIKEY_KEY, key);
  else localStorage.removeItem(APIKEY_KEY);
}
