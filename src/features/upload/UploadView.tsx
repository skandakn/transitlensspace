import { useState, useRef } from 'react'
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Download,
  AlertTriangle,
  ArrowRight,
  Database,
  RefreshCw,
  Sparkles
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import type { LightCurvePoint } from '../../types'
import {
  parseAndValidateLightCurve,
  generateSampleCsvContent,
  type CsvParseResult
} from './csvParser'
import { parseFitsLightCurve } from './fitsParser'

export interface UploadViewProps {
  onLightCurveLoaded?: (points: LightCurvePoint[], filename: string) => void
  onNavigateToAnalysis?: () => void
  currentLoadedFile?: string | null
  currentPointsCount?: number
}

export function UploadView({
  onLightCurveLoaded,
  onNavigateToAnalysis,
  currentLoadedFile,
  currentPointsCount
}: UploadViewProps) {
  const [dragActive, setDragActive] = useState(false)
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null)
  const [parseResult, setParseResult] = useState<CsvParseResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const processContent = (text: string, filename: string) => {
    setIsLoading(true)
    setSelectedFileName(filename)
    try {
      const result = parseAndValidateLightCurve(text, filename)
      setParseResult(result)

      if (result.success && result.points.length > 0) {
        onLightCurveLoaded?.(result.points, filename)
      }
    } catch (err) {
      setParseResult({
        success: false,
        points: [],
        error: `Unexpected error reading file: ${err instanceof Error ? err.message : String(err)}`,
        warnings: []
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleProcessFile = async (file: File) => {
    setIsLoading(true)
    setSelectedFileName(file.name)
    try {
      const isFits = file.name.toLowerCase().endsWith('.fits') || file.name.toLowerCase().endsWith('.fit')
      let result: CsvParseResult

      if (isFits) {
        const buffer = await file.arrayBuffer()
        result = parseFitsLightCurve(buffer, file.name)
      } else {
        const text = await file.text()
        result = parseAndValidateLightCurve(text, file.name)
      }

      setParseResult(result)

      if (result.success && result.points.length > 0) {
        onLightCurveLoaded?.(result.points, file.name)
      }
    } catch (err) {
      setParseResult({
        success: false,
        points: [],
        error: `Unexpected error reading file: ${err instanceof Error ? err.message : String(err)}`,
        warnings: []
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Predefined demo sample data loaders for judges
  const handleLoadSample = (type: 'transit' | 'flat' | 'sparse' | 'malformed') => {
    const sample = generateSampleCsvContent(type)
    processContent(sample.content, sample.filename)
  }

  const handleDownloadSample = () => {
    const sample = generateSampleCsvContent('transit')
    const blob = new Blob([sample.content], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', sample.filename)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const stats = parseResult?.stats
  const hasActiveInMemory = Boolean(currentPointsCount && currentPointsCount >= 15)

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-white tracking-wide flex items-center gap-2">
          <UploadCloud className="w-5 h-5 text-cyan-400" />
          Photometry Ingestion &amp; Validation Hub
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Import photometric time series from Kepler, TESS, or ground-based survey observatories with instant data validation
        </p>
      </div>

      {/* Active Light Curve in Memory Banner */}
      {hasActiveInMemory && (
        <div className="p-4 rounded-xl bg-gradient-to-r from-cyan-950/40 via-slate-900/90 to-emerald-950/40 border border-cyan-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-[0_0_20px_rgba(6,182,212,0.1)] animate-in fade-in">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white tracking-wide">
                  Active Photometry in Memory:
                </span>
                <span className="text-xs font-mono font-semibold text-cyan-300">
                  {currentLoadedFile || 'Uploaded Light Curve'}
                </span>
                <Badge variant="success" className="text-[10px]">
                  Loaded ✓
                </Badge>
              </div>
              <p className="text-[11px] text-slate-300 mt-0.5">
                {currentPointsCount?.toLocaleString()} calibrated cadences currently loaded and ready for algorithmic transit detection.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {onNavigateToAnalysis && (
              <Button
                variant="primary"
                size="sm"
                onClick={onNavigateToAnalysis}
                rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
              >
                Go to Analysis Workspace
              </Button>
            )}
          </div>
        </div>
      )}

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
        <CardContent className="flex flex-col items-center justify-center p-6 sm:p-10 text-center space-y-4">
          <input
            type="file"
            ref={fileInputRef}
            onClick={(e) => {
              // Reset input value so selecting the same file triggers onChange
              ;(e.target as HTMLInputElement).value = ''
            }}
            onChange={(e) => {
              if (e.target.files?.[0]) {
                handleProcessFile(e.target.files[0])
              }
            }}
            accept=".csv,.tsv,.txt,.json,.dat,.fits,.fit"
            className="hidden"
            aria-label="Upload photometric time series file"
          />

          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-violet-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.2)]">
            <UploadCloud className="w-7 h-7" />
          </div>

          <div className="space-y-1">
            <h3 className="text-base font-bold text-white">
              Drag &amp; Drop your Light Curve File
            </h3>
            <p className="text-xs text-slate-400 max-w-md">
              Supports CSV, TSV, JSON, ASCII, and NASA FITS files containing <code className="text-cyan-300">time</code> and <code className="text-cyan-300">flux</code> columns.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Button
              variant="primary"
              size="md"
              isLoading={isLoading}
              onClick={() => fileInputRef.current?.click()}
              aria-label="Select local file from computer"
            >
              Select Local File
            </Button>
            <Button
              variant="outline"
              size="md"
              onClick={handleDownloadSample}
              leftIcon={<Download className="w-3.5 h-3.5" />}
              aria-label="Download sample CSV template for testing"
            >
              Download Sample CSV
            </Button>
          </div>

          {/* Quick Demo Previews for Judges */}
          <div className="w-full pt-4 border-t border-slate-800/80">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Judges One-Click Test Cases:
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => handleLoadSample('transit')}
                className="px-2.5 py-1 rounded text-[11px] font-mono bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-500/40 text-cyan-200 transition-colors cursor-pointer"
                title="Loads a calibrated transit light curve with periodic dips (TOI-700)"
              >
                🌟 Known Transit Sample (TOI-700)
              </button>
              <button
                type="button"
                onClick={() => handleLoadSample('flat')}
                className="px-2.5 py-1 rounded text-[11px] font-mono bg-slate-900/80 hover:bg-slate-850 border border-slate-750 text-slate-300 transition-colors cursor-pointer"
                title="Loads flat quiet star data without transits (HD-219134)"
              >
                ➖ Flat Control Sample (HD-219134)
              </button>
              <button
                type="button"
                onClick={() => handleLoadSample('sparse')}
                className="px-2.5 py-1 rounded text-[11px] font-mono bg-amber-950/50 hover:bg-amber-900/50 border border-amber-500/40 text-amber-300 transition-colors cursor-pointer"
                title="Tests rejection boundary for files with < 15 points"
              >
                ⚠️ Test Sparse File (&lt;15 pts)
              </button>
              <button
                type="button"
                onClick={() => handleLoadSample('malformed')}
                className="px-2.5 py-1 rounded text-[11px] font-mono bg-rose-950/50 hover:bg-rose-900/50 border border-rose-500/40 text-rose-300 transition-colors cursor-pointer"
                title="Tests error handling for files missing numeric columns"
              >
                🚫 Test Malformed CSV
              </button>
            </div>
          </div>

          {/* Error Message */}
          {parseResult && !parseResult.success && parseResult.error && (
            <div
              className="w-full mt-4 p-3.5 rounded-lg bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs flex items-start gap-2.5 text-left animate-in fade-in duration-200"
              role="alert"
            >
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-semibold block text-white">Validation Error</span>
                <span className="leading-relaxed">{parseResult.error}</span>
              </div>
            </div>
          )}

          {/* Success Message & Parsed Telemetry */}
          {parseResult && parseResult.success && selectedFileName && (
            <div className="w-full mt-4 space-y-3 animate-in fade-in duration-200">
              <div className="p-3.5 rounded-lg bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs flex items-start justify-between gap-3 text-left">
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-white block">
                      Successfully Parsed &amp; Loaded: {selectedFileName}
                    </span>
                    <span className="text-[11px] text-emerald-300/90 font-mono">
                      Format: {parseResult.detectedDelimiter} · {parseResult.points.length.toLocaleString()} valid cadences ready for BLS detection
                    </span>
                  </div>
                </div>

                <Badge variant="success" className="text-[10px] shrink-0 font-mono">
                  Validated ✓
                </Badge>
              </div>

              {/* Parsed Telemetry Grid */}
              {stats && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-left font-mono">
                  <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block uppercase">Valid Cadences</span>
                    <span className="text-sm font-bold text-white mt-0.5 block">
                      {stats.validRows.toLocaleString()}
                    </span>
                    <span className="text-[9px] text-slate-500">
                      {stats.skippedRows > 0 ? `${stats.skippedRows} skipped` : '0 errors'}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block uppercase">Time Span</span>
                    <span className="text-sm font-bold text-cyan-300 mt-0.5 block truncate">
                      {stats.durationDays} d
                    </span>
                    <span className="text-[9px] text-slate-500">
                      [{stats.minTime} .. {stats.maxTime}]
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block uppercase">Mean Flux</span>
                    <span className="text-sm font-bold text-amber-300 mt-0.5 block truncate">
                      {stats.meanFlux.toFixed(5)}
                    </span>
                    <span className="text-[9px] text-slate-500">
                      [{stats.minFlux.toFixed(4)} .. {stats.maxFlux.toFixed(4)}]
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block uppercase">Format</span>
                    <span className="text-sm font-bold text-violet-300 mt-0.5 block truncate">
                      {parseResult.detectedDelimiter}
                    </span>
                    <span className="text-[9px] text-slate-500">
                      Auto-detected
                    </span>
                  </div>
                </div>
              )}

              {/* Warnings List */}
              {parseResult.warnings.length > 0 && (
                <div className="p-3 rounded-lg bg-amber-950/30 border border-amber-500/30 text-amber-300 text-left text-xs space-y-1">
                  <div className="flex items-center gap-1.5 font-semibold text-amber-200">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                    <span>Parser Warnings ({parseResult.warnings.length})</span>
                  </div>
                  <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-amber-300/80">
                    {parseResult.warnings.map((w, idx) => (
                      <li key={idx}>{w}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Action Buttons to proceed to Analysis or replace */}
              <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    fileInputRef.current?.click()
                  }}
                  leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
                >
                  Upload Another File
                </Button>
                {onNavigateToAnalysis && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={onNavigateToAnalysis}
                    rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                  >
                    Proceed to Transit Analysis
                  </Button>
                )}
              </div>
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
              Flux values should be normalized around 1.0 (raw counts in NASA FITS files are automatically normalized). Column names are case-insensitive.
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-violet-400" />
              Ingestion Validation &amp; Error Rules
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-slate-300 space-y-2">
            <p className="text-[11px] text-slate-400">
              The ingestion engine automatically applies the following astrophysical validation checks:
            </p>
            <ul className="list-disc pl-4 space-y-1 text-slate-400 text-[11px]">
              <li><strong className="text-slate-200">Header flexibility:</strong> Accepts time, bjd, t and flux, pdcsap_flux, f, mag.</li>
              <li><strong className="text-slate-200">Format support:</strong> Delimited CSV/TSV, whitespace ASCII, JSON, and NASA FITS BinTables.</li>
              <li><strong className="text-slate-200">Rejection of non-finite rows:</strong> Drops NaNs, infinities, and non-positive flux values.</li>
              <li><strong className="text-slate-200">Chronological enforcement:</strong> Automatically sorts out-of-order cadences.</li>
              <li><strong className="text-slate-200">Minimum threshold:</strong> At least 15 valid points required to execute transit detection.</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
