"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { getFlagUrl } from "./lib/flags";

export default function Home() {
  const [teams, setTeams] = useState<string[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<string>("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const loadingMessages = [
    "Analyzing...",
    "Simulating...",
    "Compiling...",
    "Indexing...",
  ];
  const [loadingStep, setLoadingStep] = useState(0);
  useEffect(() => {
    if (!loading) {
      setLoadingStep(0);
      return;
    }

    const interval = setInterval(() => {
      setLoadingStep((prev) => (prev + 1) % loadingMessages.length);
    }, 1900);

    return () => clearInterval(interval);
  }, [loading]);

  const router = useRouter();

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        setLoading(true);

        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/teams`,
          {
            next: { revalidate: 300 },
          }
        );

        if (!res.ok) {
          throw new Error("Failed to fetch teams");
        }

        const data = await res.json();
        setTeams(data);
      } catch (err) {
        console.error("Teams fetch failed:", err);
        setTeams([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTeams();
  }, []);

  return (
    <main className="page-transition mx-auto flex min-h-screen w-full max-w-md flex-col justify-start px-5 pb-16 pt-6">
      {/* Header artwork slot */}
      <div className="-mt-3 mb-6 w-full overflow-hidden rounded-lg">
        <Image
          src="/header.gif"
          alt="FIFA World Cup 2026 Path Difficulty Analyzer Header"
          width={1200}
          height={400}
          className="h-auto w-full object-cover"
          priority
        />
      </div>

      <h1 className="text-pretty text-[2.6rem] font-extrabold leading-[1.05] tracking-tight">
        <span className="text-primary">FIFA World Cup 2026 </span>
        <span className="text-muted-foreground">Path Difficulty Analyzer</span>
      </h1>

      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
        Select a team to simulate its bracket and reveal how hard the road to
        the final really is.
      </p>

      <div className="mt-8 space-y-3">
        <div className="relative w-full">
          <button
            type="button"
            onClick={() => setDropdownOpen((v) => !v)}
            className="btn-animate flex w-full items-center justify-between rounded-full border border-border bg-secondary px-5 py-3 text-sm font-semibold text-secondary-foreground"
          >
            <span className="flex items-center gap-3">
              {selectedTeam !== "" && getFlagUrl(selectedTeam) && (
                <Image
                  src={getFlagUrl(selectedTeam)!}
                  alt={`${selectedTeam} flag`}
                  width={28}
                  height={20}
                  className="h-5 w-7 rounded-sm object-cover shadow-sm"
                />
              )}
              <span>
                {selectedTeam === "" ? "Select a team" : selectedTeam}
              </span>
            </span>

            <svg
              className={`h-4 w-4 transition-transform duration-200 ${
                dropdownOpen ? "rotate-180" : ""
              }`}
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 10.94l3.71-3.71a.75.75 0 1 1 1.06 1.06l-4.24 4.24a.75.75 0 0 1-1.06 0L5.21 8.29a.75.75 0 0 1 .02-1.08z"
                clipRule="evenodd"
              />
            </svg>
          </button>

          {dropdownOpen && (
            <div className="absolute z-50 mt-2 max-h-60 w-full overflow-auto rounded-2xl border border-border bg-card shadow-lg">
              {teams.map((team) => (
                <button
                  key={team}
                  onClick={() => {
                    setSelectedTeam(team);
                    setDropdownOpen(false);
                  }}
                  className="flex w-full items-center gap-3 px-5 py-3 text-left text-sm text-secondary-foreground transition-colors duration-300 hover:bg-secondary active:bg-primary active:text-primary-foreground"
                >
                  {getFlagUrl(team) && (
                    <Image
                      src={getFlagUrl(team)!}
                      alt={`${team} flag`}
                      width={28}
                      height={20}
                      className="h-5 w-7 rounded-sm object-cover shadow-sm"
                    />
                  )}
                  <span>{team}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          disabled={selectedTeam === "" || loading}
          className="btn-animate w-full rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-40"
          onClick={() => {
            if (selectedTeam === "") return;
            setLoading(true);
            router.prefetch(`/team/${encodeURIComponent(selectedTeam)}`);
            router.push(`/team/${encodeURIComponent(selectedTeam)}`);
          }}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg
                className="h-4 w-4 animate-spin"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                />
              </svg>
              {loadingMessages[loadingStep]}
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              Analyze Path
              {selectedTeam !== "" && !loading && (
                <svg
                  className="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <path d="M5 12h14" />
                  <path d="M12 5l7 7-7 7" />
                </svg>
              )}
            </span>
          )}
        </button>

        <button
          className="btn-animate w-full rounded-full border border-border bg-secondary px-5 py-3 text-sm font-semibold text-secondary-foreground"
          onClick={() => {
            router.prefetch("/rankings");
            router.push("/rankings");
          }}
        >
          View Full Rankings
        </button>

        <button
          className="w-full px-5 py-2 text-sm font-medium text-muted-foreground underline-offset-4 hover:text-primary hover:underline"
          onClick={() => {
            router.prefetch("/methodology");
            router.push("/methodology");
          }}
        >
          How it works — Read the Methodology
        </button>
      </div>

      <footer className="mt-12 text-center text-xs text-muted-foreground">
        made by Rezwan Navid
      </footer>
    </main>
  );
}
