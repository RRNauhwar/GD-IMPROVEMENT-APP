// Quick functional smoke test of the analysis engine (not part of the app build).
import { analyzeSpeech } from "../src/lib/analysis/engine";
import { generateTopic } from "../src/lib/topics";

const transcript = `Um, so today I want to talk about whether social media is dangerous.
I think that it is basically a big problem because it affects mental health.
For example, my friend spends like five hours a day scrolling and he don't sleep well.
However, some people argue that it helps us connect with others.
In conclusion, I believe we should of used it more carefully. That is a very good thing to do.`;

const topic = generateTopic("Intermediate", "Society");
const report = analyzeSpeech({
  transcript,
  topic,
  mode: "Debate",
  difficulty: "Intermediate",
  durationSec: 60,
  actualSpeakingSec: 42,
});

console.log("overall:", report.overallScore);
console.log("wpm:", report.fluency.wordsPerMinute, "words:", report.fluency.totalWords);
console.log("fillers:", report.fluency.totalFillers, report.fluency.fillerWords);
console.log("grammar issues:", report.grammar.length);
report.grammar.forEach((g) => console.log("  -", g.rule, "::", g.original.slice(0, 40)));
console.log("structure score:", report.structure.score, {
  intro: report.structure.hasIntroduction,
  args: report.structure.hasArguments,
  ex: report.structure.hasExamples,
  counter: report.structure.hasCounterArguments,
  concl: report.structure.hasConclusion,
});
console.log("weak words:", report.vocabulary.weakWords.map((w) => w.word));
console.log("fear signals:", report.fearSignals.length);
console.log("exercises:", report.exercises.map((e) => e.title));
console.log("next topic:", report.nextTopic.title);

// Basic assertions
const ok =
  report.overallScore >= 0 &&
  report.overallScore <= 100 &&
  report.fluency.totalWords > 0 &&
  report.grammar.length >= 1 &&
  report.structure.hasCounterArguments === true;
console.log(ok ? "SMOKE TEST PASSED" : "SMOKE TEST FAILED");
process.exit(ok ? 0 : 1);
