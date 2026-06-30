import axios from "axios";
import { TeamView } from "./team-view";

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
  opponents: Record<string, Record<string, number>>;
  defeated_by?: string | null;
  defeated_teams?: string[];
  elimination_history?: {
    round: string;
    opponent: string;
    match_index: number;
  }[];
};

type Ranking = {
  team: string;
  PSI: number;
  RDS: number;
  win_probability: number;
};

type Props = {
  params: Promise<{ team: string }>;
};

export default async function TeamPage({ params }: Props) {
  const { team } = await params;
  const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL?.trim() || "http://127.0.0.1:8000";

  console.log("API_BASE_URL:", API_BASE_URL);

  const [teamRes, rankingsRes] = await Promise.all([
    axios.get<TeamData>(`${API_BASE_URL}/team/${team}`),
    axios.get<Ranking[]>(`${API_BASE_URL}/rankings`),
  ]);

  const data = teamRes.data;
  const rankings = rankingsRes.data;

  const total = rankings.length;

  // PDI (PSI) rank: higher PSI = harder path = rank 1
  const psiSorted = [...rankings].sort((a, b) => b.PSI - a.PSI);
  const pdiRank = psiSorted.findIndex((r) => r.team === data.team) + 1;

  // RDS rank: higher RDS = harder relative path = rank 1
  const rdsSorted = [...rankings].sort((a, b) => b.RDS - a.RDS);
  const rdsRank = rdsSorted.findIndex((r) => r.team === data.team) + 1;

  return (
    <TeamView
      data={data}
      pdiRank={pdiRank || total}
      rdsRank={rdsRank || total}
      total={total}
    />
  );
}
