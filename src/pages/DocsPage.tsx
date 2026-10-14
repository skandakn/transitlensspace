import React from 'react'
import { BookOpen, Code, Layers, GitBranch, Cpu, ShieldCheck, CheckCircle2 } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'

export function DocsPage() {
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-white tracking-wide flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-cyan-400" />
          TransitLens Architecture & Interface Contracts
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Technical specifications, team ownership boundaries, and shared TypeScript type signatures
        </p>
      </div>

      {/* Team Ownership Matrix */}
      <Card className="border-slate-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            Module Ownership & Team Boundaries
          </CardTitle>
          <CardDescription>
            Strictly segregated directories to prevent merge conflicts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[#090e1a] text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Role</th>
                  <th className="py-2.5 px-3">Module Directory</th>
                  <th className="py-2.5 px-3">Responsibilities</th>
                  <th className="py-2.5 px-3">Branch Name</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                <tr>
                  <td className="py-2.5 px-3 text-cyan-400 font-bold">Member 1 (Tech Lead)</td>
                  <td className="py-2.5 px-3 text-slate-200">src/components, src/layouts, src/lib, src/types</td>
                  <td className="py-2.5 px-3 text-slate-400 font-sans">Foundation, dark astronomy design tokens, navigation, shared contracts</td>
                  <td className="py-2.5 px-3 text-emerald-400">feature/foundation</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 text-violet-400 font-bold">Member 2 (Stars Lead)</td>
                  <td className="py-2.5 px-3 text-slate-200">src/features/stars/</td>
                  <td className="py-2.5 px-3 text-slate-400 font-sans">Stellar catalog, TIC/KIC querying, astrophysical property calculations</td>
                  <td className="py-2.5 px-3 text-violet-400">feature/stars</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 text-amber-400 font-bold">Member 3 (Upload Lead)</td>
                  <td className="py-2.5 px-3 text-slate-200">src/features/upload/</td>
                  <td className="py-2.5 px-3 text-slate-400 font-sans">CSV/FITS parsing, flux normalization, outlier rejection</td>
                  <td className="py-2.5 px-3 text-amber-400">feature/upload</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 text-emerald-400 font-bold">Member 4 (Results Lead)</td>
                  <td className="py-2.5 px-3 text-slate-200">src/features/results/</td>
                  <td className="py-2.5 px-3 text-slate-400 font-sans">Candidate vetting, false alarm tests, PDF/JSON export</td>
                  <td className="py-2.5 px-3 text-cyan-400">feature/results</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 text-sky-400 font-bold">Member 5 (Detection Lead)</td>
                  <td className="py-2.5 px-3 text-slate-200">src/features/analysis/detection/</td>
                  <td className="py-2.5 px-3 text-slate-400 font-sans">Box Least Squares (BLS) pipeline, dip detection, period grid search</td>
                  <td className="py-2.5 px-3 text-sky-400">feature/detection</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 text-fuchsia-400 font-bold">Member 6 (Analysis Experience)</td>
                  <td className="py-2.5 px-3 text-slate-200">src/features/analysis/</td>
                  <td className="py-2.5 px-3 text-slate-400 font-sans">Interactive analysis workflow, Results Panel, derived telemetry & states</td>
                  <td className="py-2.5 px-3 text-fuchsia-400">feature/analysis-results</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Core Type Contracts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-slate-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Code className="w-4 h-4 text-cyan-400" />
              LightCurvePoint & TransitEvent
            </CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="p-3 bg-slate-900 rounded-lg border border-slate-800 text-[11px] font-mono text-cyan-300 overflow-x-auto leading-relaxed">
{`interface LightCurvePoint {
  time: number;       // BJD or relative days
  flux: number;       // Normalized ~1.0
  fluxError?: number; // 1-sigma uncertainty
  trend?: number;     // Model transit fit
  phase?: number;     // -0.5 to +0.5
  isTransit?: boolean;// Within transit window
}

interface TransitEvent {
  id: string;
  epoch: number;      // Transit center time
  period: number;     // Orbital period (days)
  durationHours: number;
  depthPpm: number;
  snr: number;
  disposition: 'CONFIRMED' | 'CANDIDATE' | 'FALSE_POSITIVE';
}`}
            </pre>
          </CardContent>
        </Card>

        <Card className="border-slate-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Cpu className="w-4 h-4 text-violet-400" />
              StarObservation & AnalysisResult
            </CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="p-3 bg-slate-900 rounded-lg border border-slate-800 text-[11px] font-mono text-violet-300 overflow-x-auto leading-relaxed">
{`interface StarObservation {
  id: string;          // e.g. "TIC-261136679"
  name: string;        // e.g. "TOI-700"
  mission: 'Kepler' | 'TESS' | 'K2' | 'Synthetic';
  magnitude: number;
  temperature: number; // Teff (Kelvin)
  stellarRadius: number;// Solar radii R☉
  stellarMass: number;  // Solar masses M☉
}

interface AnalysisResult {
  id: string;
  observationId: string;
  status: AnalysisStatus;
  algorithm: DetectionAlgorithm;
  transitEvents: TransitEvent[];
  bestCandidate?: TransitEvent;
}`}
            </pre>
          </CardContent>
        </Card>
      </div>

      {/* Git Coordination Guidelines */}
      <Card className="border-slate-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <GitBranch className="w-4 h-4 text-emerald-400" />
            Git Branch & Integration Protocol
          </CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-slate-300 space-y-3">
          <p>
            To ensure zero merge conflicts across all team members, follow this workflow:
          </p>
          <ol className="list-decimal pl-5 space-y-1 text-slate-400 text-xs">
            <li>Always branch off <code className="text-cyan-300">feature/foundation</code> or <code className="text-cyan-300">main</code>.</li>
            <li>Work exclusively inside your designated feature directory (<code className="text-slate-200">src/features/&lt;your-feature&gt;/</code>).</li>
            <li>Do not modify shared types in <code className="text-cyan-300">src/types/</code> or layout in <code className="text-cyan-300">src/layouts/</code> without consulting the Integration Lead.</li>
            <li>Verify both <code className="text-emerald-300">npm install</code> and <code className="text-emerald-300">npm run build</code> pass cleanly before submitting PRs.</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  )
}
