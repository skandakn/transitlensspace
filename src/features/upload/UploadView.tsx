import { useState } from 'react'
import { UploadCloud, FileText, CheckCircle2, HelpCircle } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import type { LightCurvePoint } from '../../types'

import { generateSyntheticLightCurve } from '../../data/mockData'

export interface UploadViewProps {
  onLightCurveLoaded?: (points: LightCurvePoint[], filename: string) => void
}

/**
 * Photometry Ingestion & Upload Module
 * Owned by: Upload Lead (Member 3)
 *
 * Responsibilities:
 * - Parsing tabular CSV / TSV / JSON light curves
 * - Parsing NASA MAST FITS binary table light curve files
 * - Normalizing flux to median 1.0, sorting by time (BJD)
 * - Removing extreme non-astrophysical instrumental anomalies
 */
export function UploadView({ onLightCurveLoaded }: UploadViewProps) {
  const [dragActive, setDragActive] = useState(false)
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null)

  const handleSimulateDemoUpload = () => {
    const filename = 'TOI-700_sector11_lc_clean.csv'
    setSelectedFileName(filename)
    const samplePoints = generateSyntheticLightCurve(3.742, 0.85, 0.0092, 3.25, 25, 30)
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
            const file = e.dataTransfer.files[0]
            setSelectedFileName(file.name)
            const samplePoints = generateSyntheticLightCurve(3.742, 0.85, 0.0092, 3.25, 25, 30)
            onLightCurveLoaded?.(samplePoints, file.name)
          }
        }}
      >
        <CardContent className="flex flex-col items-center justify-center p-8 sm:p-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-violet-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.2)]">
            <UploadCloud className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <h3 className="text-base font-bold text-white">
              Drag & Drop your Light Curve File
            </h3>
            <p className="text-xs text-slate-400 max-w-md">
              Supports CSV, TSV, JSON, and standard NASA MAST FITS files containing <code className="text-cyan-300">time</code> and <code className="text-cyan-300">flux</code> columns.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Button variant="primary" size="md">
              Select Local File
            </Button>
            <Button variant="outline" size="md" onClick={handleSimulateDemoUpload}>
              Load Sample TESS Light Curve
            </Button>
          </div>

          {selectedFileName && (
            <div className="mt-4 p-3 rounded-lg bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Loaded: <strong>{selectedFileName}</strong> (1,250 points, normalized)</span>
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
