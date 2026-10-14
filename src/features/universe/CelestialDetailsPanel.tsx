import React from 'react'
import {
  X,
  Sun,
  Globe,
  ExternalLink,
  Layers,
  Activity,
  Compass,
  ArrowRight,
  Info,
  Calendar,
  Sparkles
} from 'lucide-react'
import type { CelestialObject, CelestialPlanet, SelectedTarget } from '../../types/universe'
import { ASTRONOMICAL_SCALE_DISCLAIMER } from '../../data/astronomyData'

export interface CelestialDetailsPanelProps {
  target: SelectedTarget
  onClose: () => void
  onSelectStar?: (star: CelestialObject) => void
  onSelectPlanet?: (planet: CelestialPlanet, parentStar: CelestialObject) => void
  onAnalyzeLightCurve?: (star: CelestialObject) => void
  onResetView?: () => void
}

function formatValue(value: number | string | null | undefined, unit: string = '', fallback: string = 'Unmeasured'): string {
  if (value === null || value === undefined) return fallback
  if (typeof value === 'number') {
    if (isNaN(value)) return fallback
    return `${value.toLocaleString()}${unit ? ` ${unit}` : ''}`
  }
  return `${value}${unit ? ` ${unit}` : ''}`
}

export function CelestialDetailsPanel({
  target,
  onClose,
  onSelectStar,
  onSelectPlanet,
  onAnalyzeLightCurve,
  onResetView
}: CelestialDetailsPanelProps) {
  if (!target) return null

  const isStar = target.type === 'star'
  const star = isStar ? target.star : target.parentStar
  const planet = !isStar ? target.planet : undefined

  return (
    <aside
      className="absolute right-4 top-4 bottom-4 w-88 sm:w-96 max-w-[calc(100vw-2rem)] z-30 flex flex-col rounded-2xl bg-[#070b14]/95 border border-cyan-900/40 shadow-2xl backdrop-blur-xl text-slate-200 overflow-hidden animate-in fade-in slide-in-from-right-4 duration-200"
      aria-label="Celestial Object Information Panel"
    >
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800/80 bg-slate-900/60">
        <div className="flex items-center gap-2">
          {isStar ? (
            <div className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Sun className="w-4 h-4" />
            </div>
          ) : (
            <div className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Globe className="w-4 h-4" />
            </div>
          )}
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 font-semibold block">
              {isStar ? 'Host Star System' : 'Confirmed Exoplanet'}
            </span>
            <h2 className="text-base font-bold text-white tracking-wide truncate max-w-[200px]">
              {isStar ? star.name : planet?.name}
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {onResetView && (
            <button
              onClick={onResetView}
              className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-slate-800/60 transition-colors cursor-pointer"
              title="Reset Universe Camera"
              aria-label="Reset camera position"
            >
              <Compass className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors cursor-pointer"
            title="Close Panel"
            aria-label="Close information panel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Scrollable Content Body */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4 text-xs scrollbar-thin">
        {/* Scale Notice Alert Banner */}
        <div className="p-2.5 rounded-xl bg-cyan-950/30 border border-cyan-500/30 text-cyan-200/90 flex items-start gap-2 text-[11px] leading-relaxed">
          <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <div>
            <strong className="font-semibold text-cyan-300">Astronomical Scale Disclaimer: </strong>
            {ASTRONOMICAL_SCALE_DISCLAIMER}
          </div>
        </div>

        {/* Planet Specific Parent Star Relationship */}
        {!isStar && planet && (
          <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-mono text-slate-400 block">
                Parent Host Star
              </span>
              <span className="font-bold text-amber-300 text-sm">
                {planet.hostStarName || star.name}
              </span>
            </div>
            <button
              onClick={() => onSelectStar?.(star)}
              className="px-2.5 py-1 rounded-md bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span>Focus Star</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Primary Classification Badges */}
        <div className="flex flex-wrap gap-1.5">
          {isStar ? (
            <>
              {star.spectralType && (
                <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-200 font-mono border border-slate-700">
                  Spectral Type: {star.spectralType}
                </span>
              )}
              {star.mission && (
                <span className="px-2 py-0.5 rounded-md bg-cyan-950/80 text-cyan-300 font-mono border border-cyan-800/60">
                  Mission: {star.mission}
                </span>
              )}
              {star.constellation && (
                <span className="px-2 py-0.5 rounded-md bg-indigo-950/80 text-indigo-300 font-mono border border-indigo-800/60">
                  {star.constellation}
                </span>
              )}
            </>
          ) : (
            <>
              <span className="px-2 py-0.5 rounded-md bg-emerald-950/80 text-emerald-300 font-mono border border-emerald-800/60">
                {planet?.disposition || 'CONFIRMED EXOPLANET'}
              </span>
              {planet?.discoveryMethod && (
                <span className="px-2 py-0.5 rounded-md bg-cyan-950/80 text-cyan-300 font-mono border border-cyan-800/60">
                  {planet.discoveryMethod}
                </span>
              )}
              {planet?.isHabitableZone && (
                <span className="px-2 py-0.5 rounded-md bg-teal-950/80 text-teal-300 font-mono border border-teal-800/60 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  Habitable Zone
                </span>
              )}
            </>
          )}
        </div>

        {/* Measured Scientific Properties Grid */}
        <div className="space-y-2">
          <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            <span>Measured Physical Parameters</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {isStar ? (
              <>
                <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
                  <span className="text-[10px] text-slate-400 font-mono block">Effective Temp</span>
                  <span className="text-sm font-bold text-amber-300 font-mono">
                    {formatValue(star.temperature, 'K')}
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
                  <span className="text-[10px] text-slate-400 font-mono block">Distance</span>
                  <span className="text-sm font-bold text-slate-200 font-mono">
                    {star.distanceLightYears
                      ? `${star.distanceLightYears.toFixed(1)} ly`
                      : star.distanceParsecs
                      ? `${star.distanceParsecs.toFixed(1)} pc`
                      : 'Unmeasured'}
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
                  <span className="text-[10px] text-slate-400 font-mono block">Stellar Radius</span>
                  <span className="text-sm font-bold text-slate-200 font-mono">
                    {formatValue(star.stellarRadiusSolar, 'R☉')}
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
                  <span className="text-[10px] text-slate-400 font-mono block">Stellar Mass</span>
                  <span className="text-sm font-bold text-slate-200 font-mono">
                    {formatValue(star.stellarMassSolar, 'M☉')}
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
                  <span className="text-[10px] text-slate-400 font-mono block">Apparent Mag</span>
                  <span className="text-sm font-bold text-slate-200 font-mono">
                    {formatValue(star.magnitude, 'V')}
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
                  <span className="text-[10px] text-slate-400 font-mono block">Luminosity</span>
                  <span className="text-sm font-bold text-slate-200 font-mono">
                    {formatValue(star.luminosity, 'L☉')}
                  </span>
                </div>
              </>
            ) : planet ? (
              <>
                <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
                  <span className="text-[10px] text-slate-400 font-mono block">Orbital Period</span>
                  <span className="text-sm font-bold text-cyan-300 font-mono">
                    {formatValue(planet.periodDays, 'days')}
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
                  <span className="text-[10px] text-slate-400 font-mono block">Semi-Major Axis</span>
                  <span className="text-sm font-bold text-slate-200 font-mono">
                    {formatValue(planet.semiMajorAxisAu, 'AU')}
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
                  <span className="text-[10px] text-slate-400 font-mono block">Planet Radius</span>
                  <span className="text-sm font-bold text-slate-200 font-mono">
                    {planet.planetRadiusEarth !== null && planet.planetRadiusEarth !== undefined
                      ? `${planet.planetRadiusEarth.toFixed(2)} R⊕`
                      : 'Unmeasured (RV-only)'}
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
                  <span className="text-[10px] text-slate-400 font-mono block">Planet Mass</span>
                  <span className="text-sm font-bold text-slate-200 font-mono">
                    {planet.massEarth !== null && planet.massEarth !== undefined
                      ? `${planet.massEarth.toFixed(2)} M⊕`
                      : 'Unmeasured (Transit-only)'}
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
                  <span className="text-[10px] text-slate-400 font-mono block">Equilibrium Temp</span>
                  <span className="text-sm font-bold text-amber-300 font-mono">
                    {formatValue(planet.equilibriumTempK, 'K')}
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
                  <span className="text-[10px] text-slate-400 font-mono block">Transit Depth</span>
                  <span className="text-sm font-bold text-cyan-400 font-mono">
                    {planet.depthPpm !== null && planet.depthPpm !== undefined
                      ? `${planet.depthPpm.toLocaleString()} ppm`
                      : 'Non-transiting'}
                  </span>
                </div>
              </>
            ) : null}
          </div>
        </div>

        {/* Orbiting Children (For Host Stars) */}
        {isStar && (
          <div className="space-y-2">
            <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-cyan-400" />
                <span>Known Orbiting Exoplanets ({star.planets?.length || 0})</span>
              </span>
            </div>

            {star.planets && star.planets.length > 0 ? (
              <div className="space-y-1.5">
                {star.planets.map((p) => (
                  <div
                    key={p.id}
                    className="p-2 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-cyan-500/40 flex items-center justify-between transition-colors cursor-pointer group"
                    onClick={() => onSelectPlanet?.(p, star)}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full border border-white/20"
                        style={{ backgroundColor: p.color }}
                      />
                      <div>
                        <span className="font-semibold text-slate-200 group-hover:text-cyan-300 font-mono block">
                          {p.name}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {p.periodDays ? `${p.periodDays.toFixed(2)}d orbit` : 'Orbit unknown'} ·{' '}
                          {p.planetRadiusEarth ? `${p.planetRadiusEarth.toFixed(2)} R⊕` : 'RV planet'}
                        </span>
                      </div>
                    </div>
                    <button
                      className="text-[10px] font-mono text-cyan-400 group-hover:text-cyan-300 flex items-center gap-0.5"
                      onClick={(e) => {
                        e.stopPropagation()
                        onSelectPlanet?.(p, star)
                      }}
                    >
                      Focus ➔
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800 text-slate-400 text-center">
                No confirmed exoplanets cataloged for this target.
              </div>
            )}
          </div>
        )}

        {/* Scientific Context Description */}
        <div className="space-y-1.5">
          <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
            Scientific Overview
          </div>
          <p className="text-slate-300 text-xs leading-relaxed bg-slate-900/40 p-2.5 rounded-xl border border-slate-800/80">
            {isStar
              ? star.description || 'Stellar source cataloged in NASA Exoplanet Archive and SIMBAD astronomical databases.'
              : planet?.scientificNotes || 'Exoplanetary parameters derived from photometric transit monitoring and radial velocity characterization.'}
          </p>
        </div>

        {/* Discovery & Facility Info */}
        {!isStar && planet && (
          <div className="p-2.5 rounded-xl bg-slate-900/40 border border-slate-800 space-y-1 text-[11px]">
            <div className="flex justify-between">
              <span className="text-slate-400">Discovery Facility:</span>
              <span className="text-slate-200 font-mono text-right">{planet.discoveryFacility || 'Ground / Space Survey'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Discovery Year:</span>
              <span className="text-slate-200 font-mono">{planet.discoveryYear || 'Cataloged'}</span>
            </div>
          </div>
        )}

        {/* Provenance & Citation Metadata */}
        <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/90 space-y-1.5 text-[11px]">
          <div className="flex items-center gap-1.5 text-slate-400 font-mono uppercase tracking-wider text-[10px]">
            <Calendar className="w-3 h-3 text-cyan-400" />
            <span>Data Provenance & Citation</span>
          </div>

          <div className="text-slate-400">
            Citation:{' '}
            <span className="text-slate-300 italic">
              {(isStar ? star.sourceCitation : planet?.sourceCitation) ||
                'NASA Exoplanet Archive, Caltech/IPAC; SIMBAD CDS.'}
            </span>
          </div>

          <div className="flex items-center justify-between pt-1 border-t border-slate-800">
            <span className="text-[10px] text-slate-400 font-mono">
              Retrieved: {(isStar ? star.retrievalDate : planet?.retrievalDate) || '2026-10-14'}
            </span>
            {((isStar ? star.sourceUrl : planet?.sourceUrl)) && (
              <a
                href={isStar ? star.sourceUrl : planet?.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1 hover:underline"
              >
                <span>NASA Archive</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Action Footer */}
      {onAnalyzeLightCurve && (
        <div className="p-3 border-t border-slate-800/80 bg-slate-900/80">
          <button
            onClick={() => onAnalyzeLightCurve(star)}
            className="w-full py-2 px-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold font-mono text-xs flex items-center justify-center gap-2 transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)] cursor-pointer"
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Analyze {star.name} Light Curve</span>
          </button>
        </div>
      )}
    </aside>
  )
}
