import importlib.util
from pathlib import Path
import unittest


class MainInitializationTests(unittest.TestCase):
    def test_ensure_simulation_initialized_populates_rankings_state(self):
        module_path = Path(__file__).resolve().parents[1] / "main.py"
        spec = importlib.util.spec_from_file_location("main_under_test", module_path)
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)

        module.PSI = {}
        module.RDS = {}
        module.win_probabilities = {}
        module.teams = {"Argentina": {"rank": 1.0}}

        def fake_run_model(team_name):
            module.PSI[team_name] = 0.5
            module.RDS[team_name] = 0.25
            module.win_probabilities[team_name] = 0.1
            return {"team": team_name}

        module.run_model = fake_run_model

        module.ensure_simulation_initialized()

        self.assertEqual(module.PSI["Argentina"], 0.5)
        self.assertEqual(module.RDS["Argentina"], 0.25)
        self.assertEqual(module.win_probabilities["Argentina"], 0.1)


if __name__ == "__main__":
    unittest.main()
