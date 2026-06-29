import Link from "next/link";

function Formula({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-3 overflow-x-auto rounded-md bg-secondary px-4 py-3 font-mono text-sm leading-relaxed text-primary">
      {children}
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-md border border-border bg-card p-5">
      <h2 className="text-pretty text-lg font-bold text-foreground">{title}</h2>
      <div className="mt-2 space-y-3 text-sm leading-relaxed text-muted-foreground">
        {children}
      </div>
    </section>
  );
}

const STRENGTH_WEIGHTS = [
  { label: "FIFA Ranking Weight (w_F)", value: "0.50", note: "Structural baseline" },
  { label: "Recent Form Weight (w_R)", value: "0.30", note: "Short-term momentum" },
  { label: "Head-to-Head Weight (w_H)", value: "0.20", note: "Historical match-up edge" },
];

const ROUND_WEIGHTS = [
  { round: "Round of 32", weight: "1.0" },
  { round: "Round of 16", weight: "1.5" },
  { round: "Quarterfinals", weight: "2.0" },
  { round: "Semifinals", weight: "2.5" },
  { round: "Final", weight: "3.0" },
];

export default function Methodology() {
  return (
    <main className="mx-auto w-full max-w-md px-5 pb-16 pt-10">
      <h1 className="text-pretty text-[2.6rem] font-extrabold leading-[1.05] tracking-tight">
        <span className="text-primary">The </span>
        <span className="text-muted-foreground">Methodology</span>
      </h1>
      <p className="mt-3 text-sm font-semibold text-foreground">
        Probabilistic Knockout Path Difficulty Modeling (PKPDM)
      </p>

      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
        Welcome to the engine room of the FIFA World Cup 2026 Path Difficulty
        Analyzer. Traditional tournament analysis suffers from a major flaw: it
        evaluates a team&apos;s route by looking only at the most likely opponent
        they will face next. This creates a &quot;deterministic bias&quot; — it
        ignores alternative paths, dark horses, and bracket upsets.
      </p>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        PKPDM solves this with recursive probabilistic simulation, evaluating
        every possible opponent a team could face from the Round of 32 all the
        way to the Final at MetLife Stadium.
      </p>

      <div className="mt-8 space-y-4">
        <Section title="1. Deterministic vs. Probabilistic Modeling">
          <p>
            Imagine Team A looking ahead to the Quarterfinals. Their potential
            opponents&apos; chances to advance might look like this:
          </p>
          <ul className="ml-4 list-disc space-y-1">
            <li>Senegal: 80% chance to advance</li>
            <li>USA: 10% chance to advance</li>
            <li>Belgium: 8% chance to advance</li>
            <li>Bosnia: 2% chance to advance</li>
          </ul>
          <p>
            <span className="font-semibold text-foreground">
              The Traditional Model:
            </span>{" "}
            only considers Senegal, discarding the other 20% of bracket
            uncertainty.
          </p>
          <p>
            <span className="font-semibold text-foreground">
              The PKPDM Framework:
            </span>{" "}
            multiplies the strength of all four teams by their respective
            probability of getting there, combining them into a single true{" "}
            <span className="text-primary">Expected Round Difficulty</span>.
          </p>
        </Section>

        <Section title="2. Phase 1 — Quantifying Team Strength S(T)">
          <p>
            We establish a baseline scalar strength for every qualified nation.
            The Composite Strength Function blends global standing, recent
            momentum, and historical matchups:
          </p>
          <Formula>S(T) = w_F · F(T) + w_R · R(T) + w_H · H(T)</Formula>
          <div className="overflow-hidden rounded-md border border-border">
            {STRENGTH_WEIGHTS.map((w) => (
              <div
                key={w.label}
                className="flex items-center justify-between gap-3 border-b border-border px-3 py-2 last:border-b-0"
              >
                <span className="text-foreground">{w.label}</span>
                <span className="shrink-0 font-mono text-primary">
                  {w.value}
                </span>
              </div>
            ))}
          </div>
          <p className="font-semibold text-foreground">A. FIFA Ranking — F(T)</p>
          <p>
            Because raw FIFA ranks scale backward (lower numbers mean better
            teams), we invert the ranking relative to the pool size (R_max) so
            higher points equal higher quality:
          </p>
          <Formula>F(T) = R_max + 1 − rank(T)</Formula>
          <p className="font-semibold text-foreground">B. Recent Form — R(T)</p>
          <p>Calculated from the team&apos;s last 10 official fixtures:</p>
          <Formula>R(T) = (Wins + 0.5 · Draws) / 10</Formula>
          <p className="font-semibold text-foreground">
            C. Head-to-Head Matrix — H(T)
          </p>
          <p>
            Extracted from historical competitive data against cross-bracket
            opponents to adjust for &quot;bogey teams&quot; and stylistic
            dominance.
          </p>
        </Section>

        <Section title="3. Phase 2 — Match Win Probabilities">
          <p>
            When Team A faces Team B, the probability of A advancing is a factor
            of their relative composite strengths:
          </p>
          <Formula>P(A &gt; B) = S(A) / (S(A) + S(B))</Formula>
          <p>The probability of B winning is the perfect complement:</p>
          <Formula>P(B &gt; A) = 1 − P(A &gt; B)</Formula>
          <p>
            This keeps probability curves symmetric, normalized, and strictly
            bounded between 0 and 1.
          </p>
        </Section>

        <Section title="4. Phase 3 — Recursive Bracket Propagation">
          <p>
            For any round r, a team faces a set of potential opponents. The
            probability of a specific opponent X existing at that node is
            calculated recursively along the necessary path:
          </p>
          <Formula>P(X reaches round r) = ∏ P(win along path)</Formula>
          <p className="font-semibold text-foreground">
            Expected Round Difficulty
          </p>
          <p>
            The sum of the strengths of all possible opponents multiplied by the
            probability of them being there:
          </p>
          <Formula>E[D_r] = Σ P(o_i) · S(o_i)</Formula>
        </Section>

        <Section title="5. Phase 4 — Master Metrics (PDI &amp; RDS)">
          <p>
            Group-stage matches carry less gravity than a Semifinal, so we apply
            Round-Weight Scaling (W_r):
          </p>
          <div className="overflow-hidden rounded-md border border-border">
            {ROUND_WEIGHTS.map((r) => (
              <div
                key={r.round}
                className="flex items-center justify-between gap-3 border-b border-border px-3 py-2 last:border-b-0"
              >
                <span className="text-foreground">{r.round}</span>
                <span className="shrink-0 font-mono text-primary">
                  {r.weight}
                </span>
              </div>
            ))}
          </div>
          <p className="font-semibold text-foreground">
            1. Path Difficulty Index (PDI) — Absolute
          </p>
          <p>
            PDI measures the raw, objective brutality of a bracket section,
            independent of who is walking it. A high PDI means a path through a
            minefield of elite nations.
          </p>
          <Formula>PDI(T) = Σ W_r · E[D_r]</Formula>
          <p className="font-semibold text-foreground">
            2. Relative Difficulty Score (RDS) — Team-Relative
          </p>
          <p>
            RDS normalizes path difficulty against the team&apos;s own strength.
            A path manageable for France may be impossible for an underdog.
          </p>
          <Formula>RDS(T) = Σ W_r · ( E[D_r] / S(T) )</Formula>
          <p>
            <span className="font-semibold text-foreground">Low RDS:</span> the
            team is significantly stronger than its expected path difficulty.
          </p>
          <p>
            <span className="font-semibold text-foreground">High RDS:</span> the
            team is vastly outmatched by the caliber of opponents waiting.
          </p>
        </Section>

        <Section title="6. Execution — Monte Carlo Simulations">
          <p>
            Calculating exact recursive probabilities for a 48-team expanded
            World Cup involves massive exponential complexity. To ensure fast,
            precise results, our engine runs N = 100,000 simulated iterations of
            the entire knockout tournament.
          </p>
          <Formula>
            [Bracket] → [Calc S(T)] → [Run 100k Sims] → [Aggregate] → [PDI/RDS]
          </Formula>
          <p>
            The probability of any individual matchup is derived empirically
            from this pool:
          </p>
          <Formula>P(X) = count(X) / N</Formula>
          <p>
            Every time you click a team, you are viewing an analytical
            projection built on top-tier mathematical forecasting data.
          </p>
        </Section>
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
