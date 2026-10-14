import React, { useState, useEffect } from 'react'
import {
  Orbit,
  Sparkles,
  Compass,
  UploadCloud,
  FileSpreadsheet,
  Radio,
  Cpu,
  ChevronRight,
  Activity,
  Database,
  PanelLeftClose,
  PanelLeftOpen,
  X
} from 'lucide-react'
import { GithubIcon } from './icons/GithubIcon'
import type { NavigationTab } from '../types'
import { cn } from '../lib/utils'

export interface SidebarProps {
  activeTab: NavigationTab
  onSelectTab: (tab: NavigationTab) => void
  isMobileOpen?: boolean
  onCloseMobile?: () => void
  isCollapsed?: boolean
  onToggleCollapse?: () => void
}

export function Sidebar({
  activeTab,
  onSelectTab,
  isMobileOpen = false,
  onCloseMobile,
  isCollapsed = false,
  onToggleCollapse
}: SidebarProps) {
  const [webGLStatus, setWebGLStatus] = useState<string>('WebGL 2.0')

  // Detect genuine hardware WebGL acceleration capability
  useEffect(() => {
    try {
      const canvas = document.createElement('canvas')
      const gl2 = canvas.getContext('webgl2')
      if (gl2) {
        setWebGLStatus('WebGL 2.0')
        return
      }
      const gl = canvas.getContext('webgl')
      if (gl) {
        setWebGLStatus('WebGL 1.0')
        return
      }
      setWebGLStatus('Canvas')
    } catch {
      setWebGLStatus('Canvas')
    }
  }, [])

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
          className="fixed inset-0 bg-black/75 backdrop-blur-md z-40 lg:hidden transition-opacity"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container: Option 2 — Neon Glass Spacecraft Interface */}
      <aside
        id="transitlens-sidebar"
        className={cn(
          'fixed top-0 bottom-0 left-0 z-50 bg-[#060913]/95 backdrop-blur-xl border-r border-violet-500/20 flex flex-col transition-all duration-300 ease-in-out shadow-[4px_0_24px_rgba(0,0,0,0.6)] overflow-hidden',
          isCollapsed ? 'w-20' : 'w-72',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* =========================================================================
            1. COSMIC GALAXY BACKGROUND & NEBULA TEXTURES
            Positioned near upper-right behind branding & upper navigation,
            masked & faded naturally to deep midnight-navy (#060913)
            ========================================================================= */}
        <div className="absolute top-0 right-0 w-full h-84 pointer-events-none overflow-hidden select-none z-0">
          {/* High-quality optimized spiral galaxy asset */}
          <img
            src="/assets/sidebar-galaxy.webp"
            alt="Cosmic Spiral Galaxy"
            className="absolute -top-6 -right-10 w-80 h-80 object-cover object-center opacity-60 mix-blend-screen scale-110 filter drop-shadow-[0_0_24px_rgba(168,85,247,0.35)]"
          />

          {/* Violet and indigo nebula textures with ambient glow */}
          <div className="absolute top-2 right-4 w-44 h-44 bg-purple-600/25 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute top-16 right-12 w-36 h-36 bg-indigo-600/20 rounded-full blur-2xl pointer-events-none" />

          {/* Smooth multi-directional dark masking to guarantee high text contrast */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#060913]/30 via-[#060913]/75 to-[#060913]" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#060913]/85 via-[#060913]/40 to-[#060913]/30" />
        </div>

        {/* Subtle starfield overlay with tiny cyan and violet stars */}
        <svg
          aria-hidden="true"
          className="absolute top-0 left-0 w-full h-96 pointer-events-none z-0 opacity-45"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="24" cy="22" r="1.1" fill="#38bdf8" opacity="0.8" />
          <circle cx="82" cy="38" r="0.9" fill="#c084fc" opacity="0.75" />
          <circle cx="165" cy="20" r="1.4" fill="#e0e7ff" opacity="0.9" />
          <circle cx="218" cy="52" r="1.0" fill="#38bdf8" opacity="0.85" />
          <circle cx="48" cy="88" r="0.8" fill="#a78bfa" opacity="0.6" />
          <circle cx="132" cy="108" r="1.3" fill="#38bdf8" opacity="0.8" />
          <circle cx="194" cy="94" r="1.0" fill="#c084fc" opacity="0.7" />
          <circle cx="242" cy="128" r="0.8" fill="#38bdf8" opacity="0.55" />
          <circle cx="68" cy="158" r="1.2" fill="#c084fc" opacity="0.75" />
          <circle cx="152" cy="178" r="0.9" fill="#e0e7ff" opacity="0.65" />
          <circle cx="228" cy="208" r="1.3" fill="#38bdf8" opacity="0.8" />
          <circle cx="32" cy="228" r="0.8" fill="#a78bfa" opacity="0.5" />
          <circle cx="112" cy="258" r="1.0" fill="#38bdf8" opacity="0.7" />
          <circle cx="182" cy="278" r="0.9" fill="#c084fc" opacity="0.6" />
        </svg>

        {/* Ambient violet-cyan edge highlight */}
        <div className="absolute top-0 right-0 w-[1px] h-96 bg-gradient-to-b from-cyan-400/40 via-violet-500/30 to-transparent pointer-events-none z-10" />

        {/* =========================================================================
            2. BRAND HEADER: Cyan-lit Logo Emblem & Clean Astro Typography
            ========================================================================= */}
        <div className={cn(
          'relative border-b border-violet-500/15 flex items-center z-10 bg-[#060913]/35 backdrop-blur-sm transition-all duration-300',
          isCollapsed ? 'h-24 px-2 flex-col justify-center gap-1.5' : 'h-18 px-4 justify-between'
        )}>
          {/* Subtle purple glow behind the logo */}
          <div className="absolute -left-2 top-2 w-20 h-20 bg-purple-600/20 rounded-full blur-xl pointer-events-none" />

          {/* Logo container & typography */}
          <div className={cn('flex items-center min-w-0', isCollapsed ? 'justify-center' : 'gap-3')}>
            {/* Cyan-lit logo container */}
            <div className="relative flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/25 via-violet-600/20 to-[#060913] border border-cyan-400/50 shadow-[0_0_16px_rgba(6,182,212,0.35),inset_0_0_8px_rgba(34,211,238,0.2)]">
              {/* Planetary eclipse logo glyph */}
              <div className="w-5 h-5 rounded-full bg-cyan-400 shadow-[0_0_10px_#22d3ee] flex items-center justify-center relative overflow-hidden">
                <div className="w-3.5 h-3.5 rounded-full bg-[#060913] absolute -right-1 -top-0.5" />
              </div>
            </div>

            {/* Typography (hidden when collapsed) */}
            {!isCollapsed && (
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 leading-none">
                  <span className="font-bold text-sm tracking-widest text-white whitespace-nowrap">
                    TRANSIT<span className="text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.7)]">LENS</span>
                  </span>
                </div>
                <p className="text-[9px] text-cyan-300/80 font-mono tracking-wider uppercase mt-1 whitespace-nowrap">
                  EXOPLANET DETECTION SUITE
                </p>
              </div>
            )}
          </div>

          {/* Desktop collapse / expand toggle & Mobile close button */}
          <div className="flex items-center gap-1">
            {/* Mobile close */}
            <button
              type="button"
              onClick={onCloseMobile}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 lg:hidden cursor-pointer"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Desktop toggle button */}
            {onToggleCollapse && (
              <button
                type="button"
                id="sidebar-toggle-btn"
                data-testid={isCollapsed ? 'expand-sidebar-btn' : 'collapse-sidebar-btn'}
                onClick={onToggleCollapse}
                className={cn(
                  'hidden lg:flex items-center justify-center rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-slate-800/80 border border-slate-800/90 hover:border-cyan-500/40 transition-all cursor-pointer shadow-sm',
                  isCollapsed ? 'w-8 h-8' : 'w-7 h-7'
                )}
                title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              >
                {isCollapsed ? (
                  <PanelLeftOpen className="w-4 h-4" />
                ) : (
                  <PanelLeftClose className="w-3.5 h-3.5" />
                )}
              </button>
            )}
          </div>
        </div>

        {/* =========================================================================
            3. NAVIGATION ITEMS: Option 2 Neon Glass Aesthetic
            ========================================================================= */}
        <div className="flex-1 py-4 px-2 space-y-1.5 overflow-y-auto overflow-x-hidden z-10">
          {/* Workspace category header (hidden when collapsed) */}
          {!isCollapsed && (
            <div className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500/90 flex items-center justify-between">
              <span>Workspaces</span>
              <span className="text-[9px] font-mono text-cyan-400/60">SYS::NAV</span>
            </div>
          )}

          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = activeTab === item.id

            return (
              <div key={item.id} className="relative group/nav">
                <button
                  type="button"
                  id={`nav-item-${item.id}`}
                  data-testid={`nav-item-${item.id}`}
                  onClick={() => {
                    onSelectTab(item.id)
                    if (onCloseMobile) onCloseMobile()
                  }}
                  className={cn(
                    'w-full flex items-center rounded-xl text-left transition-all duration-200 relative cursor-pointer',
                    isCollapsed ? 'justify-center p-2.5' : 'px-3 py-2.5 gap-3',
                    isActive
                      ? 'bg-gradient-to-r from-violet-950/50 via-blue-950/40 to-cyan-950/30 text-white border border-cyan-400/50 shadow-[0_0_16px_rgba(6,182,212,0.22),inset_0_0_12px_rgba(139,92,246,0.18)] backdrop-blur-md'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-violet-950/20 hover:border-violet-500/30 border border-transparent hover:shadow-[0_0_12px_rgba(139,92,246,0.12)]'
                  )}
                  title={isCollapsed ? `${item.label} — ${item.subtitle}` : undefined}
                  aria-label={item.label}
                >
                  {/* Active Neon Indicator: glowing cyan pill on left edge */}
                  {isActive && (
                    <span className="absolute left-0 top-2 bottom-2 w-1.5 bg-gradient-to-b from-cyan-400 via-cyan-300 to-violet-400 rounded-r-full shadow-[0_0_10px_#22d3ee]" />
                  )}

                  {/* Icon container */}
                  <div
                    className={cn(
                      'p-2 rounded-lg transition-all duration-200 flex-shrink-0',
                      isActive
                        ? 'text-cyan-300 bg-cyan-950/70 border border-cyan-500/40 shadow-[0_0_10px_rgba(6,182,212,0.25)]'
                        : 'text-slate-400 group-hover/nav:text-cyan-300 group-hover/nav:bg-slate-800/60 border border-transparent'
                    )}
                  >
                    <Icon className="w-4 h-4" />
                  </div>

                  {/* Title & Subtitle (hidden when collapsed) */}
                  {!isCollapsed && (
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1.5">
                        <span className={cn(
                          'text-xs font-semibold whitespace-nowrap',
                          isActive ? 'text-white' : 'text-slate-300 group-hover/nav:text-white'
                        )}>
                          {item.label}
                        </span>
                        {item.badge && (
                          <span
                            className={cn(
                              'text-[9px] px-1.5 py-0.5 rounded-md font-mono font-medium border tracking-tight shrink-0',
                              isActive
                                ? 'bg-cyan-500/20 text-cyan-200 border-cyan-400/40 shadow-[0_0_8px_rgba(6,182,212,0.25)]'
                                : 'bg-slate-900/80 text-slate-400 border-slate-800 group-hover/nav:border-slate-700'
                            )}
                          >
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 truncate block mt-0.5 group-hover/nav:text-slate-300">
                        {item.subtitle}
                      </span>
                    </div>
                  )}

                  {/* Chevron Right (hidden when collapsed) */}
                  {!isCollapsed && (
                    <ChevronRight
                      className={cn(
                        'w-3.5 h-3.5 transition-all text-slate-600 flex-shrink-0',
                        isActive
                          ? 'opacity-100 text-cyan-400 drop-shadow-[0_0_4px_rgba(34,211,238,0.6)] translate-x-0.5'
                          : 'opacity-0 group-hover/nav:opacity-100 group-hover/nav:text-slate-400'
                      )}
                    />
                  )}
                </button>

                {/* Collapsed floating tooltip on desktop hover */}
                {isCollapsed && (
                  <div className="hidden lg:group-hover/nav:flex absolute left-full ml-3 top-1/2 -translate-y-1/2 z-50 px-3 py-2 rounded-xl bg-[#090e1a]/95 border border-cyan-500/40 shadow-[0_6px_20px_rgba(0,0,0,0.7)] backdrop-blur-md pointer-events-none flex-col min-w-[180px]">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-white whitespace-nowrap">{item.label}</span>
                      {item.badge && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shrink-0">
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono mt-0.5 whitespace-nowrap">{item.subtitle}</span>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* =========================================================================
            4. BOTTOM STATUS PANEL: Genuine Spacecraft Telemetry & Diagnostics
            ========================================================================= */}
        <div className="p-3 border-t border-violet-500/15 bg-[#060913]/80 backdrop-blur-md relative z-10">
          {/* Expanded bottom telemetry card */}
          {!isCollapsed && (
            <div className="p-3 rounded-xl bg-slate-900/70 border border-violet-500/20 backdrop-blur-md space-y-2.5 shadow-[0_4px_16px_rgba(0,0,0,0.3)]">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-slate-200 flex items-center gap-1.5">
                  <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                  System Telemetry
                </span>
                <span className="flex items-center gap-1 text-[10px] font-mono text-emerald-400">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400 shadow-[0_0_6px_#34d399]" />
                  </span>
                  Nominal
                </span>
              </div>

              {/* Genuine telemetry metrics */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80 text-[10px] font-mono">
                <div className="flex items-center gap-1 text-slate-300" title="Client GPU Acceleration">
                  <Cpu className="w-3 h-3 text-cyan-400" />
                  <span>{webGLStatus}</span>
                </div>
                <div className="flex items-center gap-1 text-slate-300 text-right justify-end" title="Photometry Analysis Pipeline">
                  <Activity className="w-3 h-3 text-violet-400" />
                  <span>BLS Ready</span>
                </div>
                <div className="flex items-center gap-1 text-slate-400" title="Kepler & TESS Host Stars Cached">
                  <Database className="w-3 h-3 text-indigo-400" />
                  <span>12 Targets</span>
                </div>
                <div className="text-right text-cyan-400 font-semibold">
                  v0.2.0-astro
                </div>
              </div>
            </div>
          )}

          {/* Collapsed bottom telemetry icon on desktop */}
          {isCollapsed && (
            <div className="flex flex-col items-center gap-2 py-1">
              <div
                className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-slate-900/80 border border-violet-500/30 text-cyan-400 hover:text-white hover:border-cyan-400 transition-all cursor-help"
                title={`System Telemetry: Nominal | ${webGLStatus} | BLS Ready | 12 Targets`}
              >
                <Radio className="w-4 h-4 animate-pulse" />
                <span className="absolute -top-1 -right-1 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
                </span>
              </div>
            </div>
          )}

          {/* GitHub and License link */}
          <div className={cn(
            'mt-2.5 flex items-center justify-between px-1',
            isCollapsed ? 'justify-center' : 'justify-between'
          )}>
            <a
              href="https://github.com/skandakn/TransitLens"
              target="_blank"
              rel="noreferrer"
              className="text-xs text-slate-400 hover:text-cyan-300 flex items-center gap-1.5 transition-colors group"
              title="TransitLens GitHub Repository"
            >
              <GithubIcon className="w-3.5 h-3.5 group-hover:text-cyan-300 transition-colors" />
              {!isCollapsed && <span className="group-hover:underline">TransitLens</span>}
            </a>
            {!isCollapsed && <span className="text-[10px] text-slate-500 font-mono">MIT License</span>}
          </div>
        </div>
      </aside>
    </>
  )
}
