import math
import random
import pandas as pd
from collections import defaultdict

# ==============================
# CONFIG
# ==============================

SHEET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRRsuUJbrypZjesZoDAgMA9YXcF1E2a5ycV1g-oyHvpVJ836HCCii9p_3zQy_aKpMPLDv9O3HyETwpZ/pub?output=csv"
BRACKET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQxzdNeU3X9j6BudcKXXiFHk6Enojzq0TtPE9YmzHqfPjdk3wFLfjGdtp7G_gMd80xG4B00v9uH90_5/pub?output=csv"
SIMULATION_COUNT = 100000


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

                if i % 2 == 0:
                    sim_bracket[next_round_name][next_match_idx]["team1"] = winner
                    sim_bracket[next_round_name][next_match_idx]["status"] = "pending"
                else:
                    sim_bracket[next_round_name][next_match_idx]["team2"] = winner
                    sim_bracket[next_round_name][next_match_idx]["status"] = "pending"

    champion = sim_bracket["final"][0]["winner"]

    if champion is None:
        raise Exception("Champion is None")

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
            PSI[team] / teams[team]["rank"]
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


def run_model(team_name):
    global bracket, win_probabilities, PSI, RDS

    bracket = load_bracket()
    new_win_probs, new_psi, new_rds = run_simulation()

    win_probabilities.clear()
    win_probabilities.update(new_win_probs)

    PSI.clear()
    PSI.update(new_psi)
    

    RDS.clear()
    RDS.update(new_rds)
    return {
        "team": team_name,
        "rating": teams[team_name]["rank"],
        "win_probability": win_probabilities.get(team_name, 0),
        "PSI": PSI.get(team_name, 0),
        "RDS": RDS.get(team_name, 0),
        "opponents": get_opponent_probabilities(team_name),
        "eliminated": is_eliminated(team_name)
    }