import type {
  CoachReport,
  DebateAnalysis,
  Difficulty,
  Feedback,
  FluencyAnalysis,
  InterviewReadiness,
  PronunciationAnalysis,
  ScoreBreakdown,
  SessionMode,
  StructureAnalysis,
  Topic,
  VocabularyAnalysis,
} from "../../types";
import { generateChallengeTopic } from "../topics";
import { analyzeGrammar } from "./grammar";
import {
  ADVANCED_WORDS,
  ARGUMENT_MARKERS,
  CONCLUSION_MARKERS,
  COUNTER_MARKERS,
  EXAMPLE_MARKERS,
  FILLERS,
  FILLER_PHRASES,
  HEDGE_PHRASES,
  INTRO_MARKERS,
  POWER_WORDS,
  WEAK_WORDS,
} from "./lexicons";
import { clamp, countBy, round, sentences, syllables, words } from "./text";

const FILLER_SET = new Set(FILLERS);

// ---- Fluency -------------------------------------------------------------

function analyzeFluency(text: string, durationSec: number): FluencyAnalysis {
  const w = words(text);
  const totalWords = w.length;
  const minutes = Math.max(durationSec / 60, 1 / 60);
  const wpm = round(totalWords / minutes);

  // single-word fillers
  const fillerCounts = new Map<string, number>();
  for (const token of w) {
    if (FILLER_SET.has(token)) {
      fillerCounts.set(token, (fillerCounts.get(token) ?? 0) + 1);
    }
  }
  // multi-word filler phrases
  const lower = ` ${text.toLowerCase()} `;
  for (const phrase of FILLER_PHRASES) {
    const re = new RegExp(`\\b${phrase.replace(/ /g, "\\s+")}\\b`, "g");
    const m = lower.match(re);
    if (m) fillerCounts.set(phrase, (fillerCounts.get(phrase) ?? 0) + m.length);
  }

  const fillerWords = Array.from(fillerCounts.entries())
    .map(([word, count]) => ({ word, count }))
    .sort((a, b) => b.count - a.count);
  const totalFillers = fillerWords.reduce((s, f) => s + f.count, 0);

  // Repetition: how much of the vocabulary is reused.
  const counts = countBy(w.filter((x) => x.length > 3));
  const repeated = Array.from(counts.values()).filter((c) => c > 2).length;
  const repetitionRatio = totalWords ? clamp((repeated * 4) / totalWords, 0, 1) : 0;

  // Estimated long pauses: sentences relative to expected pace.
  const sentenceCount = sentences(text).length || 1;
  const expectedWordsPerSentence = 14;
  const longPauses =
    wpm < 90 ? Math.max(0, Math.round((90 - wpm) / 15)) : 0;

  void expectedWordsPerSentence;
  void sentenceCount;

  return {
    wordsPerMinute: wpm,
    totalWords,
    fillerWords,
    totalFillers,
    longPauses,
    repetitionRatio,
  };
}

// ---- Vocabulary ----------------------------------------------------------

function analyzeVocabulary(text: string): VocabularyAnalysis {
  const w = words(text);
  const unique = new Set(w);
  const uniqueWordRatio = w.length ? unique.size / w.length : 0;

  const counts = countBy(w.filter((x) => x.length > 3));
  const repeatedWords = Array.from(counts.entries())
    .filter(([, c]) => c >= 3)
    .map(([word, count]) => ({ word, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  const weakWords = Object.keys(WEAK_WORDS)
    .filter((w2) => unique.has(w2))
    .map((w2) => ({ word: w2, suggestions: WEAK_WORDS[w2] }));

  const usedAdvancedWords = Array.from(unique).filter((x) => ADVANCED_WORDS.has(x));

  // Suggest a handful of power words the speaker did NOT already use.
  const powerWords = POWER_WORDS.filter((p) => !unique.has(p)).slice(0, 6);

  return {
    uniqueWordRatio,
    repeatedWords,
    weakWords,
    powerWords,
    usedAdvancedWords,
  };
}

// ---- Pronunciation (heuristic) ------------------------------------------

const PRONUNCIATION_HINTS: Record<string, string> = {
  entrepreneur: "ahn-truh-pruh-NUR",
  specifically: "spuh-SIF-ik-lee",
  comfortable: "KUMF-ter-bul (3 syllables)",
  vulnerable: "VUL-nuh-ruh-bul",
  particularly: "puh-TIK-yuh-luh-lee",
  government: "GUV-ern-ment (don't drop the 'n')",
  opportunity: "op-er-TOO-ni-tee",
  environment: "en-VY-run-ment (say the 'n')",
  entrepreneurship: "ahn-truh-pruh-NUR-ship",
  phenomenon: "fuh-NOM-uh-non",
  hierarchy: "HY-uh-rar-kee",
  colleague: "KOL-eeg",
  genuine: "JEN-yoo-in",
  hyperbole: "hy-PUR-buh-lee",
};

function analyzePronunciation(text: string): PronunciationAnalysis {
  const unique = Array.from(new Set(words(text)));
  const challengingWords: { word: string; hint: string }[] = [];
  for (const w of unique) {
    if (PRONUNCIATION_HINTS[w]) {
      challengingWords.push({ word: w, hint: PRONUNCIATION_HINTS[w] });
    } else if (syllables(w) >= 4 && challengingWords.length < 8) {
      challengingWords.push({
        word: w,
        hint: `${syllables(w)} syllables - say it slowly, stress one syllable clearly`,
      });
    }
  }
  return {
    challengingWords: challengingWords.slice(0, 8),
    note: "Pronunciation is estimated from the text transcript, not from audio. For precise feedback, record yourself and compare with a dictionary's audio.",
  };
}

// ---- Structure -----------------------------------------------------------

function hasAny(lowerText: string, markers: string[]): boolean {
  return markers.some((m) => lowerText.includes(m));
}

function analyzeStructure(text: string): StructureAnalysis {
  const lower = text.toLowerCase();
  const sents = sentences(text);
  const hasIntroduction =
    hasAny(lower, INTRO_MARKERS) || sents.length >= 2;
  const hasBody = sents.length >= 3;
  const hasArguments = hasAny(lower, ARGUMENT_MARKERS);
  const hasExamples = hasAny(lower, EXAMPLE_MARKERS);
  const hasCounterArguments = hasAny(lower, COUNTER_MARKERS);
  const hasConclusion = hasAny(lower, CONCLUSION_MARKERS);

  const parts = [
    hasIntroduction,
    hasBody,
    hasArguments,
    hasExamples,
    hasCounterArguments,
    hasConclusion,
  ];
  const score = round((parts.filter(Boolean).length / parts.length) * 100);

  return {
    hasIntroduction,
    hasBody,
    hasArguments,
    hasExamples,
    hasCounterArguments,
    hasConclusion,
    score,
  };
}

// ---- Fear / confidence signals ------------------------------------------

function detectFearSignals(
  text: string,
  fluency: FluencyAnalysis,
  totalWords: number,
  durationSec: number
): string[] {
  const lower = text.toLowerCase();
  const signals: string[] = [];
  const hedges = HEDGE_PHRASES.filter((h) => lower.includes(h));
  if (hedges.length >= 2)
    signals.push(
      `Frequent hedging ("${hedges.slice(0, 3).join('", "')}") suggests uncertainty.`
    );
  if (fluency.totalFillers / Math.max(totalWords, 1) > 0.08)
    signals.push("A high filler-word rate often signals nervousness or stalling for time.");
  if (fluency.repetitionRatio > 0.35)
    signals.push("Repeating the same ideas/words can indicate a mental block under pressure.");
  const expectedWords = (durationSec / 60) * 110;
  if (totalWords < expectedWords * 0.45 && durationSec >= 45)
    signals.push("You used far fewer words than the time allowed - possible freezing or avoidance.");
  if (fluency.wordsPerMinute > 180)
    signals.push("Very fast speech can be a sign of anxiety - slow down and breathe.");
  return signals;
}

const ALL_FEAR_TECHNIQUES = [
  { name: "Box Breathing", how: "Inhale 4s, hold 4s, exhale 4s, hold 4s. Repeat 4 times before you speak." },
  { name: "Power Pose", how: "Stand tall, hands on hips or arms raised, for 2 minutes to lower stress hormones." },
  { name: "Visualization", how: "Picture yourself finishing the speech confidently to calm nerves." },
  { name: "Pause Technique", how: "When you feel rushed, pause 2 seconds. Silence reads as confidence, not weakness." },
  { name: "Eye Contact Strategy", how: "Hold one point/person for a full sentence before moving on." },
  { name: "PREP Framework", how: "Point, Reason, Example, Point - a fast way to structure any answer." },
  { name: "STAR Method", how: "Situation, Task, Action, Result - ideal for interview stories." },
  { name: "Rule of Three", how: "Group your key points in threes; it is memorable and sounds complete." },
];

// ---- Scoring -------------------------------------------------------------

function score(
  fluency: FluencyAnalysis,
  vocab: VocabularyAnalysis,
  structure: StructureAnalysis,
  grammarIssues: number,
  fearSignals: number,
  totalWords: number,
  durationSec: number,
  difficulty: Difficulty
): ScoreBreakdown {
  const fillerRate = fluency.totalFillers / Math.max(totalWords, 1);
  const idealWpm = 130;
  const speedPenalty = Math.min(Math.abs(fluency.wordsPerMinute - idealWpm) / 1.2, 55);
  const grammarScore = clamp(100 - grammarIssues * 12);
  const fluencyScore = clamp(100 - fillerRate * 350 - fluency.longPauses * 5);
  const vocabScore = clamp(
    vocab.uniqueWordRatio * 110 + vocab.usedAdvancedWords.length * 4 - vocab.weakWords.length * 3
  );
  const speakingSpeed = clamp(100 - speedPenalty);
  const confidence = clamp(
    92 - fearSignals * 12 - fillerRate * 150 - fluency.repetitionRatio * 20
  );
  const organization = structure.score;
  const logical = clamp(
    (structure.hasArguments ? 45 : 15) +
      (structure.hasExamples ? 25 : 0) +
      (structure.hasConclusion ? 15 : 0) +
      (structure.hasCounterArguments ? 15 : 0)
  );
  const critical = clamp(
    (structure.hasCounterArguments ? 40 : 10) +
      (structure.hasArguments ? 30 : 10) +
      vocab.usedAdvancedWords.length * 3 +
      (structure.hasExamples ? 15 : 0)
  );
  const persuasiveness = clamp(
    (structure.hasArguments ? 30 : 10) +
      (structure.hasExamples ? 25 : 0) +
      (structure.hasConclusion ? 20 : 0) +
      Math.min(vocab.usedAdvancedWords.length * 4, 25)
  );
  const creativity = clamp(
    vocab.uniqueWordRatio * 90 + (structure.hasExamples ? 20 : 0) + vocab.usedAdvancedWords.length * 2
  );
  const naturalness = clamp(
    100 - Math.abs(fluency.wordsPerMinute - idealWpm) / 2 - fillerRate * 120
  );
  const pressure = clamp(
    confidence * 0.5 + fluencyScore * 0.3 + (totalWords > (durationSec / 60) * 90 ? 20 : 0)
  );
  // Difficulty makes scores stricter.
  const difficultyPenalty =
    difficulty === "Expert" ? 8 : difficulty === "Advanced" ? 4 : 0;
  const adj = (n: number) => clamp(n - difficultyPenalty);

  return {
    confidence: adj(confidence),
    grammar: adj(grammarScore),
    vocabulary: adj(vocabScore),
    pronunciation: adj(clamp(85 - fillerRate * 100)),
    fluency: adj(fluencyScore),
    logicalThinking: adj(logical),
    ideaOrganization: adj(organization),
    speakingSpeed: adj(speakingSpeed),
    creativity: adj(creativity),
    persuasiveness: adj(persuasiveness),
    criticalThinking: adj(critical),
    pressureHandling: adj(pressure),
    naturalness: adj(naturalness),
  };
}

function overall(s: ScoreBreakdown): number {
  const vals = Object.values(s);
  return round(vals.reduce((a, b) => a + b, 0) / vals.length);
}

// ---- Interview / Debate --------------------------------------------------

function interviewReadiness(s: ScoreBreakdown): InterviewReadiness {
  const core = (s.logicalThinking + s.ideaOrganization + s.criticalThinking) / 3;
  return {
    bigTech: round(core * 0.55 + s.confidence * 0.2 + s.persuasiveness * 0.25),
    government: round(s.grammar * 0.4 + s.confidence * 0.3 + s.ideaOrganization * 0.3),
    mba: round(s.persuasiveness * 0.4 + s.criticalThinking * 0.3 + s.confidence * 0.3),
    publicSpeaking: round(s.confidence * 0.4 + s.fluency * 0.3 + s.persuasiveness * 0.3),
  };
}

function debateAnalysis(
  structure: StructureAnalysis,
  s: ScoreBreakdown
): DebateAnalysis {
  const fallacies: string[] = [];
  if (!structure.hasArguments)
    fallacies.push("Assertion without support - claims were made without reasons.");
  if (!structure.hasExamples)
    fallacies.push("No concrete evidence - arguments stayed abstract.");
  const missing: string[] = [];
  if (!structure.hasCounterArguments)
    missing.push("You did not address the opposing viewpoint - always pre-empt one objection.");
  if (!structure.hasConclusion)
    missing.push("No clear closing - end by restating your strongest point.");
  return {
    persuasiveness: s.persuasiveness,
    defendedPosition: structure.hasArguments && structure.hasConclusion,
    logicalFallacies: fallacies,
    missingCounterpoints: missing,
  };
}

// ---- Feedback narrative --------------------------------------------------

function buildFeedback(
  s: ScoreBreakdown,
  structure: StructureAnalysis,
  fluency: FluencyAnalysis,
  vocab: VocabularyAnalysis
): Feedback {
  const strengths: string[] = [];
  const weaknesses: string[] = [];

  const ranked = Object.entries(s).sort((a, b) => b[1] - a[1]);
  const label: Record<string, string> = {
    confidence: "Confidence",
    grammar: "Grammar",
    vocabulary: "Vocabulary",
    pronunciation: "Pronunciation",
    fluency: "Fluency",
    logicalThinking: "Logical thinking",
    ideaOrganization: "Idea organization",
    speakingSpeed: "Speaking pace",
    creativity: "Creativity",
    persuasiveness: "Persuasiveness",
    criticalThinking: "Critical thinking",
    pressureHandling: "Pressure handling",
    naturalness: "Naturalness",
  };
  for (const [k, v] of ranked.slice(0, 3))
    strengths.push(`${label[k]} is a strength (${v}/100).`);
  for (const [k, v] of ranked.slice(-3).reverse())
    weaknesses.push(`${label[k]} needs work (${v}/100).`);

  const hesitationNotes: string[] = [];
  if (fluency.totalFillers > 0)
    hesitationNotes.push(
      `You used ${fluency.totalFillers} filler word(s); the most frequent was "${fluency.fillerWords[0]?.word}".`
    );
  if (fluency.longPauses > 0)
    hesitationNotes.push(`Around ${fluency.longPauses} noticeable pause(s) were detected from your pace.`);
  if (fluency.repetitionRatio > 0.3)
    hesitationNotes.push("You circled back to the same words/ideas - a sign of searching for what to say.");

  const strongIdeas: string[] = [];
  if (structure.hasExamples) strongIdeas.push("You backed a point with a concrete example - persuasive.");
  if (structure.hasCounterArguments)
    strongIdeas.push("You acknowledged the other side - this shows maturity and balance.");
  if (vocab.usedAdvancedWords.length)
    strongIdeas.push(`Good use of higher-level vocabulary: ${vocab.usedAdvancedWords.slice(0, 4).join(", ")}.`);

  const weakArguments: string[] = [];
  if (!structure.hasArguments)
    weakArguments.push("Several statements had no supporting reason ('because', 'since', 'therefore').");
  if (!structure.hasConclusion)
    weakArguments.push("The speech trailed off without a strong conclusion.");

  return { strengths, weaknesses, hesitationNotes, strongIdeas, weakArguments };
}

// ---- Exercises -----------------------------------------------------------

function buildExercises(s: ScoreBreakdown): CoachingExerciseInternal[] {
  const out: CoachingExerciseInternal[] = [];
  const push = (category: string, title: string, instruction: string) =>
    out.push({ category, title, instruction });

  const weakest = Object.entries(s).sort((a, b) => a[1] - b[1]).slice(0, 4);
  for (const [k] of weakest) {
    switch (k) {
      case "grammar":
        push("Grammar drill", "Sentence rebuild", "Write 5 sentences using past, present, and future tense about your day, then say them aloud.");
        break;
      case "vocabulary":
        push("Vocabulary drill", "Word-swap challenge", "Pick 3 'weak' words you used and speak for 60s replacing each with a stronger synonym.");
        break;
      case "fluency":
        push("Fluency drill", "No-filler minute", "Speak for 60 seconds on any topic. Every filler word resets the timer.");
        break;
      case "confidence":
      case "pressureHandling":
        push("Confidence drill", "Power pose + 30s pitch", "Do a 2-minute power pose, then give a 30-second self-introduction with zero apologies.");
        break;
      case "pronunciation":
        push("Pronunciation drill", "Shadowing", "Play a 30s clip of a fluent speaker and repeat immediately, matching rhythm and stress.");
        break;
      case "logicalThinking":
      case "criticalThinking":
        push("Thinking drill", "PREP in 45s", "Answer a random question using Point-Reason-Example-Point in 45 seconds.");
        break;
      case "ideaOrganization":
        push("Structure drill", "3-point outline", "Before speaking, jot exactly 3 points. Speak only to those points, then conclude.");
        break;
      case "persuasiveness":
      case "creativity":
        push("Storytelling challenge", "Rule of Three story", "Tell a 90s story with 3 beats: setup, struggle, resolution.");
        break;
      case "speakingSpeed":
        push("Pace drill", "Metronome speaking", "Read a paragraph aloud aiming for ~130 words/minute; record and check.");
        break;
      case "naturalness":
        push("Naturalness drill", "Mirror speaking", "Speak to a mirror for 2 minutes; focus on relaxed tone and natural gestures.");
        break;
    }
  }
  // De-duplicate by title.
  const seen = new Set<string>();
  return out.filter((e) => (seen.has(e.title) ? false : (seen.add(e.title), true))).slice(0, 5);
}

interface CoachingExerciseInternal {
  category: string;
  title: string;
  instruction: string;
}

// ---- Public API ----------------------------------------------------------

export interface AnalyzeInput {
  transcript: string;
  topic: Topic;
  mode: SessionMode;
  difficulty: Difficulty;
  durationSec: number;
  actualSpeakingSec: number;
}

export function analyzeSpeech(input: AnalyzeInput): CoachReport {
  const { transcript, difficulty, actualSpeakingSec } = input;
  const effectiveSec = Math.max(actualSpeakingSec, 1);

  const fluency = analyzeFluency(transcript, effectiveSec);
  const vocab = analyzeVocabulary(transcript);
  const structure = analyzeStructure(transcript);
  const grammar = analyzeGrammar(transcript);
  const pronunciation = analyzePronunciation(transcript);
  const totalWords = fluency.totalWords;

  const fearSignals = detectFearSignals(transcript, fluency, totalWords, effectiveSec);
  const scores = score(
    fluency,
    vocab,
    structure,
    grammar.length,
    fearSignals.length,
    totalWords,
    effectiveSec,
    difficulty
  );
  const overallScore = overall(scores);
  const feedback = buildFeedback(scores, structure, fluency, vocab);
  const interview = interviewReadiness(scores);
  const debate = debateAnalysis(structure, scores);
  const exercises = buildExercises(scores);

  const emotionalDelivery = {
    energy: clamp(scores.confidence * 0.6 + scores.fluency * 0.4),
    enthusiasm: clamp(scores.creativity * 0.5 + scores.persuasiveness * 0.5),
    professionalism: clamp(scores.grammar * 0.5 + scores.ideaOrganization * 0.5),
    friendliness: clamp(scores.naturalness * 0.7 + scores.confidence * 0.3),
  };

  // Motivation + goals, adapted to performance.
  const weakestName = Object.entries(scores).sort((a, b) => a[1] - b[1])[0][0];
  const motivational =
    overallScore >= 75
      ? "Strong performance. You're speaking with real command - now we sharpen the edges."
      : overallScore >= 55
        ? "Solid effort. You have a clear foundation; a few focused habits will push you to the next level."
        : "Every great speaker started exactly here. Show up daily and the numbers will climb fast.";

  const fearTechniques = fearSignals.length
    ? ALL_FEAR_TECHNIQUES.slice(0, 4)
    : ALL_FEAR_TECHNIQUES.slice(3, 6);

  const nextTopic = generateChallengeTopic(
    difficulty,
    `strengthen your ${humanize(weakestName)}`
  );

  return {
    overallScore,
    scores,
    feedback,
    grammar,
    vocabulary: vocab,
    pronunciation,
    fluency,
    structure,
    interview,
    debate,
    exercises,
    emotionalDelivery,
    fearSignals,
    fearTechniques,
    motivational,
    dailyChallenge: exercises[0]
      ? `${exercises[0].title}: ${exercises[0].instruction}`
      : "Speak for 2 minutes on a random topic with zero filler words.",
    weeklyGoal: `Raise your ${humanize(weakestName)} score by 10 points across 5 sessions.`,
    monthlyGoal: "Complete 20 sessions and lift your overall score by 15+ points.",
    nextTopic,
    llmEnhanced: false,
  };
}

function humanize(key: string): string {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (c) => c.toLowerCase())
    .trim();
}
