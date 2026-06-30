"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  difficultyColor,
  formatPoints,
  prettyRound,
  tierColor,
  tierFromRank,
  type Tier,
} from "../../lib/difficulty";
import { getFlagUrl } from "../../lib/flags";

type TeamData = {
  team: string;
  rating: number;
  win_probability: number;
  PSI: number;
  RDS: number;
  ratings?: Record<string, number>;
  opponents: Record<string, Record<string, number>>;
  defeated_by?: string | null;
  defeated_teams?: string[];
  elimination_history?: {
    round: string;
    opponent: string;
    match_index: number;
  }[];
  eliminated?: boolean;
};

type Props = {
  data: TeamData;
  pdiRank: number;
  rdsRank: number;
  total: number;
};

const ROUND_ORDER = [
  "Round of 32",
  "Round of 16",
  "Quarterfinal",
  "Semifinal",
  "Final",
];

const METHODOLOGY =
  "Probability is determined by simulating the bracket with weights on elo ranking, FIFA official ranking, H2H results and Last 10 matches (weighted with opponent difficulty)";

function ArrowLeft() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M19 12H5" />
      <path d="m12 19-7-7 7-7" />
    </svg>
  );
}

function ArrowRight() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}

export function TeamView({ data, pdiRank, rdsRank, total }: Props) {
  const router = useRouter();
  const [view, setView] = useState<"path" | "index">("path");

  const ratingOf = (name: string) => data.ratings?.[name];
  console.log("TEAM:", data.team);
  console.log("DEFEATED TEAMS:", data.defeated_teams);
  console.log("OPPONENTS:", data.opponents);

  function sortedOpponents(round: string) {
    // Remove the current team itself from opponent lists.
    // Completed matches now include both winner (1.0) and loser (0.0),
    // but the UI should never render the team as its own opponent.
    const teams = Object.fromEntries(
      Object.entries(data.opponents[round] ?? {}).filter(
        ([name]) => name !== data.team
      )
    );

    return Object.entries(teams).sort((a, b) => {
      const aDefeated = data.defeated_teams?.includes(a[0]) ?? false;
      const bDefeated = data.defeated_teams?.includes(b[0]) ?? false;

      // Defeated teams always come first
      if (aDefeated !== bDefeated) {
        return aDefeated ? -1 : 1;
      }

      // Otherwise sort by probability descending
      return b[1] - a[1];
    });
  }

  const rounds = ROUND_ORDER.filter((r) => {
    const entries = data.opponents[r];
    return entries && Object.keys(entries).length > 0;
  });

  const pdiTier = tierFromRank(pdiRank, total);
  const rdsTier = tierFromRank(rdsRank, total);

  const isEliminated =
    data.defeated_by != null && (data.win_probability ?? 0) <= 0;

  if (isEliminated) {
    return (
      <main className="page-transition mx-auto w-full max-w-md px-5 pb-16 pt-10">
        {/* Title */}
        <h1 className="text-[2.6rem] font-extrabold leading-[1.05] tracking-tight">
          <span className="inline-flex flex-wrap items-center gap-2">
            {getFlagUrl(data.team) && (
              <Image
                src={getFlagUrl(data.team)!}
                alt={`${data.team} flag`}
                width={36}
                height={24}
                className="h-6 w-9 rounded-sm object-cover shadow-sm"
              />
            )}
            <span className="whitespace-nowrap text-primary">
              {data.team}&apos;s
            </span>
            <span className="text-muted-foreground">
              Possible Path to Finals
            </span>
          </span>
        </h1>

        {/* Actions */}
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            onClick={() => router.push("/")}
            className="btn-animate inline-flex items-center gap-2 rounded-full border border-border bg-secondary px-5 py-2.5 text-sm font-semibold text-secondary-foreground"
          >
            <ArrowLeft />
            Change Team
          </button>
          <button
            onClick={() => setView("index")}
            className="btn-animate inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
          >
            See Difficulty Index
            <ArrowRight />
          </button>
        </div>

        {/* Eliminated message */}
        <div className="mt-20">
          <h2 className="text-[2rem] font-medium leading-[1.2] tracking-tight text-muted-foreground">
            Your team was knocked out
            <br />
            of the tournament.
          </h2>
        </div>
      </main>
    );
  }

  return (
    <main className="page-transition mx-auto w-full max-w-md px-5 pb-16 pt-10">
      {/* Title */}
      <h1 className="text-[2.6rem] font-extrabold leading-[1.05] tracking-tight">
        <span className="inline-flex flex-wrap items-center gap-2">
          {getFlagUrl(data.team) && (
            <Image
              src={getFlagUrl(data.team)!}
              alt={`${data.team} flag`}
              width={36}
              height={24}
              className="h-6 w-9 rounded-sm object-cover shadow-sm"
            />
          )}
          <span className="whitespace-nowrap text-primary">
            {data.team}&apos;s
          </span>
          <span className="text-muted-foreground">
            {view === "path"
              ? "Possible Path to Finals"
              : "Difficulty to Final Index"}
          </span>
        </span>
      </h1>

      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
        {METHODOLOGY}
      </p>

      {/* Actions */}
      <div className="mt-6 flex flex-wrap gap-3">
        {view === "path" ? (
          <>
            <button
              onClick={() => router.push("/")}
              className="btn-animate inline-flex items-center gap-2 rounded-full border border-border bg-secondary px-5 py-2.5 text-sm font-semibold text-secondary-foreground"
            >
              <ArrowLeft />
              Change Team
            </button>
            <button
              onClick={() => setView("index")}
              className="btn-animate inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
            >
              See Difficulty Index
              <ArrowRight />
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => setView("path")}
              className="btn-animate inline-flex items-center gap-2 rounded-full border border-border bg-secondary px-5 py-2.5 text-sm font-semibold text-secondary-foreground"
            >
              <ArrowLeft />
              See Opponent
            </button>
            <button
              onClick={() => router.push("/rankings")}
              className="btn-animate inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
            >
              See Full List
            </button>
          </>
        )}
      </div>

      {/* Body */}
      <div key={view} className="page-transition">
        {view === "path" ? (
          <PathView
            rounds={rounds}
            sortedOpponents={sortedOpponents}
            ratingOf={ratingOf}
            defeatedTeams={data.defeated_teams}
          />
        ) : (
          <IndexView
            data={data}
            rounds={rounds}
            sortedOpponents={sortedOpponents}
            ratingOf={ratingOf}
            pdiRank={pdiRank}
            rdsRank={rdsRank}
            total={total}
            pdiTier={pdiTier}
            rdsTier={rdsTier}
            defeatedTeams={data.defeated_teams}
          />
        )}
      </div>

      <footer className="mt-12 text-center text-xs text-muted-foreground">
        made by Rezwan Navid
      </footer>
    </main>
  );
}

function pct(p: number) {
  return `${(p * 100).toFixed(0)}%`;
}

/* ----------------------------- Path view ----------------------------- */

function PathView({
  rounds,
  sortedOpponents,
  ratingOf,
  defeatedTeams,
}: {
  rounds: string[];
  sortedOpponents: (round: string) => [string, number][];
  ratingOf: (name: string) => number | undefined;
  defeatedTeams?: string[];
}) {
  const getStatusLabel = (_round: string, opponentName: string, prob: number) => {
    const wasDefeated =
      defeatedTeams?.some(
        (t) => t.trim().toLowerCase() === opponentName.trim().toLowerCase()
      ) ?? false;
    console.log("Checking:", opponentName, {
      defeated: wasDefeated,
      prob,
    });
    if (wasDefeated) return "Defeated";
    if (prob <= 0) return "Eliminated";
    if (prob >= 0.9999) return "Confirmed";
    return `Chance to Face: ${pct(prob)}`;
  };

  const isCrossedOut = (_round: string, opponentName: string, prob: number) => {
    const wasDefeated =
      defeatedTeams?.some(
        (t) => t.trim().toLowerCase() === opponentName.trim().toLowerCase()
      ) ?? false;
    return prob <= 0 || wasDefeated;
  };

  return (
    <div className="mt-9 space-y-7">
      {rounds.map((round) => {
        const entries = sortedOpponents(round);
        if (entries.length === 0) return null;

        // Always prioritize a historically defeated opponent for the headline card,
        // regardless of probability ordering.
        const defeatedEntry = entries.find(
          ([name]) =>
            defeatedTeams?.some(
              (t) => t.trim().toLowerCase() === name.trim().toLowerCase()
            ) ?? false
        );
        console.log("Top selection:", {
          round,
          entries,
          defeatedEntry,
        });

        const [topName, topProb] = defeatedEntry ?? entries[0];
        const rest = entries.filter(([name]) => name !== topName);
        const topRating = ratingOf(topName);

        return (
          <section key={round}>
            {/* Round header */}
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {prettyRound(round)}
            </p>

            {/* Highlighted most-likely opponent */}
            <div
              className="rounded-md px-4 py-3"
              style={{
                backgroundColor:
                  topRating != null
                    ? difficultyColor(topRating)
                    : "var(--secondary)",
                boxShadow:
                  topProb >= 1
                    ? `inset 0 0 0 4px color-mix(in srgb, ${
                        topRating != null ? difficultyColor(topRating) : "var(--secondary)"
                      } 65%, black)`
                    : undefined,
              }}
            >
            <div className="flex items-center gap-3">
                <div className="flex flex-1 items-center gap-3">
                  {getFlagUrl(topName) && (
                    <Image
                      src={getFlagUrl(topName)!}
                      alt={`${topName} flag`}
                      width={36}
                      height={24}
                      className="h-6 w-9 rounded-sm object-cover shadow-sm"
                    />
                  )}
                  <span className={`text-lg font-bold ${isCrossedOut(round, topName, topProb) ? "line-through decoration-2 decoration-white opacity-50" : "text-foreground"}`}>
                    {topName}
                  </span>
                </div>
                {topRating != null && topRating > 0 && (
                  <span className="text-sm font-medium tabular-nums text-foreground/80">
                    {formatPoints(topRating)}
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-xs font-medium text-foreground/75">
                {getStatusLabel(round, topName, topProb)}
              </p>
            </div>

            {/* Other possible opponents */}
            {rest.map(([name, prob]) => {
              const rating = ratingOf(name);
              return (
                <div
                  key={name}
                  className="flex items-center gap-3 border-b border-border px-4 py-2.5"
                  style={{ opacity: Math.max(0.45, Math.min(1, prob + 0.25)) }}
                >
                  <div className="flex flex-1 items-center gap-3">
                    {getFlagUrl(name) && (
                      <Image
                        src={getFlagUrl(name)!}
                        alt={`${name} flag`}
                        width={28}
                        height={20}
                        className="h-5 w-7 rounded-sm object-cover shadow-sm"
                      />
                    )}
                    <span className={`text-base font-semibold ${isCrossedOut(round, name, prob) ? "line-through decoration-2 decoration-white opacity-50" : "text-foreground"}`}>
                      {name}
                    </span>
                  </div>
                  {rating != null && rating > 0 && (
                    <span className="text-xs tabular-nums text-muted-foreground">
                      {formatPoints(rating)}
                    </span>
                  )}
                  <span className="w-28 text-right text-xs font-medium tabular-nums text-foreground">
                    {getStatusLabel(round, name, prob)}
                  </span>
                </div>
              );
            })}
          </section>
        );
      })}
    </div>
  );
}

/* ----------------------------- Index view ----------------------------- */

function IndexView({
  rounds,
  sortedOpponents,
  ratingOf,
  data,
  pdiRank,
  rdsRank,
  total,
  pdiTier,
  rdsTier,
  defeatedTeams,
}: {
  rounds: string[];
  sortedOpponents: (round: string) => [string, number][];
  ratingOf: (name: string) => number | undefined;
  data: TeamData;
  pdiRank: number;
  rdsRank: number;
  total: number;
  pdiTier: Tier;
  rdsTier: Tier;
  defeatedTeams?: string[];
}) {
  return (
    <div className="mt-9">
      {/* Compact path summary */}
      <div className="overflow-hidden rounded-md">
        {rounds.map((round) => {
          const entries = sortedOpponents(round);
          if (entries.length === 0) return null;
          const defeatedEntry = entries.find(
            ([name]) =>
              defeatedTeams?.some(
                (t) => t.trim().toLowerCase() === name.trim().toLowerCase()
              ) ?? false
          );

          const [name, prob] = defeatedEntry ?? entries[0];
          const rating = ratingOf(name);
          const isDefeated =
            defeatedTeams?.some(
              (t) => t.trim().toLowerCase() === name.trim().toLowerCase()
            ) ?? false;
          const isEliminated = prob <= 0 && !isDefeated;
          const statusLabel = isDefeated
            ? "Defeated"
            : isEliminated
              ? "Eliminated"
              : prob >= 0.9999
                ? "Confirmed"
                : pct(prob);
          return (
            <div
              key={round}
              className="flex items-center gap-3 px-4 py-3"
              style={{
                backgroundColor:
                  rating != null ? difficultyColor(rating) : "var(--secondary)",
              }}
            >
              <div className="flex flex-1 items-center gap-3">
                {getFlagUrl(name) && (
                  <Image
                    src={getFlagUrl(name)!}
                    alt={`${name} flag`}
                    width={36}
                    height={24}
                    className="h-6 w-9 rounded-sm object-cover shadow-sm"
                  />
                )}
                <span className={`text-lg font-bold ${isDefeated || prob <= 0 ? "line-through decoration-2 decoration-white opacity-50" : "text-foreground"}`}>
                  {name}
                </span>
              </div>
              {rating != null && rating > 0 && (
                <span className="text-sm font-medium tabular-nums text-foreground/80">
                  {formatPoints(rating)}
                </span>
              )}
              <span className="w-16 text-right text-sm font-semibold tabular-nums text-foreground">
                {statusLabel}
              </span>
            </div>
          );
        })}
      </div>

      {/* Metrics */}
      <div className="mt-10 space-y-10">
        <Metric
          abbr="PDI"
          name="Path Difficulty Index"
          value={data.PSI.toFixed(2)}
          valueColor={tierColor[pdiTier]}
          tier={pdiTier}
          rank={pdiRank}
          total={total}
          description="Path Difficulty Index — the average strength of the opponents this team is likely to meet on its road to the final. A higher PDI means a tougher path."
        />

        <Metric
          abbr="RDS"
          name="Relative Difficulty Score"
          value={data.RDS.toFixed(2)}
          valueColor={tierColor[rdsTier]}
          tier={rdsTier}
          rank={rdsRank}
          total={total}
          description="Relative Difficulty Score — how brutal this team's specific bracket layout is compared to every other nation in the tournament."
        />
      </div>
    </div>
  );
}

function Metric({
  abbr,
  name,
  value,
  valueColor,
  tier,
  rank,
  total,
  description,
}: {
  abbr: string;
  name: string;
  value: string;
  valueColor: string;
  tier: string;
  rank: number;
  total: number;
  description: string;
}) {
  // Normalize the tier before rendering value color
  const normalizedTier = tier.trim() as Tier;
  const resolvedValueColor = valueColor || tierColor[normalizedTier] || "#e07a3f";

  const ref = useRef<HTMLDivElement | null>(null);
  const [displayValue, setDisplayValue] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node || hasAnimated) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;

        setHasAnimated(true);
        const target = parseFloat(value);
        const duration = 1200;
        const start = performance.now();

        const tick = (now: number) => {
          const progress = Math.min((now - start) / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          setDisplayValue(target * eased);

          if (progress < 1) {
            requestAnimationFrame(tick);
          }
        };

        requestAnimationFrame(tick);
        observer.disconnect();
      },
      { threshold: 0.45 }
    );

    observer.observe(node);

    return () => observer.disconnect();
  }, [value, hasAnimated]);

  return (
    <div ref={ref}>
      <div className="flex items-baseline gap-3">
        <span className="text-3xl font-light tracking-tight text-foreground">
          {abbr}
        </span>
        <span className="text-base font-medium text-foreground">{name}</span>
      </div>

      <div className="mt-1 flex items-end gap-4">
        <span
          className="text-5xl font-light tracking-tight tabular-nums"
          style={{ color: resolvedValueColor }}
        >
          {displayValue.toFixed(2)}
        </span>
        <div className="pb-2">
          <p className="text-sm font-semibold" style={{ color: tierColor[normalizedTier] ?? resolvedValueColor }}>
            {tier}
          </p>
          <p className="text-xs text-muted-foreground">
            #{rank} out of {total}
          </p>
        </div>
      </div>

      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        {description}
      </p>

      {/* Slider: visual position within known range for PDI and RDS */}
      <div className="mt-4">
        {(() => {
          const numericValue = parseFloat(value) || 0;
          let min = 0;
          let max = 1;
          if (abbr === "PDI") {
            // observed tournament PDI bounds
            min = 1764;
            max = 2077;
          } else if (abbr === "RDS") {
            // observed tournament RDS bounds
            min = 0.8;
            max = 1.3;
          }

          const range = Math.max(max - min, 1e-6);
          // final percentage position for the target numeric value
          let finalPct = ((numericValue - min) / range) * 100;
          if (!Number.isFinite(finalPct)) finalPct = 0;
          finalPct = Math.max(0, Math.min(100, finalPct));

          // progress ratio from the animated counter (0 -> 1)
          const progressRatio = numericValue > 0 ? Math.max(0, Math.min(1, displayValue / numericValue)) : 0;
          const pctFilled = finalPct * progressRatio;

          const trackColor = "var(--muted)";
          const fillColor = resolvedValueColor;

          const labelValue = displayValue;

          return (
            <div>
              <div className="relative h-3 w-full rounded-full" style={{ background: trackColor }}>
                <div
                  className="absolute left-0 top-0 h-3 rounded-full"
                  style={{ width: `${pctFilled}%`, background: fillColor }}
                />
                <div
                  className="absolute top-1/2 h-5 w-5 rounded-full ring-2"
                  style={{ left: `${pctFilled}%`, transform: 'translate(-50%, -50%)', background: fillColor, boxShadow: '0 0 0 3px rgba(0,0,0,0.12)' }}
                />
              </div>

              <div className="mt-2 relative h-5 text-xs">
                <span className="absolute left-0 text-muted-foreground">{min}</span>
                <span className="absolute right-0 text-muted-foreground">{max}</span>
                <span
                  className="absolute text-foreground font-medium"
                  style={{ left: `${pctFilled}%`, transform: 'translateX(-50%)' }}
                >
                  {abbr === "PDI" ? Number(labelValue).toFixed(0) : labelValue.toFixed(2)}
                </span>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
