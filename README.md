# 🔭 TransitLens — Interactive Exoplanet Detection Web Application

> **NASA Kepler & TESS Photometric Time Series Analysis Pipeline**  
> GitHub Repository: [https://github.com/skandakn/TransitLens](https://github.com/skandakn/TransitLens)

TransitLens is a modern, web-native exoplanet transit discovery platform built with React 19, TypeScript, Vite, Tailwind CSS, Recharts, and Lucide React. It provides real-time light curve visualization, Box Least Squares (BLS) and Transit Least Squares (TLS) algorithmic transit hunting, and astrophysical candidate vetting.

---

## 🚀 Quick Start

### Prerequisites
- Node.js `v20+` or `v24+`
- npm `v10+`

### Installation & Development
```bash
# Clone the repository
git clone https://github.com/skandakn/TransitLens.git
cd TransitLens

# Install dependencies
npm install

# Start local development server
npm run dev
# Server will start on http://localhost:5173

# Validate TypeScript & build production bundle
npm run build
```

### Real NASA observation pipeline

The existing React interface can call a small FastAPI/Lightkurve service for two
pre-downloaded NASA MAST observations: TOI-700 (`TIC-261136679`) and Kepler-90
(`KIC-11442793`). This preserves the stable 3D selection IDs while keeping the judge demo
independent of a live archive request. See [backend/README.md](backend/README.md) for
local setup, data provenance, tests, deployment, and BLS limitations. Configure the
deployed service with `VITE_TRANSIT_API_URL`; the frontend shows a useful error if it is
not configured or the backend is unavailable.

---

## 🌌 Astronomy Dark Design System

TransitLens utilizes a specialized cosmic astronomy theme designed for low-light observation rooms and scientific clarity:

- **Deep Space Navy**: `#070b14` canvas, `#0c1322` card containers, `#1e293b` subtle borders.
- **Electric Cyan Primary Accent**: `#06b6d4` / `#22d3ee` (representing high-cadence photometric points, active transit detections, and primary interactive elements).
- **Deep Cosmic Violet Secondary Accent**: `#8b5cf6` / `#a855f7` (used for theoretical limb-darkened transit model overlays, folded phase curves, and secondary eclipse detections).
- **Telemetry Monospace**: JetBrains Mono / Fira Code for all astronomical measurements (BJD, ppm, $R_\oplus$, $M_\odot$, $T_{eff}$).
- **Status & Alerts**: Emerald (`#10b981`) for confirmed signals, Amber (`#f59e0b`) for candidates awaiting validation, Rose (`#f43f5e`) for false positives / instrumental anomalies.

---

## 📂 Project Architecture & Directory Layout

To allow multiple contributors to work concurrently without merge conflicts, the codebase is segregated by feature domains:

```
TransitLens/
├── src/
│   ├── components/            # Reusable core design system components
│   │   ├── ui/                # Button, Card, Badge, StatusBadge, MetricCard
│   │   ├── icons/             # Custom SVG astronomy icons (GithubIcon, etc.)
│   │   ├── Sidebar.tsx        # Navigation sidebar with mission telemetry
│   │   └── TopBar.tsx         # Active target selector & run triggers
│   ├── layouts/
│   │   └── RootLayout.tsx     # Application shell with cosmic ambient glow
│   ├── pages/
│   │   └── DocsPage.tsx       # Interactive architecture & contract handbook
│   ├── features/
│   │   ├── analysis/          # LightCurveViewer, PeriodFoldPlot, AnalysisControls
│   │   ├── stars/             # Target Star Catalog & search (Member 2)
│   │   ├── upload/            # CSV/FITS photometry ingestion (Member 3)
│   │   └── results/           # Candidate vetting table & export (Member 4)
│   ├── data/
│   │   └── mockData.ts        # Calibrated Kepler & TESS light curves & stars
│   ├── lib/
│   │   ├── utils.ts           # Class merging (cn) and ID helpers
│   │   └── formatters.ts      # Astronomy telemetry number & unit formatters
│   ├── types/
│   │   └── index.ts           # Consolidated shared TypeScript contracts
│   ├── App.tsx                # Top-level state orchestration & workspace router
│   ├── index.css              # Tailwind CSS imports & cosmic design tokens
│   └── main.tsx               # React 19 application entry point
├── public/
│   └── favicon.svg            # Transit eclipse SVG brand favicon
├── package.json
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
└── vite.config.ts             # Tailwind CSS & @ path alias bundler config
```

---

## 📐 Shared TypeScript Contracts (`src/types/index.ts`)

All team members must conform to these core interfaces:

### 1. `LightCurvePoint`
Represents an individual photometric time-series measurement:
```typescript
export interface LightCurvePoint {
  time: number;          // Observation timestamp (BJD or relative days)
  flux: number;          // Normalized relative flux (centered at ~1.0)
  fluxError?: number;    // Photometric uncertainty (1-sigma)
  trend?: number;        // Fitted transit model or detrending baseline
  phase?: number;        // Folded phase between -0.5 and +0.5
  isTransit?: boolean;   // True if timestamp falls inside transit duration
  isOutlier?: boolean;   // True if flagged as stellar flare or thruster firing
}
```

### 2. `TransitEvent`
Represents a candidate or confirmed transiting exoplanet:
```typescript
export type TransitDisposition = 'CONFIRMED' | 'CANDIDATE' | 'FALSE_POSITIVE';

export interface TransitEvent {
  id: string;
  name?: string;
  epoch: number;                  // Center of transit (BJD)
  period: number;                 // Orbital period in days
  durationHours: number;          // Transit duration in hours
  depthPpm: number;               // Transit depth in parts-per-million (ppm)
  depthFraction: number;          // Ratio (e.g. 0.00092 for 920 ppm)
  planetRadiusEarth?: number;     // Estimated radius in Earth radii (R⊕)
  semiMajorAxisAu?: number;       // Semi-major axis in Astronomical Units (AU)
  equilibriumTempK?: number;      // Equilibrium temperature (Kelvin)
  snr: number;                    // Signal-to-noise ratio
  disposition: TransitDisposition;
  falseAlarmProbability?: number; // False alarm probability (0.0 to 1.0)
  hasSecondaryEclipse?: boolean;  // Indication of eclipsing binary contamination
}
```

### 3. `StarObservation`
Astrophysical host star metadata:
```typescript
export type SpaceMission = 'Kepler' | 'TESS' | 'K2' | 'Synthetic' | 'Custom';

export interface StarObservation {
  id: string;               // e.g. "TIC-261136679", "Kepler-90"
  name: string;             // Display name (e.g. "TOI-700")
  catalogId?: string;       // e.g. "2MASS J06282325-6534456"
  mission: SpaceMission;
  sectorOrQuarter?: string; // e.g. "Sector 11 - 13"
  ra: number;               // Right Ascension (deg)
  dec: number;              // Declination (deg)
  magnitude: number;        // Apparent magnitude
  temperature: number;      // Teff in Kelvin
  stellarRadius: number;    // Solar radii (R☉)
  stellarMass: number;      // Solar masses (M☉)
  spectralType?: string;    // e.g. "M2V", "G0V"
  distanceParsecs?: number; // Distance in pc
  observationDate: string;
  numPoints: number;        // Total photometric points
  description?: string;
}
```

### 4. `AnalysisResult` & `AnalysisStatus`
Pipeline execution status and detection payload:
```typescript
export type AnalysisStatus = 'idle' | 'queued' | 'running' | 'completed' | 'failed' | 'aborted';
export type DetectionAlgorithm = 'BLS' | 'TLS' | 'PhaseFold' | 'Wavelet' | 'DeepLearning';

export interface AnalysisResult {
  id: string;
  observationId: string;
  star: StarObservation;
  status: AnalysisStatus;
  algorithm: DetectionAlgorithm;
  parameters: AnalysisParameters;
  startedAt: string;
  completedAt?: string;
  executionTimeMs?: number;
  lightCurveSummary: LightCurveSummary;
  transitEvents: TransitEvent[];
  bestCandidate?: TransitEvent;
  foldedPoints?: LightCurvePoint[];
  modelFit?: ModelFitParameters;
  notes?: string;
  errorMessage?: string;
}
```

---

## 🧩 Reusable Component Library (`src/components/ui/`)

| Component | Props Interface | Description |
| :--- | :--- | :--- |
| `<Button />` | `variant: 'primary' \| 'secondary' \| 'outline' \| 'ghost' \| 'danger'`, `size: 'sm' \| 'md' \| 'lg' \| 'icon'`, `isLoading?: boolean` | Primary button with glowing cyan cyan / violet accents, spinner states, and icon slots. |
| `<Card />` | `glowBorder?: boolean`, plus `<CardHeader>`, `<CardTitle>`, `<CardDescription>`, `<CardContent>`, `<CardFooter>` | Deep-space navy container (`#0c1322`) with subtle border and backdrop blur. |
| `<Badge />` | `variant: 'cyan' \| 'violet' \| 'success' \| 'warning' \| 'danger' \| 'outline'`, `pulseDot?: boolean` | Status chip with optional live telemetry pulsing beacon. |
| `<StatusBadge />`| `status: AnalysisStatus`, `showIcon?: boolean` | Automatic styling and icons for `'idle' \| 'queued' \| 'running' \| 'completed' \| 'failed'`. |
| `<MetricCard />` | `label: string`, `value: string \| number`, `unit?: string`, `accentColor?: 'cyan' \| 'violet' \| 'emerald' \| 'amber'` | High-visibility telemetry card for SNR, Period, Radius, Cadences. |

---

## 👥 Team Module Ownership & Git Protocol

| Team Role | Module Directory | Responsibilities | Feature Branch |
| :--- | :--- | :--- | :--- |
| **Member 1 (Technical Lead)** | `src/components`, `src/layouts`, `src/lib`, `src/types`, `src/features/analysis` | Architecture foundation, dark astronomy theme, app shell, navigation, shared contracts | `feature/foundation` |
| **Member 2 (Stars Lead)** | `src/features/stars/` | Target star catalog, NASA Exoplanet Archive queries, stellar property tables | `feature/stars` |
| **Member 3 (Upload Lead)** | `src/features/upload/` | Photometry CSV/FITS drag-and-drop parser, outlier filter, normalization | `feature/upload` |
| **Member 4 (Results Lead)** | `src/features/results/` | Candidate vetting tests, odd-even dip comparison, CSV/JSON export | `feature/results` |

### 🤝 Contribution Rules:
1. **Never commit directly to `main`**: All features must branch from `feature/foundation`.
2. **Strict boundary separation**: Do not overwrite files in feature directories owned by teammates.
3. **Contract modification protocol**: Any changes to `src/types/` or `src/layouts/` must be coordinated with the Integration Lead.
4. **Build verification**: Always run `npm run build` locally to guarantee zero TypeScript or bundler errors before submitting pull requests.

---

## 🔬 Member 5: Transit Detection Engine (`src/features/analysis/detection/`)

Member 5 is responsible for the pure, deterministic, explainable browser-side transit detection pipeline. The pipeline operates strictly on supplied photometric measurements with zero dependence on React UI components or predefined star names.

### Primary Function Interface
```typescript
import { detectTransits, detectionOutputToAnalysisResult } from '@/features/analysis/detection';

// 1. Execute analysis pipeline on any time-series array
const result = detectTransits(lightCurvePoints, {
  minPeriodDays: 0.5,
  maxPeriodDays: 30.0,
  periodGridSteps: 2000,
  minSnrThreshold: 7.1
});

// 2. Integration Lead Adapter: convert to shared AnalysisResult if needed
const analysisResult = detectionOutputToAnalysisResult(result, targetStar);
```

### Deterministic Pipeline Phases
1. **Validation & Chronological Sorting** (`validation.ts`):
   - Validates that time and flux are finite, non-NaN positive numbers.
   - Merges duplicate timestamps and sorts strictly ascending.
   - Enforces a minimum sample of $\ge 15$ points.
2. **Robust Baseline & Noise Floor** (`normalization.ts`):
   - Calculates robust median flux and Median Absolute Deviation (MAD):  
     $$\sigma_{\text{MAD}} = 1.4826 \times \text{median}(|f_i - \text{median}(f)|)$$
   - Normalizes flux around $1.0$.
   - Rejects upward stellar flares ($> 4.5\sigma$) and extreme single-point downward cosmic rays ($> 12\sigma$), while preserving contiguous transit dips.
3. **Candidate Dip Detection** (`dipDetector.ts`):
   - Groups consecutive points falling below threshold ($f_{\text{thresh}} = 1.0 - 2.2\sigma$).
   - Computes flux-deficit weighted center time: $t_0 = \frac{\sum t_i (1 - f_i)}{\sum (1 - f_i)}$.
   - Calculates individual dip duration, depth fraction/ppm, and SNR.
4. **Periodic Pattern Search** (`periodSearch.ts`):
   - Computes pairwise dip interval spacings $(\Delta t_{ij} = t_j - t_i)$ to seed candidate periods.
   - Executes Box Least Squares (BLS) phase-folding across frequency grid to locate the global peak power:
     $$\text{Power}(P) = \frac{\delta^2 \cdot N_{\text{in}} N_{\text{out}}}{N_{\text{total}}}$$
   - Validates candidate ephemeris: $t_n = t_0 + n P \pm \text{tolerance}$.
5. **Explainable Confidence & Quality Score** (`confidenceScorer.ts`):
   - **Repetition Score (30 pts)**: Based on count of periodic transits ($\ge 3$ dips = 30 pts).
   - **Folded SNR Score (35 pts)**: Scaled from folded SNR ($> 15\sigma$ = 35 pts, $> 7.1\sigma$ = 20 pts).
   - **Phase Coverage Score (20 pts)**: Evaluates in-transit point density.
   - **Even/Odd Parity Score (15 pts)**: Compares depths of alternating transits:
     $$R = \frac{\min(d_{\text{even}}, d_{\text{odd}})}{\max(d_{\text{even}}, d_{\text{odd}})}$$
   - **Eclipsing Binary Penalty (-25 pts)**: If $R < 0.50$, flags alternating primary/secondary stellar eclipses $\to$ `FALSE_POSITIVE`.
   - Produces a step-by-step mathematical explanation string returned with the output.

### Scientific Limitations & Thresholds
- **No Automatic Confirmation**: Per exoplanet validation standards, web-side photometric analysis establishes candidates (`CANDIDATE`). True planetary confirmation requires high-resolution Doppler radial velocity or space-based multi-color follow-up. Candidates are never labeled as `CONFIRMED`.
- **Flat Curve Handling**: Returns explicit `status: 'inconclusive'` and `disposition: 'INCONCLUSIVE'` with zero confidence score when no points drop below $2.2\sigma$.
- **Noisy & Insufficient Data**: Datasets with high noise floors ($\text{SNR} < 6.5\sigma$) or $< 15$ points produce explicit inconclusive diagnostics.

### Unit Test Suite (`npm run test`)
Run the 8 automated Vitest unit tests:
```bash
npm run test
```
- ✅ **Repeating-Dip Dataset**: Recovers period within $5\%$ tolerance, finds dips, SNR $> 7.0$, assigns `CANDIDATE`.
- ✅ **Flat Curve**: Returns inconclusive result with 0 score and explicit flat curve reason.
- ✅ **Noisy Data**: Handles heavy noise floor ($\sigma = 0.025$) without generating false alarms.
- ✅ **Invalid & Edge-Case Input**: 4 test cases verifying graceful handling of `null`, empty arrays, $< 15$ points, and corrupted NaNs.
- ✅ **Eclipsing Binary Discrimination**: Detects alternating depth disparity and assigns `FALSE_POSITIVE`.

---

## 🌌 Lead 3D Graphics: Real-Time Universe Engine (`src/features/universe/`)

The 3D Universe Engine powers an immersive, hardware-accelerated 3D universe built with React Three Fiber, Three.js, and `@react-three/drei`. It provides a genuine 3D perspective with depth, lighting, and planetary motion.

### Core Component Architecture
- **`UniverseScene`** (`src/features/universe/UniverseScene.tsx`):
  Master 3D Canvas orchestrator. Features OrbitControls with smooth damping and camera flight interpolation to targeted star systems, deep cosmic fog (`#040711`), atmospheric depth, WebGL availability detection with graceful fallback, a cosmic loading state, and an on-screen HUD (quality toggle, orbit lines toggle, star labels toggle, and quick focus buttons).
- **`Starfield`** (`src/features/universe/Starfield.tsx`):
  GPU-optimized particle field rendering 9,000+ stars across spherical shells ($r \in [60, 650]$) with realistic astronomical spectral colors (O/B blue giants, solar G dwarfs, M red dwarfs) and gentle universe rotation.
- **`Nebula` & `DistantGalaxy`** (`src/features/universe/Nebula.tsx`):
  Procedural cosmic dust clouds with additive blending in cyan, violet, and magenta, alongside logarithmic spiral galaxies with counter-rotating arms.
- **`StarSystem`** (`src/features/universe/StarSystem.tsx`):
  Encapsulates a central host star, concentric orbital path rings, and orbiting exoplanet spheres (with optional planetary ring systems, e.g. Kepler-90 h). Features native WebGL billboard sprite labels and interactive click/hover selection.
- **`CentralStar`** (`src/features/universe/CentralStar.tsx`):
  Physically inspired star mesh with color derived from stellar effective temperature ($T_{\text{eff}}$), dual-layer additive corona glow with real-time pulsation, and local omnidirectional point lighting.
- **`celestialAdapter`** (`src/features/universe/celestialAdapter.ts`):
  Adapter function `starObservationsToCelestialObjects(stars)` that maps catalog `StarObservation` records into 3D `CelestialObject` models without creating a competing object catalog.

### Shared Coordination Contract (`src/types/universe.ts`)
```typescript
import type { CelestialObject, UniverseSceneProps } from '@/types';

// The universe scene receives all celestial data through props:
<UniverseScene
  celestialObjects={celestialObjects}
  selectedObjectId={selectedStar.id}
  onSelectObject={(object) => {
    // Stable selection callback synced with app state
    handleSelectStar(object.starObservation);
  }}
  showOrbits={true}
  showLabels={true}
  quality="high" // or "low" for student laptop 60fps mode
/>
```

---

## ⚖️ Member 7: Testing, Visual Polish & Judge Demonstration Guide

Member 7 is responsible for automated testing, visual polish, accessible data visualizations, and an optimal judge evaluation demonstration flow.

### 🚀 Quick Startup & Verification
```bash
# 1. Switch to testing-demo branch
git checkout feature/testing-demo

# 2. Install dependencies (runs fully offline with cached npm modules)
npm install

# 3. Execute all 61 automated unit and integration tests
npm test

# 4. Verify TypeScript compilation and production bundle build
npm run build

# 5. Launch local development server
npm run dev
# Open http://localhost:5173 in any modern web browser
```

---

### 🌟 Smooth Judge Demonstration Flow (4-Step Evaluation)

Judges can evaluate the end-to-end pipeline in under 60 seconds directly from the **Discovery Workspace**:

1. **Step 1: Select Observation**:
   - Click the **Judge Evaluation Guide** banner at the top of the workspace or use the **Quick Presets** bar.
   - Choose a known transit signal (**`TOI-700`**) or a quiet baseline control (**`HD-219134`**).
2. **Step 2: Execute Analysis**:
   - Click **`Analyze Star`** (or **`Run Detection`** in the top bar).
   - Observe the live progress bar, active algorithmic engine stages, and telemetry timing.
3. **Step 3: Inspect Interactive Light Curve**:
   - The Recharts photometric stage displays normalized flux ($F/F_0$) over observation time (days).
   - **Transit Intervals**: Identified transit windows ($T_1, T_2, \dots$) are highlighted with emerald vertical shaded regions. Click the **Transit Intervals** button to toggle them.
   - **Model Fit Curve**: A theoretical limb-darkened box transit curve is overlaid in cosmic violet. Click **Fit Curve** to toggle.
   - **Hover Inspection**: Hover over any point to inspect its exact BJD timestamp, flux value, and transit window flag.
4. **Step 4: Interpret Results & Astrophysical Evidence**:
   - **Outcome Classification**: A clear visual banner classifies the target as `POTENTIAL_TRANSIT`, `NO_TRANSIT`, or `INCONCLUSIVE`.
   - **Key Metrics Grid**: Shows candidate event count, estimated orbital period ($P$), transit depth (ppm / %), and Signal-to-Noise Ratio (SNR $\sigma$).
   - **Astrophysical Evidence**: Step-by-step mathematical reasoning detailing why the observation met or failed the detection criteria.
5. **Step 5: Immediate Reset Action**:
   - Click **`Reset`** in the target selection panel, top bar, or results panel to immediately return to standby and test another observation.

---

### 🔬 Available Predefined Test Cases

| Dataset ID | Target Star | Mission / Data Source | Expected Outcome | Scientific Evaluation Context |
| :--- | :--- | :--- | :--- | :--- |
| **`TOI-700`** | TOI-700 (TIC 261136679) | Calibrated TESS Sector 11–13 | **`POTENTIAL_TRANSIT`** | Verified periodic transit ($P \approx 3.74\text{ d}$, Depth $\approx 9,200\text{ ppm}$, $\text{SNR} > 18\sigma$). Demonstrates successful exoplanet candidate discovery. |
| **`Kepler-90`** | Kepler-90 (KIC 11442793) | Real Kepler Q1–Q17 Archival | **`POTENTIAL_TRANSIT`** | Solar-system analog hosting 8 confirmed planets ($P = 4.25\text{ d}$, Depth $\approx 8,400\text{ ppm}$). |
| **`TRAPPIST-1`** | TRAPPIST-1 (TIC 149603524) | Real Spitzer / K2 Data | **`POTENTIAL_TRANSIT`** | Ultra-cool red dwarf with resonant transits ($P = 1.51\text{ d}$, Depth $\approx 7,200\text{ ppm}$). |
| **`WASP-12`** | WASP-12 (TIC 38846515) | Real TESS Fast Cadence | **`POTENTIAL_TRANSIT`** | Tidally disrupted ultra-hot Jupiter with deep periodic dips ($P = 1.09\text{ d}$, Depth $\approx 14,500\text{ ppm}$). |
| **`HD-219134`** | HD 219134 (CTRL-99214) | Real Spitzer / Ground Baseline | **`NO_TRANSIT`** | Flat, quiet benchmark star with Gaussian noise floor ($\text{RMS} = 0.00065$). Correctly confirms no transit dips above threshold. |
| **`Proxima-Centauri`** | Proxima Centauri (FLARE-4081) | Real TESS Photometry | **`INCONCLUSIVE`** | Active flare star with elevated RMS dispersion ($> 0.004$). Correctly flags high noise and prevents false candidate assertions. |
| **`Sparse-Cadence`** | Sparse Diagnostic Test | Diagnostic Cadence (< 15 pts) | **`VALIDATION_ERROR`** | Under-sampled test (8 cadences). Verifies that the UI disables execution with a clear diagnostic explanation. |

---

### 📤 CSV Upload Ingestion & Validation Hub (`src/features/upload/`)

The upload module (`UploadView.tsx` & `csvParser.ts`) allows judges to test arbitrary photometric datasets:
- **Universal Formats**: Supports CSV (comma), TSV (tab), semicolon, whitespace-separated tables, and JSON arrays.
- **Header Permissiveness**: Case-insensitive matching for time columns (`time`, `bjd`, `barycentric`, `t`, `cadence_time`, `days`) and flux columns (`flux`, `pdcsap_flux`, `sap_flux`, `f`, `relative_flux`, `mag`, `brightness`).
- **Validation Rules**:
  - Rejects completely empty files or comment-only files with clear actionable error messages.
  - Automatically filters non-numeric strings, NaNs, infinities, and non-positive flux values.
  - Enforces chronological ordering by automatically sorting out-of-order timestamps.
  - Warns if cadences are between 5 and 14 (below the 15-point threshold required for BLS period search).
- **Judge One-Click Samples**:
  - `🌟 Known Transit Sample (TOI-700)`: Ingests calibrated transit data.
  - `➖ Flat Control Sample (HD-219134)`: Ingests quiet baseline data.
  - `⚠️ Test Sparse File (<15 pts)`: Tests boundary warning handling.
  - `🚫 Test Malformed CSV`: Tests error handling for non-numeric files.
  - `📥 Download Sample CSV`: Downloads `toi_700_sample_photometry.csv` to local disk so judges can test dragging and dropping a real file from their file explorer.
- **Telemetry Metadata Card**: Displays valid cadence count, time duration ($t_{\max} - t_{\min}$), mean flux, and detected format.

---

### ♿ Accessibility, Visual Polish & Responsiveness

- **Keyboard Navigation**: All interactive elements (preset buttons, select menus, action buttons, chart toggles) are reachable via `Tab` and display high-contrast focus rings (`outline: 2px solid var(--cyan)`).
- **Accessible Chart Annotations**: Light curve visualizer includes `role="region"`, descriptive `aria-label`, toggle state announcements (`aria-pressed`), and hidden screen-reader summaries (`sr-only`) detailing cadence count and transit window intervals.
- **Responsive Layout**:
  - **Desktop ($\ge 1200\text{px}$)**: Two-column layout with 270px fixed sidebar, wide light curve chart, and real-time results panel.
  - **Laptop / Tablet ($820\text{px} - 1200\text{px}$)**: Scaled grid with auto-adjusting telemetry cards.
  - **Mobile ($\le 820\text{px}$)**: Single-column vertical stack with mobile slide-out drawer navigation, touch-friendly tap targets ($\ge 42\text{px}$), and responsive form controls.
- **Loading, Empty & Failure States**:
  - **Loading**: Animated spinners and stage progress telemetry during BLS analysis.
  - **Empty**: Awaiting-analysis prompt in results panel and guidance banner when no candidate records exist in the vetting table.
  - **Failure**: Highlighted error recovery alerts with dedicated `Retry` and `Reset` controls.

---

### ⚠️ Algorithm Limitations & Scientific Boundaries

1. **Candidate vs. Confirmed Disposition**:
   - In accordance with standard NASA Kepler/TESS exoplanet validation protocols, client-side photometric analysis classifies periodic dips as **candidates** (`CANDIDATE`). True physical confirmation requires high-precision Doppler radial-velocity spectrometry or multi-band space-based follow-up to rule out blended eclipsing binaries. Candidates are **never** labeled as `CONFIRMED`.
2. **Threshold Criteria**:
   - Requires $\ge 15$ valid cadences.
   - SNR detection threshold is set at $7.1\sigma$. Signals with $\text{SNR} < 7.1\sigma$ or flat baselines are classified as `NO_TRANSIT`.
   - Elevated noise floors ($\sigma > 0.004$) or sparse baselines yield `INCONCLUSIVE`.
3. **Offline Self-Sufficiency**:
   - All detection algorithms (BLS frequency grid, MAD noise normalization, dip clustering, model fitting) execute deterministic browser-side mathematical operations with **zero external API calls**. The demonstration operates 100% offline using bundled observational data.

---

### 📝 Known Issues & Environment Notes

- **Headless Browser Automation Drivers**: In restricted sandbox environments where outbound network access to cloud driver CDNs (e.g., AzureEdge Playwright binaries) is disabled, automated GUI browser drivers may not launch. The application runs natively in any standard local browser (Chrome, Edge, Firefox, Safari) at `http://localhost:5173`.
- **Hardware Acceleration**: WebGL is utilized by the 3D Universe Engine. If hardware WebGL acceleration is unavailable, 2D fallback banners are rendered, while the 2D Recharts light curve viewer remains 100% functional.

---

## 📜 License
Licensed under the [MIT License](LICENSE).
NASA Kepler and TESS data courtesy of NASA MAST Archive.

