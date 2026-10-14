import React from 'react'
import {
  Menu,
  Play,
  RotateCcw,
  Sparkles,
  Telescope,
  ChevronDown,
  Activity
} from 'lucide-react'
import { GithubIcon } from './icons/GithubIcon'
import type { StarObservation, AnalysisStatus } from '../types'
import { Button } from './ui/Button'
import { StatusBadge } from './ui/StatusBadge'
import { Badge } from './ui/Badge'

export interface TopBarProps {
  onToggleMobileMenu: () => void
  selectedStar: StarObservation
  stars: StarObservation[]
  onSelectStar: (star: StarObservation) => void
  analysisStatus: AnalysisStatus
  onRunAnalysis: () => void
  onResetAnalysis: () => void
  isAnalyzing: boolean
}

export function TopBar({
  onToggleMobileMenu,
  selectedStar,
  stars,
  onSelectStar,
  analysisStatus,
  onRunAnalysis,
  onResetAnalysis,
  isAnalyzing
}: TopBarProps) {
  const [dropdownOpen, setDropdownOpen] = React.useState(false)

  return (
    <header className="sticky top-0 z-30 h-16 bg-[#070b14]/90 backdrop-blur-md border-b border-slate-800/80 px-4 lg:px-6 flex items-center justify-between">
      {/* Left: Mobile trigger & Target Selection */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobileMenu}
          className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 lg:hidden cursor-pointer"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Current Target Selector */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-750 hover:border-cyan-500/50 text-left transition-all cursor-pointer group"
          >
            <Telescope className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white tracking-wide">{selectedStar.name}</span>
                <span className="text-[10px] font-mono text-cyan-400/90">({selectedStar.id})</span>
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-cyan-400 ml-1 transition-colors" />
          </button>

          {/* Star selector dropdown */}
          {dropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-30"
                onClick={() => setDropdownOpen(false)}
              />
              <div className="absolute left-0 mt-2 w-72 rounded-xl bg-[#0c1322] border border-slate-750 shadow-2xl py-2 z-40 backdrop-blur-xl animate-in fade-in-50 zoom-in-95">
                <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-800">
                  Select Observation Target
                </div>
                {stars.map((star) => (
                  <button
                    key={star.id}
                    onClick={() => {
                      onSelectStar(star)
                      setDropdownOpen(false)
                    }}
                    className="w-full px-3 py-2 text-left hover:bg-cyan-950/40 hover:border-l-2 hover:border-cyan-400 transition-colors flex items-center justify-between group cursor-pointer"
                  >
                    <div>
                      <div className="text-xs font-semibold text-slate-200 group-hover:text-cyan-300">
                        {star.name}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {star.id} · {star.spectralType || 'Star'}
                      </div>
                    </div>
                    <Badge variant={star.mission === 'TESS' ? 'cyan' : 'violet'} className="text-[9px]">
                      {star.mission}
                    </Badge>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Mission pill */}
        <Badge variant={selectedStar.mission === 'TESS' ? 'cyan' : 'violet'} className="hidden sm:inline-flex">
          <Sparkles className="w-3 h-3" />
          {selectedStar.mission} Mission
        </Badge>
      </div>

      {/* Right: Telemetry status, analysis trigger, links */}
      <div className="flex items-center gap-3">
        {/* Pipeline Status */}
        <div className="hidden md:flex items-center gap-2">
          <StatusBadge status={analysisStatus} />
        </div>

        {/* Action Buttons */}
        <Button
          variant="outline"
          size="sm"
          onClick={onResetAnalysis}
          title="Reset light curve to raw data"
          className="hidden sm:inline-flex"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset</span>
        </Button>

        <Button
          variant="primary"
          size="sm"
          isLoading={isAnalyzing}
          onClick={onRunAnalysis}
          leftIcon={<Play className="w-3.5 h-3.5 fill-current" />}
        >
          {isAnalyzing ? 'Scanning Period Grid...' : 'Run Detection'}
        </Button>

        <a
          href="https://github.com/skandakn/TransitLens"
          target="_blank"
          rel="noreferrer"
          className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors border border-slate-800 hidden sm:inline-flex"
          title="View TransitLens on GitHub"
        >
          <GithubIcon className="w-4 h-4" />
        </a>
      </div>
    </header>
  )
}
