// Maps a team's FIFA ranking points to a difficulty band.
// Higher points = stronger opponent = harder.
//   Green  : 1300 <= pts < 1500   (manageable)
//   Yellow : 1500 <= pts < 1760   (tough)
//   Red    : pts >= 1760          (elite / brutal)

export function rankBand(points: number): "green" | "yellow" | "red" {
  if (points >= 1760) return "red";
  if (points >= 1500) return "yellow";
  return "green";
}

// Returns a translucent background color for an opponent card based on FIFA points.
export function difficultyColor(rating: number): string {
  if (!rating || rating <= 0) return "rgba(148, 163, 184, 0.5)"; // neutral fallback

  if (rating >= 2100) return "rgba(245, 62, 77, 0.95)";
  if (rating >= 2000) return "rgba(242, 89, 91, 0.9)";
  if (rating >= 1900) return "rgba(242, 165, 63, 0.85)";
  if (rating >= 1800) return "rgba(234, 211, 97, 0.8)";
  if (rating >= 1700) return "rgba(49, 161, 108, 0.8)";
  return "rgba(34, 197, 94, 0.8)";
}

// Formats FIFA ranking points cleanly, e.g. 1642 -> "1,642 pts".
export function formatPoints(points: number): string {
  return `${Math.round(points).toLocaleString("en-US")} pts`;
}

/* ----------------------- PDI / RDS 5-tier scale ----------------------- */
// Rank 1 = hardest possible path (Bad). Rank N = easiest (Good).
// Tiers are scaled to the total number of teams (default thresholds match a
// 32-team field):
//   1 – 8   Very Hard          -> very red
//   9 – 15  Moderately Hard    -> deep orange
//   16 – 22 Moderate           -> pure yellow
//   23 – 27 Moderately Easy    -> yellowish green
//   28 – 32 Easy               -> solid green

export type Tier =
  | "Very Hard"
  | "Moderately Hard"
  | "Moderate"
  | "Moderately Easy"
  | "Easy";

export function tierFromRank(rank: number, total = 32): Tier {
  // Scale the 32-based thresholds to whatever the field size is.
  const f = total / 32;
  if (rank <= 8 * f) return "Very Hard";
  if (rank <= 15 * f) return "Moderately Hard";
  if (rank <= 22 * f) return "Moderate";
  if (rank <= 27 * f) return "Moderately Easy";
  return "Easy";
}

export const tierColor: Record<Tier, string> = {
  "Very Hard": "#c0392b",
  "Moderately Hard": "#e07a3f",
  Moderate: "#e3c93f",
  "Moderately Easy": "#a8d96a",
  Easy: "#4fbf73",
};

// Translucent version for row backgrounds.
export function tierBg(tier: Tier, alpha = 0.85): string {
  const hsl: Record<Tier, string> = {
    "Very Hard": "6 64% 46%",
    "Moderately Hard": "22 73% 56%",
    Moderate: "49 75% 56%",
    "Moderately Easy": "84 56% 63%",
    Easy: "120 55% 45%",
  };
  return `hsl(${hsl[tier]} / ${alpha})`;
}

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
