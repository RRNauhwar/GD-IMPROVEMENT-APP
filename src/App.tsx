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
import { analyzeSpeech } from "./lib/analysis/engine";
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

type Screen = "home" | "speaking" | "report" | "dashboard" | "settings";

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

  const prog = useMemo(() => levelProgress(game), [game]);

  const startSession = (cfg: ActiveConfig) => {
    setActive(cfg);
    setScreen("speaking");
  };

  const handleFinish = async (transcript: string, actualSpeakingSec: number) => {
    if (!active) return;
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
      <div className="topbar">
        <div className="brand">
          <span className="dot" />
          SpeakX&nbsp;AI
          <span className="small muted" style={{ fontWeight: 400 }}>· GD Improvement</span>
        </div>
        <div className="nav">
          <span className="pill">Lv {game.level}</span>
          <span className="pill" title="XP toward next level">
            ⚡ {prog.current}/{prog.needed}
          </span>
          <span className="pill">🔥 {game.streakDays}d</span>
          <button
            className={screen === "home" ? "active" : ""}
            onClick={() => setScreen("home")}
          >
            Practice
          </button>
          <button
            className={screen === "dashboard" ? "active" : ""}
            onClick={() => setScreen("dashboard")}
          >
            Dashboard
          </button>
          <button
            className={screen === "settings" ? "active" : ""}
            onClick={() => setScreen("settings")}
          >
            ⚙
          </button>
        </div>
      </div>

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
    </div>
  );
}
