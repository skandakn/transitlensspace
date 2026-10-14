import { useState } from 'react'
import {
  FileSpreadsheet,
  Download,
  ArrowRight,
  Filter,
  Sparkles
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
  onNavigateToAnalysis?: () => void
}

/**
 * Results & Exoplanet Dispositioning Module
 * Owned by: Results Lead (Member 4)
 * Visual polish & testing additions: Member 7
 *
 * Responsibilities:
 * - Candidate disposition management (CONFIRMED, CANDIDATE, FALSE_POSITIVE)
 * - Vetting metrics (even-odd transit depth test, secondary eclipse check)
 * - Exporting analysis reports as JSON / CSV
 * - Intuitive empty and filtered states for judges
 */
export function ResultsView({ results, onExportJson: _onExportJson, onNavigateToAnalysis }: ResultsViewProps) {
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
            Detection Results &amp; Vetting Table
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Review candidate planetary transit signals, astrophysical vetting tests, and dispositions
          </p>
        </div>

        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1.5 text-xs text-slate-400">
            <Filter className="w-3.5 h-3.5" />
            <select
              value={filterDisposition}
              onChange={(e) => setFilterDisposition(e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-750 text-xs text-slate-200 focus:outline-none focus:border-cyan-400"
              aria-label="Filter candidates by disposition"
            >
              <option value="ALL">All Dispositions</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="CANDIDATE">Candidate</option>
              <option value="FALSE_POSITIVE">False Positive</option>
            </select>
          </label>

          <Button
            variant="primary"
            size="sm"
            onClick={handleDownload}
            disabled={allEvents.length === 0}
            leftIcon={<Download className="w-3.5 h-3.5" />}
            title={allEvents.length === 0 ? 'No candidates available to export' : 'Download candidate vetting report as JSON'}
          >
            Export JSON
          </Button>
        </div>
      </div>

      {/* Main Candidates Card */}
      <Card className="border-slate-800">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle>Catalog of Detected Transit Signatures</CardTitle>
            <CardDescription>
              {allEvents.length === 0
                ? 'No active pipeline candidate detections recorded yet'
                : `Showing ${filteredEvents.length} of ${allEvents.length} candidates evaluated across active pipeline runs`}
            </CardDescription>
          </div>
          <Badge variant={allEvents.length > 0 ? 'cyan' : 'outline'} className="font-mono text-xs">
            {filteredEvents.length} Entries
          </Badge>
        </CardHeader>

        <CardContent className="p-0">
          {/* Empty State: No events recorded yet */}
          {allEvents.length === 0 ? (
            <div className="p-10 sm:p-14 text-center space-y-4">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-cyan-500/20 to-violet-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.15)]">
                <Sparkles className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-white">
                  No Candidate Transit Signatures Vetted Yet
                </h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                  Analyze a target star in the Transit Analysis Workspace to automatically populate this catalog with candidate transit depths, orbital periods, SNR metrics, and vetting dispositions.
                </p>
              </div>
              {onNavigateToAnalysis && (
                <div className="pt-2">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={onNavigateToAnalysis}
                    rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                  >
                    Go to Transit Analysis
                  </Button>
                </div>
              )}
            </div>
          ) : filteredEvents.length === 0 ? (
            /* Filtered Empty State: None matching the filter */
            <div className="p-8 text-center space-y-3">
              <p className="text-xs text-slate-400">
                No candidates match the filter <strong className="text-slate-200">"{filterDisposition}"</strong>.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFilterDisposition('ALL')}
              >
                Reset Filter (Show all {allEvents.length} entries)
              </Button>
            </div>
          ) : (
            /* Table of Candidates */
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono" aria-label="Detected exoplanet transit signatures">
                <thead className="bg-[#090e1a] text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
                  <tr>
                    <th scope="col" className="py-3 px-4">Target Star</th>
                    <th scope="col" className="py-3 px-4">Candidate Name</th>
                    <th scope="col" className="py-3 px-4">Period</th>
                    <th scope="col" className="py-3 px-4">Duration</th>
                    <th scope="col" className="py-3 px-4">Depth</th>
                    <th scope="col" className="py-3 px-4">Est. Radius</th>
                    <th scope="col" className="py-3 px-4">SNR</th>
                    <th scope="col" className="py-3 px-4">Disposition</th>
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
          )}
        </CardContent>
      </Card>
    </div>
  )
}
