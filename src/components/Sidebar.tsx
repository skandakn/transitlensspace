import React from 'react'
import {
  Orbit,
  Sparkles,
  Compass,
  UploadCloud,
  FileSpreadsheet,
  Radio,
  Cpu,
  ChevronRight
} from 'lucide-react'
import { GithubIcon } from './icons/GithubIcon'
import type { NavigationTab } from '../types'
import { cn } from '../lib/utils'

export interface SidebarProps {
  activeTab: NavigationTab
  onSelectTab: (tab: NavigationTab) => void
  isMobileOpen?: boolean
  onCloseMobile?: () => void
}

export function Sidebar({
  activeTab,
  onSelectTab,
  isMobileOpen = false,
  onCloseMobile
}: SidebarProps) {
  const navItems = [
    {
      id: 'universe' as NavigationTab,
      label: '3D Universe',
      subtitle: 'Real-time galaxy & star explorer',
      icon: Compass,
      badge: '3D'
    },
    {
      id: 'analysis' as NavigationTab,
      label: 'Transit Analysis',
      subtitle: 'Light curve BLS/TLS detection',
      icon: Orbit,
      badge: 'Core'
    },
    {
      id: 'stars' as NavigationTab,
      label: 'Target Registry',
      subtitle: 'Kepler & TESS catalog',
      icon: Sparkles
    },
    {
      id: 'upload' as NavigationTab,
      label: 'Photometry Upload',
      subtitle: 'CSV / FITS light curve ingest',
      icon: UploadCloud
    },
    {
      id: 'results' as NavigationTab,
      label: 'Candidate Results',
      subtitle: 'Disposition & vetting table',
      icon: FileSpreadsheet,
      badge: '2 Found'
    }
  ]

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={cn(
          'fixed top-0 bottom-0 left-0 z-50 w-72 bg-[#090e1a] border-r border-slate-800/80 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Brand Header */}
        <div className="h-16 px-5 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-violet-600/30 border border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
              {/* Planetary eclipse logo icon */}
              <div className="w-5 h-5 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee] flex items-center justify-center relative overflow-hidden">
                <div className="w-3.5 h-3.5 rounded-full bg-[#090e1a] absolute -right-1 -top-0.5" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-base tracking-wider text-white">TRANSIT<span className="text-cyan-400">LENS</span></span>
              </div>
              <p className="text-[10px] text-slate-400 font-mono tracking-tight">EXOPLANET DETECTION SUITE</p>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 py-4 px-3 space-y-1.5 overflow-y-auto">
          <div className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            Workspaces
          </div>
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = activeTab === item.id
            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectTab(item.id)
                  if (onCloseMobile) onCloseMobile()
                }}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all duration-150 group relative cursor-pointer',
                  isActive
                    ? 'bg-gradient-to-r from-cyan-950/60 to-violet-950/30 text-white border border-cyan-500/40 shadow-[0_0_12px_rgba(6,182,212,0.15)]'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border border-transparent'
                )}
              >
                {isActive && (
                  <span className="absolute left-0 top-2 bottom-2 w-1 bg-cyan-400 rounded-r-full shadow-[0_0_8px_#22d3ee]" />
                )}
                <div
                  className={cn(
                    'p-1.5 rounded-md transition-colors',
                    isActive
                      ? 'text-cyan-400 bg-cyan-950/60'
                      : 'text-slate-400 group-hover:text-cyan-300 group-hover:bg-slate-800/50'
                  )}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold truncate">{item.label}</span>
                    {item.badge && (
                      <span
                        className={cn(
                          'text-[9px] px-1.5 py-0.2 rounded font-mono font-medium border',
                          isActive
                            ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
                            : 'bg-slate-800 text-slate-400 border-slate-700'
                        )}
                      >
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400 truncate block mt-0.5">
                    {item.subtitle}
                  </span>
                </div>
                <ChevronRight
                  className={cn(
                    'w-3.5 h-3.5 transition-transform opacity-0 group-hover:opacity-100 text-slate-500',
                    isActive && 'opacity-100 text-cyan-400'
                  )}
                />
              </button>
            )
          })}
        </div>

        {/* System & Telemetry Footprint */}
        <div className="p-3 border-t border-slate-800/80 bg-[#070b14]/70">
          <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800/90 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-slate-300 flex items-center gap-1.5">
                <Radio className="w-3 h-3 text-cyan-400 animate-pulse" />
                Telemetry Nominal
              </span>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800 text-[10px] text-slate-400 font-mono">
              <div className="flex items-center gap-1">
                <Cpu className="w-3 h-3 text-violet-400" />
                <span>BLS Grid: OK</span>
              </div>
              <div className="text-right text-cyan-400">
                v0.1.0-alpha
              </div>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between px-1">
            <a
              href="https://github.com/skandakn/TransitLens"
              target="_blank"
              rel="noreferrer"
              className="text-xs text-slate-400 hover:text-cyan-400 flex items-center gap-1.5 transition-colors"
            >
              <GithubIcon className="w-3.5 h-3.5" />
              <span>GitHub Repo</span>
            </a>
            <span className="text-[10px] text-slate-400 font-mono">MIT License</span>
          </div>
        </div>
      </aside>
    </>
  )
}
