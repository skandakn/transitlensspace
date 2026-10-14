import type { StarObservation, LightCurvePoint, AnalysisResult, TransitEvent } from '../types'

export const MOCK_STARS: StarObservation[] = [
  {
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
    numPoints: 1250,
    description: 'Quiet red dwarf host in Dorado. Known host of TOI-700 d, an Earth-sized planet inside the circumstellar habitable zone.'
  },
  {
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
    numPoints: 1800,
    description: 'G-type main-sequence star with 8 confirmed exoplanets, mirroring our Solar System multiplicity.'
  },
  {
    id: 'KIC-10593626',
    name: 'Kepler-22',
    catalogId: '2MASS J19165219+4753039',
    mission: 'Kepler',
    sectorOrQuarter: 'Quarter 1 - 16',
    ra: 289.2174,
    dec: 47.8844,
    magnitude: 11.66,
    temperature: 5518,
    stellarRadius: 0.98,
    stellarMass: 0.97,
    spectralType: 'G5V',
    distanceParsecs: 190.0,
    observationDate: '2011-12-05',
    numPoints: 1540,
    description: 'Sun-like star in Cygnus hosting Kepler-22b, the first transiting planet discovered in the habitable zone of a Sun-like star.'
  },
  {
    id: 'TIC-149603524',
    name: 'TRAPPIST-1',
    catalogId: '2MASS J23062928-0502285',
    mission: 'K2',
    sectorOrQuarter: 'Campaign 12',
    ra: 346.6224,
    dec: -5.0414,
    magnitude: 18.8,
    temperature: 2566,
    stellarRadius: 0.12,
    stellarMass: 0.09,
    spectralType: 'M8V',
    distanceParsecs: 12.1,
    observationDate: '2021-04-10',
    numPoints: 1600,
    description: 'Ultra-cool red dwarf star surrounded by 7 terrestrial Earth-sized temperate planets.'
  }
]

/**
 * Generate a realistic photometric light curve with Gaussian noise and periodic transit dips.
 */
export function generateSyntheticLightCurve(
  period = 3.52,
  epoch = 0.85,
  depthFraction = 0.0095,
  durationHours = 2.4,
  numDays = 20,
  cadenceMinutes = 30
): LightCurvePoint[] {
  const points: LightCurvePoint[] = []
  const stepDays = cadenceMinutes / (24 * 60)
  const totalSteps = Math.floor(numDays / stepDays)
  const durationDays = durationHours / 24

  for (let i = 0; i < totalSteps; i++) {
    const time = parseFloat((i * stepDays).toFixed(4))
    // Calculate phase relative to period and epoch
    const rawPhase = ((time - epoch) % period + period) % period
    const phase = rawPhase > period / 2 ? (rawPhase - period) / period : rawPhase / period
    const inTransit = Math.abs(phase * period) < (durationDays / 2)

    // Baseline normalized flux = 1.0 with stellar photometric noise
    const noise = (Math.random() - 0.5) * 0.0014
    let fluxDip = 0

    if (inTransit) {
      // Limb-darkened rounded transit profile
      const x = (phase * period) / (durationDays / 2)
      fluxDip = depthFraction * Math.sqrt(Math.max(0, 1 - 0.6 * (x * x)))
    }

    const baselineFlux = 1.0
    const flux = parseFloat((baselineFlux - fluxDip + noise).toFixed(6))
    const trend = parseFloat((baselineFlux - fluxDip).toFixed(6))

    points.push({
      time,
      flux,
      fluxError: 0.0007,
      trend,
      phase: parseFloat(phase.toFixed(4)),
      isTransit: inTransit,
      isOutlier: false
    })
  }

  return points
}

export const MOCK_TRANSIT_CANDIDATE: TransitEvent = {
  id: 'cand-tl-01',
  name: 'TOI-700 d (Candidate Signal)',
  epoch: 1568.4231,
  period: 37.426,
  durationHours: 3.25,
  depthPpm: 920,
  depthFraction: 0.00092,
  planetRadiusEarth: 1.14,
  semiMajorAxisAu: 0.163,
  equilibriumTempK: 269,
  snr: 18.4,
  disposition: 'CONFIRMED',
  falseAlarmProbability: 0.00004,
  hasSecondaryEclipse: false
}

export const MOCK_ANALYSIS_RESULT: AnalysisResult = {
  id: 'run-toi700-bls-01',
  observationId: 'TIC-261136679',
  star: MOCK_STARS[0],
  status: 'completed',
  algorithm: 'BLS',
  parameters: {
    algorithm: 'BLS',
    minPeriodDays: 0.5,
    maxPeriodDays: 50.0,
    periodSteps: 25000,
    durationMinHours: 1.0,
    durationMaxHours: 6.0,
    snrThreshold: 7.1,
    detrendingWindowDays: 1.5,
    removeOutliers: true,
    outlierSigma: 3.5
  },
  startedAt: new Date(Date.now() - 45000).toISOString(),
  completedAt: new Date().toISOString(),
  executionTimeMs: 4218,
  lightCurveSummary: {
    totalPoints: 1250,
    durationDays: 20.0,
    baselineFlux: 1.0001,
    rmsNoise: 0.00074,
    cadenceMinutes: 30,
    outlierCount: 4
  },
  transitEvents: [
    MOCK_TRANSIT_CANDIDATE,
    {
      id: 'cand-tl-02',
      name: 'TOI-700 c (Secondary Detection)',
      epoch: 1563.119,
      period: 16.051,
      durationHours: 2.15,
      depthPpm: 1280,
      depthFraction: 0.00128,
      planetRadiusEarth: 2.63,
      semiMajorAxisAu: 0.092,
      equilibriumTempK: 358,
      snr: 24.1,
      disposition: 'CONFIRMED',
      falseAlarmProbability: 0.00001,
      hasSecondaryEclipse: false
    }
  ],
  bestCandidate: MOCK_TRANSIT_CANDIDATE,
  modelFit: {
    period: 37.426,
    epoch: 1568.4231,
    depthFraction: 0.00092,
    durationHours: 3.25,
    limbDarkeningU1: 0.38,
    limbDarkeningU2: 0.22,
    impactParameter: 0.41,
    chiSquare: 1142.3,
    reducedChiSquare: 1.02
  },
  notes: 'Clear periodic limb-darkened dip detected above 18-sigma SNR. Consistent with habitable zone terrestrial exoplanet.'
}
