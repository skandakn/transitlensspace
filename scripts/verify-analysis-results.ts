import {
  runTransitDetection,
  validateObservationData,
  generateFlatLightCurve,
  generateNoisyLightCurve
} from '../src/features/analysis/transitDetection'
import { determineOutcome } from '../src/features/analysis/outcomeUtils'
import { generateSyntheticLightCurve, MOCK_STARS } from '../src/data/mockData'

async function runTests() {
  console.log('🧪 Starting TransitLens Member 6 Analysis & Results Verification...\n')

  let passed = 0
  let failed = 0

  function assert(condition: boolean, msg: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${msg}`)
      passed++
    } else {
      console.error(`  ❌ FAIL: ${msg}`)
      failed++
    }
  }

  // Test 1: Validation Logic
  console.log('Test 1: Validation Rules (Requirement 2)')
  const emptyStar = { ...MOCK_STARS[0], id: '—' }
  const invalidStarCheck = validateObservationData(emptyStar, [])
  assert(!invalidStarCheck.valid, 'Empty target ID is rejected')

  const insufficientPointsCheck = validateObservationData(MOCK_STARS[0], [{ time: 1, flux: 1 }])
  assert(!insufficientPointsCheck.valid, 'Less than 15 data points is rejected')

  const validPoints = generateSyntheticLightCurve(3.52, 0.85, 0.008, 2.4, 25, 30)
  const validCheck = validateObservationData(MOCK_STARS[0], validPoints)
  assert(validCheck.valid, 'Valid star and light curve accepted')

  // Test 2: Potential Transit Detection (Requirements 4, 5, 6, 7, 8)
  console.log('\nTest 2: Transit Detection - Potential Transit (Multi-transit curve)')
  let progressStages: string[] = []
  const resultCandidate = await runTransitDetection(
    MOCK_STARS[0],
    validPoints,
    { minPeriodDays: 0.5, maxPeriodDays: 20.0, snrThreshold: 6.5 },
    (p) => progressStages.push(p.currentStage)
  )

  assert(resultCandidate.status === 'completed', 'Analysis status is completed')
  assert(progressStages.length >= 3, `Real processing stages emitted: ${progressStages.length} stages`)
  assert(resultCandidate.transitEvents.length > 0, `Transit events detected: ${resultCandidate.transitEvents.length}`)
  assert(resultCandidate.bestCandidate !== undefined, 'Best candidate populated from algorithm')
  assert(
    typeof resultCandidate.bestCandidate?.period === 'number' && resultCandidate.bestCandidate.period > 0,
    `Estimated period derived: ${resultCandidate.bestCandidate?.period} d`
  )
  assert(
    typeof resultCandidate.bestCandidate?.depthPpm === 'number' && resultCandidate.bestCandidate.depthPpm > 0,
    `Transit depth derived: ${resultCandidate.bestCandidate?.depthPpm} ppm`
  )
  assert(
    typeof resultCandidate.bestCandidate?.snr === 'number' && resultCandidate.bestCandidate.snr > 0,
    `SNR derived: ${resultCandidate.bestCandidate?.snr} σ`
  )

  const outcomeCandidate = determineOutcome(resultCandidate)
  assert(outcomeCandidate.type === 'POTENTIAL_TRANSIT', `Outcome classified as: ${outcomeCandidate.label}`)
  assert(outcomeCandidate.badgeVariant === 'success', 'Outcome badge variant is success')

  // Test 3: No Transit Found - Flat Baseline (Requirements 6, 7, 8)
  console.log('\nTest 3: Transit Detection - No Convincing Transit Found (Flat Control)')
  const flatPoints = generateFlatLightCurve(20, 30)
  const flatStar = {
    id: 'CTRL-01',
    name: 'Quiet Control Star',
    mission: 'Custom' as const,
    ra: 0,
    dec: 0,
    magnitude: 10,
    temperature: 5500,
    stellarRadius: 1.0,
    stellarMass: 1.0,
    observationDate: '2024-01-01',
    numPoints: flatPoints.length
  }
  const resultFlat = await runTransitDetection(flatStar, flatPoints)
  const outcomeFlat = determineOutcome(resultFlat)
  assert(resultFlat.transitEvents.length === 0, 'No transit events found on flat curve')
  assert(outcomeFlat.type === 'NO_TRANSIT', `Outcome classified as: ${outcomeFlat.label}`)
  assert(outcomeFlat.badgeVariant === 'outline', 'Outcome badge variant is outline')

  // Test 4: Inconclusive - High Noise / Flare Star (Requirements 6, 7, 8)
  console.log('\nTest 4: Transit Detection - Inconclusive Outcome (Noisy Flare Star)')
  const noisyPoints = generateNoisyLightCurve(8, 30)
  const noisyStar = {
    id: 'NOISE-01',
    name: 'Active Flare Host',
    mission: 'Custom' as const,
    ra: 0,
    dec: 0,
    magnitude: 14,
    temperature: 3100,
    stellarRadius: 0.2,
    stellarMass: 0.15,
    observationDate: '2024-01-01',
    numPoints: noisyPoints.length
  }
  const resultNoisy = await runTransitDetection(noisyStar, noisyPoints)
  const outcomeNoisy = determineOutcome(resultNoisy)
  assert(outcomeNoisy.type === 'INCONCLUSIVE', `Outcome classified as: ${outcomeNoisy.label}`)
  assert(outcomeNoisy.badgeVariant === 'warning', 'Outcome badge variant is warning')

  // Summary
  console.log(`\n==================================================`)
  console.log(`Verification Complete: ${passed} Passed, ${failed} Failed`)
  if (failed > 0) {
    process.exit(1)
  }
}

runTests().catch((err) => {
  console.error('Test execution error:', err)
  process.exit(1)
})
