"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
  baseline_PSI: number;
  baseline_RDS: number;
  delta_PSI: number;
  delta_RDS: number;
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
  const [showDelta, setShowDelta] = useState(false);
  const [loadingTeam, setLoadingTeam] = useState<string | null>(null);
  const loadingMessages = ["Analyzing...", "Simulating...", "Compiling..."];
  const [loadingStep, setLoadingStep] = useState(0);

  useEffect(() => {
    if (!loadingTeam) {
      setLoadingStep(0);
      return;
    }

    const interval = setInterval(() => {
      setLoadingStep((prev) => (prev + 1) % loadingMessages.length);
    }, 1800);

    return () => clearInterval(interval);
  }, [loadingTeam]);

  const ratingOf = (name: string) => data.ratings?.[name];

  const sortedOpponentsMap = useMemo(() => {
    const result: Record<string, [string, number][]> = {};

    for (const round of Object.keys(data.opponents ?? {})) {
      const teams = Object.fromEntries(
        Object.entries(data.opponents[round] ?? {}).filter(
          ([name]) => name !== data.team
        )
      );

      result[round] = Object.entries(teams).sort((a, b) => {
        const aDefeated = data.defeated_teams?.includes(a[0]) ?? false;
        const bDefeated = data.defeated_teams?.includes(b[0]) ?? false;

        if (aDefeated !== bDefeated) {
          return aDefeated ? -1 : 1;
        }

        return b[1] - a[1];
      });
    }

    return result;
  }, [data.opponents, data.team, data.defeated_teams]);

  const sortedOpponents = (round: string) => sortedOpponentsMap[round] ?? [];

  const rounds = useMemo(
    () =>
      ROUND_ORDER.filter((r) => {
        const entries = data.opponents[r];
        return entries && Object.keys(entries).length > 0;
      }),
    [data.opponents]
  );

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
        </div>

        {/* Eliminated message */}
        <div className="mt-20">
          <h2 className="text-[1.8rem] font-medium leading-[1.15] tracking-tight text-muted-foreground">
            Your team was knocked out by{" "}
            <span className="text-primary">
              {data.defeated_by ?? "their opponent"}
            </span>
            .
          </h2>
        </div>

        {/* Actual tournament path */}
        {data.elimination_history?.length ? (
          <div className="mt-10 space-y-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Path Taken
            </p>

            {data.elimination_history.map((match) => (
              <div
                key={`${match.round}-${match.match_index}`}
                className="flex items-center gap-3 rounded-md border border-border px-4 py-3"
              >
                {getFlagUrl(match.opponent) && (
                  <Image
                    src={getFlagUrl(match.opponent)!}
                    alt={`${match.opponent} flag`}
                    width={28}
                    height={20}
                    className="h-5 w-7 rounded-sm object-cover shadow-sm"
                  />
                )}

                <div className="flex flex-1 items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {match.opponent}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {prettyRound(match.round)}
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      setLoadingTeam(match.opponent);
                      router.push(`/team/${encodeURIComponent(match.opponent)}`);
                    }}
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition min-w-[170px]"
                  >
                    {loadingTeam === match.opponent ? (
                      <>
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                        {loadingMessages[loadingStep]}
                      </>
                    ) : (
                      <>
                        Follow Path
                        <ArrowRight />
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : null}
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
            showDelta={showDelta}
            setShowDelta={setShowDelta}
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
                  <span
                    title="Elo is a strength rating system that estimates how strong a team is based on match results and opponent difficulty. Higher Elo means a stronger team."
                    className="cursor-help text-sm font-medium tabular-nums text-foreground/80"
                  >
                    {topRating} Elo
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
                    <span
                      title="Elo is a strength rating system that estimates how strong a team is based on match results and opponent difficulty. Higher Elo means a stronger team."
                      className="cursor-help text-xs tabular-nums text-muted-foreground"
                    >
                      {rating} Elo
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
  showDelta,
  setShowDelta,
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
  showDelta: boolean;
  setShowDelta: (value: boolean) => void;
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
                <span
                  title="Elo is a strength rating system that estimates how strong a team is based on match results and opponent difficulty. Higher Elo means a stronger team."
                  className="cursor-help text-sm font-medium tabular-nums text-foreground/80"
                >
                  {rating} Elo
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
      <div className="mt-10">
        <div className="relative mb-8 inline-flex rounded-full border border-border bg-secondary p-1">
          <div
            className="absolute top-1 bottom-1 rounded-full bg-primary transition-all duration-300 ease-in-out"
            style={{
              width: "calc(50% - 4px)",
              left: showDelta ? "calc(50% + 2px)" : "2px",
            }}
          />
          <button
            onClick={() => setShowDelta(false)}
            className={`relative z-10 rounded-full px-4 py-2 text-sm font-semibold transition-colors duration-300 ${
              !showDelta
                ? "bg-primary text-primary-foreground"
                : "text-secondary-foreground"
            }`}
          >
            Current Score
          </button>
          <button
            onClick={() => setShowDelta(true)}
            className={`relative z-10 rounded-full px-4 py-2 text-sm font-semibold transition-colors duration-300 ${
              showDelta
                ? "bg-primary text-primary-foreground"
                : "text-secondary-foreground"
            }`}
          >
            Bracket Change
          </button>
        </div>

        <div className="space-y-10">
          <Metric
            abbr="PDI"
            name="Path Difficulty Index"
            value={showDelta ? data.delta_PSI.toFixed(2) : data.PSI.toFixed(2)}
            delta={data.delta_PSI}
            showDelta={showDelta}
            valueColor={tierColor[pdiTier]}
            tier={pdiTier}
            rank={pdiRank}
            total={total}
            description={showDelta
              ? "Path Difficulty Index Delta — the change in this team's projected path difficulty compared to the original Round of 32 bracket simulation. As teams get eliminated and the bracket resolves, this measures how much easier or harder the path has become."
              : "Path Difficulty Index — the average strength of the opponents this team is likely to meet on its road to the final. A higher PDI means a tougher path."}
          />

          <Metric
            abbr="RDS"
            name="Relative Difficulty Score"
            value={showDelta ? data.delta_RDS.toFixed(3) : data.RDS.toFixed(3)}
            delta={data.delta_RDS}
            showDelta={showDelta}
            valueColor={tierColor[rdsTier]}
            tier={rdsTier}
            rank={rdsRank}
            total={total}
            description={showDelta
              ? "Relative Difficulty Score Delta — the change in this team's bracket difficulty relative to the original Round of 32 simulation. As results come in and teams are eliminated, this tracks how the comparative difficulty of the path shifts over time."
              : "Relative Difficulty Score — how brutal this team's specific bracket layout is compared to every other nation in the tournament."}
          />
        </div>
      </div>
    </div>
  );
}

function Metric({
  abbr,
  name,
  value,
  delta,
  showDelta,
  valueColor,
  tier,
  rank,
  total,
  description,
}: {
  abbr: string;
  name: string;
  value: string;
  delta: number;
  showDelta: boolean;
  valueColor: string;
  tier: string;
  rank: number;
  total: number;
  description: string;
}) {
  // Normalize the tier before rendering value color
  const normalizedTier = tier.trim() as Tier;
  const resolvedValueColor = valueColor || tierColor[normalizedTier] || "#e07a3f";

  // Helper functions for continuous delta color scale
  const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

  const getDeltaColor = (d: number) => {
    const abs = Math.abs(d);
    const max = abbr === "RDS" ? 0.4 : 100;
    const t = clamp(abs / max, 0, 1);

    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

    if (d === 0) return "var(--muted-foreground)";

    if (d > 0) {
      // white -> red (#ef4444)
      const r = Math.round(lerp(255, 239, t));
      const g = Math.round(lerp(255, 68, t));
      const b = Math.round(lerp(255, 68, t));
      return `rgb(${r}, ${g}, ${b})`;
    } else {
      // white -> green (#22c55e)
      const r = Math.round(lerp(255, 34, t));
      const g = Math.round(lerp(255, 197, t));
      const b = Math.round(lerp(255, 94, t));
      return `rgb(${r}, ${g}, ${b})`;
    }
  };

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
        <div>
          <span
            className="text-5xl font-light tracking-tight tabular-nums"
            style={{ color: resolvedValueColor }}
          >
            {abbr === "RDS" ? displayValue.toFixed(3) : displayValue.toFixed(2)}
          </span>
          <div
            className="mt-1 text-sm font-semibold"
            style={{
              color: getDeltaColor(delta),
            }}
          >
            <span className="inline-flex items-center gap-1">
              <span>
                {delta > 0 ? "↑" : delta < 0 ? "↓" : "="}
              </span>
              <span>
                {Math.abs(delta).toFixed(abbr === "RDS" ? 3 : 2)}
              </span>
            </span>
          </div>
        </div>
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
          const numericValue = showDelta
            ? delta
            : (parseFloat(value) || 0);

          // Patch: Replace min/max delta logic as requested
          // For delta mode, use custom min/max for PDI, else fallback to previous logic
          // Find all deltas if needed (not used in this context, but preserved for logic reference)
          // const allDeltas = ...;
          // PATCHED LOGIC:
          // Replace:
          // const minDelta = allDeltas?.length
          //   ? Math.min(...allDeltas)
          //   : numericValue;
          //
          // const maxDelta = allDeltas?.length
          //   ? Math.max(...allDeltas)
          //   : numericValue;
          //
          // With:
          // const minDelta = abbr === "PDI"
          //   ? -15
          //   : (allDeltas?.length ? Math.min(...allDeltas) : numericValue);
          //
          // const maxDelta = abbr === "PDI"
          //   ? 46
          //   : (allDeltas?.length ? Math.max(...allDeltas) : numericValue);

          let min = 0;
          let max = 1;

          if (showDelta) {
            if (abbr === "PDI") {
              min = -15;
              max = 46;
            } else if (abbr === "RDS") {
              min = -0.01;
              max = 0.01;
            }
          } else {
            if (abbr === "PDI") {
              min = 1764;
              max = 2077;
            } else if (abbr === "RDS") {
              min = 0.8;
              max = 1.3;
            }
          }

          const range = Math.max(max - min, 1e-6);
          const absMax = showDelta ? Math.max(Math.abs(max), Math.abs(min)) : 0;
          const center = 50;

          let finalPct = 0;

          if (showDelta) {
            const safeMax = Math.max(absMax, 1e-6);
            finalPct = 50 + (numericValue / safeMax) * 50;
          } else {
            finalPct = ((numericValue - min) / range) * 100;
          }

          if (!Number.isFinite(finalPct)) finalPct = 50;
          finalPct = Math.max(0, Math.min(100, finalPct));

          const progressRatio = showDelta
            ? 1
            : (numericValue > 0 ? Math.max(0, Math.min(1, displayValue / numericValue)) : 0);

          // Slider position logic: in delta mode, pctFilled is just finalPct, not animated
          const pctFilled = showDelta
            ? finalPct
            : finalPct * progressRatio;

          // Delta mode: show a gradient to reinforce meaning, else muted
          const trackColor = showDelta
            ? "linear-gradient(to right, rgba(34,197,94,0.35), var(--muted), rgba(239,68,68,0.35))"
            : "var(--muted)";
          const fillColor = resolvedValueColor;

          const labelValue = numericValue;

          return (
            <div>
              <div className="relative h-3 w-full rounded-full" style={{ background: trackColor }}>
                {/* 0 marker */}
                {showDelta && (
                  <div
                    className="absolute top-0 h-3 w-[2px] bg-foreground/40"
                    style={{ left: "50%" }}
                  />
                )}

                {/* Left fill (negative values) */}
                {showDelta && numericValue < 0 && (
                  <div
                    className="absolute top-0 h-3 bg-green-500/60 rounded-full"
                    style={{
                      right: "50%",
                      width: `${Math.abs(numericValue) / Math.max(absMax, 1e-6) * 50}%`
                    }}
                  />
                )}

                {/* Right fill (positive values) */}
                {showDelta && numericValue > 0 && (
                  <div
                    className="absolute top-0 h-3 bg-red-500/60 rounded-full"
                    style={{
                      left: "50%",
                      width: `${Math.abs(numericValue) / Math.max(absMax, 1e-6) * 50}%`
                    }}
                  />
                )}

                {/* fallback for non-delta mode */}
                {!showDelta && (
                  <div
                    className="absolute left-0 top-0 h-3 rounded-full"
                    style={{ width: `${pctFilled}%`, background: fillColor }}
                  />
                )}

                <div
                  className="absolute top-1/2 h-5 w-5 rounded-full ring-2"
                  style={{
                    left: showDelta
                      ? `${50 + (numericValue / Math.max(absMax, 1e-6)) * 50}%`
                      : `${pctFilled}%`,
                    transform: 'translate(-50%, -50%)',
                    background: showDelta ? getDeltaColor(numericValue) : fillColor,
                    boxShadow: '0 0 0 3px rgba(0,0,0,0.12)'
                  }}
                />
              </div>

              <div className="mt-2 relative h-5 text-xs">
                <span className="absolute left-0 text-muted-foreground">
                  {abbr === "RDS" && showDelta ? min.toFixed(3) : min}
                </span>
                <span className="absolute right-0 text-muted-foreground">
                  {abbr === "RDS" && showDelta ? max.toFixed(3) : max}
                </span>

                <span
                  className="absolute text-foreground font-medium"
                  style={{
                    left: showDelta
                      ? `${50 + (numericValue / Math.max(absMax, 1e-6)) * 50}%`
                      : `${pctFilled}%`,
                    transform: 'translateX(-50%)'
                  }}
                >
                  {abbr === "PDI"
                    ? Number(labelValue).toFixed(showDelta ? 2 : 0)
                    : Number(labelValue).toFixed(abbr === "RDS" ? 3 : 2)}
                </span>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
