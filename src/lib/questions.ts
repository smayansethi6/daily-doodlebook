const QUESTIONS = [
  { id: 1, question: "If you could unlearn one thing you know to be true, what would it be?", category: "Epistemology", issue: "Vol. I" },
  { id: 2, question: "Is the person you were ten years ago the same person reading this now?", category: "Identity", issue: "Vol. I" },
  { id: 3, question: "What is the most beautiful thing you've ever failed at?", category: "Aesthetics", issue: "Vol. I" },
  { id: 4, question: "If free will is an illusion, does it matter?", category: "Metaphysics", issue: "Vol. II" },
  { id: 5, question: "What do you owe to strangers?", category: "Ethics", issue: "Vol. II" },
  { id: 6, question: "Can silence be a form of violence?", category: "Political Philosophy", issue: "Vol. II" },
  { id: 7, question: "What is the difference between being alone and being lonely?", category: "Existentialism", issue: "Vol. III" },
  { id: 8, question: "Is there a thought you're afraid to think?", category: "Psychology", issue: "Vol. III" },
  { id: 9, question: "Does naming something give you power over it?", category: "Language", issue: "Vol. III" },
  { id: 10, question: "What would you do differently if nobody was watching?", category: "Ethics", issue: "Vol. IV" },
  { id: 11, question: "Can you love someone you don't understand?", category: "Phenomenology", issue: "Vol. IV" },
  { id: 12, question: "Is forgetting a form of freedom or a kind of death?", category: "Memory", issue: "Vol. IV" },
  { id: 13, question: "What is the smallest thing that has changed your life?", category: "Causality", issue: "Vol. V" },
  { id: 14, question: "Is it possible to be truly selfless?", category: "Ethics", issue: "Vol. V" },
  { id: 15, question: "What would convince you that you are wrong about everything?", category: "Epistemology", issue: "Vol. V" },
  { id: 16, question: "Does art need an audience to exist?", category: "Aesthetics", issue: "Vol. VI" },
  { id: 17, question: "What is more real: your memories or your plans?", category: "Time", issue: "Vol. VI" },
  { id: 18, question: "Can a society be moral if its individuals are not?", category: "Political Philosophy", issue: "Vol. VI" },
  { id: 19, question: "What is the most honest lie you've ever told?", category: "Paradox", issue: "Vol. VII" },
  { id: 20, question: "If you could ask the universe one question, what would it be?", category: "Cosmology", issue: "Vol. VII" },
  { id: 21, question: "Is there a duty to be happy?", category: "Ethics", issue: "Vol. VII" },
  { id: 22, question: "What makes a place feel like home?", category: "Phenomenology", issue: "Vol. VIII" },
  { id: 23, question: "Can you step into the same river twice?", category: "Metaphysics", issue: "Vol. VIII" },
  { id: 24, question: "What is the weight of an unspoken word?", category: "Language", issue: "Vol. VIII" },
  { id: 25, question: "Is boredom the beginning or the end of thinking?", category: "Existentialism", issue: "Vol. IX" },
  { id: 26, question: "What does it mean to waste time?", category: "Time", issue: "Vol. IX" },
  { id: 27, question: "Can machines suffer?", category: "Philosophy of Mind", issue: "Vol. IX" },
  { id: 28, question: "What is the kindest thing you've never said?", category: "Ethics", issue: "Vol. X" },
  { id: 29, question: "Is certainty the enemy of wonder?", category: "Epistemology", issue: "Vol. X" },
  { id: 30, question: "What would you do with one extra hour each day?", category: "Praxis", issue: "Vol. X" },
];

function seededShuffle<T>(array: T[], seed: number): T[] {
  const shuffled = [...array];
  let s = seed;
  for (let i = shuffled.length - 1; i > 0; i--) {
    s = (s * 16807 + 0) % 2147483647;
    const j = s % (i + 1);
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function getDailyQuestions(count = 5): typeof QUESTIONS {
  const today = new Date();
  const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
  const shuffled = seededShuffle(QUESTIONS, seed);
  return shuffled.slice(0, count);
}

export function getTodayDateString(): string {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function getIssueNumber(): number {
  const start = new Date('2026-01-01');
  const now = new Date();
  const diff = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  return diff + 1;
}
