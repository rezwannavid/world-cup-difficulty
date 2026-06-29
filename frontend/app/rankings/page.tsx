import axios from "axios";
import Link from "next/link";

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

  return (
    <main className="mx-auto w-full max-w-md px-5 pb-16 pt-10">
      <h1 className="text-pretty text-[2.6rem] font-extrabold leading-[1.05] tracking-tight">
        <span className="text-primary">Full </span>
        <span className="text-muted-foreground">Difficulty Rankings</span>
      </h1>

      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
        Every team ranked by the difficulty of the path our simulation expects
        them to face on the way to the final.
      </p>

      {/* Sort toggle */}
      <div className="mt-6 flex gap-3">
        <Link
          href="/rankings?sort=psi"
          className={`rounded-full px-5 py-2.5 text-sm font-semibold transition ${
            metric === "psi"
              ? "bg-primary text-primary-foreground"
              : "border border-border bg-secondary text-secondary-foreground hover:bg-card"
          }`}
        >
          Sort by PDI
        </Link>
        <Link
          href="/rankings?sort=rds"
          className={`rounded-full px-5 py-2.5 text-sm font-semibold transition ${
            metric === "rds"
              ? "bg-primary text-primary-foreground"
              : "border border-border bg-secondary text-secondary-foreground hover:bg-card"
          }`}
        >
          Sort by RDS
        </Link>
      </div>

      {/* List */}
      <div className="mt-8 overflow-hidden rounded-md border border-border">
        <div className="flex items-center gap-3 bg-secondary px-4 py-2.5 text-xs font-medium text-muted-foreground">
          <span className="w-7">#</span>
          <span className="flex-1">Team</span>
          <span className="w-14 text-right">PDI</span>
          <span className="w-16 text-right">RDS</span>
        </div>

        {data.map((team, index) => (
          <Link
            key={team.team}
            href={`/team/${encodeURIComponent(team.team)}`}
            className="flex items-center gap-3 border-t border-border px-4 py-3 transition hover:bg-secondary"
          >
            <span className="w-7 text-sm font-semibold tabular-nums text-muted-foreground">
              {index + 1}
            </span>
            <span className="flex-1 text-base font-bold text-foreground">
              {team.team}
            </span>
            <span className="w-14 text-right text-sm tabular-nums text-foreground">
              {team.PSI.toFixed(0)}
            </span>
            <span className="w-16 text-right text-sm tabular-nums text-muted-foreground">
              {team.RDS.toFixed(1)}
            </span>
          </Link>
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
