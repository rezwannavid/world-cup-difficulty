// Maps an opponent rating to a difficulty color (green = easy, red = hard).
// The hue sweeps from green (145) through olive/amber down to red (0).
const MIN_RATING = 1500;
const MAX_RATING = 2450;

export function difficultyColor(rating: number, alpha = 1): string {
  const clamped = Math.max(MIN_RATING, Math.min(MAX_RATING, rating));
  const t = (clamped - MIN_RATING) / (MAX_RATING - MIN_RATING); // 0 easy -> 1 hard
  const hue = 145 * (1 - t);
  const sat = 38;
  const light = 22;
  return `hsl(${hue.toFixed(0)} ${sat}% ${light}% / ${alpha})`;
}

export type Tier = "Easy" | "Moderate" | "Hard";

// rank is 1-based, 1 = hardest. total = number of teams.
export function tierFromRank(rank: number, total: number): Tier {
  const third = total / 3;
  if (rank <= third) return "Hard";
  if (rank <= third * 2) return "Moderate";
  return "Easy";
}

export const tierColor: Record<Tier, string> = {
  Hard: "var(--accent-red)",
  Moderate: "var(--accent-orange)",
  Easy: "var(--accent-green)",
};

export const ROUND_LABELS: Record<string, string> = {
  "Round of 32": "Round of 32",
  "Round of 16": "Round of 16",
  Quarterfinal: "Quarter Finals",
  Semifinal: "Semi-Finals",
  Final: "Finals",
};

export function prettyRound(round: string): string {
  return ROUND_LABELS[round] ?? round;
}
