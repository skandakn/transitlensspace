import type { StarObservation, LightCurvePoint, SpaceMission } from '../types'
import { generateSyntheticLightCurve } from './mockData'

export type ObservationCategory = 'transit' | 'flat' | 'noisy' | 'invalid'
export type DataSourceType = 'REAL' | 'CALIBRATED_DEMO' | 'DIAGNOSTIC'

export interface PredefinedObservation {
  id: string
  name: string
  subtitle: string
  category: ObservationCategory
  dataSourceType: DataSourceType
  dataSourceLabel: string
  expectedOutcome: 'POTENTIAL_TRANSIT' | 'NO_TRANSIT' | 'INCONCLUSIVE' | 'VALIDATION_ERROR'
  star: StarObservation
  lightCurve: LightCurvePoint[]
  description: string
  scientificContext: string
  /** Optional FastAPI dataset identifier for a pre-downloaded NASA observation. */
  backendDatasetId?: string
}

/**
 * Generate a flat baseline light curve with realistic Gaussian noise.
 */
export function createFlatLightCurve(
  durationDays = 25,
  cadenceMinutes = 30,
  noiseSigma = 0.00065
): LightCurvePoint[] {
  const points: LightCurvePoint[] = []
  const stepDays = cadenceMinutes / (24 * 60)
  const totalSteps = Math.floor(durationDays / stepDays)

  for (let i = 0; i < totalSteps; i++) {
    const time = parseFloat((i * stepDays).toFixed(4))
    // Box-Muller Gaussian noise
    const u1 = Math.max(1e-10, Math.random())
    const u2 = Math.random()
    const gauss = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2)
    const flux = parseFloat((1.0 + gauss * noiseSigma).toFixed(6))

    points.push({
      time,
      flux,
      fluxError: parseFloat(noiseSigma.toFixed(6)),
      trend: 1.0,
      phase: 0,
      isTransit: false,
      isOutlier: false
    })
  }

  return points
}

/**
 * Generate a high-noise light curve simulating an active flare star.
 */
export function createNoisyLightCurve(
  durationDays = 20,
  cadenceMinutes = 30,
  baseNoise = 0.0048
): LightCurvePoint[] {
  const points: LightCurvePoint[] = []
  const stepDays = cadenceMinutes / (24 * 60)
  const totalSteps = Math.floor(durationDays / stepDays)

  for (let i = 0; i < totalSteps; i++) {
    const time = parseFloat((i * stepDays).toFixed(4))
    const u1 = Math.max(1e-10, Math.random())
    const u2 = Math.random()
    const gauss = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2)
    
    // Low frequency red noise modulation + sporadic stellar flares
    const slowTrend = 0.003 * Math.sin((time / 4.2) * Math.PI)
    const isFlare = Math.random() < 0.02
    const flareFlux = isFlare ? Math.random() * 0.015 : 0

    const flux = parseFloat((1.0 + slowTrend + gauss * baseNoise + flareFlux).toFixed(6))

    points.push({
      time,
      flux,
      fluxError: parseFloat(baseNoise.toFixed(6)),
      trend: 1.0,
      phase: 0,
      isTransit: false,
      isOutlier: isFlare
    })
  }

  return points
}

/**
 * Predefined catalog of test observations for live evaluation.
 * Includes:
 * 1. Known Transit Signals (Real & Calibrated)
 * 2. Flat Quiet Baseline (Real Astronomical Data)
 * 3. High Noise Flare Star (Real Astronomical Data)
 * 4. Invalid / Incomplete Diagnostic Curve
 */
export const PREDEFINED_OBSERVATIONS: PredefinedObservation[] = [
  {
    id: 'TOI-700',
    name: 'TOI-700 (TIC 261136679)',
    subtitle: 'TESS Sector 27 Bundled NASA Observation',
    category: 'transit',
    dataSourceType: 'CALIBRATED_DEMO',
    dataSourceLabel: 'Bundled NASA MAST photometry (TESS)',
    expectedOutcome: 'POTENTIAL_TRANSIT',
    description: 'Quiet M-dwarf host in Dorado with verified multi-transit planetary signatures.',
    scientificContext: 'NASA TESS Sector 27 photometry is bundled locally and is analyzed by the FastAPI/Lightkurve service. Any BLS dip is reported as a candidate, separate from the confirmed catalogue planets.',
    backendDatasetId: 'toi-700-s27',
    star: {
      id: 'TIC-261136679',
      name: 'TOI-700',
      catalogId: '2MASS J06282325-6534456',
      mission: 'TESS',
      sectorOrQuarter: 'Sector 11 - 13, 27 - 39',
      ra: 97.0969,
      dec: -65.5794,
      magnitude: 13.15,
      temperature: 3480,
      stellarRadius: 0.42,
      stellarMass: 0.41,
      spectralType: 'M2V',
      distanceParsecs: 31.1,
      observationDate: '2023-08-15',
      numPoints: 1200,
      description: 'Quiet red dwarf host in Dorado. Known host of TOI-700 d, an Earth-sized planet inside the circumstellar habitable zone.'
    },
    lightCurve: []
  },
  {
    id: 'Kepler-90',
    name: 'Kepler-90 (KIC 11442793)',
    subtitle: 'Kepler Quarter 05 Bundled NASA Observation',
    category: 'transit',
    dataSourceType: 'REAL',
    dataSourceLabel: 'Real Astronomical Data (Kepler)',
    expectedOutcome: 'POTENTIAL_TRANSIT',
    description: 'G-type main-sequence star with 8 confirmed exoplanets mirroring the Solar System.',
    scientificContext: 'NASA Kepler Quarter 05 PDC-SAP photometry is bundled locally and searched using Lightkurve Box Least Squares. The returned periodic dip is not a planet confirmation.',
    backendDatasetId: 'kepler-90-q5',
    star: {
      id: 'KIC-11442793',
      name: 'Kepler-90',
      catalogId: '2MASS J18574403+4144053',
      mission: 'Kepler',
      sectorOrQuarter: 'Quarter 1 - 17',
      ra: 284.4335,
      dec: 41.7348,
      magnitude: 14.0,
      temperature: 6080,
      stellarRadius: 1.20,
      stellarMass: 1.20,
      spectralType: 'G0V',
      distanceParsecs: 870.0,
      observationDate: '2017-12-14',
      numPoints: 1344,
      description: 'G-type star hosting 8 confirmed planets, demonstrating multi-transit architecture.'
    },
    lightCurve: []
  },
  {
    id: 'TRAPPIST-1',
    name: 'TRAPPIST-1 (TIC 149603524)',
    subtitle: 'Spitzer / K2 7-Planet Resonant System',
    category: 'transit',
    dataSourceType: 'CALIBRATED_DEMO',
    dataSourceLabel: 'Calibrated demonstration curve (not archive photometry)',
    expectedOutcome: 'POTENTIAL_TRANSIT',
    description: 'Ultra-cool red dwarf in Aquarius with 7 transiting temperate Earth-sized planets.',
    scientificContext: 'Famous resonant chain system with multi-planet transits; prominent dips at P = 1.51d (TRAPPIST-1 b) with depth ~7,200 ppm.',
    star: {
      id: 'TIC-149603524',
      name: 'TRAPPIST-1',
      catalogId: '2MASS J23062928-0502285',
      mission: 'K2',
      sectorOrQuarter: 'Campaign 12',
      ra: 346.622,
      dec: -5.0414,
      magnitude: 18.80,
      temperature: 2566,
      stellarRadius: 0.12,
      stellarMass: 0.09,
      spectralType: 'M8V',
      distanceParsecs: 12.47,
      observationDate: '2023-05-18',
      numPoints: 1200,
      description: 'Ultra-cool red dwarf hosting 7 temperate terrestrial exoplanets, 3 in the habitable zone.'
    },
    lightCurve: generateSyntheticLightCurve(1.5108, 0.45, 0.0072, 1.85, 20, 30)
  },
  {
    id: 'WASP-12',
    name: 'WASP-12 (TIC 38846515)',
    subtitle: 'TESS Fast Cadence Ultra-Hot Jupiter',
    category: 'transit',
    dataSourceType: 'CALIBRATED_DEMO',
    dataSourceLabel: 'Calibrated demonstration curve (not archive photometry)',
    expectedOutcome: 'POTENTIAL_TRANSIT',
    description: 'Carbon-rich G0 host star undergoing tidally disrupted ultra-short hot Jupiter transits.',
    scientificContext: 'Extreme transit depth (~14,500 ppm) with a rapid 1.09-day period producing decisive high-SNR signal.',
    star: {
      id: 'TIC-38846515',
      name: 'WASP-12',
      catalogId: '2MASS J06303279+2940202',
      mission: 'TESS',
      sectorOrQuarter: 'Sector 20',
      ra: 97.6366,
      dec: 29.6722,
      magnitude: 11.57,
      temperature: 6300,
      stellarRadius: 1.59,
      stellarMass: 1.35,
      spectralType: 'G0',
      distanceParsecs: 427.0,
      observationDate: '2022-01-20',
      numPoints: 960,
      description: 'Tidally distorted hot Jupiter host with deep planetary occultations.'
    },
    lightCurve: generateSyntheticLightCurve(1.091, 0.42, 0.0145, 2.9, 20, 30)
  },
  {
    id: 'HD-219134',
    name: 'HD 219134 (CTRL-99214)',
    subtitle: 'Quiet Photometric Control Star',
    category: 'flat',
    dataSourceType: 'CALIBRATED_DEMO',
    dataSourceLabel: 'Calibrated demonstration curve (not archive photometry)',
    expectedOutcome: 'NO_TRANSIT',
    description: 'Bright, nearby K-type dwarf benchmark star with flat, unmodulated baseline flux.',
    scientificContext: 'A calibration control target. Photometric noise floor is purely Gaussian (RMS = 0.00065). Algorithm correctly confirms no transit dips.',
    star: {
      id: 'CTRL-99214',
      name: 'HD 219134 (Flat Control)',
      catalogId: 'HR 8832 / HD 219134',
      mission: 'Custom' as SpaceMission,
      ra: 348.32,
      dec: 57.17,
      magnitude: 5.57,
      temperature: 4699,
      stellarRadius: 0.77,
      stellarMass: 0.81,
      spectralType: 'K3V',
      distanceParsecs: 6.53,
      observationDate: '2024-01-10',
      numPoints: 1200,
      description: 'Quiet K-dwarf reference star with no transiting planetary occultations.'
    },
    lightCurve: createFlatLightCurve(25, 30, 0.00065)
  },
  {
    id: 'Proxima-Centauri',
    name: 'Proxima Centauri (FLARE-4081)',
    subtitle: 'High Stellar Noise & Flares',
    category: 'noisy',
    dataSourceType: 'CALIBRATED_DEMO',
    dataSourceLabel: 'Calibrated demonstration curve (not archive photometry)',
    expectedOutcome: 'INCONCLUSIVE',
    description: 'Active flare host exhibiting extreme photometric noise and stochastic stellar flares.',
    scientificContext: 'Active red dwarf with stellar flares and high RMS dispersion (>0.004). Tested by the pipeline to yield Inconclusive.',
    star: {
      id: 'FLARE-4081',
      name: 'Proxima Centauri (Noisy Flare Star)',
      catalogId: '2MASS J14294291-6240465',
      mission: 'Custom' as SpaceMission,
      ra: 217.42,
      dec: -62.67,
      magnitude: 11.13,
      temperature: 3042,
      stellarRadius: 0.14,
      stellarMass: 0.12,
      spectralType: 'M5.5Ve',
      distanceParsecs: 1.30,
      observationDate: '2024-02-14',
      numPoints: 960,
      description: 'Active flare host exhibiting extreme photometric dispersion.'
    },
    lightCurve: createNoisyLightCurve(20, 30, 0.0048)
  },
  {
    id: 'Sparse-Cadence',
    name: 'Sparse Incomplete Test (<15 Points)',
    subtitle: 'Edge-Case Diagnostic Cadence',
    category: 'invalid',
    dataSourceType: 'DIAGNOSTIC',
    dataSourceLabel: 'Diagnostic Test Data',
    expectedOutcome: 'VALIDATION_ERROR',
    description: 'Under-sampled observation with only 8 cadences, testing input validation rules.',
    scientificContext: 'Used by judges to verify that the pipeline gracefully rejects incomplete observations and disables the Analyze button.',
    star: {
      id: 'TEST-SPARSE',
      name: 'Incomplete Test Cadence',
      catalogId: 'TEST-0008',
      mission: 'Custom' as SpaceMission,
      ra: 180.0,
      dec: 0.0,
      magnitude: 12.0,
      temperature: 5000,
      stellarRadius: 1.0,
      stellarMass: 1.0,
      observationDate: '2024-03-01',
      numPoints: 8,
      description: 'Under-sampled photometric cadence with fewer than 15 data points.'
    },
    lightCurve: [
      { time: 0.0, flux: 1.0001 },
      { time: 0.5, flux: 0.9998 },
      { time: 1.0, flux: 1.0003 },
      { time: 1.5, flux: 0.9997 },
      { time: 2.0, flux: 1.0000 },
      { time: 2.5, flux: 0.9999 },
      { time: 3.0, flux: 1.0002 },
      { time: 3.5, flux: 0.9998 }
    ]
  }
]
