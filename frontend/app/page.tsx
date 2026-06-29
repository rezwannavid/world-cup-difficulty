"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";

export default function Home() {
  const [teams, setTeams] = useState<string[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<string>("");

  const router = useRouter();

  useEffect(() => {
    axios
      .get(`${process.env.NEXT_PUBLIC_API_URL}/teams`)
      .then((res) => setTeams(res.data));
  }, []);

  return (
    <main className="min-h-screen p-10">
      <h1 className="text-4xl font-bold">
        Tournament Path Difficulty Analyzer
      </h1>

      <p className="mt-4 text-gray-600">
        Select a team to analyze PSI, RDS, win probability, and opponent tree.
      </p>

      <div className="mt-8 flex gap-4">
        <select
          className="border p-2 rounded"
          value={selectedTeam}
          onChange={(e) => setSelectedTeam(e.target.value)}
        >
          <option value="">Select Team</option>

          {teams.map((team) => (
            <option key={team}>{team}</option>
          ))}
        </select>

        <button
          disabled={selectedTeam === ""}
          className="bg-black text-white px-4 py-2 rounded"
          onClick={() => {
            if (selectedTeam === "") return;
            router.push(`/team/${encodeURIComponent(selectedTeam)}`);
          }}
        >
          Analyze
        </button>
      </div>

      <div className="mt-8">
        <button
          className="border px-4 py-2 rounded"
          onClick={() => router.push("/rankings")}
        >
          View Full Rankings
        </button>
      </div>
    </main>
  );
}