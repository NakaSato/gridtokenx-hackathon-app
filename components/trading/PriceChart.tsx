'use client'

import React, { useEffect, useState, useMemo, useContext } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { format } from 'date-fns'
import { OnChainTradeRecord } from '@/types/trading'
import { ContractContext } from '@/contexts/contractProvider'
import { Loader2, TrendingUp } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

import { createApiClient } from '@/lib/api-client'
import { useAuth } from '@/contexts/AuthProvider'

interface PriceChartProps {
    symbol?: string
    productId?: string
    type?: 'spot' | 'futures'
}

export default function PriceChart({ symbol = 'GRX', productId, type = 'spot' }: PriceChartProps) {
    const { program } = useContext(ContractContext)
    const { token } = useAuth()
    const [data, setData] = useState<{ time: number; price: number; dateStr: string }[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchData = async () => {
            if (type === 'futures' && token && productId) {
                try {
                    const api = createApiClient(token)
                    const response = await api.getFuturesCandles(productId)
                    if (response.data) {
                        const chartData = response.data.map((c: any) => ({
                            time: new Date(c.time).getTime(),
                            price: parseFloat(c.close),
                            dateStr: format(new Date(c.time), 'HH:mm')
                        }))
                        setData(chartData)
                    }
                } catch (err) {
                    console.error("Failed to fetch futures candles", err)
                } finally {
                    setLoading(false)
                }
                return
            }

            if (!program) return

            try {
                // @ts-ignore
                const tradeRecordsRaw = await program.account.tradeRecord.all();
                const trades: OnChainTradeRecord[] = tradeRecordsRaw.map((r: any) => r.account as OnChainTradeRecord)

                // Sort by time ascending
                trades.sort((a: OnChainTradeRecord, b: OnChainTradeRecord) => a.executedAt.toNumber() - b.executedAt.toNumber())

                const chartData = trades.map((t: OnChainTradeRecord) => ({
                    time: t.executedAt.toNumber() * 1000,
                    price: t.pricePerKwh.toNumber() / 1000000, // Assuming 6 decimals for price
                    dateStr: format(new Date(t.executedAt.toNumber() * 1000), 'HH:mm')
                }))

                setData(chartData)
            } catch (err) {
                console.error("Failed to fetch price history", err)
            } finally {
                setLoading(false)
            }
        }

        fetchData()
        const interval = setInterval(fetchData, 10000) // Refresh every 10s
        return () => clearInterval(interval)
    }, [program, type, token, productId])

    const currentPrice = data.length > 0 ? data[data.length - 1].price : 0
    const prevPrice = data.length > 1 ? data[data.length - 2].price : currentPrice
    const priceChange = currentPrice - prevPrice
    const percentChange = prevPrice > 0 ? (priceChange / prevPrice) * 100 : 0

    return (
        <Card className="h-full w-full border-0 shadow-none flex flex-col">
            <CardHeader className="py-3 px-4 border-b border-border/40 flex flex-row items-center justify-between">
                <div className="flex flex-col">
                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-primary" />
                        {symbol} {type === 'futures' ? 'Perpetual' : 'Market Price'}
                    </CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="text-xl font-bold font-mono">
                            {currentPrice.toFixed(4)}
                        </span>
                        <Badge variant={priceChange >= 0 ? "default" : "destructive"} className="text-[10px] h-4 px-1">
                            {priceChange >= 0 ? '+' : ''}{percentChange.toFixed(2)}%
                        </Badge>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Badge variant="outline">1H</Badge>
                    <Badge variant="secondary">24H</Badge>
                </div>
            </CardHeader>
            <CardContent className="flex-1 min-h-0 p-0">
                {loading ? (
                    <div className="h-full flex items-center justify-center">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                ) : data.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <XAxis
                                dataKey="dateStr"
                                stroke="#888888"
                                fontSize={10}
                                tickLine={false}
                                axisLine={false}
                                minTickGap={30}
                            />
                            <YAxis
                                stroke="#888888"
                                fontSize={10}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(value) => value.toFixed(2)}
                                domain={['auto', 'auto']}
                            />
                            <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                            <Tooltip
                                contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}
                                itemStyle={{ color: 'hsl(var(--foreground))' }}
                                labelStyle={{ color: 'hsl(var(--muted-foreground))' }}
                                formatter={(value: number) => [value.toFixed(4), 'Price']}
                            />
                            <Area
                                type="monotone"
                                dataKey="price"
                                stroke="#22c55e"
                                strokeWidth={2}
                                fillOpacity={1}
                                fill="url(#colorPrice)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                        No trade history available
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
