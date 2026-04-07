'use client'

import React, { useState, useEffect, useCallback } from 'react'
import dynamic from 'next/dynamic'
import TradingViewTopNav from '@/components/TradingViewTopNav'
import { useAuth } from '@/contexts/AuthProvider'
import { createApiClient } from '@/lib/api-client'
import { FuturesProduct, FuturesPosition, OrderBook } from '@/types/futures'
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable'
import { Card } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'react-hot-toast'
import type { OrderBookEntry } from '@/types/futures'

// Components
import { FuturesOrderForm } from '@/components/trading/FuturesOrderForm'
import { FuturesOrderBook } from '@/components/trading/FuturesOrderBook'
import { FuturesPositionList } from '@/components/trading/FuturesPositionList'

const PriceChart = dynamic(() => import('@/components/trading/PriceChart'), {
  ssr: false,
  loading: () => <Skeleton className="w-full h-full bg-muted/20 rounded-xl" />
})

const TradeHistory = dynamic(() => import('@/components/TradeHistory'), {
  ssr: false,
  loading: () => <Skeleton className="w-full h-full bg-muted/20 rounded-xl" />
})

export default function FuturesPage() {
  const { token, isAuthenticated } = useAuth()
  const [products, setProducts] = useState<FuturesProduct[]>([])
  const [selectedProduct, setSelectedProduct] = useState<FuturesProduct | null>(null)
  const [positions, setPositions] = useState<FuturesPosition[]>([])
  const [orderBook, setOrderBook] = useState<OrderBook | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchMarketData = useCallback(async () => {
    if (!token) return

    try {
      const api = createApiClient(token)
      const [productsRes, positionsRes] = await Promise.all([
        api.getFuturesProducts(),
        api.getFuturesPositions()
      ])

      if (productsRes.data) {
        setProducts(productsRes.data)
        if (productsRes.data.length > 0 && !selectedProduct) {
          setSelectedProduct(productsRes.data[0])
        }
      }

      if (positionsRes.data) {
        setPositions(positionsRes.data)
      }
    } catch (err) {
      console.error('Failed to fetch futures data:', err)
    } finally {
      setLoading(false)
    }
  }, [token, selectedProduct])

  const fetchOrderBook = useCallback(async () => {
    if (!token || !selectedProduct) return

    try {
      const api = createApiClient(token)
      const response = await api.getFuturesOrderBook(selectedProduct.id)
      if (response.data) {
        setOrderBook(response.data)
      }
    } catch (err) {
      console.error('Failed to fetch order book:', err)
    }
  }, [token, selectedProduct])

  useEffect(() => {
    fetchMarketData()
    const marketInterval = setInterval(fetchMarketData, 5000)
    return () => clearInterval(marketInterval)
  }, [fetchMarketData])

  useEffect(() => {
    fetchOrderBook()
    const obInterval = setInterval(fetchOrderBook, 2000)
    return () => clearInterval(obInterval)
  }, [fetchOrderBook])

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
        <div className="max-w-md space-y-4">
          <h2 className="text-2xl font-black text-foreground">Futures Trading</h2>
          <p className="text-muted-foreground">Please connect your wallet or sign in to access leveraged futures trading.</p>
        </div>
      </div>
    )
  }

  const currentPrice = selectedProduct ? parseFloat(selectedProduct.current_price) : 0

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] overflow-hidden">
      <TradingViewTopNav
        symbol={selectedProduct?.symbol || 'GRX'}
        pythSymbol="Crypto.GRX/THB" // Fallback for demonstration
        logo="/svgs/gridx.svg"
        priceData={{ price: currentPrice }}
        marketData={{
          high24h: currentPrice * 1.05,
          low24h: currentPrice * 0.95,
          volume24h: 1250000
        }}
        priceLoading={loading}
        marketLoading={loading}
        type="futures"
      />

      <div className="flex-1 mt-4 rounded-xl overflow-hidden border border-border/50">
        <ResizablePanelGroup direction="horizontal">
          {/* Left: Chart & Positions */}
          <ResizablePanel defaultSize={75} minSize={40}>
            <ResizablePanelGroup direction="vertical">
              <ResizablePanel defaultSize={70} minSize={30}>
                <div className="h-full p-2">
                  <PriceChart
                    symbol={selectedProduct?.symbol || 'GRX'}
                    type="futures"
                  />
                </div>
              </ResizablePanel>
              <ResizableHandle withHandle />
              <ResizablePanel defaultSize={30} minSize={10}>
                <div className="h-full p-4 overflow-y-auto">
                  <FuturesPositionList
                    positions={positions}
                    onRefresh={fetchMarketData}
                    loading={loading}
                  />
                </div>
              </ResizablePanel>
            </ResizablePanelGroup>
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* Right: Order Form & Book */}
          <ResizablePanel defaultSize={25} minSize={20}>
            <ResizablePanelGroup direction="vertical">
              <ResizablePanel defaultSize={50} minSize={30}>
                <div className="h-full p-4 overflow-y-auto border-b border-border/50">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">Trade Futures</h3>
                  {selectedProduct && (
                    <FuturesOrderForm
                      productId={selectedProduct.id}
                      symbol={selectedProduct.symbol}
                      currentPrice={currentPrice}
                      onOrderCreated={fetchMarketData}
                    />
                  )}
                </div>
              </ResizablePanel>
              <ResizableHandle withHandle />
              <ResizablePanel defaultSize={50} minSize={20}>
                <div className="h-full">
                  <FuturesOrderBook
                    symbol={selectedProduct?.symbol || ''}
                    currentPrice={currentPrice}
                    bids={(orderBook?.bids || []).map((b: OrderBookEntry) => ({
                      price: parseFloat(b.price),
                      quantity: parseFloat(b.quantity),
                      total: parseFloat(b.total)
                    }))}
                    asks={(orderBook?.asks || []).map((a: OrderBookEntry) => ({
                      price: parseFloat(a.price),
                      quantity: parseFloat(a.quantity),
                      total: parseFloat(a.total)
                    }))}
                  />
                </div>
              </ResizablePanel>
            </ResizablePanelGroup>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  )
}
