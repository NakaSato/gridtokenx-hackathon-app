import { Metadata } from 'next'
import { PointsCard } from '@/components/portfolio/points-card'
import { PortfolioCard } from '@/components/portfolio/portfolio-card'
import { PortfolioChart } from '@/components/portfolio/portfolio-chart'
import { PortfolioSummary } from '@/components/portfolio/portfolio-summary'
import { PortfolioTabs } from '@/components/portfolio/portfolio-tabs'
import { VolumeCard } from '@/components/portfolio/volume-card'
import { TradingHistoryChart } from '@/components/charts/TradingHistoryChart'
import ProtectedRoute from '@/components/ProtectedRoute'
import ErrorBoundary from '@/components/ui/ErrorBoundary'

export const metadata: Metadata = {
  title: 'Portfolio | GridTokenX',
  description: 'View your energy trading portfolio, performance analytics, positions, and transaction history on GridTokenX.',
}

export default function Portfolio() {
  return (
    <ProtectedRoute requireWallet={false} requireAuth={true}>
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

            {/* Middle Column - P&L Stats */}
            <div className="col-span-12 lg:col-span-4">
              <ErrorBoundary name="Portfolio Card">
                <PortfolioCard />
              </ErrorBoundary>
            </div>

            {/* Right Column - Placeholder or Info */}
            <div className="col-span-12 lg:col-span-5">
              <div className="h-full border border-border/50 rounded-lg bg-card/30 flex items-center justify-center p-8 text-muted-foreground italic text-sm text-center">
                Real-time performance metrics enabled for this portfolio session.
              </div>
            </div>
          </div>
        </section>

        {/* Trading History Chart */}
        <section className="mb-6 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300">
          <ErrorBoundary name="Trading History Chart">
            <TradingHistoryChart />
          </ErrorBoundary>
        </section>

        {/* Portfolio Tabs - Positions, Orders, History */}
        <section className="min-h-0 flex-1 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-[400ms]">
          <ErrorBoundary name="Portfolio Tabs">
            <PortfolioTabs />
          </ErrorBoundary>
        </section>
      </main>
    </ProtectedRoute>
  )
}
