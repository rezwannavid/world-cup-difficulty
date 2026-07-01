import axios from "axios";
import Image from "next/image";
import Link from "next/link";
import { Home, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { tierBg, tierFromRank } from "../lib/difficulty";

import { getFlagUrl } from "../lib/flags";

type Ranking = {
  team: string;
  PSI: number;
  baseline_PSI?: number;
  delta_PSI?: number;
  RDS: number;
  baseline_RDS?: number;
  delta_RDS?: number;
  win_probability: number;
  eliminated: boolean;
};

export default async function RankingsPage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string; order?: string; hideEliminated?: string; team?: string }>;
}) {
  const { sort, order, hideEliminated, team } = await searchParams;
  const metric = sort === "rds" ? "rds" : "psi";
  const direction = order === "asc" ? "asc" : "desc";
  const hideOut = hideEliminated === "true";

  const res = await axios.get<Ranking[]>(
    `${process.env.NEXT_PUBLIC_API_URL}/rankings?sort=${metric}&order=${direction}`
  );
  const data = res.data;
  const visibleData = data
    .map((team) => ({
      ...team,
      eliminated:
        team.eliminated ?? Number(team.win_probability) <= 0,
    }))
    .filter((team) => (hideOut ? !team.eliminated : true));
  const total = visibleData.length;

  return (
    <main className="page-transition mx-auto w-full max-w-md px-5 pb-16 pt-10">
      <h1 className="text-pretty text-[2.6rem] font-extrabold leading-[1.05] tracking-tight">
        <span className="text-primary">Full </span>
        <span className="text-muted-foreground">Difficulty Rankings</span>
      </h1>

      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
        Every team ranked by how hard the road to the final looks. Rank 1 is the
        hardest possible path; the last rank is the easiest.
      </p>

      {/* Navigation buttons */}
      <div className="mt-6 flex items-center gap-2">
        <Link
          href={team ? `/team/${encodeURIComponent(team)}?hideEliminated=${hideOut}` : "/"}
          className="btn-animate flex shrink-0 items-center gap-2 justify-center rounded-full border border-border bg-secondary px-4 py-2.5 text-sm font-semibold text-secondary-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>
        <Link
          href={`/?hideEliminated=${hideOut}`}
          className="btn-animate flex shrink-0 items-center gap-2 justify-center rounded-full border border-border bg-secondary px-4 py-2.5 text-sm font-semibold text-secondary-foreground"
        >
          <Home className="h-4 w-4" />
          Home
        </Link>

        {team ? (
          <Link
            href={`/team/${encodeURIComponent(team)}?hideEliminated=${hideOut}`}
            className="btn-animate flex shrink-0 items-center gap-2 justify-center rounded-full border border-border bg-secondary px-4 py-2.5 text-sm font-semibold text-secondary-foreground"
          >
            <span className="text-base">←</span>
            Back to team analysis
          </Link>
        ) : null}
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

      {/* Ranking controls */}
      <div className="mt-5 flex flex-wrap items-center gap-2">
        <Link
          href={`/rankings?sort=${metric}&order=${direction}&hideEliminated=${hideOut ? "false" : "true"}`}
          className={`btn-animate flex shrink-0 items-center gap-1.5 justify-center rounded-full border px-3 py-2 text-xs font-semibold transition ${
            hideOut
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-secondary text-secondary-foreground"
          }`}
        >
          {hideOut ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          <span>{hideOut ? "Show eliminated teams" : "Hide eliminated teams"}</span>
        </Link>

        <div className="flex min-w-0 flex-1 rounded-full border border-border bg-secondary p-1">
          <Link
            href={`/rankings?sort=psi&order=${metric === "psi" && direction === "desc" ? "asc" : "desc"}&hideEliminated=${hideOut}`}
            className={`flex-1 rounded-full px-3 py-2 text-center text-xs font-semibold transition ${
              metric === "psi"
                ? "btn-animate bg-primary text-primary-foreground"
                : "text-secondary-foreground"
            }`}
          >
            PDI {metric === "psi" ? (direction === "desc" ? "↓" : "↑") : ""}
          </Link>
          <Link
            href={`/rankings?sort=rds&order=${metric === "rds" && direction === "desc" ? "asc" : "desc"}&hideEliminated=${hideOut}`}
            className={`flex-1 rounded-full px-3 py-2 text-center text-xs font-semibold transition ${
              metric === "rds"
                ? "btn-animate bg-primary text-primary-foreground"
                : "text-secondary-foreground"
            }`}
          >
            RDS {metric === "rds" ? (direction === "desc" ? "↓" : "↑") : ""}
          </Link>
        </div>
      </div>

      {/* List */}
      <div className="mt-6 overflow-hidden rounded-md border border-border">
        <div className="flex items-center gap-3 bg-secondary px-4 py-2.5 text-xs font-medium text-muted-foreground">
          <span className="w-7">#</span>
          <span className="flex-1 pl-12">Team</span>
          {metric === "psi" ? (
            <span className="w-14 text-right">PDI</span>
          ) : null}
          {metric === "rds" ? (
            <span className="w-16 text-right">RDS</span>
          ) : null}
        </div>

        {visibleData.map((team, index) => {
          // Keep the real rank consistent no matter how the list is sorted.
          // Descending (hardest → easiest): 1 → 32
          // Ascending (easiest → hardest): 32 → 1
          const rank = direction === "asc" ? total - index : index + 1;
          const tier = tierFromRank(rank, total);
          const isPsiSelected = metric === "psi";
          const selectedDelta = isPsiSelected ? team.delta_PSI : team.delta_RDS;
          const deltaValue = selectedDelta;
          const deltaClass = team.eliminated
            ? "text-white/50"
            : "text-white";

          return (
            <Link
              key={team.team}
              href={`/team/${encodeURIComponent(team.team)}`}
              className={`flex items-center gap-3 border-t border-border px-4 py-3 transition hover:brightness-110 ${team.eliminated ? "bg-muted opacity-80" : ""}`}
              style={team.eliminated ? { filter: "grayscale(100%)" } : { backgroundColor: tierBg(tier, 0.85) }}
            >
              <span className={`w-7 text-sm font-semibold tabular-nums ${team.eliminated ? "text-white/50" : "text-foreground/80"}`}>
                {rank}
              </span>
              <div className="flex flex-1 items-center gap-3">
                {getFlagUrl(team.team) && (
                  <Image
                    src={getFlagUrl(team.team)!}
                    alt={`${team.team} flag`}
                    width={36}
                    height={24}
                    className={`h-6 w-9 rounded-sm object-cover shadow-sm ${team.eliminated ? "opacity-50" : ""}`}
                  />
                )}

                <span>
                  <span
                    className={`block text-base font-bold ${team.eliminated ? "line-through decoration-2 decoration-white text-white opacity-50" : "text-foreground"}`}
                  >
                    {team.team}
                  </span>
                  <span className={`text-[0.7rem] font-semibold uppercase tracking-wider ${team.eliminated ? "text-white/50" : "text-foreground/75"}`}>
                    {team.eliminated ? "Eliminated" : tier}
                  </span>
                </span>
              </div>
              {metric === "psi" ? (
                <span className={`w-14 text-right text-sm tabular-nums ${team.eliminated ? "text-white/50" : "text-foreground"}`}>
                  {team.PSI.toFixed(0)}
                  {selectedDelta != null ? (
                    <span className={`ml-2 ${deltaClass} inline-flex items-baseline`}>
                      <span>{selectedDelta >= 0 ? "↑" : "↓"}</span>
                      <span className="ml-0.5 text-[10px] leading-none">
                        {Math.abs(Number(selectedDelta)).toFixed(2)}
                      </span>
                    </span>
                  ) : null}
                </span>
              ) : null}
              {metric === "rds" ? (
                <span className={`w-16 text-right text-sm tabular-nums ${team.eliminated ? "text-white/50" : "text-foreground"}`}>
                  {team.RDS.toFixed(1)}
                  {selectedDelta != null ? (
                    <span className={`ml-2 ${deltaClass} inline-flex items-baseline`}>
                      <span>{selectedDelta >= 0 ? "↑" : "↓"}</span>
                      <span className="ml-0.5 text-[10px] leading-none">
                        {Math.abs(Number(selectedDelta)).toFixed(2)}
                      </span>
                    </span>
                  ) : null}
                </span>
              ) : null}
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
