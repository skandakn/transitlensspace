import React, { useState, useEffect, useRef } from 'react'
import { Sidebar } from '../components/Sidebar'
import { TopBar } from '../components/TopBar'
import type { NavigationTab, StarObservation, AnalysisStatus } from '../types'
import { cn } from '../lib/utils'

/** Renders a twinkling starfield on a transparent canvas */
function StarfieldCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animId: number
    let width = window.innerWidth
    let height = window.innerHeight

    const STAR_COUNT = 130
    const stars = Array.from({ length: STAR_COUNT }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      r: Math.random() * 1.1 + 0.3,
      speed: Math.random() * 0.6 + 0.2,
      phase: Math.random() * Math.PI * 2,
      color: Math.random() > 0.85
        ? `hsl(${190 + Math.random() * 40}, 80%, 80%)`   // cyan-ish
        : `hsl(${220 + Math.random() * 60}, 40%, 85%)`,   // white-blue
    }))

    const resize = () => {
      width = window.innerWidth
      height = window.innerHeight
      canvas.width = width
      canvas.height = height
    }
    resize()
    window.addEventListener('resize', resize)

    let t = 0
    const draw = () => {
      ctx.clearRect(0, 0, width, height)
      for (const s of stars) {
        const opacity = 0.15 + 0.75 * (0.5 + 0.5 * Math.sin(t * s.speed + s.phase))
        ctx.beginPath()
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2)
        ctx.fillStyle = s.color.replace(')', `, ${opacity})`).replace('hsl(', 'hsla(')
        ctx.fill()
      }
      t += 0.012
      animId = requestAnimationFrame(draw)
    }
    draw()

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    />
  )
}

export interface RootLayoutProps {
  children: React.ReactNode
  activeTab: NavigationTab
  onSelectTab: (tab: NavigationTab) => void
  selectedStar: StarObservation
  stars: StarObservation[]
  onSelectStar: (star: StarObservation) => void
  analysisStatus: AnalysisStatus
  onRunAnalysis: () => void
  onResetAnalysis: () => void
  isAnalyzing: boolean
  canAnalyze?: boolean
}

export function RootLayout({
  children,
  activeTab,
  onSelectTab,
  selectedStar,
  stars,
  onSelectStar,
  analysisStatus,
  onRunAnalysis,
  onResetAnalysis,
  isAnalyzing,
  canAnalyze = true
}: RootLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Animated cosmic background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        {/* Twinkling starfield */}
        <StarfieldCanvas />

        {/* Animated nebula blobs */}
        <div
          className="absolute -top-40 -left-40 w-[30rem] h-[30rem] rounded-full blur-[130px] animate-nebula-drift"
          style={{ background: 'radial-gradient(circle, rgba(6,182,212,0.14) 0%, transparent 70%)', animationDelay: '0s' }}
          aria-hidden="true"
        />
        <div
          className="absolute top-1/3 -right-40 w-[38rem] h-[38rem] rounded-full blur-[150px] animate-nebula-drift"
          style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)', animationDelay: '-7s' }}
          aria-hidden="true"
        />
        <div
          className="absolute -bottom-40 left-1/3 w-[32rem] h-[32rem] rounded-full blur-[160px] animate-nebula-drift"
          style={{ background: 'radial-gradient(circle, rgba(30,64,175,0.1) 0%, transparent 70%)', animationDelay: '-14s' }}
          aria-hidden="true"
        />
        <div
          className="absolute top-2/3 left-10 w-[18rem] h-[18rem] rounded-full blur-[100px] animate-nebula-drift"
          style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.07) 0%, transparent 70%)', animationDelay: '-20s' }}
          aria-hidden="true"
        />

        {/* Subtle dot-grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, #38bdf8 1px, transparent 0)`,
            backgroundSize: '32px 32px'
          }}
          aria-hidden="true"
        />
      </div>

      {/* Navigation Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={onSelectTab}
        isMobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
      />

      {/* Main Content Area */}
      <div
        className={cn(
          'flex flex-col min-h-screen relative z-10 transition-all duration-300 ease-in-out',
          isSidebarCollapsed ? 'lg:pl-20' : 'lg:pl-72',
          activeTab === 'universe' ? 'h-screen overflow-hidden' : ''
        )}
      >
        {activeTab !== 'universe' && (
          <TopBar
            onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)}
            selectedStar={selectedStar}
            stars={stars}
            onSelectStar={onSelectStar}
            analysisStatus={analysisStatus}
            onRunAnalysis={onRunAnalysis}
            onResetAnalysis={onResetAnalysis}
            isAnalyzing={isAnalyzing}
            canAnalyze={canAnalyze}
          />
        )}

        <main className={activeTab === 'universe' ? 'flex-1 relative w-full h-full overflow-hidden' : 'flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6'}>
          {children}
        </main>

        {/* Global Footer – suppressed in full-screen universe mode */}
        {activeTab !== 'universe' && (
          <footer className="border-t border-slate-800/80 bg-[#070b14]/80 py-4 px-6 text-center text-xs text-slate-400 font-mono">
            <span>TransitLens Exoplanet Detection System · NASA Kepler &amp; TESS Photometry Pipeline · Open Source MIT</span>
          </footer>
        )}
      </div>
    </div>
  )
}
