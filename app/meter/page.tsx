"use client"

import { useState, Suspense } from 'react'
import ProtectedRoute from '@/components/ProtectedRoute'
import { Button } from '@/components/ui/button'
import { RefreshCw, Plus, Loader2 } from 'lucide-react'
import { MeterRegistrationModal } from '@/components/MeterRegistrationModal'
import { SubmitReadingModal } from '@/components/SubmitReadingModal'
import { useSmartMeter } from '@/hooks/useSmartMeter'
import ErrorBoundary from '@/components/ui/ErrorBoundary'
import dynamic from 'next/dynamic'

// Lazy load heavy components with skeletons
const MeterStats = dynamic(
  () => import('@/components/meter/MeterStats').then(m => m.MemoizedMeterStats),
  {
    loading: () => (
      <div className="flex items-center justify-center h-32">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    ),
  }
)

const ReadingsList = dynamic(
  () => import('@/components/meter/ReadingsList').then(m => m.MemoizedReadingsList),
  {
    loading: () => (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    ),
  }
)

const MeterList = dynamic(
  () => import('@/components/meter/MeterList').then(m => m.MemoizedMeterList),
  {
    loading: () => (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    ),
  }
)

export default function SmartMeterPage() {
    const {
        meters,
        readings,
        loading,
        refreshing,
        mintingReadingId,
        fetchData,
        handleMintTokens,
        copyToClipboard,
        lastRefreshed,
        stats
    } = useSmartMeter()

    const [activeTab, setActiveTab] = useState("readings")
    const [isRegisterOpen, setIsRegisterOpen] = useState(false)
    const [isSubmitOpen, setIsSubmitOpen] = useState(false)
    const [selectedMeterSerial, setSelectedMeterSerial] = useState<string>('')

    const handleOpenSubmit = (serial: string) => {
        setSelectedMeterSerial(serial)
        setIsSubmitOpen(true)
    }

    return (
        <ProtectedRoute requireWallet={false} requireAuth={true}>
            <main className="flex h-[calc(100vh-4rem)] flex-1 flex-col gap-6 p-6 overflow-hidden">

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Smart Energy Dashboard</h1>
                        <p className="text-muted-foreground">Monitor your energy production and consumption in real-time.</p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => fetchData()} disabled={refreshing}>
                            <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                            Refresh
                        </Button>
                        <Button size="sm" onClick={() => setIsRegisterOpen(true)}>
                            <Plus className="mr-2 h-4 w-4" />
                            Register Meter
                        </Button>
                    </div>
                </div>

                <MeterRegistrationModal
                    isOpen={isRegisterOpen}
                    onClose={() => setIsRegisterOpen(false)}
                    onSuccess={fetchData}
                />

                <SubmitReadingModal
                    isOpen={isSubmitOpen}
                    onClose={() => setIsSubmitOpen(false)}
                    meterSerial={selectedMeterSerial}
                    onSuccess={fetchData}
                />

                <ErrorBoundary name="Meter Stats">
                    <MeterStats
                        totalGenerated={stats.totalGenerated}
                        totalMinted={stats.totalMinted}
                        mintedCount={stats.mintedCount}
                        pendingToMint={stats.pendingToMint}
                        pendingCount={stats.pendingCount}
                        netEnergy={stats.netEnergy}
                        meterCount={meters.length}
                        lastUpdate={stats.lastUpdate}
                        lastRefreshed={lastRefreshed}
                    />
                </ErrorBoundary>

                <div className="flex-1 flex flex-col min-h-0">
                    <div className="flex items-center border-b pb-2 mb-4 flex-none">
                        <Button
                            variant={activeTab === 'readings' ? 'secondary' : 'ghost'}
                            onClick={() => setActiveTab('readings')}
                            className="mr-2 rounded-none border-b-2 border-transparent px-4 pb-2 pt-2 font-medium text-muted-foreground hover:text-foreground data-[state=active]:border-primary data-[state=active]:text-foreground"
                            data-state={activeTab === 'readings' ? 'active' : ''}
                        >
                            Recent Readings
                        </Button>
                        <Button
                            variant={activeTab === 'meters' ? 'secondary' : 'ghost'}
                            onClick={() => setActiveTab('meters')}
                            className="rounded-none border-b-2 border-transparent px-4 pb-2 pt-2 font-medium text-muted-foreground hover:text-foreground data-[state=active]:border-primary data-[state=active]:text-foreground"
                            data-state={activeTab === 'meters' ? 'active' : ''}
                        >
                            My Meters
                        </Button>
                    </div>

                    <ErrorBoundary name="Meter Lists">
                        {activeTab === 'readings' && (
                            <div className="flex-1 min-h-0 flex flex-col">
                                <ReadingsList
                                    readings={readings}
                                    meters={meters}
                                    loading={loading}
                                    onMint={async (id, kwh, meterId) => handleMintTokens(id, kwh, meterId)}
                                    onCopy={copyToClipboard}
                                    mintingId={mintingReadingId}
                                />
                            </div>
                        )}

                        {activeTab === 'meters' && (
                            <div className="flex-1 min-h-0 overflow-y-auto">
                                <MeterList
                                    meters={meters}
                                    loading={loading}
                                    onOpenSubmit={handleOpenSubmit}
                                />
                            </div>
                        )}
                    </ErrorBoundary>
                </div>
            </main>
        </ProtectedRoute>
    )
}
