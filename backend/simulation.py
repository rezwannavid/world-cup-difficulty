import math
import random
import pandas as pd
from collections import defaultdict

# ==============================
# GOOGLE SHEET CSV URL
# Replace with your actual public CSV URL
# ==============================

SHEET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRRsuUJbrypZjesZoDAgMA9YXcF1E2a5ycV1g-oyHvpVJ836HCCii9p_3zQy_aKpMPLDv9O3HyETwpZ/pub?output=csv"

# ==============================
# LOAD TEAMS FROM GOOGLE SHEETS
# ==============================

def load_teams():
    df = pd.read_csv(SHEET_URL)

    return {
        row["Team"]: {
            "name": row["Team"],
            "rank": row["Fifa Ranking"]
        }
        for _, row in df.iterrows()
    }

teams = load_teams()

# ==============================
# BRACKET STRUCTURE
# Keep this exactly as your Colab
# ==============================

initial_teams_for_tournament = [
    'Germany', 'Paraguay',
    'France', 'Sweden',
    'South Africa', 'Canada',
    'Netherlands', 'Morocco',

    'Portugal', 'Croatia',
    'Spain', 'Austria',
    'USA', 'Bosnia',
    'Belgium', 'Senegal',

    'Brazil', 'Japan',
    'Ivory Coast', 'Norway',
    'Mexico', 'Ecuador',
    'England', 'DR Congo',

    'Argentina', 'Cabo Verde',
    'Australia', 'Egypt',
    'Switzerland', 'Algeria',
    'Colombia', 'Ghana'
]

# ==============================
# WIN PROBABILITY MODEL
# ==============================

def win_prob(points_a, points_b, temperature=350):
    return 1 / (1 + math.exp(-(points_a - points_b) / temperature))

# ==============================
# SINGLE TOURNAMENT SIMULATION
# ==============================

def simulate_once():
    current_round = initial_teams_for_tournament.copy()

    psi_tracker = defaultdict(float)
    match_counter = defaultdict(int)

    while len(current_round) > 1:
        next_round = []

        for i in range(0, len(current_round), 2):
            teamA = teams[current_round[i]]
            teamB = teams[current_round[i + 1]]

            rating_a = teamA["rank"]
            rating_b = teamB["rank"]

            p = win_prob(rating_a, rating_b)

            psi_tracker[teamA["name"]] += rating_b
            psi_tracker[teamB["name"]] += rating_a

            match_counter[teamA["name"]] += 1
            match_counter[teamB["name"]] += 1

            winner = teamA if random.random() < p else teamB
            next_round.append(winner["name"])

        current_round = next_round

    return current_round[0], psi_tracker, match_counter

# ==============================
# MONTE CARLO ENGINE
# ==============================

N = 100000

def run_simulation():
    win_counts = defaultdict(int)
    psi_total = defaultdict(float)
    match_totals = defaultdict(int)

    for _ in range(N):
        winner, psi_tracker, match_counter = simulate_once()

        win_counts[winner] += 1

        for team in psi_tracker:
            psi_total[team] += psi_tracker[team]
            match_totals[team] += match_counter[team]

    win_probabilities = {
        team: count / N
        for team, count in win_counts.items()
    }

    PSI = {
        team: psi_total[team] / match_totals[team]
        for team in psi_total
        if match_totals[team] > 0
    }

    RDS = {
        team: PSI[team] / teams[team]["rank"]
        for team in PSI
    }

    return win_probabilities, PSI, RDS

# Run once at startup (cache)
win_probabilities, PSI, RDS = run_simulation()

# ==============================
# OPPONENT TREE PROBABILITIES
# ==============================

def subtree_survival_probability(subtree):
    if len(subtree) == 1:
        return {subtree[0]: 1.0}

    mid = len(subtree) // 2

    left = subtree[:mid]
    right = subtree[mid:]

    left_probs = subtree_survival_probability(left)
    right_probs = subtree_survival_probability(right)

    winners = {}

    for l_team, l_prob in left_probs.items():
        for r_team, r_prob in right_probs.items():

            l_rating = teams[l_team]["rank"]
            r_rating = teams[r_team]["rank"]

            p_l = win_prob(l_rating, r_rating)
            p_r = 1 - p_l

            winners[l_team] = winners.get(l_team, 0) + l_prob * r_prob * p_l
            winners[r_team] = winners.get(r_team, 0) + l_prob * r_prob * p_r

    return winners

# ==============================
# TEAM OPPONENT PROBABILITIES
# ==============================

def get_opponent_probabilities(team_name):
    bracket = initial_teams_for_tournament.copy()
    results = {}

    current_size = 2
    round_names = [
        "Round of 32",
        "Round of 16",
        "Quarterfinal",
        "Semifinal",
        "Final"
    ]

    for round_name in round_names:
        idx = bracket.index(team_name)

        block_start = (idx // current_size) * current_size
        block = bracket[block_start:block_start + current_size]

        if current_size == 2:
            opponent = block[1] if block[0] == team_name else block[0]
            results[round_name] = {opponent: 1.0}
        else:
            half = current_size // 2

            if idx < block_start + half:
                opponent_subtree = block[half:]
            else:
                opponent_subtree = block[:half]

            results[round_name] = subtree_survival_probability(opponent_subtree)

        current_size *= 2

    return results

# ==============================
# FRONTEND RESPONSE MODEL
# ==============================

def run_model(team_name):
    return {
        "team": team_name,
        "rating": teams[team_name]["rank"],
        "win_probability": win_probabilities.get(team_name, 0),
        "PSI": PSI.get(team_name, 0),
        "RDS": RDS.get(team_name, 0),
        "opponents": get_opponent_probabilities(team_name)
    }