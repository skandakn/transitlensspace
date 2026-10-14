from __future__ import annotations

import json
from pathlib import Path
from typing import Any

DATA_DIR = Path(__file__).resolve().parents[1] / "data"
MANIFEST_PATH = DATA_DIR / "observations.json"


def observation_manifest() -> list[dict[str, Any]]:
    """Return bundled observations without their photometry arrays."""
    with MANIFEST_PATH.open(encoding="utf-8") as manifest_file:
        return json.load(manifest_file)["observations"]


def find_observation(dataset_id: str) -> dict[str, Any] | None:
    return next((item for item in observation_manifest() if item["id"] == dataset_id), None)
