import unittest
from pathlib import Path

from backend.app.analysis import load_photometry, run_bls
from backend.app.catalog import find_observation, observation_manifest


class BundledObservationTests(unittest.TestCase):
    def test_manifest_preserves_existing_universe_ids(self) -> None:
        ids = {record["star"]["id"] for record in observation_manifest()}
        self.assertEqual(ids, {"TIC-261136679", "KIC-11442793"})

    def test_bundled_observations_have_measured_cadences(self) -> None:
        for record in observation_manifest():
            path = Path(__file__).resolve().parents[1] / "data" / record["file"]
            time, flux, flux_error = load_photometry(path)
            self.assertGreater(len(time), 1000)
            self.assertEqual(len(time), len(flux))
            self.assertEqual(len(time), len(flux_error))

    def test_bls_returns_candidate_language_for_periodic_dips(self) -> None:
        path = Path(__file__).resolve().parent / "_periodic_fixture.csv"
        try:
            with path.open("w", encoding="utf-8") as output:
                output.write("time_bjd,normalized_flux,flux_error\n")
                for index in range(600):
                    time = index * 0.02
                    phase = (time - 0.3) % 2.5
                    flux = 0.99 if phase < 0.1 else 1.0
                    output.write(f"{time:.5f},{flux:.6f},0.0005\n")
            result = run_bls(path, min_period_days=1, max_period_days=4)
        finally:
            path.unlink(missing_ok=True)
        self.assertEqual(result["candidate"]["disposition"], "CANDIDATE")
        self.assertAlmostEqual(result["candidate"]["period"], 2.5, delta=0.1)
        self.assertGreater(len(result["detectedIntervals"]), 2)

    def test_dataset_ids_are_explicit(self) -> None:
        self.assertEqual(find_observation("toi-700-s27")["star"]["id"], "TIC-261136679")
        self.assertIsNone(find_observation("does-not-exist"))
