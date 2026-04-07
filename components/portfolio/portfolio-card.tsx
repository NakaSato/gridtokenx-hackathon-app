'use client'

import { useQuery } from '@tanstack/react-query'
import { ChevronDown, ArrowUpRight, ArrowDownRight, RefreshCw } from 'lucide-react'
import { Button } from '../ui/button'
import { Card, CardContent } from '../ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select'
import { useState } from 'react'
import { useAuth } from '@/contexts/AuthProvider'
import { useWallet } from '@solana/wallet-adapter-react'
import { createApiClient } from '@/lib/api-client'
import { Skeleton } from '../ui/skeleton'

export function PortfolioCard() {
  const { user, token, isAuthenticated } = useAuth()
  const { publicKey } = useWallet()
  const [selectedTimeframe, setSelectedTimeframe] = useState('30D')
  const [selectedAssets, setSelectedAssets] = useState('All Assets')

  const walletAddress = user?.wallet_address || publicKey?.toString()
  const apiClient = createApiClient(token || '')

  // Map UI timeframe to API timeframe
  const apiTimeframe = selectedTimeframe === '24H' ? '24h'
    : selectedTimeframe === '7D' ? '7d'
      : selectedTimeframe === '30D' ? '30d'
        : '30d'

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['portfolio-stats', token, walletAddress, apiTimeframe],
    queryFn: async () => {
      if (!token) throw new Error('Not authenticated')

      // Fetch user analytics for PnL stats
      const analyticsResponse = await apiClient.getUserAnalytics({ timeframe: apiTimeframe })
      const analytics = analyticsResponse.data

      // Fetch trades for volume and count
      const tradesResponse = await apiClient.getTrades({ limit: 100 })
      const trades = tradesResponse.data?.trades || []

      // Calculate stats from trades
      let totalBuyValue = 0
      let totalSellValue = 0
      let totalVolume = 0
      let tradeCount = 0

      // Filter trades by timeframe
      const now = new Date()
      const cutoff = new Date()
      if (selectedTimeframe === '24H') {
        cutoff.setHours(cutoff.getHours() - 24)
      } else if (selectedTimeframe === '7D') {
        cutoff.setDate(cutoff.getDate() - 7)
      } else if (selectedTimeframe === '30D') {
        cutoff.setDate(cutoff.getDate() - 30)
      } else {
        cutoff.setFullYear(2000) // All time
      }

      trades.forEach((trade: any) => {
        const tradeDate = new Date(trade.executed_at || trade.created_at)
        if (tradeDate < cutoff) return

        const value = parseFloat(trade.total_value || trade.price || '0')
        totalVolume += value
        tradeCount++

        if (trade.role === 'buyer' || trade.side === 'buy') {
          totalBuyValue += value
        } else {
          totalSellValue += value
        }
      })

      const pnl = totalSellValue - totalBuyValue
      const pnlPercent = totalBuyValue > 0 ? (pnl / totalBuyValue) * 100 : 0

      return {
        pnl,
        pnlPercent,
        volume: totalVolume,
        tradeCount,
        // Use analytics data if available
        totalVolumeKwh: analytics?.overall?.total_volume_kwh ?? 0,
        avgPrice: analytics?.overall?.avg_price ?? 0,
      }
    },
    enabled: !!token && isAuthenticated,
    staleTime: 30000,
    refetchInterval: 60000,
  })

  const stats = data ?? { pnl: 0, pnlPercent: 0, volume: 0, tradeCount: 0 }
  const isProfitable = stats.pnl >= 0

  const formatCurrency = (value: number): string => {
    const prefix = value >= 0 ? '+฿' : '-฿'
    return `${prefix}${Math.abs(value).toFixed(2)}`
  }

  if (!isAuthenticated) {
    return (
      <Card className="col-span-3 h-full w-full rounded-sm">
        <CardContent className="p-6 flex items-center justify-center h-full">
          <div className="text-center text-muted-foreground">
            <p className="font-medium">Portfolio Stats</p>
            <p className="text-sm">Sign in to view your P&L</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="col-span-3 h-full w-full rounded-sm">
      <CardContent className="p-6">
        <div className="mb-4 flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Select value={selectedAssets} onValueChange={setSelectedAssets}>
              <SelectTrigger asChild>
                <Button variant="outline" className="bg-transparent text-sm">
                  <SelectValue />
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All Assets">All Assets</SelectItem>
                <SelectItem value="Energy Tokens">Energy Tokens</SelectItem>
                <SelectItem value="SOL Only">SOL Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => refetch()}
              disabled={isLoading || isRefetching}
            >
              <RefreshCw className={`h-4 w-4 ${isRefetching ? 'animate-spin' : ''}`} />
            </Button>
            <Select
              value={selectedTimeframe}
              onValueChange={setSelectedTimeframe}
            >
              <SelectTrigger asChild>
                <Button variant="outline" className="bg-transparent text-sm">
                  <SelectValue />
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="24H">24H</SelectItem>
                <SelectItem value="7D">7D</SelectItem>
                <SelectItem value="30D">30D</SelectItem>
                <SelectItem value="ALL">ALL TIME</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-4">
          {/* PNL */}
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">P&L</span>
            {isLoading ? (
              <Skeleton className="h-5 w-24" />
            ) : (
              <div className="flex items-center gap-1">
                <span className={`font-medium ${isProfitable ? 'text-green-500' : 'text-red-500'}`}>
                  {formatCurrency(stats.pnl)}
                </span>
                {isProfitable ? (
                  <ArrowUpRight className="h-4 w-4 text-green-500" />
                ) : (
                  <ArrowDownRight className="h-4 w-4 text-red-500" />
                )}
                <span className={`text-xs ${isProfitable ? 'text-green-500' : 'text-red-500'}`}>
                  ({stats.pnlPercent >= 0 ? '+' : ''}{stats.pnlPercent.toFixed(2)}%)
                </span>
              </div>
            )}
          </div>

          {/* Volume */}
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Volume</span>
            {isLoading ? (
              <Skeleton className="h-5 w-20" />
            ) : (
              <span className="font-medium">฿{stats.volume.toFixed(2)}</span>
            )}
          </div>

          {/* Trade Count */}
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Total Trades</span>
            {isLoading ? (
              <Skeleton className="h-5 w-16" />
            ) : (
              <span className="font-medium">{stats.tradeCount}</span>
            )}
          </div>

          {/* Average Price (if available) */}
          {data?.avgPrice ? (
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Avg Price</span>
              <span className="font-medium">฿{data.avgPrice.toFixed(2)}/kWh</span>
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  )
}
