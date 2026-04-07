'use client'

import { useQuery } from '@tanstack/react-query'
import { useEffect, useState, useMemo } from 'react'
import {
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Area,
    AreaChart,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TrendingUp, TrendingDown, Activity, RefreshCw } from 'lucide-react'
import { useAuth } from '@/contexts/AuthProvider'
import { createApiClient } from '@/lib/api-client'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

interface TradeDataPoint {
    date: string
    volume: number
    value: number
    trades: number
}

interface TradingHistoryChartProps {
    className?: string
}

export function TradingHistoryChart({ className }: TradingHistoryChartProps) {
    const { token, isAuthenticated } = useAuth()
    const [timeframe, setTimeframe] = useState('7d')
    const apiClient = createApiClient(token || '')

    // Fetch user's trading history from API
    const { data: rawData, isLoading, refetch, error } = useQuery({
        queryKey: ['trading-history-chart', token, timeframe],
        queryFn: async () => {
            if (!token) throw new Error('Not authenticated')

            // Get user trades
            const tradesResponse = await apiClient.getTrades({ limit: 100 })
            if (tradesResponse.error) throw new Error(tradesResponse.error)

            const trades = tradesResponse.data?.trades || []

            // Get user analytics for aggregated stats
            const analyticsResponse = await apiClient.getUserAnalytics({ timeframe })
            const analytics = analyticsResponse.data

            return { trades, analytics }
        },
        enabled: !!token && isAuthenticated,
        refetchInterval: 30000, // Refresh every 30s
        staleTime: 15000,
    })

    // Process trades into chart data points
    const chartData = useMemo(() => {
        if (!rawData?.trades?.length) {
            return []
        }

        const trades = rawData.trades
        const now = new Date()
        const daysMap = new Map<string, TradeDataPoint>()

        // Determine the number of periods based on timeframe
        const periods = timeframe === '24h' ? 24 : timeframe === '7d' ? 7 : 30
        const isHourly = timeframe === '24h'

        // Initialize all periods
        for (let i = periods - 1; i >= 0; i--) {
            const date = new Date(now)
            if (isHourly) {
                date.setHours(date.getHours() - i, 0, 0, 0)
            } else {
                date.setDate(date.getDate() - i)
                date.setHours(0, 0, 0, 0)
            }

            const key = isHourly
                ? `${date.getHours()}:00`
                : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

            daysMap.set(key, {
                date: key,
                volume: 0,
                value: 0,
                trades: 0,
            })
        }

        // Aggregate trades into periods
        trades.forEach((trade: any) => {
            const tradeDate = new Date(trade.executed_at || trade.created_at)
            const timeDiff = now.getTime() - tradeDate.getTime()

            // Filter based on timeframe
            const maxMs = timeframe === '24h' ? 24 * 60 * 60 * 1000
                : timeframe === '7d' ? 7 * 24 * 60 * 60 * 1000
                    : 30 * 24 * 60 * 60 * 1000

            if (timeDiff > maxMs) return

            const key = isHourly
                ? `${tradeDate.getHours()}:00`
                : tradeDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

            const existing = daysMap.get(key)
            if (existing) {
                existing.volume += parseFloat(trade.quantity || trade.energy_amount || '0')
                existing.value += parseFloat(trade.total_value || trade.price || '0')
                existing.trades += 1
            }
        })

        return Array.from(daysMap.values())
    }, [rawData?.trades, timeframe])

    // Calculate trend
    const trend = useMemo(() => {
        if (chartData.length < 2) return 'neutral'
        const first = chartData[0].value
        const last = chartData[chartData.length - 1].value
        return last > first ? 'up' : last < first ? 'down' : 'neutral'
    }, [chartData])

    // Calculate totals
    const totalVolume = chartData.reduce((sum, d) => sum + d.volume, 0)
    const avgValue = chartData.length > 0
        ? chartData.reduce((sum, d) => sum + d.value, 0) / chartData.filter(d => d.value > 0).length || 0
        : 0
    const totalTrades = chartData.reduce((sum, d) => sum + d.trades, 0)

    // Show login prompt for unauthenticated users
    if (!isAuthenticated) {
        return (
            <Card className={className}>
                <CardContent className="flex items-center justify-center h-[300px]">
                    <div className="text-center text-muted-foreground">
                        <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="font-medium">Trading History</p>
                        <p className="text-sm">Sign in to view your trading activity</p>
                    </div>
                </CardContent>
            </Card>
        )
    }

    // Loading state
    if (isLoading) {
        return (
            <Card className={className}>
                <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                        <Skeleton className="h-6 w-40" />
                        <Skeleton className="h-8 w-32" />
                    </div>
                    <div className="grid grid-cols-3 gap-4 pt-2">
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                    </div>
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-[200px] w-full" />
                </CardContent>
            </Card>
        )
    }

    // Empty state
    if (chartData.length === 0 || totalTrades === 0) {
        return (
            <Card className={className}>
                <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                            <Activity className="h-5 w-5 text-primary" />
                            Trading History
                        </CardTitle>
                        <Tabs value={timeframe} onValueChange={setTimeframe}>
                            <TabsList className="h-8">
                                <TabsTrigger value="24h" className="text-xs">24H</TabsTrigger>
                                <TabsTrigger value="7d" className="text-xs">7D</TabsTrigger>
                                <TabsTrigger value="30d" className="text-xs">30D</TabsTrigger>
                            </TabsList>
                        </Tabs>
                    </div>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center h-[250px]">
                    <Activity className="h-10 w-10 text-muted-foreground/30 mb-3" />
                    <p className="text-muted-foreground font-medium">No trades in this period</p>
                    <p className="text-sm text-muted-foreground/70">Start trading to see your activity here</p>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className={className}>
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                        <Activity className="h-5 w-5 text-primary" />
                        Trading History
                        {trend === 'up' && <TrendingUp className="h-4 w-4 text-green-500" />}
                        {trend === 'down' && <TrendingDown className="h-4 w-4 text-red-500" />}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => refetch()}
                            disabled={isLoading}
                        >
                            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                        </Button>
                        <Tabs value={timeframe} onValueChange={setTimeframe}>
                            <TabsList className="h-8">
                                <TabsTrigger value="24h" className="text-xs">24H</TabsTrigger>
                                <TabsTrigger value="7d" className="text-xs">7D</TabsTrigger>
                                <TabsTrigger value="30d" className="text-xs">30D</TabsTrigger>
                            </TabsList>
                        </Tabs>
                    </div>
                </div>
                <div className="grid grid-cols-3 gap-4 pt-2">
                    <div>
                        <p className="text-xs text-muted-foreground">Volume (kWh)</p>
                        <p className="text-lg font-bold text-primary">{totalVolume.toFixed(1)}</p>
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground">Avg Value (฿)</p>
                        <p className="text-lg font-bold text-green-500">{avgValue.toFixed(0)}</p>
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground">Trades</p>
                        <p className="text-lg font-bold text-blue-500">{totalTrades}</p>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="h-[200px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                            <defs>
                                <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid
                                strokeDasharray="3 3"
                                stroke="hsl(var(--border))"
                                vertical={false}
                            />
                            <XAxis
                                dataKey="date"
                                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                                tickLine={false}
                                axisLine={false}
                            />
                            <YAxis
                                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(value) => `${value}`}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'hsl(var(--background))',
                                    border: '1px solid hsl(var(--border))',
                                    borderRadius: '8px',
                                    fontSize: '12px',
                                }}
                                labelStyle={{ color: 'hsl(var(--primary))' }}
                                formatter={(value: number, name: string) => [
                                    name === 'volume' ? `${value.toFixed(2)} kWh` : `฿${value.toFixed(2)}`,
                                    name === 'volume' ? 'Volume' : 'Value'
                                ]}
                            />
                            <Area
                                type="monotone"
                                dataKey="volume"
                                stroke="hsl(var(--primary))"
                                strokeWidth={2}
                                fill="url(#colorVolume)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    )
}
