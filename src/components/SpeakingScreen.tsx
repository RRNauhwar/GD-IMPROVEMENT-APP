import { useEffect, useRef, useState } from "react";
import type { Difficulty, SessionMode, Topic } from "../types";
import { useSpeechRecognition } from "../hooks/useSpeechRecognition";

function mmss(total: number): string {
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function SpeakingScreen({
  topic,
  mode,
  difficulty,
  durationSec,
  onFinish,
  onCancel,
}: {
  topic: Topic;
  mode: SessionMode;
  difficulty: Difficulty;
  durationSec: number;
  onFinish: (transcript: string, actualSpeakingSec: number) => void;
  onCancel: () => void;
}) {
  const speech = useSpeechRecognition();
  const [remaining, setRemaining] = useState(durationSec);
  const [started, setStarted] = useState(false);
  const [manual, setManual] = useState("");
  const startedAt = useRef<number>(0);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const begin = () => {
    setStarted(true);
    startedAt.current = Date.now();
    speech.reset();
    speech.start();
    tickRef.current = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          finish();
          return 0;
        }
        return r - 1;
      });
    }, 1000);
  };

  const finish = () => {
    if (tickRef.current) clearInterval(tickRef.current);
    tickRef.current = null;
    speech.stop();
    const elapsed = startedAt.current
      ? Math.round((Date.now() - startedAt.current) / 1000)
      : durationSec;
    const spoken = manual.trim() ? manual.trim() : speech.finalTranscript.trim();
    onFinish(spoken, Math.max(1, Math.min(elapsed, durationSec)));
  };

  useEffect(() => {
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, []);

  const warning = remaining <= 10 && remaining > 5;
  const danger = remaining <= 5;

  return (
    <div className="grid" style={{ gap: 18 }}>
      <div className="card">
        <div className="chips">
          <span className="pill">{mode}</span>
          <span className="pill">{topic.category}</span>
          <span className="pill">{difficulty}</span>
        </div>
        <h2 className="mt">{topic.title}</h2>
        <p className="muted" style={{ whiteSpace: "pre-wrap" }}>
          {topic.prompt}
        </p>
      </div>

      <div className="card center">
        <div
          className={`timer ${danger ? "danger" : warning ? "warning" : ""}`}
        >
          {mmss(remaining)}
        </div>
        {warning && <div className="tag-warn">⚠ 10 seconds left — wrap up your conclusion!</div>}
        {!started ? (
          <div className="row-actions mt">
            <button className="primary" onClick={begin}>
              🎤 Begin now
            </button>
            <button className="ghost" onClick={onCancel}>
              Cancel
            </button>
          </div>
        ) : (
          <div className="row-actions mt">
            <button className="primary" onClick={finish}>
              ⏹ Finish &amp; get report
            </button>
          </div>
        )}
        {started && (
          <div className="small muted mt">
            {speech.listening ? "🔴 Listening…" : "Mic paused"} · speak naturally, I won't interrupt.
          </div>
        )}
      </div>

      {started && (
        <div className="card">
          <h3>Live transcript</h3>
          {speech.supported ? (
            <div className="transcript">
              {speech.finalTranscript}
              <span className="interim"> {speech.interimTranscript}</span>
              {!speech.finalTranscript && !speech.interimTranscript && (
                <span className="muted">Your words will appear here…</span>
              )}
            </div>
          ) : (
            <>
              <p className="small tag-warn">
                Speech recognition isn't available in this browser (works best in
                Chrome/Edge). Type or paste what you said before finishing:
              </p>
              <textarea
                value={manual}
                onChange={(e) => setManual(e.target.value)}
                placeholder="Type your response here…"
              />
            </>
          )}
          {speech.error && <p className="small tag-bad mt">{speech.error}</p>}
          {speech.supported && (
            <details className="mt">
              <summary className="small muted">Transcript looks wrong? Edit it manually</summary>
              <textarea
                className="mt"
                value={manual || speech.finalTranscript}
                onChange={(e) => setManual(e.target.value)}
              />
            </details>
          )}
        </div>
      )}
    </div>
  );
}
