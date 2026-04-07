'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { defaultApiClient } from '@/lib/api-client'
import { useAuth } from '@/contexts/AuthProvider'
import {
    ArrowUp,
    ArrowDown,
    TrendingUp,
    TrendingDown,
    BarChart3,
    AlertCircle,
    Activity
} from 'lucide-react'
import { cn } from '@/lib/utils'

import { useOrderBookUpdates } from '@/hooks/useTransactionUpdates'

interface OrderBookDepthProps {
    currentPrice?: number
    side: 'buy' | 'sell'
    amount?: number
}

interface DepthLevel {
    price: number
    amount: number
    cumulative: number
    count: number
}

interface OrderBookSnapshot {
    bids: DepthLevel[]
    asks: DepthLevel[]
    spread: number
    midPrice: number
    bestBid: number
    bestAsk: number
    totalBidVolume: number
    totalAskVolume: number
}

export default function OrderBookDepth({
    currentPrice,
    side,
    amount
}: OrderBookDepthProps) {
    const { token } = useAuth()
    const [orderBook, setOrderBook] = useState<OrderBookSnapshot | null>(null)
    const [loading, setLoading] = useState(false)
    const [priceImpact, setPriceImpact] = useState<number | null>(null)
    const [isFlashing, setIsFlashing] = useState<boolean>(false)

    const processOrderBookData = useCallback((bids: any[], asks: any[]) => {
        const aggregatedBids = aggregateDepth(bids, 'buy')
        const aggregatedAsks = aggregateDepth(asks, 'sell')

        const bestBid = aggregatedBids.length > 0 ? Math.max(...aggregatedBids.map(b => b.price)) : 0
        const bestAsk = aggregatedAsks.length > 0 ? Math.min(...aggregatedAsks.map(a => a.price)) : 0
        const midPrice = bestBid > 0 && bestAsk > 0 ? (bestBid + bestAsk) / 2 : currentPrice || 0

        const totalBidVolume = aggregatedBids.reduce((sum, b) => sum + b.amount, 0)
        const totalAskVolume = aggregatedAsks.reduce((sum, a) => sum + a.amount, 0)

        setOrderBook(prev => {
            if (prev) {
                // Determine if a meaningful volume change occurred to flash
                if (prev.totalBidVolume !== totalBidVolume || prev.totalAskVolume !== totalAskVolume) {
                    setIsFlashing(true)
                    setTimeout(() => setIsFlashing(false), 500)
                }
            }

            return {
                bids: aggregatedBids.slice(0, 5),
                asks: aggregatedAsks.slice(0, 5),
                spread: bestAsk - bestBid,
                midPrice,
                bestBid,
                bestAsk,
                totalBidVolume,
                totalAskVolume
            }
        })
    }, [currentPrice])

    // Fetch initial order book depth
    useEffect(() => {
        const fetchDepth = async () => {
            if (!token) return

            setLoading(true)
            try {
                defaultApiClient.setToken(token)
                const response = await defaultApiClient.getP2POrderBook()

                if (response.data) {
                    const data = response.data as any
                    processOrderBookData(
                        data.buy_orders || data.bids || [],
                        data.sell_orders || data.asks || []
                    )
                }
            } catch (err) {
                console.error('Failed to fetch initial order book:', err)
            } finally {
                setLoading(false)
            }
        }

        fetchDepth()
    }, [token, processOrderBookData])

    // Listen to real-time order book updates
    const { latestSnapshot } = useOrderBookUpdates({ token: token || undefined })

    useEffect(() => {
        if (latestSnapshot) {
            processOrderBookData(latestSnapshot.bids, latestSnapshot.asks)
        }
    }, [latestSnapshot, processOrderBookData])

    // Calculate price impact
    useEffect(() => {
        if (!orderBook || !amount || amount <= 0) {
            setPriceImpact(null)
            return
        }

        if (side === 'buy' && orderBook.asks.length > 0) {
            // For buy: calculate average price when buying 'amount' from asks
            let remaining = amount
            let totalCost = 0
            let filledAmount = 0

            for (const ask of orderBook.asks) {
                if (remaining <= 0) break
                const fill = Math.min(remaining, ask.amount)
                totalCost += fill * ask.price
                filledAmount += fill
                remaining -= fill
            }

            if (filledAmount > 0) {
                const avgPrice = totalCost / filledAmount
                const impact = ((avgPrice - orderBook.bestAsk) / orderBook.bestAsk) * 100
                setPriceImpact(impact)
            }
        } else if (side === 'sell' && orderBook.bids.length > 0) {
            // For sell: calculate average price when selling 'amount' to bids
            let remaining = amount
            let totalValue = 0
            let filledAmount = 0

            for (const bid of orderBook.bids) {
                if (remaining <= 0) break
                const fill = Math.min(remaining, bid.amount)
                totalValue += fill * bid.price
                filledAmount += fill
                remaining -= fill
            }

            if (filledAmount > 0) {
                const avgPrice = totalValue / filledAmount
                const impact = ((orderBook.bestBid - avgPrice) / orderBook.bestBid) * 100
                setPriceImpact(impact)
            }
        }
    }, [orderBook, amount, side])

    if (loading && !orderBook) {
        return (
            <Card className="border-border/50 bg-card/50 rounded-lg">
                <CardContent className="flex items-center justify-center py-6">
                    <Activity className="h-5 w-5 animate-pulse text-muted-foreground" />
                    <span className="ml-2 text-sm text-muted-foreground">Loading market depth...</span>
                </CardContent>
            </Card>
        )
    }

    if (!orderBook) {
        return (
            <Card className="border-border/50 bg-card/50 rounded-lg">
                <CardContent className="py-4 text-center">
                    <BarChart3 className="mx-auto h-6 w-6 text-muted-foreground/50" />
                    <p className="mt-1 text-xs text-muted-foreground">
                        Market depth unavailable
                    </p>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className={cn("border-border/50 bg-card/50 rounded-lg overflow-hidden transition-colors",
            isFlashing ? "bg-accent/30" : "")}>
            <CardHeader className="pb-2 pt-3 px-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center text-xs font-medium">
                        <BarChart3 className="mr-1.5 h-3.5 w-3.5 text-primary" />
                        Market Depth
                    </CardTitle>
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] text-muted-foreground">
                            Spread: ฿{orderBook.spread.toFixed(2)}
                        </span>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="p-3 pt-0 space-y-3">
                {/* Best Prices */}
                <div className="flex items-center justify-between gap-2">
                    <div className="flex-1 rounded-md bg-emerald-500/5 border border-emerald-500/10 p-2">
                        <div className="flex items-center gap-1">
                            <ArrowUp className="h-3 w-3 text-emerald-500" />
                            <span className="text-[10px] text-muted-foreground">Best Bid</span>
                        </div>
                        <span className="font-mono text-sm font-semibold text-emerald-600">
                            ฿{orderBook.bestBid.toFixed(2)}
                        </span>
                        <div className="text-[9px] text-muted-foreground mt-0.5">
                            {orderBook.totalBidVolume.toFixed(1)} kWh total
                        </div>
                    </div>

                    <div className="flex-1 rounded-md bg-destructive/5 border border-destructive/10 p-2 text-right">
                        <div className="flex items-center justify-end gap-1">
                            <span className="text-[10px] text-muted-foreground">Best Ask</span>
                            <ArrowDown className="h-3 w-3 text-destructive" />
                        </div>
                        <span className="font-mono text-sm font-semibold text-destructive">
                            ฿{orderBook.bestAsk.toFixed(2)}
                        </span>
                        <div className="text-[9px] text-muted-foreground mt-0.5">
                            {orderBook.totalAskVolume.toFixed(1)} kWh total
                        </div>
                    </div>
                </div>

                {/* Depth Visualization */}
                <div className="space-y-4">
                    {/* SVG Depth Chart */}
                    <div className="h-32 w-full relative">
                        <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
                            {/* Ask Depth Area (top half) */}
                            <path
                                d={`M ${100 - (orderBook.asks.length > 0 ? (orderBook.asks[0].cumulative / Math.max(orderBook.totalAskVolume, orderBook.totalBidVolume)) * 100 : 0)} 0 L 100 0 L 100 50 L ${100 - (orderBook.asks.length > 0 ? (orderBook.asks[orderBook.asks.length - 1].cumulative / Math.max(orderBook.totalAskVolume, orderBook.totalBidVolume)) * 100 : 0)} 50 Z`}
                                fill={isFlashing ? "rgba(239, 68, 68, 0.6)" : "url(#askGradient)"}
                                className="transition-all duration-500"
                            />
                            {/* Bid Depth Area (bottom half) */}
                            <path
                                d={`M 0 50 L ${(orderBook.bids.length > 0 ? (orderBook.bids[orderBook.bids.length - 1].cumulative / Math.max(orderBook.totalAskVolume, orderBook.totalBidVolume)) * 100 : 0)} 50 L ${(orderBook.bids.length > 0 ? (orderBook.bids[0].cumulative / Math.max(orderBook.totalAskVolume, orderBook.totalBidVolume)) * 100 : 0)} 100 L 0 100 Z`}
                                fill={isFlashing ? "rgba(16, 185, 129, 0.6)" : "url(#bidGradient)"}
                                className="transition-all duration-500"
                            />

                            <defs>
                                <linearGradient id="askGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#ef4444" stopOpacity="0.4" />
                                    <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
                                </linearGradient>
                                <linearGradient id="bidGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#10b981" stopOpacity="0" />
                                    <stop offset="100%" stopColor="#10b981" stopOpacity="0.4" />
                                </linearGradient>
                            </defs>

                            {/* Mid Line */}
                            <line x1="0" y1="50" x2="100" y2="50" stroke="currentColor" strokeOpacity="0.1" strokeWidth="1" />
                        </svg>

                        {/* Legend for Depth Chart */}
                        <div className="absolute top-1 right-2 text-[8px] font-black uppercase text-destructive tracking-widest">Supply Depth</div>
                        <div className="absolute bottom-1 left-2 text-[8px] font-black uppercase text-emerald-500 tracking-widest">Demand Depth</div>
                    </div>

                    <div className="space-y-1 pt-2 border-t border-border/20">
                        {/* Asks (Sells) - Reversed to show highest first */}
                        <div className="space-y-0.5">
                            {[...orderBook.asks].reverse().map((ask, i) => (
                                <DepthBar
                                    key={`ask-${i}`}
                                    level={ask}
                                    total={orderBook.totalAskVolume}
                                    type="ask"
                                    isHighlighted={!!currentPrice && currentPrice >= ask.price}
                                />
                            ))}
                        </div>

                        {/* Current Price Indicator */}
                        <div className="py-1.5 border-y border-border/50 bg-accent/20">
                            <div className="flex items-center justify-between px-2">
                                <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-tighter">Mid Market</span>
                                <span className="font-mono text-sm font-black text-primary">
                                    ฿{orderBook.midPrice.toFixed(2)}
                                </span>
                            </div>
                        </div>

                        {/* Bids (Buys) */}
                        <div className="space-y-0.5">
                            {orderBook.bids.map((bid, i) => (
                                <DepthBar
                                    key={`bid-${i}`}
                                    level={bid}
                                    total={orderBook.totalBidVolume}
                                    type="bid"
                                    isHighlighted={!!currentPrice && currentPrice <= bid.price}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                {/* Price Impact Warning */}
                {priceImpact !== null && priceImpact > 1 && (
                    <div className={cn(
                        "flex items-start gap-1.5 p-2 rounded-md text-xs",
                        priceImpact > 5
                            ? "bg-amber-500/10 border border-amber-500/20 text-amber-700"
                            : "bg-blue-500/10 border border-blue-500/20 text-blue-700"
                    )}>
                        <AlertCircle className="h-3 w-3 mt-0.5 shrink-0" />
                        <div>
                            <span className="font-medium">Price Impact: {priceImpact.toFixed(2)}%</span>
                            <p className="text-[10px] mt-0.5 opacity-80">
                                Your order will move the market price. Consider smaller amounts for better execution.
                            </p>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

// Helper component for depth bars
function DepthBar({
    level,
    total,
    type,
    isHighlighted
}: {
    level: DepthLevel
    total: number
    type: 'bid' | 'ask'
    isHighlighted?: boolean
}) {
    const percentage = total > 0 ? (level.amount / total) * 100 : 0
    const bgColor = type === 'bid' ? 'bg-emerald-500/20' : 'bg-destructive/20'
    const textColor = type === 'bid' ? 'text-emerald-600' : 'text-destructive'

    return (
        <div className={cn(
            "relative flex items-center justify-between py-1 px-1.5 rounded text-xs",
            isHighlighted && "bg-primary/5"
        )}>
            {/* Background bar */}
            <div
                className={cn("absolute left-0 top-0 h-full rounded opacity-50", bgColor)}
                style={{ width: `${Math.min(percentage * 2, 100)}%` }}
            />

            {/* Content */}
            <span className={cn("relative font-mono", textColor)}>
                ฿{level.price.toFixed(2)}
            </span>
            <div className="relative flex items-center gap-2">
                <span className="text-muted-foreground">{level.amount.toFixed(1)} kWh</span>
                <span className="text-[10px] text-muted-foreground/60">({level.count})</span>
            </div>
        </div>
    )
}

// Helper function to aggregate orders by price
function aggregateDepth(orders: any[], side: 'buy' | 'sell'): DepthLevel[] {
    const levels = new Map<number, DepthLevel>()

    orders.forEach(order => {
        const price = order.price_per_kwh || order.price || 0
        const amount = order.remaining_amount || order.amount || 0

        if (price <= 0 || amount <= 0) return

        if (levels.has(price)) {
            const existing = levels.get(price)!
            existing.amount += amount
            existing.count += 1
        } else {
            levels.set(price, {
                price,
                amount,
                cumulative: 0,
                count: 1
            })
        }
    })

    // Calculate cumulative and sort
    let cumulative = 0
    const sorted = Array.from(levels.values())
        .sort((a, b) => side === 'buy' ? b.price - a.price : a.price - b.price)

    sorted.forEach(level => {
        cumulative += level.amount
        level.cumulative = cumulative
    })

    return sorted
}
