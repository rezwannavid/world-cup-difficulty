from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from simulation import run_model, teams, PSI, RDS, win_probabilities
from functools import lru_cache


def team_rating(name: str) -> float:
    try:
        return float(teams[name]["rank"])
    except (KeyError, TypeError, ValueError):
        return 0.0


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://world-cup-difficulty.vercel.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@lru_cache(maxsize=64)
def cached_team(team_name: str):
    return run_model(team_name)

@lru_cache(maxsize=1)
def cached_rankings(sort: str = "psi"):
    data = []

    for team in teams:
        data.append({
            "team": team,
            "PSI": PSI[team],
            "RDS": RDS[team],
            "win_probability": win_probabilities.get(team, 0)
        })

    if sort == "rds":
        data.sort(key=lambda x: x["RDS"], reverse=True)
    else:
        data.sort(key=lambda x: x["PSI"], reverse=True)

    return data

@app.get("/")
def root():
    return {"message": "TPDA API Running"}

@app.get("/teams")
def get_teams():
    return list(teams.keys())

@app.get("/team/{team_name}")
def get_team(team_name: str):
    result = cached_team(team_name)

    # Collect ratings for every opponent that appears in the path so the
    # frontend can show opponent strength and color-code difficulty.
    ratings = {}
    for opponents in result["opponents"].values():
        for opponent_team in opponents:
            ratings[opponent_team] = team_rating(opponent_team)

    return {
        "team": result["team"],
        "rating": float(result["rating"]),
        "win_probability": float(result["win_probability"]),
        "PSI": float(result["PSI"]),
        "RDS": float(result["RDS"]),
        "ratings": ratings,
        "opponents": {
            round_name: {
                opponent_team: float(prob)
                for opponent_team, prob in opponents.items()
            }
            for round_name, opponents in result["opponents"].items()
        }
    }

@app.get("/rankings")
def rankings(sort: str = "psi"):
    return cached_rankings(sort)
