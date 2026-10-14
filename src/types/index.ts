/**
 * TransitLens - Shared Core Domain Types
 * 
 * These types form the contract between the analysis pipeline, star registry,
 * data ingestion, and visual results modules.
 */

// ---------------------------------------------------------------------------
// 1. Analysis Lifecycle & Status Types
// ---------------------------------------------------------------------------

export type AnalysisStatus = 'idle' | 'queued' | 'running' | 'completed' | 'failed' | 'aborted';

export type DetectionAlgorithm = 
  | 'BLS'          // Box Least Squares
  | 'TLS'          // Transit Least Squares
  | 'PhaseFold'    // Supervised Phase Folding
  | 'Wavelet'      // Wavelet Denoising & Peak Detect
  | 'DeepLearning'; // Neural Network Transit Classifier

export interface AnalysisParameters {
  algorithm: DetectionAlgorithm;
  minPeriodDays: number;
  maxPeriodDays: number;
  periodSteps: number;
  durationMinHours: number;
  durationMaxHours: number;
  snrThreshold: number;
  detrendingWindowDays?: number;
  removeOutliers?: boolean;
  outlierSigma?: number;
}

export interface AnalysisProgress {
  status: AnalysisStatus;
  progressPercent: number; // 0 to 100
  currentStage: string;    // e.g., "Detrending light curve", "Scanning period grid", "Fitting limb-darkened model"
  elapsedTimeMs: number;
  etaMs?: number;
}

// ---------------------------------------------------------------------------
// 2. Photometry & Light Curve Types
// ---------------------------------------------------------------------------

export interface LightCurvePoint {
  /** Time of observation (BJD or relative days) */
  time: number;
  /** Normalized relative flux (typically centered around 1.0) */
  flux: number;
  /** Measurement uncertainty / flux error */
  fluxError?: number;
  /** Model or trend fit flux at this time */
  trend?: number;
  /** Folded phase between -0.5 and +0.5 (populated during folded analysis) */
  phase?: number;
  /** True if this data point falls within a detected transit dip */
  isTransit?: boolean;
  /** True if flagged as an uncorrected stellar flare or thruster firing */
  isOutlier?: boolean;
}

export interface LightCurveSummary {
  totalPoints: number;
  durationDays: number;
  baselineFlux: number;
  rmsNoise: number;
  cadenceMinutes: number;
  outlierCount: number;
}

// ---------------------------------------------------------------------------
// 3. Exoplanet Candidate & Transit Event Types
// ---------------------------------------------------------------------------

export type TransitDisposition = 'CONFIRMED' | 'CANDIDATE' | 'FALSE_POSITIVE';

export interface TransitEvent {
  id: string;
  name?: string;
  /** Transit epoch / center time (BJD) */
  epoch: number;
  /** Orbital period in Earth days */
  period: number;
  /** Duration of transit in hours */
  durationHours: number;
  /** Transit depth in parts-per-million (ppm) or normalized ratio (fraction) */
  depthPpm: number;
  depthFraction: number; // e.g. 0.0084 for 8400 ppm
  /** Estimated planet radius in Earth radii (R⊕) */
  planetRadiusEarth?: number;
  /** Estimated semi-major axis in Astronomical Units (AU) */
  semiMajorAxisAu?: number;
  /** Estimated equilibrium temperature in Kelvin */
  equilibriumTempK?: number;
  /** Signal-to-noise ratio of detected transit signal */
  snr: number;
  /** Transit signal classification disposition */
  disposition: TransitDisposition;
  /** False alarm probability (0.0 to 1.0) */
  falseAlarmProbability?: number;
  /** Flag for secondary eclipse presence (e.g. eclipsing binary indicator) */
  hasSecondaryEclipse?: boolean;
}

// ---------------------------------------------------------------------------
// 4. Stellar Host Observation Types
// ---------------------------------------------------------------------------

export type SpaceMission = 'Kepler' | 'TESS' | 'K2' | 'Synthetic' | 'Custom';

export interface StarObservation {
  id: string;               // e.g. "TIC-261136679", "Kepler-90"
  name: string;             // Display name
  catalogId?: string;       // Cross-reference catalog ID
  mission: SpaceMission;
  sectorOrQuarter?: string; // e.g. "Sector 14", "Quarter 4"
  ra: number;               // Right Ascension in degrees
  dec: number;              // Declination in degrees
  magnitude: number;        // Apparent optical / mission magnitude
  temperature: number;      // Effective temperature Teff in Kelvin
  stellarRadius: number;    // Radius in Solar radii (R☉)
  stellarMass: number;      // Mass in Solar masses (M☉)
  spectralType?: string;    // e.g. "G2V", "M3V", "K1V"
  distanceParsecs?: number; // Distance from solar system in pc
  observationDate: string;  // ISO timestamp or calendar date
  numPoints: number;        // Total photometric data points
  description?: string;     // Contextual astrophysical notes
}

// ---------------------------------------------------------------------------
// 5. Consolidated Analysis Result Types
// ---------------------------------------------------------------------------

export interface ModelFitParameters {
  period: number;
  epoch: number;
  depthFraction: number;
  durationHours: number;
  limbDarkeningU1?: number;
  limbDarkeningU2?: number;
  impactParameter?: number;
  chiSquare: number;
  reducedChiSquare: number;
}

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
  detectedIntervals?: {
    startTime: number;
    endTime: number;
    centerTime: number;
    depthPpm: number;
    snr: number;
  }[];
  notes?: string;
  errorMessage?: string;
}

// ---------------------------------------------------------------------------
// 6. Navigation & UI Types
// ---------------------------------------------------------------------------

export type NavigationTab = 'analysis' | 'universe' | 'stars' | 'upload' | 'results' | 'docs';

export interface NavItem {
  id: NavigationTab;
  label: string;
  href: string;
  icon: string;
  badge?: string;
}

// ---------------------------------------------------------------------------
// 7. 3D Universe Explorer Types
// ---------------------------------------------------------------------------
export * from './universe';

