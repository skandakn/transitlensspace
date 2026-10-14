import { useState } from 'react'
import {
  FileSpreadsheet,
  Download
} from 'lucide-react'
import type { AnalysisResult } from '../../types'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import {
  formatPeriod,
  formatDepth,
  formatRadius,
  formatDuration
} from '../../lib/formatters'

export interface ResultsViewProps {
  results: AnalysisResult[]
  onExportJson?: () => void
}

/**
 * Results & Exoplanet Dispositioning Module
 * Owned by: Results Lead (Member 4)
 *
 * Responsibilities:
 * - Candidate disposition management (CONFIRMED, CANDIDATE, FALSE_POSITIVE)
 * - Vetting metrics (even-odd transit depth test, secondary eclipse check)
 * - Exporting analysis reports as JSON / CSV / Publication-ready table
 */
export function ResultsView({ results, onExportJson: _onExportJson }: ResultsViewProps) {
  const [filterDisposition, setFilterDisposition] = useState<string>('ALL')

  // Collect all events across runs
  const allEvents = results.flatMap((r) =>
    r.transitEvents.map((evt) => ({
      ...evt,
      starName: r.star.name,
      starId: r.star.id,
      algorithm: r.algorithm
    }))
  )

  const filteredEvents = allEvents.filter((evt) => {
    if (filterDisposition === 'ALL') return true
    return evt.disposition === filterDisposition
  })

  const handleDownload = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(results, null, 2))
    const downloadAnchor = document.createElement('a')
    downloadAnchor.setAttribute('href', dataStr)
    downloadAnchor.setAttribute('download', 'transitlens_candidates.json')
    document.body.appendChild(downloadAnchor)
    downloadAnchor.click()
    downloadAnchor.remove()
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-wide flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-cyan-400" />
            Detection Results & Vetting Table
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Review candidate planetary transit signals, astrophysical vetting tests, and dispositions
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={filterDisposition}
            onChange={(e) => setFilterDisposition(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-750 text-xs text-slate-200 focus:outline-none focus:border-cyan-400"
          >
            <option value="ALL">All Dispositions</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="CANDIDATE">Candidate</option>
            <option value="FALSE_POSITIVE">False Positive</option>
          </select>

          <Button variant="primary" size="sm" onClick={handleDownload}>
            <Download className="w-3.5 h-3.5" />
            <span>Export JSON</span>
          </Button>
        </div>
      </div>

      {/* Main Candidates Card */}
      <Card className="border-slate-800">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle>Catalog of Detected Transit Signatures</CardTitle>
            <CardDescription>
              Showing {filteredEvents.length} candidates evaluated across active pipeline runs
            </CardDescription>
          </div>
          <Badge variant="cyan" className="font-mono text-xs">
            {filteredEvents.length} Entries
          </Badge>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[#090e1a] text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Target Star</th>
                  <th className="py-3 px-4">Candidate Name</th>
                  <th className="py-3 px-4">Period</th>
                  <th className="py-3 px-4">Duration</th>
                  <th className="py-3 px-4">Depth</th>
                  <th className="py-3 px-4">Est. Radius</th>
                  <th className="py-3 px-4">SNR</th>
                  <th className="py-3 px-4">Disposition</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredEvents.map((evt) => (
                  <tr key={evt.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-white">{evt.starName}</div>
                      <div className="text-[10px] text-cyan-400">{evt.starId}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-200">
                      {evt.name || evt.id}
                    </td>
                    <td className="py-3 px-4 text-cyan-300 font-bold">
                      {formatPeriod(evt.period)}
                    </td>
                    <td className="py-3 px-4 text-slate-300">
                      {formatDuration(evt.durationHours)}
                    </td>
                    <td className="py-3 px-4 text-slate-200">
                      {formatDepth(evt.depthFraction, evt.depthPpm)}
                    </td>
                    <td className="py-3 px-4 text-violet-300 font-bold">
                      {evt.planetRadiusEarth ? formatRadius(evt.planetRadiusEarth) : '—'}
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-emerald-400 font-bold">{evt.snr.toFixed(1)} σ</span>
                    </td>
                    <td className="py-3 px-4">
                      <Badge
                        variant={
                          evt.disposition === 'CONFIRMED'
                            ? 'success'
                            : evt.disposition === 'CANDIDATE'
                            ? 'cyan'
                            : 'warning'
                        }
                      >
                        {evt.disposition}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
