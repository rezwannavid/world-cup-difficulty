const teamToCode: Record<string, string> = {
  France: "fr",
  England: "eng",
  Australia: "au",
  Switzerland: "ch",
  Belgium: "be",
  Bosnia: "ba",
  Brazil: "br",
  Argentina: "ar",
  Germany: "de",
  Spain: "es",
  Portugal: "pt",
  Netherlands: "nl",
  Italy: "it",
  Croatia: "hr",
  Japan: "jp",
  Mexico: "mx",
  USA: "us",
  "United States": "us",
  Canada: "ca",
  Morocco: "ma",
  Senegal: "sn",
  Denmark: "dk",
  Uruguay: "uy",
  Poland: "pl",
  Serbia: "rs",
  Tunisia: "tn",
  Cameroon: "cm",
  Ghana: "gh",
  Ecuador: "ec",
  Iran: "ir",
  "South Korea": "kr",
  "Korea Republic": "kr",
  Wales: "gb",
  Scotland: "gb",
  "Saudi Arabia": "sa",
  Qatar: "qa",
  "Costa Rica": "cr",
  Colombia: "co",
  "South Africa": "za",
  Egypt: "eg",
  Norway: "no",
  Algeria: "dz",
  "Ivory Coast": "ci",
  "Côte d'Ivoire": "ci",
  "DR Congo": "cd",
  "Democratic Republic of the Congo": "cd",
  Sweden: "se",
  Austria: "at",
  "Cape Verde": "cv",
  "Cabo Verde": "cv",
  Paraguay: "py",
};

export function getFlagUrl(team: string) {
  const normalized = team.trim();
  const code = teamToCode[normalized];
  if (!code) return null;

  // Special case for England (St George's Cross)
  if (code === "eng") {
    return "https://flagcdn.com/w40/gb-eng.png";
  }

  return `https://flagcdn.com/w40/${code}.png`;
}