import React, { useState, useEffect } from 'react'
import {
  Orbit,
  Activity,
  Target,
  UploadCloud,
  FileSpreadsheet,
  ChevronsLeft,
  ChevronsRight,
  ChevronRight,
  PanelLeftOpen,
  PanelLeftClose,
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
  const [webGLActive, setWebGLActive] = useState<boolean>(true)
  const [hasCamera, setHasCamera] = useState<boolean>(false)

  // Real-world runtime capability checks
  useEffect(() => {
    try {
      const canvas = document.createElement('canvas')
      const gl = !!(window.WebGL2RenderingContext && canvas.getContext('webgl2')) ||
                 !!(window.WebGLRenderingContext && canvas.getContext('webgl'))
      setWebGLActive(gl)
    } catch {
      setWebGLActive(false)
    }

    // Check camera availability
    if (navigator.mediaDevices && typeof navigator.mediaDevices.enumerateDevices === 'function') {
      navigator.mediaDevices.enumerateDevices()
        .then((devices) => {
          setHasCamera(devices.some((d) => d.kind === 'videoinput'))
        })
        .catch(() => setHasCamera(false))
    }
  }, [])

  const navItems = [
    {
      id: 'universe' as NavigationTab,
      label: '3D Universe',
      subtitle: 'Real-time galaxy & star explorer',
      icon: Orbit,
      badge: '3D'
    },
    {
      id: 'analysis' as NavigationTab,
      label: 'Transit Analysis',
      subtitle: 'Light curve BLS/TLS detection',
      icon: Activity,
      badge: 'Core'
    },
    {
      id: 'stars' as NavigationTab,
      label: 'Target Registry',
      subtitle: 'Kepler & TESS catalog',
      icon: Target
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
          className="fixed inset-0 bg-black/80 backdrop-blur-md z-40 lg:hidden transition-opacity"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container: Option 2 — Neon Glass Spacecraft Interface */}
      <aside
        id="transitlens-sidebar"
        className={cn(
          'fixed top-0 bottom-0 left-0 z-50 bg-[#060913] border-r border-violet-500/30 flex flex-col transition-all duration-300 ease-in-out shadow-[4px_0_28px_rgba(0,0,0,0.7)] overflow-hidden',
          isCollapsed ? 'w-20' : 'w-72',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* =========================================================================
            1. FULL-HEIGHT VERTICAL VIBRANT COSMIC GALAXY & NEBULA BACKGROUND
            Vivid purple/magenta interstellar nebula and spiral galaxy from top to bottom
            ========================================================================= */}
        <div className="absolute inset-0 pointer-events-none select-none z-0 overflow-hidden">
          <img
            src="/assets/sidebar-galaxy-full.webp"
            alt="Cosmic Spiral Galaxy and Purple Nebula"
            className="w-full h-full object-cover object-top opacity-100 filter brightness-125 contrast-120 saturate-140 scale-105"
          />

          {/* Radiant violet and indigo lighting highlights matching Option 2 */}
          <div className="absolute top-6 right-0 w-56 h-56 bg-purple-500/40 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute top-1/2 left-0 w-52 h-52 bg-indigo-500/35 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-16 right-0 w-56 h-56 bg-purple-600/40 rounded-full blur-3xl pointer-events-none" />

          {/* Minimal contrast overlay ensuring text legibility without dimming the purple cosmic nebulae */}
          <div className="absolute inset-0 bg-[#050811]/20" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#050811]/45 via-transparent to-[#050811]/30" />
        </div>

        {/* Ambient violet-cyan edge highlight */}
        <div className="absolute top-0 right-0 w-[1px] h-full bg-gradient-to-b from-cyan-400/50 via-violet-500/40 to-cyan-400/30 pointer-events-none z-10" />

        {/* =========================================================================
            2. OPTION 2 BADGE & BRAND HEADER
            ========================================================================= */}
        <div className={cn(
          'relative z-10 pt-2.5 px-3 transition-all duration-300 flex-shrink-0',
          isCollapsed ? 'flex flex-col items-center pb-2' : 'pb-2'
        )}>
          {/* Top Option 2 reference badge matching reference image */}
          {!isCollapsed && (
            <div className="flex justify-center mb-2">
              <span className="px-3.5 py-0.5 rounded-full border border-cyan-400/50 bg-slate-900/80 text-[9px] font-mono tracking-widest text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.3)] backdrop-blur-md">
                OPTION 2
              </span>
            </div>
          )}

          {/* Brand Card: Cyan-lit Logo Container & Typography */}
          <div className={cn(
            'flex items-center',
            isCollapsed ? 'justify-center flex-col gap-1.5' : 'justify-between gap-2.5'
          )}>
            <div className={cn('flex items-center min-w-0', isCollapsed ? 'justify-center' : 'gap-2.5')}>
              {/* Cyan-lit logo emblem container */}
              <div className="relative flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/30 via-violet-600/25 to-[#060913] border border-cyan-400/60 shadow-[0_0_16px_rgba(6,182,212,0.45),inset_0_0_8px_rgba(34,211,238,0.25)]">
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

            {/* Mobile close button / Header collapse icon */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={onCloseMobile}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 lg:hidden cursor-pointer"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>

              {onToggleCollapse && (
                <button
                  type="button"
                  id="sidebar-header-toggle"
                  onClick={onToggleCollapse}
                  className="hidden lg:flex items-center justify-center w-7 h-7 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-slate-800/70 border border-slate-800/90 hover:border-cyan-500/40 transition-all cursor-pointer shadow-sm"
                  title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                  aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                >
                  {isCollapsed ? (
                    <PanelLeftOpen className="w-3.5 h-3.5" />
                  ) : (
                    <PanelLeftClose className="w-3.5 h-3.5" />
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* =========================================================================
            3. WORKSPACES NAVIGATION: Option 2 Neon Glass
            ========================================================================= */}
        <div className="flex-1 py-2 px-2.5 space-y-1 overflow-y-auto overflow-x-hidden z-10">
          {/* Workspaces category header (matching reference) */}
          {!isCollapsed && (
            <div className="px-3 pt-1 pb-1.5 text-[10px] font-semibold uppercase tracking-widest text-slate-400/90 flex items-center justify-between">
              <span>WORKSPACES</span>
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
                    isCollapsed ? 'justify-center p-2.5' : 'px-3 py-2.5 gap-2.5',
                    isActive
                      ? 'bg-gradient-to-r from-blue-950/70 via-violet-950/60 to-cyan-950/50 text-white border border-cyan-400/70 shadow-[0_0_18px_rgba(6,182,212,0.3),inset_0_0_14px_rgba(6,182,212,0.2)] backdrop-blur-md'
                      : 'text-slate-300 hover:text-white hover:bg-violet-950/30 hover:border-violet-500/35 border border-transparent hover:shadow-[0_0_14px_rgba(139,92,246,0.15)]'
                  )}
                  title={isCollapsed ? `${item.label} — ${item.subtitle}` : undefined}
                  aria-label={item.label}
                >
                  {/* Glowing electric cyan pill indicator on left edge for active item */}
                  {isActive && (
                    <span className="absolute left-0 top-2 bottom-2 w-1.5 bg-gradient-to-b from-cyan-400 via-cyan-300 to-cyan-500 rounded-r-full shadow-[0_0_12px_#22d3ee]" />
                  )}

                  {/* Icon container */}
                  <div
                    className={cn(
                      'p-1.5 rounded-lg transition-all duration-200 flex-shrink-0',
                      isActive
                        ? 'text-cyan-300 bg-cyan-950/80 border border-cyan-500/50 shadow-[0_0_10px_rgba(6,182,212,0.35)]'
                        : 'text-slate-400 group-hover/nav:text-cyan-300 group-hover/nav:bg-slate-800/60 border border-transparent'
                    )}
                  >
                    <Icon className="w-4 h-4" />
                  </div>

                  {/* Title & Subtitle */}
                  {!isCollapsed && (
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1.5">
                        <span className={cn(
                          'text-xs font-semibold whitespace-nowrap',
                          isActive ? 'text-white' : 'text-slate-200 group-hover/nav:text-white'
                        )}>
                          {item.label}
                        </span>
                        {item.badge && (
                          <span
                            className={cn(
                              'text-[9px] px-1.5 py-0.2 rounded-md font-mono font-medium border tracking-tight shrink-0',
                              isActive
                                ? 'bg-cyan-500/25 text-cyan-200 border-cyan-400/50 shadow-[0_0_10px_rgba(6,182,212,0.3)]'
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

                  {/* Cyan Chevron Right on active/hover item */}
                  {!isCollapsed && (
                    <ChevronRight
                      className={cn(
                        'w-3.5 h-3.5 transition-all flex-shrink-0',
                        isActive
                          ? 'opacity-100 text-cyan-400 drop-shadow-[0_0_6px_rgba(34,211,238,0.7)] translate-x-0.5'
                          : 'opacity-0 group-hover/nav:opacity-80 group-hover/nav:text-slate-400'
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
                        <span className="text-[9px] px-1.5 py-0.2 rounded font-mono bg-cyan-500/25 text-cyan-300 border border-cyan-500/30 shrink-0">
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
            4. BOTTOM STATUS PANEL & COLLAPSE CONTROL
            Exact match to Option 2 reference: WebGL Renderer, Camera, Analysis, Data Cache
            ========================================================================= */}
        <div className="p-2.5 border-t border-violet-500/25 bg-[#060913]/70 backdrop-blur-md relative z-10 space-y-2 flex-shrink-0">
          {/* Expanded bottom telemetry card matching Option 2 reference */}
          {!isCollapsed && (
            <div className="p-2.5 rounded-xl bg-slate-950/60 backdrop-blur-md border border-violet-500/30 space-y-1.5 text-xs shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
              {/* WebGL Renderer */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-300">
                  <span className={cn('w-2 h-2 rounded-full', webGLActive ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]' : 'bg-amber-400')} />
                  <span className="text-[11px] font-medium">WebGL Renderer</span>
                </div>
                <div className="flex items-center gap-1.5 text-emerald-400 font-mono text-[10px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>{webGLActive ? 'Active' : 'Fallback'}</span>
                </div>
              </div>

              {/* Camera (Gestures) */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-300">
                  <span className={cn('w-2 h-2 rounded-full', hasCamera ? 'bg-cyan-400 shadow-[0_0_6px_#22d3ee]' : 'bg-slate-500')} />
                  <span className="text-[11px] font-medium">Camera (Gestures)</span>
                </div>
                <div className={cn('flex items-center gap-1.5 font-mono text-[10px]', hasCamera ? 'text-cyan-400' : 'text-slate-400')}>
                  <span className={cn('w-1.5 h-1.5 rounded-full', hasCamera ? 'bg-cyan-400' : 'bg-slate-500')} />
                  <span>{hasCamera ? 'Ready' : 'Disconnected'}</span>
                </div>
              </div>

              {/* Analysis Service */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-300">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
                  <span className="text-[11px] font-medium">Analysis Service</span>
                </div>
                <div className="flex items-center gap-1.5 text-emerald-400 font-mono text-[10px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>Online</span>
                </div>
              </div>

              {/* Data Cache */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-300">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
                  <span className="text-[11px] font-medium">Data Cache</span>
                </div>
                <div className="flex items-center gap-1.5 text-emerald-400 font-mono text-[10px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>Ready</span>
                </div>
              </div>
            </div>
          )}

          {/* Collapsed bottom status indicator */}
          {isCollapsed && (
            <div className="flex flex-col items-center gap-2 py-1">
              <div
                className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-slate-900/80 border border-violet-500/30 text-cyan-400 hover:text-white hover:border-cyan-400 transition-all cursor-help"
                title="System Status: WebGL Active | Analysis Service Online | Data Cache Ready"
              >
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400 shadow-[0_0_8px_#34d399]" />
                </span>
              </div>
            </div>
          )}

          {/* Bottom dedicated Collapse Button (exact match to Option 2 reference) */}
          {onToggleCollapse && (
            <button
              type="button"
              id="sidebar-bottom-collapse-btn"
              data-testid={isCollapsed ? 'expand-sidebar-btn' : 'collapse-sidebar-btn'}
              onClick={onToggleCollapse}
              className={cn(
                'w-full flex items-center justify-center py-2 rounded-xl bg-slate-900/70 hover:bg-slate-800/90 border border-slate-700/60 hover:border-cyan-500/50 text-slate-300 hover:text-white transition-all cursor-pointer shadow-sm group',
                isCollapsed ? 'px-2' : 'gap-2 px-3'
              )}
              title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isCollapsed ? (
                <ChevronsRight className="w-4 h-4 text-slate-400 group-hover:text-cyan-300 group-hover:translate-x-0.5 transition-all" />
              ) : (
                <>
                  <ChevronsLeft className="w-4 h-4 text-slate-400 group-hover:text-cyan-300 group-hover:-translate-x-0.5 transition-all" />
                  <span className="text-xs font-medium">Collapse</span>
                </>
              )}
            </button>
          )}

          {/* GitHub Link & License */}
          {!isCollapsed && (
            <div className="flex items-center justify-between px-1 text-[10px] text-slate-400 font-mono">
              <a
                href="https://github.com/skandakn/TransitLens"
                target="_blank"
                rel="noreferrer"
                className="hover:text-cyan-300 flex items-center gap-1.5 transition-colors group"
                title="TransitLens GitHub Repository"
              >
                <GithubIcon className="w-3.5 h-3.5 group-hover:text-cyan-300 transition-colors" />
                <span className="group-hover:underline">TransitLens</span>
              </a>
              <span>MIT License</span>
            </div>
          )}
        </div>
      </aside>
    </>
  )
}
