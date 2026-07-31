// Core domain types for SpeakX AI / GD-IMPROVEMENT-APP

export type Difficulty = "Beginner" | "Intermediate" | "Advanced" | "Expert";

export type SessionMode =
  | "Random Topic"
  | "Group Discussion"
  | "Debate"
  | "Interview"
  | "Storytelling";

export interface Topic {
  id: string;
  title: string;
  category: string;
  difficulty: Difficulty;
  prompt: string;
}

/** Duration options for the speaking timer, in seconds. */
export const DURATION_OPTIONS = [30, 45, 60, 120, 180, 300, 600] as const;
export type Duration = (typeof DURATION_OPTIONS)[number];

/** Every score is on a 0-100 scale. */
export interface ScoreBreakdown {
  confidence: number;
  grammar: number;
  vocabulary: number;
  pronunciation: number;
  fluency: number;
  logicalThinking: number;
  ideaOrganization: number;
  speakingSpeed: number;
  creativity: number;
  persuasiveness: number;
  criticalThinking: number;
  pressureHandling: number;
  naturalness: number;
}

export interface GrammarIssue {
  original: string;
  corrected: string;
  explanation: string;
  rule: string;
  difficulty: Difficulty;
}

export interface VocabularyAnalysis {
  uniqueWordRatio: number; // 0-1
  repeatedWords: { word: string; count: number }[];
  weakWords: { word: string; suggestions: string[] }[];
  powerWords: string[]; // power words the user could use
  usedAdvancedWords: string[];
}

export interface FluencyAnalysis {
  wordsPerMinute: number;
  totalWords: number;
  fillerWords: { word: string; count: number }[];
  totalFillers: number;
  longPauses: number; // estimated
  repetitionRatio: number; // 0-1
}

export interface StructureAnalysis {
  hasIntroduction: boolean;
  hasBody: boolean;
  hasArguments: boolean;
  hasExamples: boolean;
  hasCounterArguments: boolean;
  hasConclusion: boolean;
  score: number; // 0-100
}

export interface PronunciationAnalysis {
  challengingWords: { word: string; hint: string }[];
  note: string;
}

export interface InterviewReadiness {
  bigTech: number; // Google/Microsoft/Amazon/OpenAI style
  government: number;
  mba: number;
  publicSpeaking: number;
}

export interface DebateAnalysis {
  persuasiveness: number;
  defendedPosition: boolean;
  logicalFallacies: string[];
  missingCounterpoints: string[];
}

export interface CoachingExercise {
  category: string;
  title: string;
  instruction: string;
}

export interface Feedback {
  strengths: string[];
  weaknesses: string[];
  hesitationNotes: string[];
  strongIdeas: string[];
  weakArguments: string[];
}

export interface CoachReport {
  overallScore: number;
  scores: ScoreBreakdown;
  feedback: Feedback;
  grammar: GrammarIssue[];
  vocabulary: VocabularyAnalysis;
  pronunciation: PronunciationAnalysis;
  fluency: FluencyAnalysis;
  structure: StructureAnalysis;
  interview: InterviewReadiness;
  debate: DebateAnalysis;
  exercises: CoachingExercise[];
  emotionalDelivery: {
    energy: number;
    enthusiasm: number;
    professionalism: number;
    friendliness: number;
  };
  fearSignals: string[];
  fearTechniques: { name: string; how: string }[];
  motivational: string;
  dailyChallenge: string;
  weeklyGoal: string;
  monthlyGoal: string;
  nextTopic: Topic;
  /** Whether an LLM enhanced the qualitative narrative. */
  llmEnhanced: boolean;
  /** Optional richer narrative when an LLM is enabled. */
  llmDetailedFeedback?: string;
}

export interface Session {
  id: string;
  date: string; // ISO
  topic: Topic;
  mode: SessionMode;
  difficulty: Difficulty;
  durationSec: number;
  actualSpeakingSec: number;
  transcript: string;
  report: CoachReport;
}

export interface GamificationState {
  xp: number;
  level: number;
  streakDays: number;
  lastSessionDate: string | null;
  badges: string[];
}
