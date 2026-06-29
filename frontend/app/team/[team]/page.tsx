import axios from "axios";
import { TeamView } from "./team-view";

type TeamData = {
  team: string;
  rating: number;
  win_probability: number;
  PSI: number;
  RDS: number;
  opponents: Record<string, Record<string, number>>;
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

  const [teamRes, rankingsRes] = await Promise.all([
    axios.get<TeamData>(`${process.env.NEXT_PUBLIC_API_URL}/team/${team}`),
    axios.get<Ranking[]>(`${process.env.NEXT_PUBLIC_API_URL}/rankings`),
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
