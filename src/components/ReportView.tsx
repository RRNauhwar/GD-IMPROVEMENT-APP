import {
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from "recharts";
import type { CoachReport, Session, Topic } from "../types";
import type { XpResult } from "../lib/gamification";
import { ScoreBar, ScoreRing, Section, Stat, scoreColor } from "./common";

const SCORE_LABELS: [keyof CoachReport["scores"], string][] = [
  ["confidence", "Confidence"],
  ["grammar", "Grammar"],
  ["vocabulary", "Vocabulary"],
  ["pronunciation", "Pronunciation"],
  ["fluency", "Fluency"],
  ["logicalThinking", "Logical Thinking"],
  ["ideaOrganization", "Idea Organization"],
  ["speakingSpeed", "Speaking Speed"],
  ["creativity", "Creativity"],
  ["persuasiveness", "Persuasiveness"],
  ["criticalThinking", "Critical Thinking"],
  ["pressureHandling", "Pressure Handling"],
  ["naturalness", "Naturalness"],
];

function Check({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className="kv">
      <span>{label}</span>
      <span className={ok ? "tag-good" : "tag-bad"}>{ok ? "✓ present" : "✗ missing"}</span>
    </div>
  );
}

export function ReportView({
  report,
  session,
  insights,
  xp,
  onPracticeNext,
  onHome,
}: {
  report: CoachReport;
  session: Session;
  insights: string[];
  xp: XpResult | null;
  onPracticeNext: (topic: Topic) => void;
  onHome: () => void;
}) {
  const radarData = SCORE_LABELS.map(([k, label]) => ({
    metric: label,
    value: report.scores[k],
  }));

  return (
    <div className="grid" style={{ gap: 8 }}>
      {/* Gamification banner */}
      {xp && (
        <div className="card" style={{ background: "var(--card-2)" }}>
          <div className="grid cols-4">
            <Stat num={`+${xp.xpGained}`} label="XP earned" />
            <Stat num={xp.state.level} label={xp.leveledUp ? "Level ⬆" : "Level"} />
            <Stat num={`${xp.state.streakDays}🔥`} label="Day streak" />
            <Stat num={xp.state.badges.length} label="Badges" />
          </div>
          {xp.newBadges.length > 0 && (
            <div className="chips mt">
              {xp.newBadges.map((b) => (
                <span key={b} className="badge">🏅 {b}</span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 1. Overall */}
      <Section n={1} title="Overall Score">
        <div className="card overall">
          <ScoreRing value={report.overallScore} />
          <div style={{ flex: 1, minWidth: 260 }}>
            <div style={{ height: 240 }}>
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData} outerRadius="75%">
                  <PolarGrid stroke="#2a356b" />
                  <PolarAngleAxis dataKey="metric" tick={{ fill: "#97a1c9", fontSize: 10 }} />
                  <Radar dataKey="value" stroke="#6c8cff" fill="#6c8cff" fillOpacity={0.35} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
        <div className="card mt grid cols-3">
          {SCORE_LABELS.map(([k, label]) => (
            <ScoreBar key={k} label={label} value={report.scores[k]} />
          ))}
        </div>
      </Section>

      {/* 2. Detailed feedback */}
      <Section n={2} title="Detailed Feedback">
        <div className="card">
          {report.llmDetailedFeedback && (
            <p style={{ marginTop: 0 }}>{report.llmDetailedFeedback}</p>
          )}
          <div className="grid cols-2">
            <div>
              <h4 className="tag-good">Strengths</h4>
              <ul className="list">
                {report.feedback.strengths.map((s, i) => <li key={i}>{s}</li>)}
              </ul>
            </div>
            <div>
              <h4 className="tag-bad">Areas to improve</h4>
              <ul className="list">
                {report.feedback.weaknesses.map((s, i) => <li key={i}>{s}</li>)}
              </ul>
            </div>
          </div>
          {report.feedback.hesitationNotes.length > 0 && (
            <>
              <h4 className="tag-warn mt">Where you hesitated</h4>
              <ul className="list">
                {report.feedback.hesitationNotes.map((s, i) => <li key={i}>{s}</li>)}
              </ul>
            </>
          )}
          {report.feedback.strongIdeas.length > 0 && (
            <>
              <h4 className="mt">Strong ideas</h4>
              <ul className="list">
                {report.feedback.strongIdeas.map((s, i) => <li key={i}>{s}</li>)}
              </ul>
            </>
          )}
          {report.feedback.weakArguments.length > 0 && (
            <>
              <h4 className="mt">Weak arguments</h4>
              <ul className="list">
                {report.feedback.weakArguments.map((s, i) => <li key={i}>{s}</li>)}
              </ul>
            </>
          )}
        </div>
      </Section>

      {/* 3. Grammar */}
      <Section n={3} title="Grammar Analysis">
        <div className="card">
          {report.grammar.length === 0 ? (
            <p className="tag-good">No grammar issues detected by the rule engine. 🎉</p>
          ) : (
            report.grammar.map((g, i) => (
              <div key={i} className="grammar-issue">
                <div className="orig">✗ {g.original}</div>
                <div className="fixed">✓ {g.corrected}</div>
                <div className="small muted">
                  {g.explanation} · <b>{g.rule}</b> · {g.difficulty}
                </div>
              </div>
            ))
          )}
          <p className="small muted">
            Rule-based detection catches common patterns. Enable the AI coach
            (Settings) for deeper, context-aware grammar feedback.
          </p>
        </div>
      </Section>

      {/* 4. Vocabulary */}
      <Section n={4} title="Vocabulary Analysis">
        <div className="card grid cols-2">
          <div>
            <div className="kv">
              <span>Vocabulary diversity</span>
              <span style={{ color: scoreColor(Math.round(report.vocabulary.uniqueWordRatio * 100)) }}>
                {Math.round(report.vocabulary.uniqueWordRatio * 100)}%
              </span>
            </div>
            <h4 className="mt">Overused words</h4>
            {report.vocabulary.repeatedWords.length ? (
              <div className="chips">
                {report.vocabulary.repeatedWords.map((r) => (
                  <span key={r.word} className="chip">{r.word} ×{r.count}</span>
                ))}
              </div>
            ) : (
              <p className="small muted">Nice variety — no word was overused.</p>
            )}
            <h4 className="mt">Advanced words you used</h4>
            {report.vocabulary.usedAdvancedWords.length ? (
              <div className="chips">
                {report.vocabulary.usedAdvancedWords.map((w) => (
                  <span key={w} className="chip selected">{w}</span>
                ))}
              </div>
            ) : (
              <p className="small muted">Try weaving in higher-level vocabulary.</p>
            )}
          </div>
          <div>
            <h4>Upgrade these weak words</h4>
            {report.vocabulary.weakWords.length ? (
              report.vocabulary.weakWords.map((w) => (
                <div key={w.word} className="kv">
                  <span className="tag-warn">{w.word}</span>
                  <span className="small">→ {w.suggestions.join(", ")}</span>
                </div>
              ))
            ) : (
              <p className="small muted">No obvious weak words. 👍</p>
            )}
            <h4 className="mt">Power words to try next time</h4>
            <div className="chips">
              {report.vocabulary.powerWords.map((w) => (
                <span key={w} className="chip">{w}</span>
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* 5. Pronunciation */}
      <Section n={5} title="Pronunciation Analysis">
        <div className="card">
          {report.pronunciation.challengingWords.length ? (
            report.pronunciation.challengingWords.map((c) => (
              <div key={c.word} className="kv">
                <span>{c.word}</span>
                <span className="small muted">{c.hint}</span>
              </div>
            ))
          ) : (
            <p className="small muted">No especially tricky words detected.</p>
          )}
          <p className="small muted mt">{report.pronunciation.note}</p>
        </div>
      </Section>

      {/* 6. Fluency */}
      <Section n={6} title="Fluency Analysis">
        <div className="card grid cols-4">
          <Stat num={report.fluency.wordsPerMinute} label="words / min" />
          <Stat num={report.fluency.totalWords} label="total words" />
          <Stat num={report.fluency.totalFillers} label="filler words" />
          <Stat num={report.fluency.longPauses} label="est. long pauses" />
        </div>
        {report.fluency.fillerWords.length > 0 && (
          <div className="card mt">
            <h4>Filler breakdown</h4>
            <div className="chips">
              {report.fluency.fillerWords.map((f) => (
                <span key={f.word} className="chip">"{f.word}" ×{f.count}</span>
              ))}
            </div>
            <p className="small muted mt">
              Ideal pace is ~120–150 wpm. Replace fillers with a short, silent pause.
            </p>
          </div>
        )}
      </Section>

      {/* 7. Structure */}
      <Section n={7} title="Structure Analysis">
        <div className="card">
          <div className="overall">
            <ScoreRing value={report.structure.score} />
            <div style={{ flex: 1, minWidth: 240 }}>
              <Check ok={report.structure.hasIntroduction} label="Introduction" />
              <Check ok={report.structure.hasBody} label="Body" />
              <Check ok={report.structure.hasArguments} label="Arguments / reasons" />
              <Check ok={report.structure.hasExamples} label="Examples" />
              <Check ok={report.structure.hasCounterArguments} label="Counter-arguments" />
              <Check ok={report.structure.hasConclusion} label="Conclusion" />
            </div>
          </div>
        </div>
      </Section>

      {/* 8 + 12. Critical thinking + debate */}
      <Section n="8" title="Critical Thinking & Debate">
        <div className="card grid cols-2">
          <div>
            <ScoreBar label="Critical thinking" value={report.scores.criticalThinking} />
            <ScoreBar label="Logical thinking" value={report.scores.logicalThinking} />
            <ScoreBar label="Persuasiveness" value={report.debate.persuasiveness} />
            <div className="kv mt">
              <span>Defended a clear position</span>
              <span className={report.debate.defendedPosition ? "tag-good" : "tag-bad"}>
                {report.debate.defendedPosition ? "Yes" : "Not clearly"}
              </span>
            </div>
          </div>
          <div>
            {report.debate.logicalFallacies.length > 0 && (
              <>
                <h4 className="tag-bad">Logic gaps</h4>
                <ul className="list">
                  {report.debate.logicalFallacies.map((f, i) => <li key={i}>{f}</li>)}
                </ul>
              </>
            )}
            {report.debate.missingCounterpoints.length > 0 && (
              <>
                <h4 className="tag-warn">Missing counterpoints</h4>
                <ul className="list">
                  {report.debate.missingCounterpoints.map((f, i) => <li key={i}>{f}</li>)}
                </ul>
              </>
            )}
            {report.debate.logicalFallacies.length === 0 &&
              report.debate.missingCounterpoints.length === 0 && (
                <p className="tag-good">Balanced, well-supported reasoning. 👏</p>
              )}
          </div>
        </div>
      </Section>

      {/* 9 + 10. Pressure + emotional delivery */}
      <Section n="9" title="Pressure Handling & Emotional Delivery">
        <div className="card grid cols-2">
          <div>
            <ScoreBar label="Pressure handling" value={report.scores.pressureHandling} />
            {report.fearSignals.length > 0 ? (
              <>
                <h4 className="tag-warn mt">Signals I noticed</h4>
                <ul className="list">
                  {report.fearSignals.map((s, i) => <li key={i}>{s}</li>)}
                </ul>
              </>
            ) : (
              <p className="tag-good mt">You sounded composed and in control. 💪</p>
            )}
          </div>
          <div>
            <ScoreBar label="Energy" value={report.emotionalDelivery.energy} />
            <ScoreBar label="Enthusiasm" value={report.emotionalDelivery.enthusiasm} />
            <ScoreBar label="Professionalism" value={report.emotionalDelivery.professionalism} />
            <ScoreBar label="Friendliness" value={report.emotionalDelivery.friendliness} />
          </div>
        </div>
        {report.fearTechniques.length > 0 && (
          <div className="card mt">
            <h4>Confidence techniques for you</h4>
            <div className="grid cols-2">
              {report.fearTechniques.map((t) => (
                <div key={t.name} className="kv">
                  <b>{t.name}</b>
                  <span className="small muted" style={{ maxWidth: "60%" }}>{t.how}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </Section>

      {/* 11. Interview readiness */}
      <Section n={11} title="Interview Readiness">
        <div className="card grid cols-4">
          <Stat num={report.interview.bigTech} label="Big Tech (FAANG/OpenAI)" />
          <Stat num={report.interview.government} label="Government" />
          <Stat num={report.interview.mba} label="MBA admissions" />
          <Stat num={report.interview.publicSpeaking} label="Public speaking" />
        </div>
      </Section>

      {/* 13. Coaching + insights */}
      <Section n={13} title="Personalized Coaching">
        <div className="card">
          {insights.length > 0 && (
            <>
              <h4>Insights vs your history</h4>
              <ul className="list">
                {insights.map((s, i) => <li key={i}>{s}</li>)}
              </ul>
            </>
          )}
          <h4 className="mt">Your drills</h4>
          <div className="grid cols-2">
            {report.exercises.map((e, i) => (
              <div key={i} className="card" style={{ background: "var(--bg-2)" }}>
                <span className="pill">{e.category}</span>
                <h4 className="mt">{e.title}</h4>
                <p className="small muted">{e.instruction}</p>
              </div>
            ))}
          </div>
          <div className="grid cols-3 mt">
            <div className="card" style={{ background: "var(--bg-2)" }}>
              <div className="label small muted">Daily challenge</div>
              <p>{report.dailyChallenge}</p>
            </div>
            <div className="card" style={{ background: "var(--bg-2)" }}>
              <div className="label small muted">Weekly goal</div>
              <p>{report.weeklyGoal}</p>
            </div>
            <div className="card" style={{ background: "var(--bg-2)" }}>
              <div className="label small muted">Monthly goal</div>
              <p>{report.monthlyGoal}</p>
            </div>
          </div>
          <p className="mt" style={{ fontStyle: "italic" }}>💬 {report.motivational}</p>
        </div>
      </Section>

      {/* 14. Next challenge */}
      <Section n={14} title="Next Challenge">
        <div className="card">
          <span className="pill">{report.nextTopic.category}</span>{" "}
          <span className="pill">{report.nextTopic.difficulty}</span>
          <h3 className="mt">{report.nextTopic.title}</h3>
          <p className="muted" style={{ whiteSpace: "pre-wrap" }}>{report.nextTopic.prompt}</p>
          <div className="row-actions mt">
            <button className="primary" onClick={() => onPracticeNext(report.nextTopic)}>
              ▶ Practice this next
            </button>
            <button className="ghost" onClick={onHome}>
              Back to home
            </button>
          </div>
        </div>
      </Section>

      <p className="small muted center mt">
        Session saved · {new Date(session.date).toLocaleString()} ·{" "}
        {report.llmEnhanced ? "AI-enhanced report" : "Engine report"}
      </p>
    </div>
  );
}
