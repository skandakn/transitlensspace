# TransitLens scientific backend

This FastAPI service runs Lightkurve's Box Least Squares (BLS) period search against
small, repository-bundled NASA MAST observations. It is intentionally independent of
the React build so the browser never needs direct archive credentials or a live MAST
connection during a demo.

## Bundled observations

| API dataset | Existing 3D object ID | Source product | Stored file |
| --- | --- | --- | --- |
| `toi-700-s27` | `TIC-261136679` | TESS Sector 27, 20-second SPOC cadence | `data/toi-700-s27.csv` |
| `kepler-90-q5` | `KIC-11442793` | Kepler Quarter 05, long cadence | `data/kepler-90-q5.csv` |

The provenance, target identifier, mission, processing choices, and UTC retrieval time
are stored in [`data/observations.json`](data/observations.json). The download script
uses Lightkurve's MAST search and is kept in
[`scripts/download_demo_data.py`](scripts/download_demo_data.py). The source archives
are NASA MAST's [Kepler collection](https://archive.stsci.edu/missions-and-data/kepler)
and [TESS collection](https://archive.stsci.edu/missions-and-data/tess).

The CSV files contain measured PDC-SAP/SPOC flux after documented, reversible display
preparation: NaN removal, 8-sigma outlier rejection, normalization, and 20-minute bins.
They are bundled so the initial demonstration has no runtime dependence on MAST.

## Local setup

```powershell
python -m venv backend/.venv
backend/.venv/Scripts/python -m pip install -r backend/requirements.txt
backend/.venv/Scripts/python -m uvicorn backend.app.main:app --reload --port 8000
```

Set the frontend variable before running Vite:

```bash
VITE_TRANSIT_API_URL=http://localhost:8000
```

`FRONTEND_ORIGINS` accepts a comma-separated list of allowed frontend origins and
defaults to `http://localhost:5173`.

## Deployment

Deploy the `backend/` directory to a Python service such as Render, Railway, or Fly.io
with the build command `pip install -r requirements.txt` and start command
`uvicorn app.main:app --host 0.0.0.0 --port $PORT`. Set `FRONTEND_ORIGINS` to the Vercel
deployment origin, then set the matching `VITE_TRANSIT_API_URL` environment variable in
the existing Vercel frontend project and redeploy it.

## Scientific limits

BLS finds periodic box-shaped dimmings. Its output is labelled `CANDIDATE` even when a
catalogue contains confirmed planets for the host system. A BLS peak requires vetting for
instrumental effects, eclipsing binaries, stellar variability, ephemeris consistency,
and follow-up observations before any planetary confirmation claim.
