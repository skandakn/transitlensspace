import React, { useState } from 'react'
import { Sparkles, Search, Compass, ExternalLink, Filter } from 'lucide-react'
import type { StarObservation } from '../../types'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import {
  formatCoordinates,
  formatTemperature,
  formatStellarRadius,
  formatStellarMass
} from '../../lib/formatters'

export interface StarCatalogViewProps {
  stars: StarObservation[]
  selectedStarId: string
  onSelectStar: (star: StarObservation) => void
}

/**
 * Star Catalog & Registry Module
 * Owned by: Stars Lead (Member 2)
 *
 * Responsibilities:
 * - Querying MAST / Kepler / TESS star catalogs
 * - Displaying stellar astrophysics (Teff, logg, Fe/H, radius, mass)
 * - Filtering by mission, magnitude, spectral type
 */
export function StarCatalogView({
  stars,
  selectedStarId,
  onSelectStar
}: StarCatalogViewProps) {
  const [search, setSearch] = useState('')
  const [filterMission, setFilterMission] = useState<string>('ALL')

  const filteredStars = stars.filter((star) => {
    const matchesSearch =
      star.name.toLowerCase().includes(search.toLowerCase()) ||
      star.id.toLowerCase().includes(search.toLowerCase()) ||
      (star.catalogId && star.catalogId.toLowerCase().includes(search.toLowerCase()))
    const matchesMission = filterMission === 'ALL' || star.mission === filterMission
    return matchesSearch && matchesMission
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-wide flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-cyan-400" />
            Target Star Registry
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Browse Kepler, TESS, and K2 host stars with calibrated photometric time series
          </p>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search star or TIC ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-3 py-1.5 rounded-lg bg-slate-900 border border-slate-750 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400 w-48 sm:w-64"
            />
          </div>

          <select
            value={filterMission}
            onChange={(e) => setFilterMission(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-750 text-xs text-slate-200 focus:outline-none focus:border-cyan-400"
          >
            <option value="ALL">All Missions</option>
            <option value="TESS">TESS</option>
            <option value="Kepler">Kepler</option>
            <option value="K2">K2</option>
          </select>
        </div>
      </div>

      {/* Grid of Star Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredStars.map((star) => {
          const isSelected = star.id === selectedStarId
          return (
            <Card
              key={star.id}
              glowBorder={isSelected}
              className={`transition-all duration-200 cursor-pointer ${
                isSelected
                  ? 'border-cyan-400/80 bg-cyan-950/20 shadow-[0_0_20px_rgba(6,182,212,0.15)]'
                  : 'hover:border-slate-700'
              }`}
              onClick={() => onSelectStar(star)}
            >
              <CardHeader className="flex flex-row items-start justify-between pb-2">
                <div>
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base text-white">{star.name}</CardTitle>
                    <Badge variant={star.mission === 'TESS' ? 'cyan' : 'violet'} className="text-[10px]">
                      {star.mission}
                    </Badge>
                  </div>
                  <div className="text-xs text-cyan-400 font-mono mt-0.5">{star.id}</div>
                </div>

                <Button
                  variant={isSelected ? 'primary' : 'outline'}
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    onSelectStar(star)
                  }}
                  className="text-xs"
                >
                  {isSelected ? 'Active Target' : 'Select'}
                </Button>
              </CardHeader>

              <CardContent className="space-y-3 pt-2">
                <p className="text-xs text-slate-400 line-clamp-2">
                  {star.description || 'Target host observed during mission telemetry.'}
                </p>

                {/* Astrophysical Metrics Grid */}
                <div className="grid grid-cols-3 gap-2 p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 text-[11px] font-mono">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Temp (Teff)</span>
                    <span className="text-amber-300 font-bold">{formatTemperature(star.temperature)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Radius (R☉)</span>
                    <span className="text-cyan-300 font-bold">{formatStellarRadius(star.stellarRadius)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Mass (M☉)</span>
                    <span className="text-violet-300 font-bold">{formatStellarMass(star.stellarMass)}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 border-t border-slate-800/80 pt-2">
                  <span>{formatCoordinates(star.ra, star.dec)}</span>
                  <span className="text-slate-300 font-bold">{star.numPoints.toLocaleString()} points</span>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
