'use client'

import { Skeleton } from '@/components/ui/skeleton'
import { PointsCard } from '@/components/portfolio/points-card'
import { PortfolioCard } from '@/components/portfolio/portfolio-card'
import { PortfolioChart } from '@/components/portfolio/portfolio-chart'
import { PortfolioSummary } from '@/components/portfolio/portfolio-summary'
import { PortfolioTabs } from '@/components/portfolio/portfolio-tabs'
import { VolumeCard } from '@/components/portfolio/volume-card'
import { TradingHistoryChart } from '@/components/charts/TradingHistoryChart'
import ErrorBoundary from '@/components/ui/ErrorBoundary'

export function PortfolioClient() {
  return (
    <main className="flex h-full flex-1 flex-col overflow-y-auto py-4 px-1">
      {/* Page Header */}
      <header className="mb-6 animate-in fade-in slide-in-from-top-4 duration-500">
        <div className="flex items-center gap-3 mb-2">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Portfolio</h1>
            <p className="text-sm text-muted-foreground">
              Track your assets, performance, and trading history
            </p>
          </div>
        </div>
      </header>

      {/* Portfolio Summary - User Info, Balance, Wealth */}
      <section className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
        <ErrorBoundary name="Portfolio Summary">
          <PortfolioSummary />
        </ErrorBoundary>
      </section>

      {/* Stats & Performance Section */}
      <section className="mb-6 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">
        <div className="grid grid-cols-12 gap-4">
          {/* Left Column - Quick Stats */}
          <div className="col-span-12 lg:col-span-3">
            <div className="flex flex-col gap-4 sm:flex-row lg:flex-col h-full">
              <ErrorBoundary name="Volume Card">
                <VolumeCard />
              </ErrorBoundary>
              <ErrorBoundary name="Points Card">
                <PointsCard />
              </ErrorBoundary>
            </div>
          </div>

          {/* Middle - Portfolio Chart */}
          <div className="col-span-12 lg:col-span-6">
            <ErrorBoundary name="Portfolio Chart">
              <PortfolioCard />
            </ErrorBoundary>
          </div>

          {/* Right - Portfolio Tabs */}
          <div className="col-span-12 lg:col-span-3">
            <ErrorBoundary name="Portfolio Tabs">
              <PortfolioTabs />
            </ErrorBoundary>
          </div>
        </div>
      </section>

      {/* Trading History */}
      <section className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300">
        <ErrorBoundary name="Trading History">
          <TradingHistoryChart />
        </ErrorBoundary>
      </section>
    </main>
  )
}
