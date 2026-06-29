"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import axios from "axios";
import { useRouter } from "next/navigation";

export default function Home() {
  const [teams, setTeams] = useState<string[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<string>("");

  const router = useRouter();

  useEffect(() => {
    axios
      .get(`${process.env.NEXT_PUBLIC_API_URL}/teams`)
      .then((res) => setTeams(res.data))
      .catch(() => setTeams([]));
  }, []);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-5 pb-16 pt-12">
      {/* Header artwork slot */}
      <div className="mb-8 w-full overflow-hidden rounded-lg">
        <Image
          src="/header-artwork.png"
          alt="FIFA World Cup 2026 Path Difficulty Analyzer Header"
          width={1200}
          height={420}
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
        <label htmlFor="team" className="sr-only">
          Select team
        </label>
        <select
          id="team"
          className="w-full rounded-full border border-border bg-secondary px-5 py-3 text-sm font-semibold text-secondary-foreground outline-none transition focus:ring-2 focus:ring-ring"
          value={selectedTeam}
          onChange={(e) => setSelectedTeam(e.target.value)}
        >
          <option value="">Select a team</option>
          {teams.map((team) => (
            <option key={team} value={team}>
              {team}
            </option>
          ))}
        </select>

        <button
          disabled={selectedTeam === ""}
          className="w-full rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          onClick={() => {
            if (selectedTeam === "") return;
            router.push(`/team/${encodeURIComponent(selectedTeam)}`);
          }}
        >
          Analyze Path
        </button>

        <button
          className="w-full rounded-full border border-border bg-secondary px-5 py-3 text-sm font-semibold text-secondary-foreground transition hover:bg-card"
          onClick={() => router.push("/rankings")}
        >
          View Full Rankings
        </button>

        <button
          className="w-full px-5 py-2 text-sm font-medium text-muted-foreground underline-offset-4 transition hover:text-primary hover:underline"
          onClick={() => router.push("/methodology")}
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
