"""Download and compact verified NASA MAST data for the offline TransitLens demo.

Run from repository root after installing backend/requirements.txt. The generated CSVs are
checked in deliberately: the deployed demo reads these bundled observations and never needs
to contact MAST during a judge run.
"""
from __future__ import annotations

import csv
from datetime import UTC, datetime
from pathlib import Path

import lightkurve as lk
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "data"

TARGETS = (
    {"id": "kepler-90-q5", "target": "KIC 11442793", "mission": "Kepler", "index": 4, "file": "kepler-90-q5.csv"},
    {"id": "toi-700-s27", "target": "TIC 261136679", "mission": "TESS", "index": 6, "file": "toi-700-s27.csv"},
)


def export_target(target: dict[str, object]) -> None:
    search = lk.search_lightcurve(str(target["target"]), mission=str(target["mission"]))
    lightcurve = search[int(target["index"])].download(quality_bitmask="default")
    cleaned = lightcurve.remove_nans().remove_outliers(sigma=8).normalize().bin(time_bin_size=20 / (24 * 60))
    output_path = DATA_DIR / str(target["file"])
    with output_path.open("w", newline="", encoding="utf-8") as csv_file:
        writer = csv.DictWriter(csv_file, fieldnames=["time_bjd", "normalized_flux", "flux_error"])
        writer.writeheader()
        for time, flux, error in zip(cleaned.time.value, cleaned.flux.value, cleaned.flux_err.value, strict=True):
            if np.isfinite(time) and np.isfinite(flux):
                writer.writerow({"time_bjd": f"{time:.8f}", "normalized_flux": f"{flux:.9f}", "flux_error": f"{error:.9f}" if np.isfinite(error) else ""})
    print(f"{target['id']}: wrote {len(cleaned)} cadences to {output_path}")
    print(f"Retrieved {datetime.now(UTC).isoformat()} from NASA MAST through Lightkurve")


if __name__ == "__main__":
    DATA_DIR.mkdir(exist_ok=True)
    for selected in TARGETS:
        export_target(selected)
