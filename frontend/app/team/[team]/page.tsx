import axios from "axios";

type TeamData = {
  team: string;
  rating: number;
  win_probability: number;
  PSI: number;
  RDS: number;
  opponents: Record<string, Record<string, number>>;
};

type Props = {
  params: Promise<{ team: string }>;
};

export default async function TeamPage({ params }: Props) {
  const { team } = await params;

  const res = await axios.get(
    `${process.env.NEXT_PUBLIC_API_URL}/team/${team}`
  );

  const data: TeamData = res.data;

  return (
    <main className="p-10 max-w-4xl mx-auto">
      <h1 className="text-4xl font-bold">{data.team}</h1>

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-4 mt-8">
        <div className="border rounded p-4">
          <p className="font-bold">FIFA Rating</p>
          <p>{data.rating}</p>
        </div>

        <div className="border rounded p-4">
          <p className="font-bold">Win Probability</p>
          <p>{(data.win_probability * 100).toFixed(2)}%</p>
        </div>

        <div className="border rounded p-4">
          <p className="font-bold">PSI</p>
          <p>{data.PSI.toFixed(2)}</p>
        </div>

        <div className="border rounded p-4">
          <p className="font-bold">RDS</p>
          <p>{data.RDS.toFixed(2)}</p>
        </div>
      </div>

      {/* Opponent probabilities */}
      <div className="mt-10">
        <h2 className="text-2xl font-bold mb-4">Possible Opponents</h2>

        {Object.entries(data.opponents).map(([round, teams]) => (
          <div key={round} className="mb-8">
            <h3 className="text-xl font-semibold mb-3">{round}</h3>

            {Object.entries(teams)
              .sort((a, b) => b[1] - a[1])
              .map(([team, prob]) => (
                <div key={team} className="mb-3">
                  <div className="flex justify-between">
                    <span>{team}</span>
                    <span>{(prob * 100).toFixed(2)}%</span>
                  </div>

                  <div className="w-full bg-gray-200 rounded h-2 mt-1">
                    <div
                      className="bg-black h-2 rounded"
                      style={{ width: `${prob * 100}%` }}
                    />
                  </div>
                </div>
              ))}
          </div>
        ))}
      </div>
    </main>
  );
}