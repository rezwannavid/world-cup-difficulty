from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from simulation import (
    run_model,
    initialize_simulation,
    teams,
    PSI,
    RDS,
    win_probabilities,
    baseline_PSI,
    baseline_RDS,
)
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

def ensure_simulation_initialized():
    if not teams:
        return

    if not PSI or len(PSI) < len(teams):
        initialize_simulation()


@lru_cache(maxsize=64)
def cached_team(team_name: str):
    ensure_simulation_initialized()
    return run_model(team_name)

@lru_cache(maxsize=4)
def cached_rankings(sort: str = "psi", order: str = "desc"):
    ensure_simulation_initialized()
    data = []

    for team in teams:
        baseline_psi = baseline_PSI.get(team, 0)
        baseline_rds = baseline_RDS.get(team, 0)
        data.append({
            "team": team,
            "PSI": PSI[team],
            "baseline_PSI": baseline_psi,
            "delta_PSI": PSI[team] - baseline_psi,
            "RDS": RDS[team],
            "baseline_RDS": baseline_rds,
            "delta_RDS": RDS[team] - baseline_rds,
            "win_probability": win_probabilities.get(team, 0),
            "eliminated": win_probabilities.get(team, 0) <= 0,
        })

    reverse = order == "desc"

    if sort == "rds":
        data.sort(key=lambda x: x["RDS"], reverse=reverse)
    else:
        data.sort(key=lambda x: x["PSI"], reverse=reverse)


    return data

@app.on_event("startup")
def startup_event():
    ensure_simulation_initialized()

@app.get("/")
def root():
    return {"message": "TPDA API Running"}

@app.get("/health")
def health():
    return {"status": "ok"}

@app.get("/teams")
def get_teams():
    try:
        return list(teams.keys())
    except Exception as e:
        print("Teams route failed:", e)
        return {"error": "Server warming up"}, 503

@app.get("/team/{team_name}")
def get_team(team_name: str):
    result = cached_team(team_name)
    defeated_by = result.get("defeated_by")
    defeated_teams = result.get("defeated_teams", [])
    elimination_history = result.get("elimination_history", [])

    # Collect ratings for every opponent that appears in the path so the
    # frontend can show opponent strength and color-code difficulty.
    ratings = {}
    for opponents in result["opponents"].values():
        for opponent_team in opponents:
            if opponent_team != result["team"]:
                ratings[opponent_team] = team_rating(opponent_team)

    return {
        "team": result["team"],
        "rating": float(result["rating"]),
        "win_probability": float(result["win_probability"]),
        "PSI": float(result["PSI"]),
        "RDS": float(result["RDS"]),
        "baseline_PSI": float(result.get("baseline_PSI", 0)),
        "baseline_RDS": float(result.get("baseline_RDS", 0)),
        "delta_PSI": float(result.get("delta_PSI", 0)),
        "delta_RDS": float(result.get("delta_RDS", 0)),
        "ratings": ratings,
        "opponents": {
            round_name: {
                opponent_team: float(prob)
                for opponent_team, prob in opponents.items()
            }
            for round_name, opponents in result["opponents"].items()
        },
        "defeated_by": defeated_by,
        "defeated_teams": defeated_teams,
        "elimination_history": elimination_history,
        "eliminated": bool(result.get("eliminated", False)),
    }

@app.get("/rankings")
def rankings(sort: str = "psi", order: str = "desc"):
    sort = sort.lower()
    order = order.lower()

    # Clear stale cache if invalid params change
    if sort not in ["psi", "rds"]:
        sort = "psi"
    if order not in ["asc", "desc"]:
        order = "desc"

    return cached_rankings(sort, order)
