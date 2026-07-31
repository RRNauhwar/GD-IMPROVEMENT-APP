import type { ReactNode } from "react";

export function scoreColor(v: number): string {
  if (v >= 80) return "var(--good)";
  if (v >= 60) return "var(--brand)";
  if (v >= 40) return "var(--warn)";
  return "var(--bad)";
}

export function ScoreBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="scorebar">
      <div className="row">
        <span>{label}</span>
        <span style={{ color: scoreColor(value) }}>{value}</span>
      </div>
      <div className="track">
        <div
          className="fill"
          style={{ width: `${value}%`, background: scoreColor(value) }}
        />
      </div>
    </div>
  );
}

export function ScoreRing({ value }: { value: number }) {
  return (
    <div className="ring" style={{ ["--val" as string]: value }}>
      <div className="inner">
        <div className="num" style={{ color: scoreColor(value) }}>
          {value}
        </div>
        <div className="small muted">/ 100</div>
      </div>
    </div>
  );
}

export function Section({
  n,
  title,
  children,
}: {
  n: number | string;
  title: string;
  children: ReactNode;
}) {
  return (
    <>
      <h3 className="section-title">
        <span className="num">{n}</span>
        {title}
      </h3>
      {children}
    </>
  );
}

export function Stat({ num, label }: { num: ReactNode; label: string }) {
  return (
    <div className="stat">
      <div className="num">{num}</div>
      <div className="label">{label}</div>
    </div>
  );
}
