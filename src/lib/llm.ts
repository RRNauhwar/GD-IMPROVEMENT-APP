import type { CoachReport } from "../types";

// The SpeakX AI "brain" - used as the system prompt when an LLM is enabled.
export const SPEAKX_SYSTEM_PROMPT = `You are SpeakX AI, the world's most advanced AI English Speaking Coach, Public Speaking Trainer, Debate Mentor, Interview Evaluator, Communication Psychologist, and Confidence Coach.

Your job is NOT to be a grammar checker. You are a world-class communication coach whose goal is to transform the user into a confident English speaker who can think quickly, organize ideas, communicate naturally, and perform under pressure.

You will be given: the speaking topic, the difficulty level, the target duration, and the user's transcript. A deterministic engine has already computed objective metrics (WPM, filler counts, scores). Your task is to add human, specific, encouraging-but-brutally-honest qualitative coaching.

Respond with ONLY a JSON object (no markdown fences) of the shape:
{
  "detailedFeedback": string,       // 3-6 sentences, specific to what they said
  "strongIdeas": string[],          // up to 3
  "weakArguments": string[],        // up to 3
  "motivational": string,           // 1-2 sentences, energising
  "dailyChallenge": string          // one concrete challenge for tomorrow
}
Be specific to the transcript. Never generic.`;

export interface LlmEnhancement {
  detailedFeedback: string;
  strongIdeas: string[];
  weakArguments: string[];
  motivational: string;
  dailyChallenge: string;
}

interface EnhanceArgs {
  apiKey: string;
  topicTitle: string;
  difficulty: string;
  durationSec: number;
  transcript: string;
  baseReport: CoachReport;
  model?: string;
}

/**
 * Optional: call an OpenAI-compatible chat completion to enrich the narrative.
 * Runs entirely in the browser using the user's own key. Returns null on any failure
 * so the deterministic report is always shown.
 */
export async function enhanceWithLlm(
  args: EnhanceArgs
): Promise<LlmEnhancement | null> {
  const { apiKey, topicTitle, difficulty, durationSec, transcript, baseReport } = args;
  if (!apiKey) return null;

  const userContent = [
    `Topic: ${topicTitle}`,
    `Difficulty: ${difficulty}`,
    `Target duration: ${durationSec}s`,
    `Engine overall score: ${baseReport.overallScore}/100`,
    `Engine WPM: ${baseReport.fluency.wordsPerMinute}, fillers: ${baseReport.fluency.totalFillers}`,
    ``,
    `Transcript:`,
    transcript || "(empty)",
  ].join("\n");

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: args.model ?? "gpt-4o-mini",
        temperature: 0.6,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SPEAKX_SYSTEM_PROMPT },
          { role: "user", content: userContent },
        ],
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const raw = data?.choices?.[0]?.message?.content;
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<LlmEnhancement>;
    return {
      detailedFeedback: parsed.detailedFeedback ?? "",
      strongIdeas: Array.isArray(parsed.strongIdeas) ? parsed.strongIdeas : [],
      weakArguments: Array.isArray(parsed.weakArguments) ? parsed.weakArguments : [],
      motivational: parsed.motivational ?? baseReport.motivational,
      dailyChallenge: parsed.dailyChallenge ?? baseReport.dailyChallenge,
    };
  } catch {
    return null;
  }
}

/** Merge an LLM enhancement into a base report (non-destructive). */
export function applyEnhancement(
  report: CoachReport,
  enh: LlmEnhancement
): CoachReport {
  return {
    ...report,
    llmEnhanced: true,
    motivational: enh.motivational || report.motivational,
    dailyChallenge: enh.dailyChallenge || report.dailyChallenge,
    feedback: {
      ...report.feedback,
      strongIdeas: enh.strongIdeas.length ? enh.strongIdeas : report.feedback.strongIdeas,
      weakArguments: enh.weakArguments.length
        ? enh.weakArguments
        : report.feedback.weakArguments,
    },
    llmDetailedFeedback: enh.detailedFeedback || undefined,
  };
}
