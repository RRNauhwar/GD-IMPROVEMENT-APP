import { useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Session } from "../types";
import { Stat } from "./common";

type Metric =
  | "overall"
  | "grammar"
  | "vocabulary"
  | "confidence"
  | "fluency"
  | "pronunciation"
  | "criticalThinking"
  | "pressureHandling"
  | "wpm";

const METRICS: { key: Metric; label: string }[] = [
  { key: "overall", label: "Overall" },
  { key: "grammar", label: "Grammar" },
  { key: "vocabulary", label: "Vocabulary" },
  { key: "confidence", label: "Confidence" },
  { key: "fluency", label: "Fluency" },
  { key: "pronunciation", label: "Pronunciation" },
  { key: "criticalThinking", label: "Critical Thinking" },
  { key: "pressureHandling", label: "Pressure" },
  { key: "wpm", label: "Speaking Speed (wpm)" },
];

function metricValue(s: Session, m: Metric): number {
  if (m === "overall") return s.report.overallScore;
  if (m === "wpm") return s.report.fluency.wordsPerMinute;
  return s.report.scores[m];
}

export function Dashboard({
  sessions,
  onDelete,
  onClear,
  onStart,
}: {
  sessions: Session[];
  onDelete: (id: string) => void;
  onClear: () => void;
  onStart: () => void;
}) {
  const [metric, setMetric] = useState<Metric>("overall");

  if (sessions.length === 0) {
    return (
      <div className="card center">
        <h2>No sessions yet</h2>
        <p className="muted">
          Your progress dashboard fills up as you practice. Complete your first
          session to set a baseline.
        </p>
        <div className="row-actions mt">
          <button className="primary" onClick={onStart}>▶ Start your first session</button>
        </div>
      </div>
    );
  }

  // Chronological (oldest → newest) for the trend line.
  const chrono = [...sessions].reverse();
  const data = chrono.map((s, i) => ({
    name: `#${i + 1}`,
    value: metricValue(s, metric),
    date: new Date(s.date).toLocaleDateString(),
  }));

  const overallList = sessions.map((s) => s.report.overallScore);
  const best = Math.max(...overallList);
  const worst = Math.min(...overallList);
  const avg = Math.round(overallList.reduce((a, b) => a + b, 0) / overallList.length);
  const first = chrono[0].report.overallScore;
  const last = chrono[chrono.length - 1].report.overallScore;
  const improvementPct = first ? Math.round(((last - first) / first) * 100) : 0;

  return (
    <div className="grid" style={{ gap: 16 }}>
      <div className="card grid cols-4">
        <Stat num={sessions.length} label="Sessions" />
        <Stat num={best} label="Best score" />
        <Stat num={avg} label="Average" />
        <Stat
          num={`${improvementPct >= 0 ? "+" : ""}${improvementPct}%`}
          label="Improvement (first→last)"
        />
      </div>

      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
          <h3 style={{ margin: 0 }}>Progress over time</h3>
          <select value={metric} onChange={(e) => setMetric(e.target.value as Metric)} style={{ width: "auto" }}>
            {METRICS.map((m) => (
              <option key={m.key} value={m.key}>{m.label}</option>
            ))}
          </select>
        </div>
        <div style={{ height: 280 }} className="mt">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 10, right: 16, bottom: 0, left: -16 }}>
              <CartesianGrid stroke="#e7e9f5" strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fill: "#737a95", fontSize: 12 }} />
              <YAxis tick={{ fill: "#737a95", fontSize: 12 }} domain={metric === "wpm" ? [0, "auto"] : [0, 100]} />
              <Tooltip
                contentStyle={{ background: "#ffffff", border: "1px solid #e7e9f5", borderRadius: 10 }}
                labelStyle={{ color: "#171a2e" }}
              />
              <Line type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={3} dot={{ r: 4, fill: "#6366f1" }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <p className="small muted">Best {best} · Worst {worst} · Average {avg}</p>
      </div>

      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ margin: 0 }}>Session history</h3>
          <button className="danger ghost small" onClick={onClear}>Clear all</button>
        </div>
        <div className="mt">
          {sessions.map((s) => (
            <div key={s.id} className="kv">
              <span>
                <b>{s.report.overallScore}</b> · {s.topic.title}
              </span>
              <span className="small muted" style={{ display: "flex", gap: 10, alignItems: "center" }}>
                {s.difficulty} · {new Date(s.date).toLocaleDateString()}
                <button className="ghost small" onClick={() => onDelete(s.id)}>✕</button>
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
