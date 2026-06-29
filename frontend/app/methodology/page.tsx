export default function Methodology() {
  return (
    <main className="p-10 max-w-4xl mx-auto">
      <h1 className="text-4xl font-bold mb-8">Methodology</h1>

      <div className="space-y-8">

        <div className="border rounded p-6">
          <h2 className="text-2xl font-bold mb-2">1. Team Strength</h2>
          <p>
            Each team is assigned a strength value directly from FIFA rating.
            Higher rating means stronger team.
          </p>
        </div>

        <div className="border rounded p-6">
          <h2 className="text-2xl font-bold mb-2">2. Win Probability</h2>
          <p className="mb-2">
            Probability of Team A beating Team B:
          </p>
          <code>
            P(A wins) = S(A) / (S(A) + S(B))
          </code>
        </div>

        <div className="border rounded p-6">
          <h2 className="text-2xl font-bold mb-2">3. Monte Carlo Simulation</h2>
          <p>
            Tournament is simulated thousands of times. Each match outcome is
            sampled based on win probability.
          </p>
        </div>

        <div className="border rounded p-6">
          <h2 className="text-2xl font-bold mb-2">4. PSI (Path Strength Index)</h2>
          <p className="mb-2">
            Measures average opponent difficulty:
          </p>
          <code>
            PSI(T) = Total Opponent Strength / Matches Played
          </code>
        </div>

        <div className="border rounded p-6">
          <h2 className="text-2xl font-bold mb-2">5. RDS (Relative Difficulty Score)</h2>
          <p className="mb-2">
            Adjusts PSI based on team’s own strength:
          </p>
          <code>
            RDS(T) = PSI(T) / Strength(T)
          </code>
        </div>

      </div>
    </main>
  );
}