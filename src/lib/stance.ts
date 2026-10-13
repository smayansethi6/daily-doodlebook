import type { Question } from "@/lib/questions";

export const STANCE_VALUES = [-2, -1, 0, 1, 2] as const;
export type StanceValue = (typeof STANCE_VALUES)[number];

export const STANCE_LABELS: Record<StanceValue, string> = {
  [-2]: "Strongly disagree",
  [-1]: "Disagree",
  0: "Unsure",
  1: "Agree",
  2: "Strongly agree",
};

export const DEFAULT_LOW_LABEL = "Disagree";
export const DEFAULT_HIGH_LABEL = "Agree";

export function stanceLabel(question: Question | undefined, stance: StanceValue): string {
  const low = question?.stance_label_low?.trim();
  const high = question?.stance_label_high?.trim();

  if (stance === 0) return STANCE_LABELS[0];
  if (stance < 0 && low) return stance === -2 ? `Strongly: ${low}` : low;
  if (stance > 0 && high) return stance === 2 ? `Strongly: ${high}` : high;
  return STANCE_LABELS[stance];
}

export function endLabels(question: Question | undefined) {
  const low = question?.stance_label_low?.trim() || DEFAULT_LOW_LABEL;
  const high = question?.stance_label_high?.trim() || DEFAULT_HIGH_LABEL;
  return { low: `Strongly ${low.toLowerCase()}`, high: `Strongly ${high.toLowerCase()}` };
}

export function stanceEnabled(question: Question | undefined): boolean {
  return question?.stance_enabled !== false;
}

/**
 * Seeds stand in until real consented entries exist for a question. They are
 * always labelled as written by the ThinkPhil team, never passed off as a
 * visitor's words.
 */
export interface SeedReflection {
  id: string;
  excerpt: string;
  sign: -1 | 1;
}

export const SEED_REFLECTIONS: SeedReflection[] = [
  {
    id: "seed-disagree-1",
    sign: -1,
    excerpt:
      "The case against usually starts somewhere ordinary: a rule exists because the alternative was tried and hurt someone. Before discarding it, it is worth asking who the rule was protecting when nobody was watching.",
  },
  {
    id: "seed-disagree-2",
    sign: -1,
    excerpt:
      "What looks like principle from the inside often looks like preference from the outside. If the answer would change when the cost falls on you rather than on someone else, it was never quite a principle.",
  },
  {
    id: "seed-disagree-3",
    sign: -1,
    excerpt:
      "Certainty is cheap at a distance. The people who live closest to a question are usually the least sure about it, and that hesitancy is information rather than weakness.",
  },
  {
    id: "seed-agree-1",
    sign: 1,
    excerpt:
      "Sometimes the honest answer is that the rule was built for a world that no longer exists. Keeping it out of respect for the people who wrote it is a way of letting them decide something they never saw.",
  },
  {
    id: "seed-agree-2",
    sign: 1,
    excerpt:
      "A view held only because it is comfortable is not really held at all. The test is whether you would still say it out loud in a room where it costs you something.",
  },
  {
    id: "seed-agree-3",
    sign: 1,
    excerpt:
      "Consequences are not everything, but pretending they are nothing is its own kind of evasion. A position that never has to meet the world is easy to keep clean.",
  },
];

export function pickSeedReflections(sign: -1 | 1, excludeIds: string[]): SeedReflection | undefined {
  const pool = SEED_REFLECTIONS.filter(
    (seed) => seed.sign === sign && !excludeIds.includes(seed.id)
  );
  if (!pool.length) return undefined;
  return pool[Math.floor(Math.random() * pool.length)];
}
