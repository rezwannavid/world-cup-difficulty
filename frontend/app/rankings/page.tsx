import axios from "axios";

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

  const metric = sort || "psi";

  const res = await axios.get(
    `${process.env.NEXT_PUBLIC_API_URL}/rankings?sort=${metric}`
  );

  const data: Ranking[] = res.data;

  return (
    <main className="p-10 max-w-5xl mx-auto">
      <h1 className="text-4xl font-bold mb-6">Rankings</h1>

      {/* Toggle */}
      <div className="flex gap-4 mb-8">
        <a href="/rankings?sort=psi" className="border px-4 py-2 rounded">
          Sort by PSI
        </a>

        <a href="/rankings?sort=rds" className="border px-4 py-2 rounded">
          Sort by RDS
        </a>
      </div>

      {/* Table */}
      <div className="space-y-3">
        {data.map((team, index) => (
          <div
            key={team.team}
            className="border rounded p-4 flex justify-between"
          >
            <div>
              <p className="font-bold">
                #{index + 1} {team.team}
              </p>
            </div>

            <div className="flex gap-6">
              <p>PSI: {team.PSI.toFixed(2)}</p>
              <p>RDS: {team.RDS.toFixed(2)}</p>
              <p>Win: {(team.win_probability * 100).toFixed(2)}%</p>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}