from __future__ import annotations

import csv
from pathlib import Path
from typing import Any

import lightkurve as lk
import numpy as np


def load_photometry(path: Path) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    """Read the repository's compact, pre-normalized Lightkurve export."""
    rows: list[tuple[float, float, float]] = []
    with path.open(newline="", encoding="utf-8") as csv_file:
        for row in csv.DictReader(csv_file):
            try:
                time = float(row["time_bjd"])
                flux = float(row["normalized_flux"])
                error = float(row.get("flux_error", "nan"))
            except (KeyError, TypeError, ValueError):
                continue
            if np.isfinite(time) and np.isfinite(flux) and flux > 0:
                rows.append((time, flux, error))
    if len(rows) < 50:
        raise ValueError("Bundled observation contains fewer than 50 valid cadences.")
    array = np.asarray(rows, dtype=float)
    flux_error = array[:, 2]
    fallback_error = float(np.nanmedian(np.abs(array[:, 1] - np.nanmedian(array[:, 1])))) or 1e-4
    flux_error[~np.isfinite(flux_error) | (flux_error <= 0)] = fallback_error
    return array[:, 0], array[:, 1], flux_error


def run_bls(path: Path, *, min_period_days: float = 0.5, max_period_days: float = 30.0) -> dict[str, Any]:
    """Run Lightkurve's BLS implementation on a bundled NASA observation.

    This produces a periodic-dip candidate only. It never validates or confirms a planet.
    """
    time, flux, flux_error = load_photometry(path)
    baseline = float(time.max() - time.min())
    upper_period = min(max_period_days, baseline / 2)
    if upper_period <= min_period_days:
        raise ValueError("Observation baseline is too short for the configured BLS period range.")

    curve = lk.LightCurve(time=time, flux=flux, flux_err=flux_error).remove_nans()
    periods = np.linspace(min_period_days, upper_period, 2500)
    # Astropy requires every trial duration to remain below every trial period.
    durations = np.linspace(0.02, min(0.3, min_period_days * 0.8), 12)
    periodogram = curve.to_periodogram(method="bls", period=periods, duration=durations)

    period = float(periodogram.period_at_max_power.value)
    epoch = float(periodogram.transit_time_at_max_power.value)
    duration_days = float(periodogram.duration_at_max_power.value)
    depth_fraction = abs(float(periodogram.depth_at_max_power.value))
    mask = periodogram.get_transit_mask(period=periodogram.period_at_max_power, transit_time=periodogram.transit_time_at_max_power, duration=periodogram.duration_at_max_power)
    in_transit = flux[mask]
    out_of_transit = flux[~mask]
    scatter = float(np.nanstd(out_of_transit))
    snr = depth_fraction / max(scatter / max(np.sqrt(max(len(in_transit), 1)), 1), 1e-8)

    intervals: list[dict[str, float]] = []
    first_epoch = epoch
    while first_epoch - period >= time.min():
        first_epoch -= period
    center = first_epoch
    half_duration = duration_days / 2
    while center <= time.max():
        if center >= time.min() - half_duration:
            intervals.append({
                "startTime": round(center - half_duration, 8),
                "endTime": round(center + half_duration, 8),
                "centerTime": round(center, 8),
                "depthPpm": round(depth_fraction * 1_000_000, 1),
            "snr": round(float(snr), 2),
            })
        center += period

    return {
        "candidate": {
            "id": "bls-periodic-dip",
            "name": "BLS periodic-dip candidate",
            "epoch": epoch,
            "period": period,
            "durationHours": duration_days * 24,
            "depthPpm": depth_fraction * 1_000_000,
            "depthFraction": depth_fraction,
            "snr": float(snr),
            "disposition": "CANDIDATE",
        },
        "detectedIntervals": intervals,
        "summary": {
            "totalPoints": int(len(time)),
            "durationDays": baseline,
            "baselineFlux": float(np.nanmedian(flux)),
            "rmsNoise": scatter,
            "cadenceMinutes": float(np.nanmedian(np.diff(time)) * 24 * 60),
            "outlierCount": 0,
        },
        "points": [
            {"time": float(item_time), "flux": float(item_flux), "fluxError": float(item_error), "isTransit": bool(is_transit)}
            for item_time, item_flux, item_error, is_transit in zip(time, flux, flux_error, mask, strict=True)
        ],
    }
