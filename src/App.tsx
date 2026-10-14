import { useState } from 'react'
import {
  CartesianGrid,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Activity, ChevronDown, ChevronRight, Search, Star } from 'lucide-react'
import { RootLayout } from './layouts/RootLayout'
import { UploadView } from './features/upload/UploadView'
import { ResultsView } from './features/results/ResultsView'
import { DocsPage } from './pages/DocsPage'
import type {
  AnalysisResult,
  AnalysisStatus,
  LightCurvePoint,
  NavigationTab,
  SpaceMission,
  StarObservation,
} from './types'
import './App.css'

const missionOptions: SpaceMission[] = ['TESS', 'Kepler', 'K2', 'Custom']

function makeWorkspaceStar(identifier: string, mission: SpaceMission): StarObservation {
  const target = identifier.trim()
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
          <span>Choose a target and connect an observation set to begin.</span>
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
            labelFormatter={(value) => `Time: ${value}`}
          />
          <Scatter name="Observed flux" dataKey="flux" fill="#59d6e2" opacity={0.78} />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  )
}

function DiscoveryWorkspace({
  targetId,
  setTargetId,
  mission,
  setMission,
  analysisRequested,
  onAnalyze,
  lightCurve,
}: {
  targetId: string
  setTargetId: (value: string) => void
  mission: SpaceMission
  setMission: (value: SpaceMission) => void
  analysisRequested: boolean
  onAnalyze: () => void
  lightCurve: LightCurvePoint[]
}) {
  return (
    <div className="dashboard-workspace" id="workspace">
      <header className="page-intro">
        <div className="page-kicker"><span /> TRANSIT PHOTOMETRY</div>
        <div className="page-title-row">
          <div>
            <h1>Discover Hidden Worlds</h1>
            <p>
              When a planet crosses in front of its star, the observed brightness can dip. Select a target to prepare its light-curve workspace.
            </p>
          </div>
          <div className="engine-status" aria-label="Analysis engine not connected">
            <span className="engine-status-dot" aria-hidden="true" />
            <span>Analysis engine</span>
            <strong>Not connected</strong>
          </div>
        </div>
      </header>

      <section className="target-panel panel" id="target-selection" aria-labelledby="target-heading">
        <div className="target-panel-heading">
          <div className="section-number">01</div>
          <div>
            <h2 id="target-heading">Select a target star</h2>
            <p>Enter a catalog identifier and mission to define this workspace.</p>
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
                onChange={(event) => setTargetId(event.target.value)}
                placeholder="Enter a catalog ID or coordinates"
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
                onChange={(event) => setMission(event.target.value as SpaceMission)}
                aria-label="Observation mission"
              >
                {missionOptions.map((item) => <option key={item}>{item}</option>)}
              </select>
              <ChevronDown size={15} aria-hidden="true" />
            </span>
          </label>
          <button className="analyze-button" type="button" onClick={onAnalyze} disabled={!targetId.trim()}>
            <span>Analyze Star</span>
            <ChevronRight size={17} strokeWidth={2} aria-hidden="true" />
          </button>
        </div>
        <div className="target-footnote">
          <span className="footnote-dot" aria-hidden="true" />
          Target details stay in this workspace preview; no catalog lookup is active.
        </div>
      </section>

      <div className="analysis-layout">
        <section className="chart-panel panel" id="light-curve" aria-labelledby="light-curve-heading">
          <div className="panel-heading chart-heading">
            <div>
              <div className="heading-overline">OBSERVATION VIEW</div>
              <h2 id="light-curve-heading">Light curve</h2>
              <p>Brightness over time</p>
            </div>
            <div className="chart-status"><span />{lightCurve.length ? `${lightCurve.length.toLocaleString()} points` : 'No observation data'}</div>
          </div>
          <div className="chart-stage">
            <div className="chart-y-label">Relative flux</div>
            <LightCurveChart data={lightCurve} />
            <div className="chart-x-label">Time</div>
          </div>
          <div className="chart-footer">
            <span><i className="legend-dot" /> Stellar flux</span>
            <span>{lightCurve.length ? 'Uploaded observation data' : 'Waiting for observation data'}</span>
          </div>
        </section>

        <section className="results-panel panel" id="results" aria-labelledby="results-heading">
          <div className="panel-heading results-heading">
            <div>
              <div className="heading-overline">ANALYSIS</div>
              <h2 id="results-heading">Results summary</h2>
            </div>
            <span className="results-state">{analysisRequested ? 'Unavailable' : 'Not run'}</span>
          </div>

          <div className={`results-empty${analysisRequested ? ' results-empty--notice' : ''}`} aria-live="polite">
            <div className="results-icon"><Star size={18} strokeWidth={1.7} /></div>
            <h3>{analysisRequested ? 'Analysis service unavailable' : 'No analysis yet'}</h3>
            <p>
              {analysisRequested
                ? 'The analysis engine is not connected in this preview. No results have been generated.'
                : 'Choose a target star and load its observations. Analysis output will be shown here when available.'}
            </p>
          </div>

          <div className="result-fields" aria-label="Analysis output fields">
            <div><span>Target</span><strong>{targetId.trim() || '—'}</strong></div>
            <div><span>Mission</span><strong>{targetId.trim() ? mission : '—'}</strong></div>
            <div><span>Transit candidates</span><strong>—</strong></div>
            <div><span>Signal review</span><strong>—</strong></div>
          </div>
          <div className="results-note"><span className="note-mark">i</span> No discovery claims are made without analysis output.</div>
        </section>
      </div>

      <footer className="workspace-footer">
        <span>TransitLens <span className="footer-separator">/</span> Discovery workspace</span>
        <span>Research interface preview</span>
      </footer>
    </div>
  )
}

function App() {
  const [activeTab, setActiveTab] = useState<NavigationTab>('analysis')
  const [targetId, setTargetId] = useState('')
  const [mission, setMission] = useState<SpaceMission>('Custom')
  const [analysisRequested, setAnalysisRequested] = useState(false)
  const [lightCurve, setLightCurve] = useState<LightCurvePoint[]>([])
  const analysisStatus: AnalysisStatus = 'idle'
  const results: AnalysisResult[] = []
  const selectedStar: StarObservation = makeWorkspaceStar(targetId, mission)
  const stars = targetId.trim() ? [selectedStar] : []

  const handleAnalyze = () => {
    if (targetId.trim()) setAnalysisRequested(true)
  }

  const handleSelectStar = (star: StarObservation) => {
    setTargetId(star.id === '—' ? '' : star.id)
    setMission(star.mission)
    setAnalysisRequested(false)
    setLightCurve([])
  }

  return (
    <RootLayout
      activeTab={activeTab}
      onSelectTab={setActiveTab}
      selectedStar={selectedStar}
      stars={stars}
      onSelectStar={handleSelectStar}
      analysisStatus={analysisStatus}
      onRunAnalysis={handleAnalyze}
      onResetAnalysis={() => setAnalysisRequested(false)}
      isAnalyzing={false}
    >
      {activeTab === 'analysis' && (
        <DiscoveryWorkspace
          targetId={targetId}
          setTargetId={(value) => {
            setTargetId(value)
            setAnalysisRequested(false)
            setLightCurve([])
          }}
          mission={mission}
          setMission={(value) => {
            setMission(value)
            setAnalysisRequested(false)
          }}
          analysisRequested={analysisRequested}
          onAnalyze={handleAnalyze}
          lightCurve={lightCurve}
        />
      )}

      {activeTab === 'stars' && (
        <div className="module-empty panel">
          <div className="section-number">02</div>
          <h1>Target catalog</h1>
          <p>No catalog lookup is connected. Enter a target identifier in the Discovery workspace to prepare a search.</p>
          <button type="button" onClick={() => setActiveTab('analysis')}>Back to discovery</button>
        </div>
      )}

      {activeTab === 'upload' && (
        <UploadView
          onLightCurveLoaded={(points) => {
            setLightCurve(points)
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
