// Word lists used across the analysis engine.

export const FILLERS = [
  "um",
  "umm",
  "uh",
  "uhh",
  "er",
  "erm",
  "ah",
  "hmm",
  "like",
  "actually",
  "basically",
  "literally",
  "honestly",
  "seriously",
  "obviously",
  "so",
  "well",
  "okay",
  "right",
  "yeah",
];

// Multi-word fillers detected on the raw text.
export const FILLER_PHRASES = [
  "you know",
  "i mean",
  "kind of",
  "sort of",
  "and stuff",
  "or something",
  "and so on",
  "at the end of the day",
];

// Very common, low-impact words with stronger alternatives.
export const WEAK_WORDS: Record<string, string[]> = {
  good: ["excellent", "outstanding", "remarkable", "beneficial"],
  bad: ["harmful", "detrimental", "problematic", "counterproductive"],
  nice: ["pleasant", "delightful", "commendable"],
  big: ["substantial", "significant", "immense"],
  small: ["minor", "negligible", "modest"],
  thing: ["factor", "aspect", "element", "consideration"],
  stuff: ["material", "content", "matters"],
  lot: ["a great deal", "numerous", "considerable"],
  very: ["remarkably", "exceptionally", "notably"],
  really: ["genuinely", "truly", "profoundly"],
  get: ["obtain", "acquire", "achieve"],
  make: ["create", "generate", "produce"],
  important: ["crucial", "vital", "pivotal", "paramount"],
  happy: ["delighted", "content", "fulfilled"],
  sad: ["disheartened", "dejected", "downcast"],
};

// Power / persuasive vocabulary we encourage.
export const POWER_WORDS = [
  "undeniably",
  "consequently",
  "furthermore",
  "nevertheless",
  "compelling",
  "pivotal",
  "profound",
  "sustainable",
  "empower",
  "transform",
  "resilient",
  "unprecedented",
  "paramount",
  "advocate",
  "leverage",
  "catalyst",
  "imperative",
  "holistic",
  "pragmatic",
  "robust",
];

// Rough "advanced" vocabulary set to reward usage.
export const ADVANCED_WORDS = new Set([
  ...POWER_WORDS,
  "nuance",
  "paradigm",
  " subsequently".trim(),
  "subsequently",
  "inevitable",
  "inherent",
  "mitigate",
  "advocate",
  "trajectory",
  "equitable",
  "autonomy",
  "credibility",
  "perspective",
  "implication",
  "framework",
  "correlation",
  "detrimental",
  "beneficial",
  "substantial",
  "coherent",
  "articulate",
  "comprehensive",
]);

// Discourse markers that signal good structure.
export const INTRO_MARKERS = [
  "today i",
  "i want to talk",
  "i would like to",
  "the topic",
  "let me start",
  "first of all",
  "to begin",
  "in this",
  "i believe",
  "i think that",
  "when it comes to",
];

export const CONCLUSION_MARKERS = [
  "in conclusion",
  "to conclude",
  "to sum up",
  "in summary",
  "finally",
  "in the end",
  "overall",
  "therefore",
  "thus",
  "to wrap up",
  "all in all",
];

export const EXAMPLE_MARKERS = [
  "for example",
  "for instance",
  "such as",
  "to illustrate",
  "consider",
  "imagine",
  "in my experience",
  "recently",
  "a good example",
  "like when",
];

export const ARGUMENT_MARKERS = [
  "because",
  "since",
  "therefore",
  "as a result",
  "this shows",
  "the reason",
  "due to",
  "which means",
  "leads to",
  "the evidence",
];

export const COUNTER_MARKERS = [
  "however",
  "on the other hand",
  "some people",
  "critics",
  "although",
  "even though",
  "one might argue",
  "opponents",
  "despite",
  "while some",
  "admittedly",
];

// Phrases that hint at nervousness / low confidence.
export const HEDGE_PHRASES = [
  "i'm not sure",
  "i don't know",
  "maybe",
  "i guess",
  "i think maybe",
  "kind of",
  "sort of",
  "i'm not really",
  "probably",
  "i forgot",
  "what was i saying",
];
