import { useState, useMemo } from 'react'
import { Activity, ChevronDown, ChevronRight, Search, Sparkles, Compass } from 'lucide-react'
import { RootLayout } from './layouts/RootLayout'
import { UploadView } from './features/upload/UploadView'
import { ResultsView } from './features/results/ResultsView'
import { StarCatalogView } from './features/stars/StarCatalogView'
import { DocsPage } from './pages/DocsPage'
import { AnalysisResultsPanel } from './features/analysis/AnalysisResultsPanel'
import { LightCurvePlot } from './features/analysis/LightCurvePlot'
import { useAnalysisWorkflow } from './features/analysis/useAnalysisWorkflow'
import { PREDEFINED_OBSERVATIONS, type PredefinedObservation } from './data/observations'
import { MOCK_STARS, generateSyntheticLightCurve } from './data/mockData'
import { Badge } from './components/ui/Badge'
import { ExplorerView } from './features/explorer'
import type {
  AnalysisResult,
  LightCurvePoint,
  NavigationTab,
  SpaceMission,
  StarObservation,
} from './types'
import './App.css'

const missionOptions: SpaceMission[] = ['TESS', 'Kepler', 'K2', 'Custom']

function makeWorkspaceStar(identifier: string, mission: SpaceMission): StarObservation {
  const target = identifier.trim()
  const matched = MOCK_STARS.find(
    (s) => s.id.toLowerCase() === target.toLowerCase() || s.name.toLowerCase() === target.toLowerCase()
  )
  if (matched) {
    return matched
  }

  const matchedObs = PREDEFINED_OBSERVATIONS.find(
    (o) => o.id.toLowerCase() === target.toLowerCase() || o.name.toLowerCase() === target.toLowerCase()
  )
  if (matchedObs) {
    return matchedObs.star
  }

  return {
    id: target || '—',
    name: target || 'No target selected',
    catalogId: target || undefined,
    mission,
    ra: 0,
    dec: 0,
    magnitude: 0,
    temperature: 0,
    stellarRadius: 0,
    stellarMass: 0,
    observationDate: '',
    numPoints: 0,
  }
}

interface DiscoveryWorkspaceProps {
  targetId: string
  setTargetId: (value: string) => void
  mission: SpaceMission
  setMission: (value: SpaceMission) => void
  selectedStar: StarObservation
  lightCurve: LightCurvePoint[]
  workflow: ReturnType<typeof useAnalysisWorkflow>
  selectedObsId: string
  onSelectObservation: (obsId: string) => void
  currentObs?: PredefinedObservation
}

function DiscoveryWorkspace({
  targetId,
  setTargetId,
  mission,
  setMission,
  selectedStar,
  lightCurve,
  workflow,
  selectedObsId,
  onSelectObservation,
  currentObs
}: DiscoveryWorkspaceProps) {
  return (
    <div className="dashboard-workspace" id="workspace">
      <header className="page-intro">
        <div className="page-kicker"><span /> TRANSIT PHOTOMETRY</div>
        <div className="page-title-row">
          <div>
            <h1>Discover Hidden Worlds</h1>
            <p>
              When an exoplanet crosses in front of its star, the observed brightness dips periodically. Select a target star to analyze its light curve for planetary transit signatures.
            </p>
          </div>
          <div
            className="engine-status"
            aria-label={`Analysis engine status: ${
              workflow.isAnalyzing
                ? 'Processing BLS grid'
                : workflow.status === 'completed'
                ? 'Analysis Ready'
                : 'Connected'
            }`}
          >
            <span
              className="engine-status-dot"
              style={{
                backgroundColor: workflow.isAnalyzing
                  ? '#06b6d4'
                  : workflow.status === 'completed'
                  ? '#10b981'
                  : '#59d6e2'
              }}
              aria-hidden="true"
            />
            <span>Analysis engine</span>
            <strong>
              {workflow.isAnalyzing
                ? 'Processing BLS grid...'
                : workflow.status === 'completed'
                ? 'Outcome Available'
                : 'Connected (BLS Algorithm)'}
            </strong>
          </div>
        </div>
      </header>

      {/* Target Star Selection (01) */}
      <section className="target-panel panel" id="target-selection" aria-labelledby="target-heading">
        <div className="target-panel-heading">
          <div className="section-number">01</div>
          <div>
            <h2 id="target-heading">Select a target star</h2>
            <p>Choose a calibrated test observation below or enter a custom catalog identifier.</p>
          </div>
        </div>

        {/* Predefined Observation Selector */}
        <div className="mb-4 p-3 rounded-lg bg-slate-900/70 border border-slate-800 space-y-3">
          <label className="field-group w-full">
            <div className="flex items-center justify-between">
              <span className="field-label text-slate-200 font-semibold text-xs">
                Predefined Test Observation Dataset
              </span>
              <span className="text-[10px] text-cyan-400 font-mono">
                Real & Calibrated Test Cadences
              </span>
            </div>
            <span className="select-wrap bg-[#070b14] border-slate-700">
              <select
                value={selectedObsId}
                onChange={(e) => onSelectObservation(e.target.value)}
                aria-label="Predefined test observations"
                className="bg-transparent text-slate-100 font-mono text-xs w-full focus:outline-none cursor-pointer"
              >
                <optgroup label="🌟 Known Planetary Transit Signals">
                  <option value="TOI-700">TOI-700 — Calibrated Demo Data (TESS Sector 11-13) [Periodic Dips]</option>
                  <option value="Kepler-90">Kepler-90 — Real Astronomical Data (Kepler Q1-Q17) [Multi-Planet]</option>
                  <option value="WASP-12">WASP-12 — Real Astronomical Data (TESS Fast Cadence) [Ultra-Hot Jupiter]</option>
                </optgroup>
                <optgroup label="➖ Flat Baseline Control (No Transits)">
                  <option value="HD-219134">HD 219134 — Real Astronomical Data (Spitzer/Ground) [Flat Quiet Star]</option>
                </optgroup>
                <optgroup label="⚡ High Stellar Noise & Flares (Inconclusive)">
                  <option value="Proxima-Centauri">Proxima Centauri — Real Astronomical Data (TESS) [Active Flare Host]</option>
                </optgroup>
                <optgroup label="⚠️ Diagnostic Validation (<15 Cadences)">
                  <option value="Sparse-Cadence">Sparse Incomplete Test (&lt;15 Points) [Rejection Diagnostic]</option>
                </optgroup>
              </select>
              <ChevronDown size={15} aria-hidden="true" />
            </span>
          </label>

          {/* Observation Details & Astronomical Metadata Badges */}
          {currentObs && (
            <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex flex-wrap items-center gap-1.5">
                {currentObs.dataSourceType === 'REAL' ? (
                  <Badge variant="cyan" className="text-[10px]">
                    {currentObs.dataSourceLabel}
                  </Badge>
                ) : currentObs.dataSourceType === 'CALIBRATED_DEMO' ? (
                  <Badge variant="violet" className="text-[10px]">
                    {currentObs.dataSourceLabel}
                  </Badge>
                ) : (
                  <Badge variant="warning" className="text-[10px]">
                    {currentObs.dataSourceLabel}
                  </Badge>
                )}

                {currentObs.category === 'transit' ? (
                  <Badge variant="success" className="text-[10px]">
                    Known Periodic Transit
                  </Badge>
                ) : currentObs.category === 'flat' ? (
                  <Badge variant="outline" className="text-[10px]">
                    Flat Control Star
                  </Badge>
                ) : currentObs.category === 'noisy' ? (
                  <Badge variant="warning" className="text-[10px]">
                    High Stellar Noise / Flares
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-[10px] text-red-400 border-red-500/30">
                    Incomplete Test Data
                  </Badge>
                )}
              </div>

              <div className="text-[11px] font-mono text-slate-400">
                {selectedStar.temperature ? `Teff: ${selectedStar.temperature}K` : ''}
                {selectedStar.stellarRadius ? ` · R*: ${selectedStar.stellarRadius} R☉` : ''}
                {selectedStar.magnitude ? ` · Mag: ${selectedStar.magnitude}` : ''}
                {selectedStar.spectralType ? ` · Sp: ${selectedStar.spectralType}` : ''}
              </div>

              <div className="w-full text-[11px] text-slate-400 italic">
                {currentObs.scientificContext}
              </div>
            </div>
          )}
        </div>

        <div className="target-form">
          <label className="field-group target-id-field">
            <span className="field-label">Target identifier</span>
            <span className="input-wrap">
              <Search size={17} aria-hidden="true" />
              <input
                type="text"
                value={targetId}
                onChange={(event) => {
                  setTargetId(event.target.value)
                  workflow.resetAnalysis()
                }}
                placeholder="Enter a catalog ID or target name (e.g. TOI-700, Kepler-90)"
                autoComplete="off"
                aria-label="Target star identifier or coordinates"
              />
            </span>
          </label>

          <label className="field-group mission-field">
            <span className="field-label">Mission</span>
            <span className="select-wrap">
              <select
                value={mission}
                onChange={(event) => {
                  setMission(event.target.value as SpaceMission)
                  workflow.resetAnalysis()
                }}
                aria-label="Observation mission"
              >
                {missionOptions.map((item) => <option key={item}>{item}</option>)}
              </select>
              <ChevronDown size={15} aria-hidden="true" />
            </span>
          </label>

          {/* Analyze Star button - enabled only when valid data is available (Requirement 2 & 3) */}
          <button
            className="analyze-button"
            type="button"
            onClick={() => workflow.runAnalysis()}
            disabled={!workflow.canAnalyze || workflow.isAnalyzing}
            aria-busy={workflow.isAnalyzing}
            aria-disabled={!workflow.canAnalyze || workflow.isAnalyzing}
            title={
              !workflow.canAnalyze
                ? workflow.validationReason || 'Valid observation and light curve data required'
                : 'Run client-side BLS algorithmic transit detection'
            }
          >
            {workflow.isAnalyzing ? (
              <>
                <Activity size={17} className="animate-spin" aria-hidden="true" />
                <span>Analyzing...</span>
              </>
            ) : (
              <>
                <span>Analyze Star</span>
                <ChevronRight size={17} strokeWidth={2} aria-hidden="true" />
              </>
            )}
          </button>
        </div>

        {/* Quick Sample Observation Presets */}
        <div className="mt-3 pt-3 border-t border-slate-800/80 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-400 mr-1">
            Quick Presets:
          </span>
          {PREDEFINED_OBSERVATIONS.map((obs) => {
            const isSelected = selectedObsId === obs.id
            return (
              <button
                key={obs.id}
                type="button"
                onClick={() => onSelectObservation(obs.id)}
                className={`px-2.5 py-1 rounded text-[11px] font-mono transition-colors cursor-pointer border ${
                  isSelected
                    ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 shadow-[0_0_10px_rgba(6,182,212,0.2)]'
                    : 'bg-slate-900/80 hover:bg-slate-850 border-slate-750 text-slate-300'
                }`}
              >
                {obs.id}
              </button>
            )
          })}
        </div>

        <div className="target-footnote">
          <span className="footnote-dot" aria-hidden="true" />
          {lightCurve.length >= 15 ? (
            <span className="text-emerald-400">
              ✓ {lightCurve.length.toLocaleString()} calibrated photometric cadences loaded and ready for analysis.
            </span>
          ) : (
            <span className="text-amber-400">
              ⚠ {lightCurve.length} cadences available. At least 15 valid photometric cadences required to run the detection algorithm.
            </span>
          )}
        </div>
      </section>

      {/* Main Analysis Layout: Light Curve & Results Panel */}
      <div className="analysis-layout">
        <section className="chart-panel panel" id="light-curve" aria-labelledby="light-curve-heading">
          <div className="panel-heading chart-heading">
            <div>
              <div className="heading-overline">OBSERVATION VIEW</div>
              <h2 id="light-curve-heading">Light curve</h2>
              <p>Continuous brightness over observation baseline</p>
            </div>
            <div className="chart-status">
              <span />
              {lightCurve.length ? `${lightCurve.length.toLocaleString()} points · ${selectedStar.mission}` : 'No observation data'}
            </div>
          </div>
          <div className="chart-stage">
            <div className="chart-y-label">Relative flux (F / F₀)</div>
            <LightCurvePlot
              data={lightCurve}
              detectedIntervals={workflow.result?.detectedIntervals}
              isTransitCandidate={workflow.result?.bestCandidate !== undefined}
              modelFit={workflow.result?.modelFit}
              isAnalyzing={workflow.isAnalyzing}
            />
            <div className="chart-x-label">Observation Time (Days)</div>
          </div>
          <div className="chart-footer flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <i className="legend-dot" /> Normalized Flux
            </span>
            <span>
              {lightCurve.length
                ? `${selectedStar.name || selectedStar.id} time series (${lightCurve.length.toLocaleString()} cadences)`
                : 'Waiting for observation data'}
            </span>
            {workflow.result?.bestCandidate && (
              <span className="text-emerald-400 font-mono text-[11px] flex items-center gap-1">
                <Sparkles size={13} />
                {workflow.result.detectedIntervals?.length || 1} transit window(s) identified
              </span>
            )}
          </div>
        </section>

        {/* Member 6 Interactive Results Panel (Requirements 4 - 9) */}
        <AnalysisResultsPanel
          observation={selectedStar}
          lightCurve={lightCurve}
          status={workflow.status}
          progress={workflow.progress}
          result={workflow.result}
          error={workflow.error}
          isAnalyzing={workflow.isAnalyzing}
          canAnalyze={workflow.canAnalyze}
          validationReason={workflow.validationReason}
          onRunAnalysis={() => workflow.runAnalysis()}
          onResetAnalysis={() => workflow.resetAnalysis()}
        />
      </div>

      <footer className="workspace-footer">
        <span>TransitLens <span className="footer-separator">/</span> Discovery workspace</span>
        <span>Algorithmic Transit Detection & Results Pipeline</span>
      </footer>
    </div>
  )
}

export function App() {
  const [activeTab, setActiveTab] = useState<NavigationTab>('analysis')
  const [selectedObsId, setSelectedObsId] = useState<string>('TOI-700')
  const [targetId, setTargetId] = useState<string>('TOI-700')
  const [mission, setMission] = useState<SpaceMission>('TESS')
  const [lightCurve, setLightCurve] = useState<LightCurvePoint[]>(() => {
    const initialObs = PREDEFINED_OBSERVATIONS.find((o) => o.id === 'TOI-700')
    return initialObs ? initialObs.lightCurve : generateSyntheticLightCurve(3.742, 0.85, 0.0092, 3.25, 25, 30)
  })
  const [results, setResults] = useState<AnalysisResult[]>([])

  const currentObs = useMemo(() => {
    return PREDEFINED_OBSERVATIONS.find((o) => o.id === selectedObsId)
  }, [selectedObsId])

  const selectedStar: StarObservation = useMemo(() => {
    if (currentObs) {
      return currentObs.star
    }
    return makeWorkspaceStar(targetId, mission)
  }, [currentObs, targetId, mission])

  const stars = useMemo(() => {
    const predefinedStars = PREDEFINED_OBSERVATIONS.map((o) => o.star)
    return [selectedStar, ...predefinedStars.filter((s) => s.id !== selectedStar.id)]
  }, [selectedStar])

  // Coordinated workflow hook with client-side detection engine
  const workflow = useAnalysisWorkflow({
    star: selectedStar,
    lightCurve,
    onAnalysisCompleted: (completedResult) => {
      setResults((prev) => [
        completedResult,
        ...prev.filter((r) => r.observationId !== completedResult.observationId)
      ])
    }
  })

  const handleSelectObservation = (obsId: string) => {
    setSelectedObsId(obsId)
    const obs = PREDEFINED_OBSERVATIONS.find((o) => o.id === obsId)
    if (obs) {
      setTargetId(obs.star.name || obs.star.id)
      setMission(obs.star.mission)
      setLightCurve(obs.lightCurve)
      workflow.resetAnalysis()
    }
  }

  const handleSelectStar = (star: StarObservation) => {
    const matched = PREDEFINED_OBSERVATIONS.find(
      (o) =>
        o.id.toLowerCase() === star.id.toLowerCase() ||
        o.star.id.toLowerCase() === star.id.toLowerCase() ||
        o.star.name.toLowerCase() === star.name.toLowerCase()
    )
    if (matched) {
      handleSelectObservation(matched.id)
    } else {
      setSelectedObsId('')
      setTargetId(star.id === '—' ? '' : star.name || star.id)
      setMission(star.mission)
      setLightCurve(generateSyntheticLightCurve(3.52, 0.85, 0.0095, 2.4, 20, 30))
      workflow.resetAnalysis()
    }
  }

  return (
    <RootLayout
      activeTab={activeTab}
      onSelectTab={setActiveTab}
      selectedStar={selectedStar}
      stars={stars}
      onSelectStar={handleSelectStar}
      analysisStatus={workflow.status}
      onRunAnalysis={() => workflow.runAnalysis()}
      onResetAnalysis={() => workflow.resetAnalysis()}
      isAnalyzing={workflow.isAnalyzing}
      canAnalyze={workflow.canAnalyze}
    >
      {activeTab === 'universe' && (
        <ExplorerView
          stars={stars}
          selectedStarId={selectedStar.id}
          onSelectStar={handleSelectStar}
          onNavigateToAnalysis={() => setActiveTab('analysis')}
          onReturnToUniverse={() => {
            // reset selection back to first catalog star or default
            if (stars.length > 0) handleSelectStar(stars[0])
          }}
        />
      )}

      {activeTab === 'analysis' && (
        <DiscoveryWorkspace
          targetId={targetId}
          setTargetId={setTargetId}
          mission={mission}
          setMission={setMission}
          selectedStar={selectedStar}
          lightCurve={lightCurve}
          workflow={workflow}
          selectedObsId={selectedObsId}
          onSelectObservation={handleSelectObservation}
          currentObs={currentObs}
        />
      )}

      {activeTab === 'stars' && (
        <StarCatalogView
          stars={stars}
          selectedStarId={selectedStar.id}
          onSelectStar={(star) => {
            handleSelectStar(star)
            setActiveTab('analysis')
          }}
        />
      )}

      {activeTab === 'upload' && (
        <UploadView
          onLightCurveLoaded={(points, filename) => {
            setSelectedObsId('')
            setLightCurve(points)
            if (filename) {
              setTargetId(filename.replace(/(\.csv|\.fits|\.json|\.tsv)$/i, ''))
            }
            workflow.resetAnalysis()
            setActiveTab('analysis')
          }}
        />
      )}

      {activeTab === 'results' && <ResultsView results={results} />}

      {activeTab === 'docs' && <DocsPage />}
    </RootLayout>
  )
}

export default App
