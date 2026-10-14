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

## 📜 License
Licensed under the [MIT License](LICENSE).
NASA Kepler and TESS data courtesy of NASA MAST Archive.
