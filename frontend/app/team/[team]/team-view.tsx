"use client";

import { useState } from "react";
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

  function sortedOpponents(round: string) {
    const teams = data.opponents[round] ?? {};
    return Object.entries(teams).sort((a, b) => b[1] - a[1]);
  }

  const rounds = ROUND_ORDER.filter((r) => {
    const entries = data.opponents[r];
    return entries && Object.keys(entries).length > 0;
  });

  const pdiTier = tierFromRank(pdiRank, total);
  const rdsTier = tierFromRank(rdsRank, total);

  const hasLivePath = rounds.some((round) => {
    const entries = Object.values(data.opponents[round] ?? {});
    return entries.some((prob) => prob > 0);
  });

  const isEliminated = data.eliminated === true || !hasLivePath;

  if (isEliminated) {
    const lastRound = [...ROUND_ORDER]
      .reverse()
      .find((r) => data.opponents[r] !== undefined);

    const lastEntries = lastRound
      ? Object.entries(data.opponents[lastRound] ?? {})
      : [];

    const lastOpponent =
      lastEntries.length > 0
        ? lastEntries.sort((a, b) => b[1] - a[1])[0][0]
        : rounds.length > 0
          ? sortedOpponents(rounds[rounds.length - 1])[0]?.[0] ?? "Unknown"
          : "Unknown";

    return (
      <main className="mx-auto w-full max-w-md px-5 pb-16 pt-10">
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
    <main className="mx-auto w-full max-w-md px-5 pb-16 pt-10">
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
      {view === "path" ? (
        <PathView
          rounds={rounds}
          sortedOpponents={sortedOpponents}
          ratingOf={ratingOf}
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
        />
      )}

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
}: {
  rounds: string[];
  sortedOpponents: (round: string) => [string, number][];
  ratingOf: (name: string) => number | undefined;
}) {
  return (
    <div className="mt-9 space-y-7">
      {rounds.map((round) => {
        const entries = sortedOpponents(round);
        if (entries.length === 0) return null;

        const [topName, topProb] = entries[0];
        const rest = entries.slice(1);
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
                  <span className={`text-lg font-bold ${topProb <= 0 ? "line-through decoration-2 decoration-white opacity-50" : "text-foreground"}`}>
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
                Chance to Face: {topProb <= 0 ? "0%" : pct(topProb)}
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
                    <span className={`text-base font-semibold ${prob <= 0 ? "line-through decoration-2 decoration-white opacity-50" : "text-foreground"}`}>
                      {name}
                    </span>
                  </div>
                  {rating != null && rating > 0 && (
                    <span className="text-xs tabular-nums text-muted-foreground">
                      {formatPoints(rating)}
                    </span>
                  )}
                  <span className="w-28 text-right text-xs font-medium tabular-nums text-foreground">
                    Chance to Face: {prob <= 0 ? "0%" : pct(prob)}
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
}) {
  return (
    <div className="mt-9">
      {/* Compact path summary */}
      <div className="overflow-hidden rounded-md">
        {rounds.map((round) => {
          const entries = sortedOpponents(round);
          if (entries.length === 0) return null;
          const [name, prob] = entries[0];
          const rating = ratingOf(name);
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
                <span className="text-lg font-bold text-foreground">
                  {name}
                </span>
              </div>
              {rating != null && rating > 0 && (
                <span className="text-sm font-medium tabular-nums text-foreground/80">
                  {formatPoints(rating)}
                </span>
              )}
              <span className="w-16 text-right text-sm font-semibold tabular-nums text-foreground">
                {pct(prob)}
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
  return (
    <div>
      <div className="flex items-baseline gap-3">
        <span className="text-3xl font-light tracking-tight text-foreground">
          {abbr}
        </span>
        <span className="text-base font-medium text-foreground">{name}</span>
      </div>

      <div className="mt-1 flex items-end gap-4">
        <span
          className="text-5xl font-light tracking-tight tabular-nums"
          style={{ color: valueColor }}
        >
          {value}
        </span>
        <div className="pb-2">
          <p className="text-sm font-semibold text-foreground">{tier}</p>
          <p className="text-xs text-muted-foreground">
            #{rank} out of {total}
          </p>
        </div>
      </div>

      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        {description}
      </p>
    </div>
  );
}
