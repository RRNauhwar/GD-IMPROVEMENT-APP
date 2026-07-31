import type { Difficulty, Topic } from "../types";

let counter = 0;
const uid = () => `topic_${Date.now()}_${counter++}`;

interface TopicSeed {
  title: string;
  category: string;
}

// A large, curated pool. The generator mixes these with framing templates,
// so the effective number of unique prompts is very large ("unlimited" in practice).
const SEEDS: TopicSeed[] = [
  { title: "Is AI a boon or a bane?", category: "Technology" },
  { title: "Should homework be banned?", category: "Education" },
  { title: "Is social media dangerous for teenagers?", category: "Society" },
  { title: "Should mobile phones be allowed in schools?", category: "Education" },
  { title: "Is remote work better than office work?", category: "Business" },
  { title: "Does money buy happiness?", category: "Philosophy" },
  { title: "Should traditional exams be removed?", category: "Education" },
  { title: "Should college education be free?", category: "Economics" },
  { title: "How should we tackle climate change?", category: "Environment" },
  { title: "Startup vs a stable job: which is the smarter choice?", category: "Business" },
  { title: "Is nuclear energy the answer to our energy needs?", category: "Environment" },
  { title: "Should Universal Basic Income be adopted?", category: "Economics" },
  { title: "Is space exploration worth the cost?", category: "Future Technology" },
  { title: "Do sports build character better than academics?", category: "Sports" },
  { title: "Is technology making us less human?", category: "Technology" },
  { title: "Should voting be made compulsory?", category: "Politics" },
  { title: "Does the education system kill creativity?", category: "Education" },
  { title: "Is a cashless economy good for society?", category: "Economics" },
  { title: "Can history teach us to avoid future mistakes?", category: "History" },
  { title: "Does birth order shape personality?", category: "Psychology" },
  { title: "Is it ethical to use animals for research?", category: "Ethics" },
  { title: "Do we have free will?", category: "Philosophy" },
  { title: "Are leaders born or made?", category: "Leadership" },
  { title: "Will AI replace most human jobs?", category: "Future Technology" },
  { title: "Is preventive healthcare better than treatment?", category: "Health" },
  { title: "Can long-distance relationships work?", category: "Relationships" },
  { title: "Should single-use plastics be banned worldwide?", category: "Environment" },
  { title: "Is influencer culture harming society?", category: "Society" },
  { title: "Should genetic engineering of humans be allowed?", category: "Ethics" },
  { title: "Is failure a better teacher than success?", category: "Psychology" },
  { title: "Should the four-day work week become standard?", category: "Business" },
  { title: "Is online learning as effective as classroom learning?", category: "Education" },
  { title: "Does globalization help or hurt local cultures?", category: "Society" },
  { title: "Should governments regulate Big Tech more strictly?", category: "Politics" },
  { title: "Is ambition more important than contentment?", category: "Philosophy" },
  { title: "Can money and morality coexist in business?", category: "Ethics" },
  { title: "Is the metaverse the future of the internet?", category: "Future Technology" },
  { title: "Should euthanasia be legalized?", category: "Ethics" },
  { title: "Is competition necessary for growth?", category: "Psychology" },
  { title: "Do vaccines mandates make sense in a free society?", category: "Health" },
];

const FRAMES: Record<Difficulty, (t: string) => string> = {
  Beginner: (t) =>
    `Share your opinion in simple words: ${t} Give at least two reasons and one example from your own life.`,
  Intermediate: (t) =>
    `${t} Present a clear stand, support it with two or three arguments and a real-world example, then briefly acknowledge the other side.`,
  Advanced: (t) =>
    `${t} Build a structured argument (claim, evidence, reasoning), address the strongest counter-argument, and close with a memorable conclusion.`,
  Expert: (t) =>
    `${t} Deliver a persuasive, well-structured speech that weighs trade-offs, cites concrete data or examples, dismantles the opposing view, and ends with a call to action. Assume a sceptical panel.`,
};

/** Fisher-Yates-free lightweight random pick. */
function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function generateTopic(difficulty: Difficulty, category?: string): Topic {
  const pool = category ? SEEDS.filter((s) => s.category === category) : SEEDS;
  const seed = pick(pool.length ? pool : SEEDS);
  return {
    id: uid(),
    title: seed.title,
    category: seed.category,
    difficulty,
    prompt: FRAMES[difficulty](seed.title),
  };
}

/** A topic that intentionally targets a user's weak area for the "Next Challenge". */
export function generateChallengeTopic(
  difficulty: Difficulty,
  weakness: string
): Topic {
  const base = generateTopic(difficulty);
  const focus = `Focus while speaking: ${weakness}.`;
  return { ...base, prompt: `${base.prompt}\n\n${focus}` };
}

export function allCategories(): string[] {
  return Array.from(new Set(SEEDS.map((s) => s.category))).sort();
}
