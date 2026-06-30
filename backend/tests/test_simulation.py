import importlib.util
import sys
import unittest
from pathlib import Path
from unittest.mock import patch

import pandas as pd


class SimulationBracketPropagationTests(unittest.TestCase):
    def test_simulate_once_preserves_already_decided_later_round_matches(self):
        module_path = Path(__file__).resolve().parents[1] / "simulation.py"
        spec = importlib.util.spec_from_file_location("simulation_under_test", module_path)
        module = importlib.util.module_from_spec(spec)

        def fake_read_csv(*args, **kwargs):
            return pd.DataFrame(
                {
                    "Team": ["Alpha", "Beta", "Gamma", "Delta"],
                    "Elo Ratings": [1200.0, 1100.0, 1000.0, 900.0],
                }
            )

        with patch("pandas.read_csv", side_effect=fake_read_csv):
            spec.loader.exec_module(module)

        module.teams = {
            "Alpha": {"name": "Alpha", "rank": 1200.0},
            "Beta": {"name": "Beta", "rank": 1100.0},
            "Gamma": {"name": "Gamma", "rank": 1000.0},
            "Delta": {"name": "Delta", "rank": 900.0},
        }
        module.bracket = {
            "r32": [
                {"team1": "Alpha", "team2": "Beta", "winner": None, "status": "pending"},
                {"team1": "Gamma", "team2": "Delta", "winner": None, "status": "pending"},
            ],
            "r16": [
                {"team1": None, "team2": None, "winner": None, "status": "pending"},
            ],
            "qf": [{"team1": None, "team2": None, "winner": None, "status": "pending"}],
            "sf": [{"team1": None, "team2": None, "winner": None, "status": "pending"}],
            "final": [{"team1": "Gamma", "team2": "Delta", "winner": "Gamma", "status": "done"}],
        }

        champion, _, _ = module.simulate_once()

        self.assertEqual(champion, "Gamma")
        self.assertEqual(module._last_sim_bracket["final"][0]["winner"], "Gamma")


if __name__ == "__main__":
    unittest.main()
