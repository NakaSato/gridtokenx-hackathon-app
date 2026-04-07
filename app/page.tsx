'use client'
import { useState, useCallback } from 'react'
import dynamic from 'next/dynamic'
import TradingViewTopNav from '@/components/TradingViewTopNav'
import { tokenList } from '@/lib/data/tokenlist'
import { useSidebar } from '@/contexts/SidebarContext'

const TradingPositionsPanel = dynamic(
  () => import('@/components/TradingPositionsPanel'),
  {
    ssr: false,
    loading: () => (
      <div className="h-full w-full rounded-lg border border-border bg-card p-4 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div className="h-5 w-40 animate-pulse rounded bg-secondary" />
          <div className="h-8 w-24 animate-pulse rounded bg-secondary" />
        </div>
        <div className="space-y-2">
          <div className="bg-secondary/30 h-10 w-full animate-pulse rounded" />
          <div className="bg-secondary/30 h-10 w-full animate-pulse rounded" />
          <div className="bg-secondary/30 h-10 w-full animate-pulse rounded" />
        </div>
      </div>
    ),
  }
)

import { usePythPrice } from '@/hooks/usePythPrice'
import { usePythMarketData } from '@/hooks/usePythMarketData'
import { useAuth } from '@/contexts/AuthProvider'

const TradeHistory = dynamic(() => import('@/components/TradeHistory'), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full rounded-lg border border-border bg-card p-4 shadow-sm">
      <div className="mb-4 h-5 w-32 animate-pulse rounded bg-secondary" />
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex justify-between">
            <div className="bg-secondary/50 h-4 w-24 animate-pulse rounded" />
            <div className="bg-secondary/50 h-4 w-16 animate-pulse rounded" />
          </div>
        ))}
      </div>
    </div>
  ),
})

const EnergyGridMapWrapper = dynamic(
  () => import('@/components/EnergyGridMapWrapper'),
  {
    ssr: false,
    loading: () => (
      <div className="bg-secondary/20 flex h-full w-full animate-pulse flex-col items-center justify-center rounded-lg">
        <div className="mb-3 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-sm font-medium text-secondary-foreground">
          Loading map...
        </p>
      </div>
    ),
  }
)

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable'

const P2POrderForm = dynamic(() => import('@/components/p2p/OrderForm'), {
  ssr: false,
  loading: () => (
    <div className="bg-secondary/50 h-full animate-pulse rounded-lg" />
  ),
})

const P2PStatus = dynamic(() => import('@/components/p2p/P2PStatus'), {
  ssr: false,
  loading: () => (
    <div className="bg-secondary/50 mb-4 h-32 animate-pulse rounded-lg" />
  ),
})

import type { EnergyNode } from '@/components/energy-grid/types'
import { CAMPUS_CONFIG } from '@/lib/constants'

export default function Homepage() {
  const [viewState, setViewState] = useState({
    longitude: CAMPUS_CONFIG.center.longitude,
    latitude: CAMPUS_CONFIG.center.latitude,
    zoom: CAMPUS_CONFIG.defaultZoom,
  })

  const [selectedMeterNode, setSelectedMeterNode] = useState<EnergyNode | null>(
    null
  )
  const [tokenIdx, setTokenIdx] = useState(0)
  const [selectedSymbol, setSelectedSymbol] = useState<string>('Crypto.GRX/THB')
  const [selectedLogo, setSelectedLogo] = useState<string>('/svgs/gridx.svg')

  const { showLeftSidebar, showRightSidebar, showPositionsPanel, toggleLeftSidebar, toggleRightSidebar, togglePositionsPanel } = useSidebar()
  const { priceData, loading: priceLoading } = usePythPrice(selectedSymbol)
  const { marketData, loading: marketLoading } =
    usePythMarketData(selectedSymbol)
  const { token } = useAuth()

  const handleViewStateChange = useCallback((newViewState: any) => {
    setViewState(newViewState)
  }, [])

  const handleTradeFromNode = useCallback((node: EnergyNode) => {
    setSelectedMeterNode(node)
  }, [])

  const handleClearNode = useCallback(() => {
    setSelectedMeterNode(null)
  }, [])

  return (
    <>
      <TradingViewTopNav
        symbol={selectedSymbol}
        pythSymbol={tokenList[tokenIdx].pythSymbol}
        logo={selectedLogo}
        priceData={priceData}
        marketData={marketData}
        priceLoading={priceLoading}
        marketLoading={marketLoading}
        type="options"
      />
      <div className="flex min-h-0 w-full flex-1 flex-col overflow-hidden pb-4 pt-2">
        {/* Mobile Layout */}
        <div className="flex h-full flex-col md:hidden">
          <div className="flex flex-1 flex-col overflow-hidden rounded-lg border border-border bg-card shadow-sm duration-700 animate-in fade-in zoom-in-95">
            <EnergyGridMapWrapper
              onTradeFromNode={handleTradeFromNode}
              viewState={viewState}
              onViewStateChange={handleViewStateChange}
            />
          </div>
        </div>

        {/* Desktop Layout - Resizable Panels */}
        <div className="hidden h-full w-full md:flex">
          <ResizablePanelGroup
            direction="horizontal"
            className="h-full w-full rounded-lg"
            id="main-panel-group"
          >
            {/* LEFT SIDEBAR - TRADING HISTORY */}
            {showLeftSidebar && (
              <>
                <ResizablePanel
                  id="left-sidebar"
                  defaultSize={15}
                  minSize={10}
                  maxSize={25}
                >
                  <div className="flex h-full flex-col overflow-y-auto pr-1 duration-700 animate-in fade-in slide-in-from-left-4">
                    <div className="h-full flex-1 overflow-hidden rounded-lg border border-border bg-card shadow-sm">
                      <TradeHistory />
                    </div>
                  </div>
                </ResizablePanel>

                <ResizableHandle withHandle />
              </>
            )}

            {/* CENTER - MAP & POSITIONS */}
            <ResizablePanel 
              id="center-area" 
              defaultSize={showLeftSidebar && showRightSidebar ? 65 : showLeftSidebar || showRightSidebar ? 80 : 100} 
              minSize={40}
            >
              <ResizablePanelGroup
                direction="vertical"
                className="h-full"
                id="center-vertical-group"
              >
                {/* MAP - No Tabs */}
                <ResizablePanel id="center-map" defaultSize={85} minSize={30}>
                  <div className="flex h-full flex-col overflow-hidden">
                    <div className="relative mt-1 min-h-0 flex-1 overflow-hidden rounded-lg border border-border bg-card shadow-sm">
                      <EnergyGridMapWrapper
                        onTradeFromNode={handleTradeFromNode}
                        viewState={viewState}
                        onViewStateChange={handleViewStateChange}
                      />
                    </div>
                  </div>
                </ResizablePanel>

                {showPositionsPanel && (
                  <>
                    <ResizableHandle withHandle />

                    {/* POSITIONS */}
                    <ResizablePanel
                      id="center-positions"
                      defaultSize={15}
                      minSize={10}
                      maxSize={40}
                    >
                      <div className="h-full overflow-y-auto pt-2">
                        <TradingPositionsPanel />
                      </div>
                    </ResizablePanel>
                  </>
                )}
              </ResizablePanelGroup>
            </ResizablePanel>

            {showRightSidebar && (
              <>
                <ResizableHandle withHandle />

                {/* RIGHT SIDEBAR */}
                <ResizablePanel
                  id="right-sidebar"
                  defaultSize={20}
                  minSize={12}
                  maxSize={30}
                >
                  <div className="flex h-full flex-col overflow-y-auto pl-2 text-xs duration-700 animate-in fade-in slide-in-from-right-4">
                    <div className="flex-1 rounded-lg border border-border bg-card p-3 shadow-sm">
                      <P2POrderForm
                        selectedNode={selectedMeterNode}
                        onClearNode={handleClearNode}
                      />
                      {token && (
                        <div className="mt-3 flex flex-col gap-3">
                          <P2PStatus />
                        </div>
                      )}
                    </div>
                  </div>
                </ResizablePanel>
              </>
            )}
          </ResizablePanelGroup>
        </div>
      </div>
    </>
  )
}
