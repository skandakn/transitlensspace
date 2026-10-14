import { useState, useRef } from 'react'
import { UploadCloud, FileText, CheckCircle2, AlertCircle, HelpCircle } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import type { LightCurvePoint } from '../../types'
import { generateSyntheticLightCurve } from '../../data/mockData'

export interface UploadViewProps {
  onLightCurveLoaded?: (points: LightCurvePoint[], filename: string) => void
}

function parseLightCurveText(text: string): LightCurvePoint[] {
  const trimmed = text.trim()
  if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
    try {
      const parsed = JSON.parse(trimmed)
      const arr = Array.isArray(parsed) ? parsed : parsed.data || parsed.points || []
      const points: LightCurvePoint[] = []
      for (const item of arr) {
        const time = Number(item.time ?? item.Time ?? item.TIME ?? item.bjd ?? item.BJD ?? item.t)
        const flux = Number(item.flux ?? item.Flux ?? item.FLUX ?? item.pdcsap_flux ?? item.f)
        if (!isNaN(time) && !isNaN(flux)) {
          points.push({ time, flux })
        }
      }
      if (points.length) return points
    } catch {
      // fallback to line parsing
    }
  }

  const lines = trimmed.split(/\r?\n/)
  const points: LightCurvePoint[] = []
  let timeCol = 0
  let fluxCol = 1
  let startIdx = 0

  if (lines.length > 0) {
    const firstLine = lines[0].toLowerCase()
    const headerCols = firstLine.split(/,|\t|\s+/)
    const timeIdx = headerCols.findIndex((c) => c.includes('time') || c.includes('bjd') || c === 't')
    const fluxIdx = headerCols.findIndex((c) => c.includes('flux') || c.includes('mag') || c === 'f')
    if (timeIdx !== -1 && fluxIdx !== -1) {
      timeCol = timeIdx
      fluxCol = fluxIdx
      startIdx = 1
    } else if (isNaN(Number(headerCols[0]))) {
      startIdx = 1
    }
  }

  for (let i = startIdx; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line || line.startsWith('#')) continue
    const parts = line.split(/,|\t|\s+/)
    if (parts.length >= 2) {
      const time = parseFloat(parts[timeCol])
      const flux = parseFloat(parts[fluxCol])
      if (!isNaN(time) && !isNaN(flux)) {
        points.push({ time, flux })
      }
    }
  }

  return points
}

export function UploadView({ onLightCurveLoaded }: UploadViewProps) {
  const [dragActive, setDragActive] = useState(false)
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null)
  const [parseError, setParseError] = useState<string | null>(null)
  const [pointCount, setPointCount] = useState<number>(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleProcessFile = async (file: File) => {
    try {
      setParseError(null)
      setSelectedFileName(file.name)
      const text = await file.text()
      const parsedPoints = parseLightCurveText(text)

      if (parsedPoints.length < 5) {
        setParseError(`File "${file.name}" contained insufficient valid (time, flux) rows (${parsedPoints.length} points parsed). Check formatting.`)
        return
      }

      setPointCount(parsedPoints.length)
      onLightCurveLoaded?.(parsedPoints, file.name)
    } catch (err) {
      setParseError(`Failed to read file: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  const handleSimulateDemoUpload = () => {
    const filename = 'TOI-700_sector11_lc_clean.csv'
    setSelectedFileName(filename)
    setParseError(null)
    const samplePoints = generateSyntheticLightCurve(3.742, 0.85, 0.0092, 3.25, 25, 30)
    setPointCount(samplePoints.length)
    onLightCurveLoaded?.(samplePoints, filename)
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-white tracking-wide flex items-center gap-2">
          <UploadCloud className="w-5 h-5 text-cyan-400" />
          Photometry Ingestion Hub
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Import photometric time series from Kepler, TESS, or ground-based survey observatories
        </p>
      </div>

      {/* Drop Zone Card */}
      <Card
        className={`border-2 border-dashed transition-all ${
          dragActive
            ? 'border-cyan-400 bg-cyan-950/20'
            : 'border-slate-750 hover:border-cyan-500/50 bg-[#0c1322]/80'
        }`}
        onDragOver={(e) => {
          e.preventDefault()
          setDragActive(true)
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragActive(false)
          if (e.dataTransfer.files?.[0]) {
            handleProcessFile(e.dataTransfer.files[0])
          }
        }}
      >
        <CardContent className="flex flex-col items-center justify-center p-8 sm:p-12 text-center space-y-4">
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => {
              if (e.target.files?.[0]) {
                handleProcessFile(e.target.files[0])
              }
            }}
            accept=".csv,.tsv,.txt,.json"
            className="hidden"
            aria-label="Upload photometric time series file"
          />

          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-violet-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.2)]">
            <UploadCloud className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <h3 className="text-base font-bold text-white">
              Drag & Drop your Light Curve File
            </h3>
            <p className="text-xs text-slate-400 max-w-md">
              Supports CSV, TSV, JSON, and ASCII files containing <code className="text-cyan-300">time</code> and <code className="text-cyan-300">flux</code> columns.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Button
              variant="primary"
              size="md"
              onClick={() => fileInputRef.current?.click()}
            >
              Select Local File
            </Button>
            <Button variant="outline" size="md" onClick={handleSimulateDemoUpload}>
              Load Sample TESS Light Curve
            </Button>
          </div>

          {parseError && (
            <div className="mt-4 p-3 rounded-lg bg-red-950/40 border border-red-500/40 text-red-300 text-xs flex items-center gap-2 text-left">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{parseError}</span>
            </div>
          )}

          {selectedFileName && !parseError && (
            <div className="mt-4 p-3 rounded-lg bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Loaded: <strong>{selectedFileName}</strong> ({pointCount.toLocaleString()} observations parsed and ready for analysis)</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Specification & Supported Schemas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-slate-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <FileText className="w-4 h-4 text-cyan-400" />
              Expected CSV Column Format
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs font-mono text-slate-300 space-y-2">
            <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 text-[11px] leading-relaxed">
              <span className="text-cyan-400">time</span>, <span className="text-cyan-400">flux</span>, <span className="text-slate-400">flux_err</span><br />
              0.0000, 1.000214, 0.00072<br />
              0.0208, 0.999812, 0.00071<br />
              0.0417, 1.000045, 0.00070
            </div>
            <p className="text-[11px] text-slate-400 font-sans">
              Flux values should be normalized around 1.0. Time in Barycentric Julian Date (BJD) or relative days.
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-violet-400" />
              Handoff Contract for Upload Lead
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-slate-300 space-y-2">
            <p>
              Use <code className="text-violet-300">LightCurvePoint[]</code> as the return type for parsed files.
            </p>
            <ul className="list-disc pl-4 space-y-1 text-slate-400 text-[11px]">
              <li>Filter out NaNs and inf values</li>
              <li>Pass resulting points to <code className="text-cyan-300">onLightCurveLoaded</code></li>
              <li>Add FITS parsing worker via <code className="text-slate-300">fitsjs</code> if needed</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
