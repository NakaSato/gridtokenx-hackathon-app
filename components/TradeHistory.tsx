'use client'

import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { defaultApiClient } from '@/lib/api-client'
import { formatDistanceToNow } from 'date-fns'
import { useSocket } from '@/contexts/SocketContext'
import { useAuth } from '@/contexts/AuthProvider'
import { History, TrendingUp, BarChart3, Globe } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { motion, AnimatePresence } from 'framer-motion'

interface Trade {
    id: string
    quantity: string
    price: string
    total_value: string
    role: 'buyer' | 'seller'
    counterparty_id: string
    executed_at: string
    status: string
    wheeling_charge?: number
    loss_cost?: number
    effective_energy?: number
    buyer_zone_id?: number
    seller_zone_id?: number
}

const TradeHistory = React.memo(function TradeHistory() {
    const { token } = useAuth()
    const [trades, setTrades] = useState<Trade[]>([])
    const [loading, setLoading] = useState(true)

    const { socket } = useSocket()

    const fetchTrades = async () => {
        if (!token) {
            setLoading(false)
            return
        }

        try {
            defaultApiClient.setToken(token)
            const response = await defaultApiClient.getTrades({ limit: 20 })
            if (response.data) {
                // @ts-ignore - API response might have different shape or fields, casting loosely
                setTrades(response.data.trades || [])
            }
        } catch (error) {
            console.error('Failed to fetch trades:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (!token) {
            setTrades([])
            setLoading(false)
            return
        }

        fetchTrades()
        const interval = setInterval(fetchTrades, 10000)

        if (socket) {
            const handleMessage = (event: MessageEvent) => {
                try {
                    const message = JSON.parse(event.data)
                    if (message.type === 'trade_executed') {
                        fetchTrades()
                    }
                } catch (e) { }
            }
            socket.addEventListener('message', handleMessage)
            return () => {
                socket.removeEventListener('message', handleMessage)
                clearInterval(interval)
            }
        }

        return () => clearInterval(interval)
    }, [socket, token])

    if (loading) {
        return (
            <Card className="h-full border-0 shadow-none">
                <CardHeader className="pb-2 border-b border-border/50">
                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                        <History className="h-4 w-4 text-primary" />
                        Recent Trades
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-3">
                    <div className="space-y-2">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="animate-pulse flex justify-between items-center p-2 rounded-sm bg-secondary/30">
                                <div className="flex items-center gap-2">
                                    <div className="h-8 w-8 bg-secondary rounded-sm" />
                                    <div className="space-y-1">
                                        <div className="h-3 bg-secondary w-20 rounded" />
                                        <div className="h-2 bg-secondary w-14 rounded" />
                                    </div>
                                </div>
                                <div className="space-y-1 text-right">
                                    <div className="h-3 bg-secondary w-16 rounded" />
                                    <div className="h-2 bg-secondary w-12 rounded" />
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="flex h-full flex-col border-0 shadow-none">
            <CardHeader className="py-3 px-4 border-b border-border/40">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                    <span className="flex items-center gap-2">
                        <History className="h-3.5 w-3.5" />
                        Market Activity
                    </span>
                    {trades.length > 0 && (
                        <div className="flex items-center gap-2">
                            <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                            <span className="text-[10px] font-medium text-foreground uppercase tracking-widest">{trades.length} Trades</span>
                        </div>
                    )}
                </CardTitle>
            </CardHeader>

            {/* Market Statistics Bar */}
            <div className="px-4 py-3 bg-accent/20 border-b border-border/30 grid grid-cols-2 gap-4">
                <div className="space-y-1">
                    <p className="text-[8px] font-black uppercase text-muted-foreground tracking-widest flex items-center gap-1">
                        <TrendingUp className="h-2.5 w-2.5 text-primary" /> VWAP (24H)
                    </p>
                    <div className="text-sm font-black font-mono">
                        ฿{(trades.reduce((acc, t) => acc + (parseFloat(t.price) * parseFloat(t.quantity)), 0) /
                            trades.reduce((acc, t) => acc + parseFloat(t.quantity), 0) || 0).toFixed(2)}
                    </div>
                </div>
                <div className="space-y-1 text-right">
                    <p className="text-[8px] font-black uppercase text-muted-foreground tracking-widest flex items-center justify-end gap-1">
                        <BarChart3 className="h-2.5 w-2.5 text-purple-500" /> Volume
                    </p>
                    <div className="text-sm font-black font-mono">
                        {trades.reduce((acc, t) => acc + parseFloat(t.quantity), 0).toFixed(1)} <span className="text-[9px] font-normal uppercase text-muted-foreground">kWh</span>
                    </div>
                </div>
            </div>

            <CardContent className="flex-1 overflow-y-auto p-0">
                {trades.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground space-y-3">
                        <div className="p-3 rounded-full bg-accent/50">
                            <TrendingUp className="h-6 w-6 opacity-50" />
                        </div>
                        <div className="text-center">
                            <p className="text-sm font-medium text-foreground">No trades yet</p>
                            <p className="text-xs opacity-70">Market is quiet</p>
                        </div>
                    </div>
                ) : (
                    <div className="divide-y divide-border/30">
                        {trades.map((trade, idx) => {
                            const isBuyer = trade.role === 'buyer'
                            // Calculate extra costs if available (only relevant for buyer usually, or net for seller)
                            const fees = (trade.wheeling_charge || 0) + (trade.loss_cost || 0);

                            return (
                                <div
                                    key={trade.id}
                                    className="group flex flex-col gap-1 px-4 py-3 hover:bg-accent/30 transition-colors"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Badge
                                                variant="outline"
                                                className={cn(
                                                    "text-[9px] px-1.5 py-0 h-4 font-mono font-bold tracking-tight border-opacity-40",
                                                    isBuyer
                                                        ? "bg-green-500/10 text-green-500 border-green-500"
                                                        : "bg-red-500/10 text-red-500 border-red-500"
                                                )}
                                            >
                                                {isBuyer ? 'BUY' : 'SELL'}
                                            </Badge>

                                            {/* Zone Badge */}
                                            {(trade.buyer_zone_id !== undefined && trade.seller_zone_id !== undefined) && (
                                                <Badge
                                                    variant="secondary"
                                                    className={cn(
                                                        "text-[9px] px-1.5 py-0 h-4 font-normal tracking-tight",
                                                        trade.buyer_zone_id === trade.seller_zone_id
                                                            ? "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20"
                                                            : "bg-purple-500/10 text-purple-500 hover:bg-purple-500/20"
                                                    )}
                                                >
                                                    {trade.buyer_zone_id === trade.seller_zone_id ? 'LOCAL' : 'X-ZONE'}
                                                </Badge>
                                            )}

                                            <span className="text-sm font-medium font-mono text-foreground">
                                                {parseFloat(trade.quantity).toFixed(2)} kWh
                                            </span>
                                        </div>
                                        <span className="text-[10px] text-muted-foreground tabular-nums">
                                            {formatDistanceToNow(new Date(trade.executed_at), { addSuffix: true })}
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between pl-1">
                                        <div className="flex flex-col">
                                            <div className="flex items-center text-xs text-muted-foreground font-mono">
                                                @{parseFloat(trade.price).toFixed(2)}
                                            </div>
                                            {fees > 0 && (
                                                <div className="text-[9px] text-muted-foreground opacity-70">
                                                    + Fees: {fees.toFixed(2)}
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <div className={cn(
                                                "font-mono text-sm font-medium tabular-nums",
                                                isBuyer ? "text-red-500" : "text-green-500"
                                            )}>
                                                {isBuyer ? '-' : '+'}{parseFloat(trade.total_value).toFixed(2)}
                                                <span className="text-[10px] text-muted-foreground ml-1">THB</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </CardContent>
        </Card>
    )
})

export default TradeHistory
