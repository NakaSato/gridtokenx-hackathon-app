'use client'

import { useQuery } from '@tanstack/react-query'
import { Card, CardContent } from '../ui/card'
import { TrendingUp, RefreshCw } from 'lucide-react'
import { useAuth } from '@/contexts/AuthProvider'
import { createApiClient } from '@/lib/api-client'
import { Skeleton } from '../ui/skeleton'
import { Button } from '../ui/button'

export function VolumeCard() {
  const { token, isAuthenticated } = useAuth()
  const apiClient = createApiClient(token || '')

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['user-volume', token],
    queryFn: async () => {
      if (!token) throw new Error('Not authenticated')

      // Try to get user's trading volume from analytics API
      const response = await apiClient.getUserAnalytics({ timeframe: '7d' })

      if (response.error) {
        throw new Error(response.error)
      }

      const analytics = response.data
      return {
        volume: analytics?.overall?.total_volume_kwh ?? 0,
        tradeCount: analytics?.overall?.trade_count ?? 0,
        avgVolume: analytics?.overall?.avg_volume_per_trade ?? 0,
      }
    },
    enabled: !!token && isAuthenticated,
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // Refresh every minute
  })

  const volume = data?.volume ?? 0

  const formatValue = (value: number): string => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(2)}M`
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(2)}K`
    }
    return value.toFixed(2)
  }

  if (!isAuthenticated) {
    return (
      <Card className="w-full rounded-sm">
        <CardContent className="p-6">
          <div className="mb-4 flex items-start justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <h1 className="text-sm font-medium text-muted-foreground">7 Day Volume</h1>
            </div>
          </div>
          <div className="text-sm text-muted-foreground">Sign in to view</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full rounded-sm">
      <CardContent className="p-6">
        <div className="mb-4 flex items-start justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            <h1 className="text-sm font-medium text-muted-foreground">7 Day Volume</h1>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => refetch()}
            disabled={isLoading || isRefetching}
          >
            <RefreshCw className={`h-3 w-3 ${isRefetching ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        {isLoading ? (
          <Skeleton className="h-9 w-24" />
        ) : (
          <>
            <div className="text-3xl font-bold text-foreground">{formatValue(volume)} kWh</div>
            {data?.tradeCount !== undefined && data.tradeCount > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                {data.tradeCount} trades • Avg {formatValue(data.avgVolume)} kWh/trade
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
