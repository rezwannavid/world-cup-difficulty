import copy
import math
import random
import time
import pandas as pd
from collections import defaultdict

# ==============================
# CONFIG
# ==============================

SHEET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRRsuUJbrypZjesZoDAgMA9YXcF1E2a5ycV1g-oyHvpVJ836HCCii9p_3zQy_aKpMPLDv9O3HyETwpZ/pub?output=csv"
BRACKET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQxzdNeU3X9j6BudcKXXiFHk6Enojzq0TtPE9YmzHqfPjdk3wFLfjGdtp7G_gMd80xG4B00v9uH90_5/pub?output=csv"
SIMULATION_COUNT = 10000


# ==============================
# LOAD TEAMS
# ==============================

def load_teams():
    df = pd.read_csv(SHEET_URL)

    return {
        row["Team"]: {
            "name": row["Team"],
            "rank": float(row["Elo Ratings"])
        }
        for _, row in df.iterrows()
    }


teams = load_teams()



# ==============================
# BRACKET
# status:
# done = already played
# pending = to be simulated
# future = waiting on earlier matches
# ==============================

def load_bracket():
    df = pd.read_csv(BRACKET_URL)

    bracket = {
        "r32": [],
        "r16": [],
        "qf": [],
        "sf": [],
        "final": []
    }

    for _, row in df.iterrows():
        round_name = str(row["round"]).strip().lower()

        for col in ["team1", "team2", "winner"]:
            if not pd.isna(row[col]):
                team_name = str(row[col]).strip()

                if team_name not in teams:
                    raise Exception(
                        f"Invalid team name in bracket sheet: {team_name}"
                    )

        if round_name not in bracket:
            continue

        bracket[round_name].append({
            "team1": None if pd.isna(row["team1"]) else str(row["team1"]).strip(),
            "team2": None if pd.isna(row["team2"]) else str(row["team2"]).strip(),
            "winner": None if pd.isna(row["winner"]) else str(row["winner"]).strip(),
            "status": str(row["status"]).strip().lower()
        })

    return bracket


bracket = None


# ==============================
# WIN PROBABILITY MODEL
# ==============================

def win_prob(points_a, points_b, temperature=350):
    return 1 / (1 + math.exp(-(points_a - points_b) / temperature))


# ==============================
# ELIMINATION CHECK
# ==============================

def is_eliminated(team_name):
    for round_matches in bracket.values():
        for match in round_matches:
            if match["status"] == "done":
                if team_name in [match["team1"], match["team2"]]:
                    if match["winner"] != team_name:
                        return True
    return False

def get_completed_results():
    defeated_by = {}
    defeated_teams = defaultdict(list)
    elimination_history = defaultdict(list)

    for round_name, round_matches in bracket.items():
        for i, match in enumerate(round_matches):
            if match["status"] != "done":
                continue

            winner = match["winner"]
            loser = (
                match["team2"]
                if winner == match["team1"]
                else match["team1"]
            )

            defeated_by[loser] = winner
            defeated_teams[winner].append(loser)
            elimination_history[loser].append({
                "round": round_name,
                "opponent": winner,
                "match_index": i
            })

    return defeated_by, defeated_teams, elimination_history


def get_baseline_bracket(current_bracket):
    baseline = copy.deepcopy(current_bracket)

    for round_name, round_matches in baseline.items():
        for match in round_matches:
            if match["status"] == "done":
                match["status"] = "pending"
            match["winner"] = None
            if round_name != "r32":
                match["team1"] = None
                match["team2"] = None

    return baseline


def run_simulation_with_bracket(bracket_override):
    global bracket
    original_bracket = bracket
    bracket = bracket_override

    try:
        return run_simulation()
    finally:
        bracket = original_bracket


def initialize_simulation():
    global bracket, win_probabilities, PSI, RDS, baseline_win_probabilities, baseline_PSI, baseline_RDS

    bracket = load_bracket()
    new_win_probs, new_psi, new_rds = run_simulation()

    baseline_bracket = get_baseline_bracket(bracket)
    baseline_win_probs, baseline_psi, baseline_rds = run_simulation_with_bracket(
        baseline_bracket
    )

    win_probabilities.clear()
    win_probabilities.update(new_win_probs)

    PSI.clear()
    PSI.update(new_psi)

    RDS.clear()
    RDS.update(new_rds)

    baseline_win_probabilities.clear()
    baseline_win_probabilities.update(baseline_win_probs)

    baseline_PSI.clear()
    baseline_PSI.update(baseline_psi)

    baseline_RDS.clear()
    baseline_RDS.update(baseline_rds)


# ==============================
# RESOLVE MATCH
# ==============================

def resolve_match(match):
    if match["status"] == "done":
        return match["winner"]

    if match["team1"] not in teams:
        raise Exception(f"Missing team: {match['team1']}")

    if match["team2"] not in teams:
        raise Exception(f"Missing team: {match['team2']}")

    teamA = teams[match["team1"]]
    teamB = teams[match["team2"]]

    p = win_prob(teamA["rank"], teamB["rank"])

    return teamA["name"] if random.random() < p else teamB["name"]


# ==============================
# COMPLETED MATCHES → PSI
# ==============================

def seed_completed_matches(psi_tracker, match_counter):
    for round_matches in bracket.values():
        for match in round_matches:
            if match["status"] == "done":
                t1 = teams[match["team1"]]
                t2 = teams[match["team2"]]

                psi_tracker[t1["name"]] += t2["rank"]
                psi_tracker[t2["name"]] += t1["rank"]

                match_counter[t1["name"]] += 1
                match_counter[t2["name"]] += 1


# ==============================
# SINGLE TOURNAMENT
# ==============================

def simulate_once():
    global _last_sim_bracket

    sim_bracket = {
        round_name: [match.copy() for match in matches]
        for round_name, matches in bracket.items()
    }

    psi_tracker = defaultdict(float)
    match_counter = defaultdict(int)

    seed_completed_matches(psi_tracker, match_counter)

    round_order = ["r32", "r16", "qf", "sf", "final"]

    for r_idx, round_name in enumerate(round_order):
        current_round = sim_bracket[round_name]

        for i, match in enumerate(current_round):

            if match["team1"] is None or match["team2"] is None:
                continue

            winner = resolve_match(match)

            t1 = teams[match["team1"]]
            t2 = teams[match["team2"]]

            if match["status"] != "done":
                psi_tracker[t1["name"]] += t2["rank"]
                psi_tracker[t2["name"]] += t1["rank"]

                match_counter[t1["name"]] += 1
                match_counter[t2["name"]] += 1

            match["winner"] = winner

            if round_name != "final":
                next_round_name = round_order[r_idx + 1]
                next_match_idx = i // 2
                next_match = sim_bracket[next_round_name][next_match_idx]

                if next_match["status"] == "done":
                    continue

                if i % 2 == 0:
                    if next_match["team1"] is None:
                        next_match["team1"] = winner
                    next_match["status"] = "pending"
                else:
                    if next_match["team2"] is None:
                        next_match["team2"] = winner
                    next_match["status"] = "pending"

    champion = sim_bracket["final"][0]["winner"]

    if champion is None:
        raise Exception("Champion is None")

    _last_sim_bracket = sim_bracket

    return champion, psi_tracker, match_counter


# ==============================
# MONTE CARLO
# ==============================

def run_simulation():
    if len(bracket["r32"]) == 0:
        raise Exception("Bracket r32 is empty")

    win_counts = defaultdict(int)
    psi_total = {team: 0.0 for team in teams}
    match_totals = {team: 0 for team in teams}

    for _ in range(SIMULATION_COUNT):
        winner, psi_tracker, match_counter = simulate_once()

        win_counts[winner] += 1

        for team in psi_tracker:
            psi_total[team] += psi_tracker[team]
            match_totals[team] += match_counter[team]

    win_probabilities = {
        team: win_counts[team] / SIMULATION_COUNT
        for team in teams
    }

    PSI = {
        team: (
            psi_total[team] / match_totals[team]
            if match_totals[team] > 0 else 0
        )
        for team in teams
    }

    RDS = {
        team: (
            (PSI[team] / teams[team]["rank"]) * 100
            if teams[team]["rank"] > 0 else 0
        )
        for team in teams
    }

    return win_probabilities, PSI, RDS


# ==============================
# SUBTREE PROBABILITIES
# ==============================

def round_survival_probability(round_name, match_idx):
    match = bracket[round_name][match_idx]

    if match["status"] == "done":
        loser = (
            match["team1"]
            if match["winner"] == match["team2"]
            else match["team2"]
        )
        return {
            match["winner"]: 1.0,
            loser: 0.0
        }

    if round_name == "r32":
        t1 = match["team1"]
        t2 = match["team2"]

        p1 = win_prob(teams[t1]["rank"], teams[t2]["rank"])

        return {
            t1: p1,
            t2: 1 - p1
        }

    previous_round_map = {
        "r16": "r32",
        "qf": "r16",
        "sf": "qf",
        "final": "sf"
    }

    prev_round = previous_round_map[round_name]

    left_probs = round_survival_probability(prev_round, match_idx * 2)
    right_probs = round_survival_probability(prev_round, match_idx * 2 + 1)

    winners = {}

    for lt, lp in left_probs.items():
        for rt, rp in right_probs.items():
            p_left = win_prob(teams[lt]["rank"], teams[rt]["rank"])

            winners[lt] = winners.get(lt, 0) + (lp * rp * p_left)
            winners[rt] = winners.get(rt, 0) + (lp * rp * (1 - p_left))

    return winners


# ==============================
# OPPONENT TREE
# ==============================

def get_opponent_probabilities(team_name):
    if is_eliminated(team_name):
        return {}

    round_labels = {
        "r32": "Round of 32",
        "r16": "Round of 16",
        "qf": "Quarterfinal",
        "sf": "Semifinal",
        "final": "Final"
    }

    round_order = ["r32", "r16", "qf", "sf", "final"]

    results = {}

    current_round = "r32"
    current_match_idx = None

    # Find starting match
    for idx, match in enumerate(bracket["r32"]):
        if team_name in [match["team1"], match["team2"]]:
            current_match_idx = idx

            opponent = (
                match["team2"]
                if match["team1"] == team_name
                else match["team1"]
            )

            # Preserve both sides of the completed/opening match so the UI can
            # distinguish historical defeats from future confirmed opponents.
            match = bracket["r32"][idx]

            if match["status"] == "done":
                results["Round of 32"] = {
                    opponent: 0.0,
                    team_name: 1.0
                }
            else:
                results["Round of 32"] = {
                    opponent: 1.0
                }
            break

    if current_match_idx is None:
        return {}

    # Move upward through bracket
    for round_idx in range(1, len(round_order)):
        current_round = round_order[round_idx]
        previous_round = round_order[round_idx - 1]

        # Find sibling branch only
        sibling_idx = (
            current_match_idx - 1
            if current_match_idx % 2 == 1
            else current_match_idx + 1
        )

        opponent_probs = round_survival_probability(
            previous_round,
            sibling_idx
        )

        total_prob = sum(opponent_probs.values())

        if total_prob > 0:
            opponent_probs = {
                team: prob / total_prob
                for team, prob in opponent_probs.items()
            }

        results[round_labels[current_round]] = opponent_probs

        # Advance to next round
        current_match_idx = current_match_idx // 2

    return results


# ==============================
# PUBLIC EXPORTS (KEEP SAME)
# ==============================

win_probabilities = {}
PSI = {}
RDS = {}
baseline_win_probabilities = {}
baseline_PSI = {}
baseline_RDS = {}
LAST_REFRESH = 0
REFRESH_INTERVAL = 300


def maybe_refresh():
    global LAST_REFRESH

    now = time.time()

    if now - LAST_REFRESH >= REFRESH_INTERVAL:
        initialize_simulation()
        LAST_REFRESH = now


def get_team_data(team_name):
    defeated_by, defeated_teams, elimination_history = get_completed_results()

    defeated_teams = {
        team: list(opponents)
        for team, opponents in defeated_teams.items()
    }

    elimination_history = {
        team: list(events)
        for team, events in elimination_history.items()
    }

    baseline_psi = baseline_PSI.get(team_name, 0)
    baseline_rds = baseline_RDS.get(team_name, 0)

    return {
        "team": team_name,
        "rating": teams[team_name]["rank"],
        "win_probability": win_probabilities.get(team_name, 0),
        "PSI": PSI.get(team_name, 0),
        "RDS": RDS.get(team_name, 0),
        "baseline_PSI": baseline_psi,
        "baseline_RDS": baseline_rds,
        "delta_PSI": PSI.get(team_name, 0) - baseline_psi,
        "delta_RDS": RDS.get(team_name, 0) - baseline_rds,
        "opponents": get_opponent_probabilities(team_name),
        "eliminated": is_eliminated(team_name),
        "defeated_by": defeated_by.get(team_name),
        "defeated_teams": defeated_teams.get(team_name, []),
        "elimination_history": elimination_history.get(team_name, [])
    }


def run_model(team_name):
    maybe_refresh()
    return get_team_data(team_name)


if __name__ == "__main__":
    # Temporary debug entrypoint
    run_model("Morocco")