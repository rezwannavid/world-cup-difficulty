import axios from "axios";
import Link from "next/link";
import { tierBg, tierColor, tierFromRank } from "../lib/difficulty";

type Ranking = {
  team: string;
  PSI: number;
  RDS: number;
  win_probability: number;
};

export default async function RankingsPage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string }>;
}) {
  const { sort } = await searchParams;
  const metric = sort === "rds" ? "rds" : "psi";

  const res = await axios.get<Ranking[]>(
    `${process.env.NEXT_PUBLIC_API_URL}/rankings?sort=${metric}`
  );
  const data = res.data;
  const total = data.length;

  return (
    <main className="mx-auto w-full max-w-md px-5 pb-16 pt-10">
      <h1 className="text-pretty text-[2.6rem] font-extrabold leading-[1.05] tracking-tight">
        <span className="text-primary">Full </span>
        <span className="text-muted-foreground">Difficulty Rankings</span>
      </h1>

      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
        Every team ranked by how hard the road to the final looks. Rank 1 is the
        hardest possible path; the last rank is the easiest.
      </p>

      {/* Single-row action bar: Back + sort controls scale uniformly */}
      <div className="mt-6 grid grid-cols-3 gap-3">
        <Link
          href="/"
          className="flex items-center justify-center rounded-full border border-border bg-secondary px-4 py-2.5 text-sm font-semibold text-secondary-foreground transition hover:bg-card"
        >
          Back to Home
        </Link>
        <Link
          href="/rankings?sort=psi"
          className={`flex items-center justify-center rounded-full px-4 py-2.5 text-sm font-semibold transition ${
            metric === "psi"
              ? "bg-primary text-primary-foreground"
              : "border border-border bg-secondary text-secondary-foreground hover:bg-card"
          }`}
        >
          Sort by PDI
        </Link>
        <Link
          href="/rankings?sort=rds"
          className={`flex items-center justify-center rounded-full px-4 py-2.5 text-sm font-semibold transition ${
            metric === "rds"
              ? "bg-primary text-primary-foreground"
              : "border border-border bg-secondary text-secondary-foreground hover:bg-card"
          }`}
        >
          Sort by RDS
        </Link>
      </div>

      {/* What the metrics mean */}
      <div className="mt-5 space-y-2 rounded-md border border-border bg-card p-4 text-xs leading-relaxed text-muted-foreground">
        <p>
          <span className="font-semibold text-foreground">PDI</span> (Path
          Difficulty Index) — the average strength of opponents a team is likely
          to meet on the way to the final.
        </p>
        <p>
          <span className="font-semibold text-foreground">RDS</span> (Relative
          Difficulty Score) — how brutal a team&apos;s specific bracket layout is
          compared to other nations.
        </p>
      </div>

      {/* List */}
      <div className="mt-6 overflow-hidden rounded-md border border-border">
        <div className="flex items-center gap-3 bg-secondary px-4 py-2.5 text-xs font-medium text-muted-foreground">
          <span className="w-7">#</span>
          <span className="flex-1">Team</span>
          <span className="w-14 text-right">PDI</span>
          <span className="w-16 text-right">RDS</span>
        </div>

        {data.map((team, index) => {
          const rank = index + 1;
          const tier = tierFromRank(rank, total);
          return (
            <Link
              key={team.team}
              href={`/team/${encodeURIComponent(team.team)}`}
              className="flex items-center gap-3 border-t border-border px-4 py-3 transition hover:brightness-110"
              style={{ backgroundColor: tierBg(tier, 0.85) }}
            >
              <span className="w-7 text-sm font-semibold tabular-nums text-foreground/80">
                {rank}
              </span>
              <span className="flex-1">
                <span className="block text-base font-bold text-foreground">
                  {team.team}
                </span>
                <span className="text-[0.7rem] font-semibold uppercase tracking-wider text-foreground/75">
                  {tier}
                </span>
              </span>
              <span className="w-14 text-right text-sm tabular-nums text-foreground">
                {team.PSI.toFixed(0)}
              </span>
              <span className="w-16 text-right text-sm tabular-nums text-foreground/80">
                {team.RDS.toFixed(1)}
              </span>
            </Link>
          );
        })}
      </div>

      <footer className="mt-12 text-center text-xs text-muted-foreground">
        made by Rezwan Navid
      </footer>
    </main>
  );
}
