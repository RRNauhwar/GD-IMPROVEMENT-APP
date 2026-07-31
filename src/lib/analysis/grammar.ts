import type { Difficulty, GrammarIssue } from "../../types";
import { sentences } from "./text";

interface Rule {
  // Pattern to test against a sentence (case-insensitive).
  test: RegExp;
  // Build the corrected sentence.
  fix: (s: string) => string;
  explanation: string;
  rule: string;
  difficulty: Difficulty;
}

const RULES: Rule[] = [
  {
    test: /\b(should|could|would|must|might)\s+of\b/i,
    fix: (s) => s.replace(/\b(should|could|would|must|might)\s+of\b/gi, "$1 have"),
    explanation:
      '"of" is a preposition; after modal verbs you need the auxiliary "have".',
    rule: "Modal + have (not 'of')",
    difficulty: "Intermediate",
  },
  {
    test: /\b(he|she|it)\s+don't\b/i,
    fix: (s) => s.replace(/\b(he|she|it)\s+don't\b/gi, "$1 doesn't"),
    explanation:
      "Third-person singular subjects (he/she/it) take 'doesn't', not 'don't'.",
    rule: "Subject-verb agreement",
    difficulty: "Beginner",
  },
  {
    test: /\b(he|she|it)\s+(have)\b/i,
    fix: (s) => s.replace(/\b(he|she|it)\s+have\b/gi, "$1 has"),
    explanation: "With he/she/it, use 'has' rather than 'have'.",
    rule: "Subject-verb agreement",
    difficulty: "Beginner",
  },
  {
    test: /\bmore\s+(better|worse|easier|faster|bigger|smaller|higher|lower)\b/i,
    fix: (s) =>
      s.replace(/\bmore\s+(better|worse|easier|faster|bigger|smaller|higher|lower)\b/gi, "$1"),
    explanation:
      "Do not stack 'more' with a comparative adjective; the -er form already means 'more'.",
    rule: "Double comparative",
    difficulty: "Intermediate",
  },
  {
    test: /\b(informations|advices|equipments|furnitures|luggages|softwares)\b/i,
    fix: (s) =>
      s.replace(
        /\b(informations|advices|equipments|furnitures|luggages|softwares)\b/gi,
        (m) => m.slice(0, -1)
      ),
    explanation:
      "These are uncountable nouns in English and have no plural '-s' form.",
    rule: "Uncountable nouns",
    difficulty: "Intermediate",
  },
  {
    test: /\bpeoples\b/i,
    fix: (s) => s.replace(/\bpeoples\b/gi, "people"),
    explanation: "'People' is already plural; 'peoples' is almost never what you want.",
    rule: "Irregular plural",
    difficulty: "Beginner",
  },
  {
    test: /\bdidn't\s+(went|came|saw|did|took|gave|made|got|had)\b/i,
    fix: (s) => {
      const map: Record<string, string> = {
        went: "go",
        came: "come",
        saw: "see",
        did: "do",
        took: "take",
        gave: "give",
        made: "make",
        got: "get",
        had: "have",
      };
      return s.replace(
        /\bdidn't\s+(went|came|saw|did|took|gave|made|got|had)\b/gi,
        (_m, v: string) => `didn't ${map[v.toLowerCase()]}`
      );
    },
    explanation:
      "After 'didn't' use the base form of the verb, not the past tense.",
    rule: "Auxiliary 'did' + base verb",
    difficulty: "Intermediate",
  },
  {
    test: /\ba\s+(hour|honest|apple|orange|umbrella|elephant|idea|answer|egg|item)\b/i,
    fix: (s) =>
      s.replace(
        /\ba\s+(hour|honest|apple|orange|umbrella|elephant|idea|answer|egg|item)\b/gi,
        "an $1"
      ),
    explanation: "Use 'an' before a vowel sound.",
    rule: "Article a/an",
    difficulty: "Beginner",
  },
  {
    test: /\bi\s+am\s+agree\b/i,
    fix: (s) => s.replace(/\bi\s+am\s+agree\b/gi, "I agree"),
    explanation: "'Agree' is a verb, so say 'I agree', not 'I am agree'.",
    rule: "Verb form",
    difficulty: "Beginner",
  },
  {
    test: /\b(\w+)\s+\1\b/i,
    fix: (s) => s.replace(/\b(\w+)\s+\1\b/gi, "$1"),
    explanation: "A word was repeated back-to-back, likely a stumble.",
    rule: "Accidental repetition",
    difficulty: "Beginner",
  },
];

export function analyzeGrammar(text: string): GrammarIssue[] {
  const issues: GrammarIssue[] = [];
  const seen = new Set<string>();
  for (const s of sentences(text)) {
    for (const r of RULES) {
      if (r.test.test(s)) {
        const corrected = r.fix(s);
        if (corrected.toLowerCase() === s.toLowerCase()) continue;
        const key = `${r.rule}::${s.toLowerCase()}`;
        if (seen.has(key)) continue;
        seen.add(key);
        issues.push({
          original: s,
          corrected,
          explanation: r.explanation,
          rule: r.rule,
          difficulty: r.difficulty,
        });
      }
    }
  }
  return issues;
}
