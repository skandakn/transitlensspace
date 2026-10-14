import React, { useState } from 'react'
import { Sidebar } from '../components/Sidebar'
import { TopBar } from '../components/TopBar'
import type { NavigationTab, StarObservation, AnalysisStatus } from '../types'

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

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Background ambient cosmic glow effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-cyan-600/10 rounded-full blur-[128px]" />
        <div className="absolute top-1/3 -right-40 w-[30rem] h-[30rem] bg-violet-600/10 rounded-full blur-[140px]" />
        <div className="absolute -bottom-40 left-1/3 w-[32rem] h-[32rem] bg-blue-900/10 rounded-full blur-[160px]" />
        {/* Subtle grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, #38bdf8 1px, transparent 0)`,
            backgroundSize: '32px 32px'
          }}
        />
      </div>

      {/* Navigation Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={onSelectTab}
        isMobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div className="lg:pl-72 flex flex-col min-h-screen relative z-10">
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

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          {children}
        </main>

        {/* Global Footer */}
        <footer className="border-t border-slate-800/80 bg-[#070b14]/80 py-4 px-6 text-center text-xs text-slate-400 font-mono">
          <span>TransitLens Exoplanet Detection System · NASA Kepler & TESS Photometry Pipeline · Open Source MIT</span>
        </footer>
      </div>
    </div>
  )
}
