from __future__ import annotations

import os
from datetime import UTC, datetime
from time import perf_counter
from typing import Any

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from .analysis import run_bls
from .catalog import DATA_DIR, find_observation, observation_manifest

app = FastAPI(title="TransitLens Analysis API", version="1.0.0")
frontend_origins = os.getenv("FRONTEND_ORIGINS", "*")
origins = [item.strip() for item in frontend_origins.split(",") if item.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if origins else ["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


class AnalysisRequest(BaseModel):
    dataset_id: str = Field(min_length=1)
    min_period_days: float = Field(default=0.5, gt=0)
    max_period_days: float = Field(default=30.0, gt=0)


@app.get("/health")
@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok", "engine": "Lightkurve Box Least Squares"}


@app.get("/api/v1/observations")
def observations() -> dict[str, list[dict[str, Any]]]:
    return {"observations": observation_manifest()}


@app.post("/api/v1/analyze")
def analyze(request: AnalysisRequest) -> dict[str, Any]:
    record = find_observation(request.dataset_id)
    if record is None:
        raise HTTPException(status_code=404, detail="Bundled observation was not found.")

    started = perf_counter()
    try:
        output = run_bls(
            DATA_DIR / record["file"],
            min_period_days=request.min_period_days,
            max_period_days=request.max_period_days,
        )
    except (OSError, ValueError) as error:
        raise HTTPException(status_code=422, detail=f"Analysis could not process this observation: {error}") from error

    elapsed_ms = round((perf_counter() - started) * 1000)
    record = {**record, "star": {**record["star"], "numPoints": output["summary"]["totalPoints"]}}
    candidate = output["candidate"]
    result = {
        "id": f"bls-{record['id'].lower()}",
        "observationId": record["star"]["id"],
        "star": record["star"],
        "status": "completed",
        "algorithm": "BLS",
        "parameters": {
            "algorithm": "BLS",
            "minPeriodDays": request.min_period_days,
            "maxPeriodDays": request.max_period_days,
            "periodSteps": 2500,
            "durationMinHours": 1.2,
            "durationMaxHours": 12,
            "snrThreshold": 7.1,
        },
        "startedAt": datetime.now(UTC).isoformat(),
        "completedAt": datetime.now(UTC).isoformat(),
        "executionTimeMs": elapsed_ms,
        "lightCurveSummary": output["summary"],
        "transitEvents": [candidate],
        "bestCandidate": candidate,
        "detectedIntervals": output["detectedIntervals"],
        "notes": "A BLS periodic dip is a candidate signal. Catalogue confirmation is separate and requires follow-up validation.",
    }
    return {"dataset": record, "lightCurve": output["points"], "result": result}
