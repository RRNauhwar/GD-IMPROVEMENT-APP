import { useMemo, useState } from "react";
import type { Difficulty, Duration, SessionMode, Topic } from "../types";
import { DURATION_OPTIONS } from "../types";
import { allCategories, generateTopic } from "../lib/topics";

const MODES: SessionMode[] = [
  "Random Topic",
  "Group Discussion",
  "Debate",
  "Interview",
  "Storytelling",
];
const DIFFICULTIES: Difficulty[] = ["Beginner", "Intermediate", "Advanced", "Expert"];

function fmtDuration(sec: number): string {
  if (sec < 60) return `${sec} sec`;
  const m = sec / 60;
  return `${m} min`;
}

export function SetupScreen({
  initialTopic,
  onStart,
}: {
  initialTopic?: Topic | null;
  onStart: (opts: {
    topic: Topic;
    mode: SessionMode;
    difficulty: Difficulty;
    durationSec: Duration;
  }) => void;
}) {
  const [mode, setMode] = useState<SessionMode>("Random Topic");
  const [difficulty, setDifficulty] = useState<Difficulty>(
    initialTopic?.difficulty ?? "Intermediate"
  );
  const [category, setCategory] = useState<string>("Any");
  const [duration, setDuration] = useState<Duration>(60);
  const [topic, setTopic] = useState<Topic>(
    initialTopic ?? generateTopic("Intermediate")
  );

  const categories = useMemo(() => ["Any", ...allCategories()], []);

  const roll = () =>
    setTopic(generateTopic(difficulty, category === "Any" ? undefined : category));

  return (
    <div className="grid" style={{ gap: 20 }}>
      <div className="hero">
        <h1>Speak. Get coached. Improve daily.</h1>
        <p className="muted">
          Pick a mode, choose your challenge, and speak. SpeakX AI listens
          silently, then delivers a full coaching report.
        </p>
      </div>

      <div className="card">
        <h3>1 · Choose your mode</h3>
        <div className="chips">
          {MODES.map((m) => (
            <button
              key={m}
              className={`chip ${mode === m ? "selected" : ""}`}
              onClick={() => setMode(m)}
            >
              {m}
            </button>
          ))}
        </div>

        <h3 className="mt-lg">2 · Difficulty</h3>
        <div className="chips">
          {DIFFICULTIES.map((d) => (
            <button
              key={d}
              className={`chip ${difficulty === d ? "selected" : ""}`}
              onClick={() => setDifficulty(d)}
            >
              {d}
            </button>
          ))}
        </div>

        <h3 className="mt-lg">3 · Topic category</h3>
        <div className="chips">
          {categories.map((c) => (
            <button
              key={c}
              className={`chip ${category === c ? "selected" : ""}`}
              onClick={() => setCategory(c)}
            >
              {c}
            </button>
          ))}
        </div>

        <h3 className="mt-lg">4 · Speaking time</h3>
        <div className="chips">
          {DURATION_OPTIONS.map((d) => (
            <button
              key={d}
              className={`chip ${duration === d ? "selected" : ""}`}
              onClick={() => setDuration(d)}
            >
              {fmtDuration(d)}
            </button>
          ))}
        </div>
      </div>

      <div className="card">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <h3 style={{ margin: 0 }}>Your topic</h3>
          <div className="chips">
            <span className="pill">{topic.category}</span>
            <span className="pill">{difficulty}</span>
            <button className="ghost" onClick={roll}>
              🎲 New topic
            </button>
          </div>
        </div>
        <h2 className="mt">{topic.title}</h2>
        <p className="muted" style={{ whiteSpace: "pre-wrap" }}>
          {topic.prompt}
        </p>

        <div className="row-actions mt-lg">
          <button
            className="primary"
            onClick={() =>
              onStart({ topic: { ...topic, difficulty }, mode, difficulty, durationSec: duration })
            }
          >
            ▶ Start speaking ({fmtDuration(duration)})
          </button>
        </div>
      </div>
    </div>
  );
}
