'use client'

import { useState, useEffect, useCallback } from 'react'
import { TrendingUp, RefreshCw, BarChart2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts'
import { useAuth } from '@/contexts/AuthProvider'
import { createApiClient } from '@/lib/api-client'
import { Skeleton } from '../ui/skeleton'
import { Button } from '../ui/button'

export function PortfolioChart() {
  const { isAuthenticated, user, token } = useAuth()
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timeframe, setTimeframe] = useState('24h')

  const fetchData = useCallback(async () => {
    if (!isAuthenticated || !token) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    try {
      const apiClient = createApiClient(token)
      const response = await apiClient.getUserHistory({ timeframe })

      if (response.data && response.data.history) {
        // Format for recharts
        const formatted = response.data.history.map((item: any) => ({
          time: new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          fullTime: new Date(item.timestamp).toLocaleString(),
          value: item.balance_usd,
        }))
        setData(formatted)
      } else {
        setData([])
      }
    } catch (err) {
      console.error('Failed to fetch portfolio history:', err)
      setError('Failed to load chart data')
    } finally {
      setLoading(false)
    }
  }, [isAuthenticated, token, timeframe])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  if (!isAuthenticated) {
    return (
      <Card className="col-span-12 w-full rounded-sm lg:col-span-6">
        <CardContent className="h-[400px] p-6 flex items-center justify-center">
          <div className="text-center">
            <TrendingUp className="mx-auto mb-2 h-12 w-12 opacity-50" />
            <p className="font-medium">Portfolio Performance Chart</p>
            <p className="text-sm text-muted-foreground">
              Sign in to view your portfolio analytics
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="col-span-12 w-full rounded-sm lg:col-span-6 border-primary/10">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <BarChart2 className="h-4 w-4 text-primary" />
            Portfolio Performance
          </CardTitle>
          <CardDescription>Visualized wealth progression</CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-muted rounded-md p-1 items-center">
            {['24h', '7d', '30d'].map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-3 py-1 text-xs rounded-md transition-all ${timeframe === tf
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                  }`}
              >
                {tf}
              </button>
            ))}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={fetchData}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        {loading ? (
          <div className="h-[300px] w-full flex items-center justify-center">
            <Skeleton className="h-full w-full rounded-md" />
          </div>
        ) : error ? (
          <div className="h-[300px] w-full flex flex-col items-center justify-center text-destructive">
            <p>{error}</p>
            <Button variant="link" onClick={fetchData} className="mt-2 text-primary">Try again</Button>
          </div>
        ) : data.length === 0 ? (
          <div className="h-[300px] w-full flex items-center justify-center border-2 border-dashed rounded-md">
            <div className="text-center text-muted-foreground">
              <TrendingUp className="mx-auto mb-2 h-10 w-10 opacity-30" />
              <p>No trading data found for this timeframe</p>
              <p className="text-xs">Start trading to see your performance!</p>
            </div>
          </div>
        ) : (
          <div className="h-[300px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="time"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                  minTickGap={30}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                  tickFormatter={(val) => `$${val}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    borderColor: 'hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px'
                  }}
                  itemStyle={{ color: 'hsl(var(--primary))' }}
                  labelStyle={{ color: 'hsl(var(--muted-foreground))', marginBottom: '4px' }}
                  labelFormatter={(idx, payload) => payload[0]?.payload?.fullTime || idx}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorValue)"
                  animationDuration={1500}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
