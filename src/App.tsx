import { useMemo, useState } from "react";
import type {
  CoachReport,
  Difficulty,
  Duration,
  GamificationState,
  Session,
  SessionMode,
  Topic,
} from "./types";
import {
  analyzeSpeech,
  countSpokenWords,
  MIN_SPEECH_WORDS,
} from "./lib/analysis/engine";
import { SetupScreen } from "./components/SetupScreen";
import { SpeakingScreen } from "./components/SpeakingScreen";
import { ReportView } from "./components/ReportView";
import { Dashboard } from "./components/Dashboard";
import { Settings } from "./components/Settings";
import {
  clearSessions,
  deleteSession,
  loadApiKey,
  loadGamification,
  loadSessions,
  saveSession,
} from "./lib/storage";
import { awardForSession, buildInsights, levelProgress, type XpResult } from "./lib/gamification";
import { applyEnhancement, enhanceWithLlm } from "./lib/llm";

type Screen =
  | "home"
  | "speaking"
  | "report"
  | "dashboard"
  | "settings"
  | "nospeech";

interface ActiveConfig {
  topic: Topic;
  mode: SessionMode;
  difficulty: Difficulty;
  durationSec: Duration;
}

export default function App() {
  const [screen, setScreen] = useState<Screen>("home");
  const [sessions, setSessions] = useState<Session[]>(() => loadSessions());
  const [game, setGame] = useState<GamificationState>(() => loadGamification());
  const [active, setActive] = useState<ActiveConfig | null>(null);
  const [presetTopic, setPresetTopic] = useState<Topic | null>(null);

  const [report, setReport] = useState<CoachReport | null>(null);
  const [currentSession, setCurrentSession] = useState<Session | null>(null);
  const [insights, setInsights] = useState<string[]>([]);
  const [xp, setXp] = useState<XpResult | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [spokenWords, setSpokenWords] = useState(0);

  const prog = useMemo(() => levelProgress(game), [game]);

  const startSession = (cfg: ActiveConfig) => {
    setActive(cfg);
    setScreen("speaking");
  };

  const handleFinish = async (transcript: string, actualSpeakingSec: number) => {
    if (!active) return;

    // Guard: don't score, save, or award XP unless the user actually spoke.
    const wordCount = countSpokenWords(transcript);
    if (wordCount < MIN_SPEECH_WORDS) {
      setSpokenWords(wordCount);
      setScreen("nospeech");
      return;
    }

    setAnalyzing(true);

    const base = analyzeSpeech({
      transcript,
      topic: active.topic,
      mode: active.mode,
      difficulty: active.difficulty,
      durationSec: active.durationSec,
      actualSpeakingSec,
    });

    // Optional LLM enrichment.
    let finalReport = base;
    const apiKey = loadApiKey();
    if (apiKey && transcript.trim().length > 0) {
      const enh = await enhanceWithLlm({
        apiKey,
        topicTitle: active.topic.title,
        difficulty: active.difficulty,
        durationSec: active.durationSec,
        transcript,
        baseReport: base,
      });
      if (enh) finalReport = applyEnhancement(base, enh);
    }

    const session: Session = {
      id: `sess_${Date.now()}`,
      date: new Date().toISOString(),
      topic: active.topic,
      mode: active.mode,
      difficulty: active.difficulty,
      durationSec: active.durationSec,
      actualSpeakingSec,
      transcript,
      report: finalReport,
    };

    const priorSessions = sessions;
    const builtInsights = buildInsights(session, priorSessions);
    const xpResult = awardForSession(finalReport, priorSessions.length + 1);

    const updated = saveSession(session);
    setSessions(updated);
    setGame(xpResult.state);
    setReport(finalReport);
    setCurrentSession(session);
    setInsights(builtInsights);
    setXp(xpResult);
    setAnalyzing(false);
    setScreen("report");
  };

  const practiceNext = (topic: Topic) => {
    setPresetTopic(topic);
    setScreen("home");
  };

  return (
    <div className="app">
      <header className="topbar">
        <button className="brand" onClick={() => setScreen("home")}>
          <span className="logo">S</span>
          <span className="brand-name">
            SpeakX<span className="brand-accent">AI</span>
          </span>
        </button>

        <nav className="nav">
          <button
            className={`tab ${screen === "home" || screen === "speaking" ? "active" : ""}`}
            onClick={() => setScreen("home")}
          >
            🎤 Practice
          </button>
          <button
            className={`tab ${screen === "dashboard" ? "active" : ""}`}
            onClick={() => setScreen("dashboard")}
          >
            📈 Progress
          </button>
          <button
            className={`tab ${screen === "settings" ? "active" : ""}`}
            onClick={() => setScreen("settings")}
          >
            ⚙️
          </button>
        </nav>

        <div className="stats-cluster">
          <div className="stat-pill">
            <span className="stat-pill-label">Level</span>
            <span className="stat-pill-value">{game.level}</span>
          </div>
          <div className="stat-pill xp" title="XP toward next level">
            <div className="xp-bar">
              <div className="xp-fill" style={{ width: `${prog.pct}%` }} />
            </div>
            <span className="stat-pill-value small">
              {prog.current}/{prog.needed} XP
            </span>
          </div>
          <div className="stat-pill">
            <span className="stat-pill-value">🔥 {game.streakDays}</span>
          </div>
        </div>
      </header>

      {analyzing && (
        <div className="card center">
          <h3>Analyzing your speech…</h3>
          <p className="muted">Building your coaching report.</p>
        </div>
      )}

      {!analyzing && screen === "home" && (
        <SetupScreen initialTopic={presetTopic} onStart={startSession} />
      )}

      {!analyzing && screen === "speaking" && active && (
        <SpeakingScreen
          topic={active.topic}
          mode={active.mode}
          difficulty={active.difficulty}
          durationSec={active.durationSec}
          onFinish={handleFinish}
          onCancel={() => setScreen("home")}
        />
      )}

      {!analyzing && screen === "report" && report && currentSession && (
        <ReportView
          report={report}
          session={currentSession}
          insights={insights}
          xp={xp}
          onPracticeNext={practiceNext}
          onHome={() => setScreen("home")}
        />
      )}

      {!analyzing && screen === "dashboard" && (
        <Dashboard
          sessions={sessions}
          onStart={() => setScreen("home")}
          onDelete={(id) => setSessions(deleteSession(id))}
          onClear={() => {
            clearSessions();
            setSessions([]);
          }}
        />
      )}

      {!analyzing && screen === "settings" && (
        <Settings onClose={() => setScreen("home")} />
      )}

      {!analyzing && screen === "nospeech" && (
        <div className="empty-state card">
          <div className="empty-emoji">🤫</div>
          <h2>I didn't catch enough to coach you</h2>
          <p className="muted">
            {spokenWords === 0
              ? "No speech was detected."
              : `I only picked up ${spokenWords} word${spokenWords === 1 ? "" : "s"}.`}{" "}
            You need at least {MIN_SPEECH_WORDS} words for a fair, honest report —
            so no score or XP was recorded for this attempt.
          </p>
          <ul className="tips">
            <li>Allow microphone access, then speak clearly and continuously.</li>
            <li>
              Live transcription works best in <b>Chrome</b> or <b>Edge</b>. In other
              browsers, type what you said in the box before finishing.
            </li>
            <li>Don't finish until you actually see your words in the transcript.</li>
          </ul>
          <div className="row-actions mt-lg">
            <button
              className="primary"
              onClick={() => active && setScreen("speaking")}
            >
              🎤 Try again
            </button>
            <button className="ghost" onClick={() => setScreen("home")}>
              Pick a new topic
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
