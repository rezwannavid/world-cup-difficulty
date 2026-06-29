import Link from "next/link";

const SECTIONS = [
  {
    title: "1. Team Strength",
    body: "Each team is assigned a strength value directly from its FIFA rating. A higher rating means a stronger team.",
  },
  {
    title: "2. Win Probability",
    body: "The probability of Team A beating Team B is derived from the gap between their strengths.",
    code: "P(A wins) = S(A) / (S(A) + S(B))",
  },
  {
    title: "3. Monte Carlo Simulation",
    body: "The tournament is simulated thousands of times. Each match outcome is sampled based on the win probability of the two teams.",
  },
  {
    title: "4. PDI (Path Difficulty Index)",
    body: "Measures the average difficulty of the opponents a team is expected to face.",
    code: "PDI(T) = Total Opponent Strength / Matches Played",
  },
  {
    title: "5. RDS (Relative Difficulty Score)",
    body: "Adjusts the path difficulty against the team's own strength to show how hard the road is for them specifically.",
    code: "RDS(T) = PDI(T) - Strength(T)",
  },
];

export default function Methodology() {
  return (
    <main className="mx-auto w-full max-w-md px-5 pb-16 pt-10">
      <h1 className="text-pretty text-[2.6rem] font-extrabold leading-[1.05] tracking-tight">
        <span className="text-primary">The </span>
        <span className="text-muted-foreground">Methodology</span>
      </h1>

      <div className="mt-8 space-y-4">
        {SECTIONS.map((section) => (
          <div
            key={section.title}
            className="rounded-md border border-border bg-card p-5"
          >
            <h2 className="text-lg font-bold text-foreground">
              {section.title}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {section.body}
            </p>
            {section.code && (
              <code className="mt-3 block rounded-md bg-secondary px-3 py-2 font-mono text-sm text-primary">
                {section.code}
              </code>
            )}
          </div>
        ))}
      </div>

      <div className="mt-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary px-5 py-2.5 text-sm font-semibold text-secondary-foreground transition hover:bg-card"
        >
          Back to Home
        </Link>
      </div>

      <footer className="mt-12 text-center text-xs text-muted-foreground">
        made by Rezwan Navid
      </footer>
    </main>
  );
}
