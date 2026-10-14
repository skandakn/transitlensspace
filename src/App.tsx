import { useState, useMemo } from 'react'
import {
  CartesianGrid,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Activity, ChevronDown, ChevronRight, Search } from 'lucide-react'
import { RootLayout } from './layouts/RootLayout'
import { UploadView } from './features/upload/UploadView'
import { ResultsView } from './features/results/ResultsView'
import { StarCatalogView } from './features/stars/StarCatalogView'
import { DocsPage } from './pages/DocsPage'
import { AnalysisResultsPanel } from './features/analysis/AnalysisResultsPanel'
import { useAnalysisWorkflow } from './features/analysis/useAnalysisWorkflow'
import { generateFlatLightCurve, generateNoisyLightCurve } from './features/analysis/transitDetection'
import { MOCK_STARS, generateSyntheticLightCurve } from './data/mockData'
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
  // Check if target matches one of our known catalog stars
  const matched = MOCK_STARS.find(
    (s) => s.id.toLowerCase() === target.toLowerCase() || s.name.toLowerCase() === target.toLowerCase()
  )
  if (matched) {
    return matched
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

function LightCurveChart({ data }: { data: LightCurvePoint[] }) {
  if (data.length === 0) {
    return (
      <div className="chart-grid" aria-hidden="true">
        {Array.from({ length: 16 }, (_, index) => <span key={index} />)}
        <div className="chart-empty-state">
          <div className="chart-empty-icon"><Activity size={19} strokeWidth={1.7} /></div>
          <p>Light curve will appear here</p>
          <span>Choose a target star and connect observation data to begin.</span>
        </div>
      </div>
    )
  }

  return (
    <div className="chart-grid chart-grid--populated">
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart data={data} margin={{ top: 10, right: 12, bottom: 8, left: 4 }}>
          <CartesianGrid strokeDasharray="3 5" stroke="#2b3a4b" opacity={0.65} />
          <XAxis
            dataKey="time"
            name="Time"
            type="number"
            tick={{ fill: '#8293a7', fontSize: 9 }}
            tickLine={{ stroke: '#394a5d' }}
            axisLine={{ stroke: '#394a5d' }}
            tickFormatter={(val) => `${val}d`}
          />
          <YAxis
            dataKey="flux"
            name="Relative flux"
            type="number"
            domain={['auto', 'auto']}
            width={54}
            tick={{ fill: '#8293a7', fontSize: 9 }}
            tickLine={{ stroke: '#394a5d' }}
            axisLine={{ stroke: '#394a5d' }}
            tickFormatter={(value: number) => value.toFixed(4)}
          />
          <Tooltip
            cursor={{ strokeDasharray: '3 3', stroke: '#5b728a' }}
            contentStyle={{ border: '1px solid #34495b', borderRadius: 6, color: '#dce8f4', background: '#0b1522' }}
            formatter={(value) => [Number(value).toFixed(6), 'Flux']}
            labelFormatter={(value) => `Time: ${value} d`}
          />
          <Scatter name="Observed flux" dataKey="flux" fill="#59d6e2" opacity={0.78} />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  )
}

interface DiscoveryWorkspaceProps {
  targetId: string
  setTargetId: (value: string) => void
  mission: SpaceMission
  setMission: (value: SpaceMission) => void
  selectedStar: StarObservation
  lightCurve: LightCurvePoint[]
  workflow: ReturnType<typeof useAnalysisWorkflow>
  onSelectPreset: (star: StarObservation, points: LightCurvePoint[]) => void
}

function DiscoveryWorkspace({
  targetId,
  setTargetId,
  mission,
  setMission,
  selectedStar,
  lightCurve,
  workflow,
  onSelectPreset,
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
                ? 'Processing'
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
                : 'Connected (Member 5 BLS)'}
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
            <p>Enter a catalog identifier and mission, or load a calibrated observation set below.</p>
          </div>
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
          
          {/* Analyze Star button - enabled only when valid data is available (Requirement 2) */}
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
                : 'Run Member 5 BLS algorithmic transit detection'
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
            Quick Load Presets:
          </span>
          <button
            type="button"
            onClick={() => {
              const star = MOCK_STARS[0] // TOI-700
              const points = generateSyntheticLightCurve(3.742, 0.85, 0.0092, 3.25, 25, 30)
              onSelectPreset(star, points)
            }}
            className="px-2.5 py-1 rounded bg-cyan-950/40 hover:bg-cyan-900/60 border border-cyan-500/30 text-cyan-300 text-[11px] font-mono transition-colors cursor-pointer"
          >
            TOI-700 (Periodic Transit)
          </button>
          <button
            type="button"
            onClick={() => {
              const star = MOCK_STARS[1] // Kepler-90
              const points = generateSyntheticLightCurve(4.25, 1.22, 0.0084, 4.1, 28, 30)
              onSelectPreset(star, points)
            }}
            className="px-2.5 py-1 rounded bg-violet-950/40 hover:bg-violet-900/60 border border-violet-500/30 text-violet-300 text-[11px] font-mono transition-colors cursor-pointer"
          >
            Kepler-90 (Confirmed Orbit)
          </button>
          <button
            type="button"
            onClick={() => {
              const star = {
                id: 'CTRL-99214',
                name: 'HD 219134 (Flat Control)',
                mission: 'Custom' as SpaceMission,
                ra: 348.32,
                dec: 57.17,
                magnitude: 5.57,
                temperature: 4699,
                stellarRadius: 0.77,
                stellarMass: 0.81,
                observationDate: '2024-01-10',
                numPoints: 960,
                description: 'Quiet K-dwarf reference star with no planetary occultations.'
              }
              const points = generateFlatLightCurve(20, 30)
              onSelectPreset(star, points)
            }}
            className="px-2.5 py-1 rounded bg-slate-900/80 hover:bg-slate-800 border border-slate-700 text-slate-300 text-[11px] font-mono transition-colors cursor-pointer"
          >
            HD 219134 (Flat Baseline)
          </button>
          <button
            type="button"
            onClick={() => {
              const star = {
                id: 'FLARE-4081',
                name: 'Proxima Cen (Noisy Flare Star)',
                mission: 'Custom' as SpaceMission,
                ra: 217.42,
                dec: -62.67,
                magnitude: 11.13,
                temperature: 3042,
                stellarRadius: 0.14,
                stellarMass: 0.12,
                observationDate: '2024-02-14',
                numPoints: 480,
                description: 'Active flare host exhibiting extreme photometric dispersion.'
              }
              const points = generateNoisyLightCurve(10, 30)
              onSelectPreset(star, points)
            }}
            className="px-2.5 py-1 rounded bg-amber-950/40 hover:bg-amber-900/60 border border-amber-500/30 text-amber-300 text-[11px] font-mono transition-colors cursor-pointer"
          >
            Proxima (High Noise)
          </button>
        </div>

        <div className="target-footnote">
          <span className="footnote-dot" aria-hidden="true" />
          {lightCurve.length > 0 ? (
            <span className="text-emerald-400">
              ✓ {lightCurve.length.toLocaleString()} calibrated photometric cadences ready for analysis.
            </span>
          ) : (
            <span>
              Target details loaded in workspace preview. Connect observation cadences or pick a preset above to enable analysis.
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
              {lightCurve.length ? `${lightCurve.length.toLocaleString()} points` : 'No observation data'}
            </div>
          </div>
          <div className="chart-stage">
            <div className="chart-y-label">Relative flux</div>
            <LightCurveChart data={lightCurve} />
            <div className="chart-x-label">Time (Days)</div>
          </div>
          <div className="chart-footer">
            <span><i className="legend-dot" /> Stellar flux</span>
            <span>{lightCurve.length ? `${selectedStar.name || selectedStar.id} time series` : 'Waiting for observation data'}</span>
          </div>
        </section>

        {/* Member 6 Interactive Results Panel (Requirements 1 - 9) */}
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
        <span>Member 6 Interactive Analysis & Results Pipeline</span>
      </footer>
    </div>
  )
}

export function App() {
  const [activeTab, setActiveTab] = useState<NavigationTab>('analysis')
  const [targetId, setTargetId] = useState('TOI-700')
  const [mission, setMission] = useState<SpaceMission>('TESS')
  const [lightCurve, setLightCurve] = useState<LightCurvePoint[]>(() =>
    generateSyntheticLightCurve(3.742, 0.85, 0.0092, 3.25, 25, 30)
  )
  const [results, setResults] = useState<AnalysisResult[]>([])

  const selectedStar: StarObservation = useMemo(() => {
    return makeWorkspaceStar(targetId, mission)
  }, [targetId, mission])

  const stars = useMemo(() => {
    return targetId.trim() ? [selectedStar, ...MOCK_STARS.filter((s) => s.id !== selectedStar.id)] : MOCK_STARS
  }, [selectedStar, targetId])

  // Coordinated workflow hook with Member 5 detection engine
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

  const handleSelectStar = (star: StarObservation) => {
    setTargetId(star.id === '—' ? '' : star.name || star.id)
    setMission(star.mission)
    workflow.resetAnalysis()

    // Load appropriate light curve for known star
    if (star.name === 'TOI-700' || star.id === 'TIC-261136679') {
      setLightCurve(generateSyntheticLightCurve(3.742, 0.85, 0.0092, 3.25, 25, 30))
    } else if (star.name === 'Kepler-90' || star.id === 'KIC-11442793') {
      setLightCurve(generateSyntheticLightCurve(4.25, 1.22, 0.0084, 4.1, 28, 30))
    } else if (star.name === 'Kepler-22' || star.id === 'KIC-10593626') {
      setLightCurve(generateSyntheticLightCurve(289.86, 4.5, 0.0049, 7.4, 30, 30))
    } else if (star.name === 'TRAPPIST-1' || star.id === 'TIC-149603524') {
      setLightCurve(generateSyntheticLightCurve(1.51, 0.42, 0.0071, 0.6, 15, 10))
    } else {
      setLightCurve(generateSyntheticLightCurve(3.52, 0.85, 0.0095, 2.4, 20, 30))
    }
  }

  const handleSelectPreset = (star: StarObservation, points: LightCurvePoint[]) => {
    setTargetId(star.name || star.id)
    setMission(star.mission)
    setLightCurve(points)
    workflow.resetAnalysis()
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
    >
      {activeTab === 'analysis' && (
        <DiscoveryWorkspace
          targetId={targetId}
          setTargetId={setTargetId}
          mission={mission}
          setMission={setMission}
          selectedStar={selectedStar}
          lightCurve={lightCurve}
          workflow={workflow}
          onSelectPreset={handleSelectPreset}
        />
      )}

      {activeTab === 'stars' && (
        <StarCatalogView
          stars={MOCK_STARS}
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
