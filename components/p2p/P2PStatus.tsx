'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { defaultApiClient, createApiClient } from '@/lib/api-client'
import { useAuth } from '@/contexts/AuthProvider'
import {
    CheckCircle2,
    Clock,
    AlertCircle,
    Database,
    RefreshCw,
    TrendingUp,
    TrendingDown,
    ArrowRightLeft,
    Zap,
    Wallet,
} from 'lucide-react'
import { cn } from '@/lib/utils'

import { useOrderMatchedWebSocket } from '@/hooks/useWebSocket'
import { useP2POrderUpdates, useSettlementUpdates } from '@/hooks/useTransactionUpdates'

// Matching engine status from API
interface MatchingStatus {
    can_match: boolean
    match_reason?: string
    pending_buy_orders: number
    pending_sell_orders: number
    pending_matches: number
    buy_price_range?: { min: number; max: number }
    sell_price_range?: { min: number; max: number }
}

// Settlement statistics from API
interface SettlementStats {
    confirmed_count: number
    pending_count: number
    failed_count: number
    total_settled_value: number
}

// User P2P stats from API
interface UserP2PStats {
    active_orders: number
    total_traded_24h: number
    total_volume_24h: number
    success_rate: number
}

interface RecentMatch {
    id: string
    energy: number
    price: number
    timestamp: Date
}

const P2PStatus = React.memo(function P2PStatus() {
    const { token, user } = useAuth()
    const [matchingStatus, setMatchingStatus] = useState<MatchingStatus | null>(null)
    const [settlementStats, setSettlementStats] = useState<SettlementStats | null>(null)
    const [userStats, setUserStats] = useState<UserP2PStats | null>(null)
    const [lastUpdated, setLastUpdated] = useState<Date>(new Date())
    const [recentMatches, setRecentMatches] = useState<RecentMatch[]>([])

    // Real-time P2P order updates
    const { connected: p2pConnected, latestUpdate: latestOrderUpdate } = useP2POrderUpdates({
        showToasts: false, // Handle in parent component
    })

    // Real-time settlement updates
    const { connected: settlementConnected, latestSettlement } = useSettlementUpdates({
        showToasts: false,
    })

    const isRealTimeConnected = p2pConnected || settlementConnected

    const fetchData = useCallback(async () => {
        if (!token) return

        try {
            defaultApiClient.setToken(token)
            const apiClient = createApiClient(token)
            const [matchRes, settleRes, userRes] = await Promise.all([
                defaultApiClient.getMatchingStatus(),
                defaultApiClient.getSettlementStats(),
                apiClient.getMyP2POrders().catch(() => ({ data: null })) // Fallback if endpoint doesn't exist
            ])

            if (matchRes.data) setMatchingStatus(matchRes.data)
            if (settleRes.data) setSettlementStats(settleRes.data)

            // Calculate user stats from orders if available
            if (userRes.data) {
                const raw = userRes.data as any
                const orders: any[] = Array.isArray(raw) ? raw : raw?.orders || []
                const activeOrders = orders.filter((o: any) => o.status === 'open').length
                setUserStats({
                    active_orders: activeOrders,
                    total_traded_24h: 0, // Would need dedicated endpoint
                    total_volume_24h: 0,
                    success_rate: 0,
                })
            }

            setLastUpdated(new Date())
        } catch (error) {
            console.error('Failed to fetch P2P status:', error)
        }
    }, [token])

    // Initial fetch
    useEffect(() => {
        fetchData()
    }, [fetchData])

    // Poll every 10 seconds (increased from 5s since we have WebSocket)
    useEffect(() => {
        const interval = setInterval(fetchData, 10000)
        return () => clearInterval(interval)
    }, [fetchData])

    // Refresh on WebSocket updates
    useEffect(() => {
        if (latestOrderUpdate || latestSettlement) {
            fetchData()
        }
    }, [latestOrderUpdate, latestSettlement, fetchData])

    // Listen for WebSocket match events — accumulate for live feed
    useOrderMatchedWebSocket(useCallback((data: any) => {
        fetchData()
        // Add to recent matches feed
        const match: RecentMatch = {
            id: data?.match_id || `match-${Date.now()}`,
            energy: parseFloat(data?.energy_amount || data?.amount || '0'),
            price: parseFloat(data?.price_per_kwh || data?.price || '0'),
            timestamp: new Date(),
        }
        if (match.energy > 0) {
            setRecentMatches(prev => [match, ...prev].slice(0, 5)) // Keep last 5
        }
    }, [fetchData]), token || undefined)

    if (!token) return null

    return (
        <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Real-time Connection Status */}
            <div className="flex items-center justify-between px-1">
                <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">System Status</span>
                <div className="flex items-center gap-1.5">
                    <div className="relative flex h-2 w-2">
                        <span className={cn(
                            "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
                            isRealTimeConnected ? "bg-emerald-500" : "bg-amber-500"
                        )}></span>
                        <span className={cn(
                            "relative inline-flex rounded-full h-2 w-2",
                            isRealTimeConnected ? "bg-emerald-500" : "bg-amber-500"
                        )}></span>
                    </div>
                    <span className={cn(
                        "text-[10px] font-medium",
                        isRealTimeConnected ? "text-emerald-500" : "text-amber-500"
                    )}>
                        {isRealTimeConnected ? "Live" : "Polling"}
                    </span>
                </div>
            </div>

            {/* User Stats Card - NEW */}
            <Card className="rounded-lg border-border bg-gradient-to-br from-card to-muted/20 shadow-sm overflow-hidden">
                <CardHeader className="pb-2 pt-3 px-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                            <div className="p-1 rounded-md bg-primary/10 text-primary">
                                <Wallet className="h-3.5 w-3.5" />
                            </div>
                            <span className="text-xs font-semibold">Your P2P Activity</span>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-3 pt-0">
                    <div className="grid grid-cols-2 gap-2">
                        <div className="flex flex-col gap-1 p-2 rounded-md bg-muted/50">
                            <span className="text-[10px] uppercase text-muted-foreground font-medium">Active Orders</span>
                            <span className="font-mono text-lg font-bold text-foreground">
                                {userStats?.active_orders || 0}
                            </span>
                        </div>
                        <div className="flex flex-col gap-1 p-2 rounded-md bg-muted/50">
                            <span className="text-[10px] uppercase text-muted-foreground font-medium">24h Trades</span>
                            <span className="font-mono text-lg font-bold text-foreground">
                                {userStats?.total_traded_24h || 0}
                            </span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Matching Engine Status - Enhanced Visual Flow */}
            <Card className="rounded-lg border-border bg-card shadow-sm overflow-hidden">
                <CardHeader className="pb-2 pt-3 px-3 border-b border-border bg-muted/20">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                            <div className="p-1 rounded-md bg-primary/10 text-primary">
                                <Zap className="h-3.5 w-3.5" />
                            </div>
                            <span className="text-xs font-semibold">Matching Engine</span>
                        </div>
                        <Badge variant="outline" className={cn(
                            "text-[10px] h-5 px-1.5 font-normal border-0 rounded-md",
                            matchingStatus?.can_match
                                ? "bg-emerald-500/10 text-emerald-500 ring-1 ring-emerald-500/20"
                                : "bg-amber-500/10 text-amber-500 ring-1 ring-amber-500/20"
                        )}>
                            {matchingStatus?.can_match ? "Active" : "Paused"}
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent className="p-3">
                    {/* Visual Flow: Buy → Match → Sell */}
                    <div className="flex items-center gap-2 mb-4">
                        {/* Buy Orders */}
                        <div className="flex-1">
                            <div className={cn(
                                "flex flex-col gap-1 p-2 rounded-lg border transition-all",
                                (matchingStatus?.pending_buy_orders ?? 0) > 0
                                    ? "bg-emerald-500/10 border-emerald-500/30"
                                    : "bg-muted/30 border-border"
                            )}>
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] uppercase text-muted-foreground font-medium flex items-center gap-1">
                                        <TrendingUp className="h-3 w-3 text-emerald-500" /> Buy
                                    </span>
                                </div>
                                <span className={cn(
                                    "font-mono text-xl font-bold lining-nums",
                                    (matchingStatus?.pending_buy_orders ?? 0) > 0 ? "text-emerald-600" : "text-muted-foreground"
                                )}>
                                    {matchingStatus?.pending_buy_orders || 0}
                                </span>
                            </div>
                        </div>

                        {/* Flow Arrow */}
                        <div className="flex flex-col items-center">
                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10">
                                <ArrowRightLeft className="h-3 w-3 text-primary" />
                            </div>
                            <span className="text-[9px] text-muted-foreground mt-0.5">
                                {matchingStatus?.pending_matches || 0}
                            </span>
                        </div>

                        {/* Sell Orders */}
                        <div className="flex-1">
                            <div className={cn(
                                "flex flex-col gap-1 p-2 rounded-lg border transition-all",
                                (matchingStatus?.pending_sell_orders ?? 0) > 0
                                    ? "bg-destructive/10 border-destructive/30"
                                    : "bg-muted/30 border-border"
                            )}>
                                <div className="flex items-center justify-end">
                                    <span className="text-[10px] uppercase text-muted-foreground font-medium flex items-center gap-1">
                                        Sell <TrendingDown className="h-3 w-3 text-destructive" />
                                    </span>
                                </div>
                                <span className={cn(
                                    "font-mono text-xl font-bold lining-nums text-right",
                                    (matchingStatus?.pending_sell_orders ?? 0) > 0 ? "text-destructive" : "text-muted-foreground"
                                )}>
                                    {matchingStatus?.pending_sell_orders || 0}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Price Range Bar */}
                    <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                            <span>Price Spread</span>
                            <span className="font-mono text-foreground">
                                ฿{matchingStatus?.buy_price_range?.min?.toFixed(2) || '0.00'} -
                                ฿{matchingStatus?.sell_price_range?.max?.toFixed(2) || '0.00'}
                            </span>
                        </div>
                        <div className="relative h-2 w-full rounded-full bg-muted overflow-hidden">
                            {/* Buy zone */}
                            <div className="absolute top-0 left-0 h-full bg-emerald-500/30"
                                style={{ width: '40%' }} />
                            {/* Match zone */}
                            <div className="absolute top-0 left-[40%] h-full w-[20%] bg-primary/30" />
                            {/* Sell zone */}
                            <div className="absolute top-0 right-0 h-full w-[40%] bg-destructive/30" />
                        </div>
                        <div className="flex items-center justify-between text-[9px] text-muted-foreground">
                            <span className="text-emerald-600">Buy Range</span>
                            <span className="text-destructive">Sell Range</span>
                        </div>
                    </div>

                    {!matchingStatus?.can_match && matchingStatus?.match_reason && (
                        <div className="mt-3 text-[10px] text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 p-2 rounded-md flex items-start gap-1.5 animate-in fade-in slide-in-from-top-1">
                            <AlertCircle className="h-3 w-3 mt-0.5 shrink-0" />
                            <span className="leading-tight">{matchingStatus.match_reason}</span>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Live Match Activity Feed */}
            {recentMatches.length > 0 && (
                <Card className="rounded-lg border-border bg-card shadow-sm overflow-hidden">
                    <CardHeader className="pb-1 pt-3 px-3">
                        <div className="flex items-center gap-1.5">
                            <div className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </div>
                            <span className="text-xs font-semibold">Recent Matches</span>
                        </div>
                    </CardHeader>
                    <CardContent className="p-3 pt-1">
                        <div className="space-y-1.5">
                            {recentMatches.map((m) => (
                                <div key={m.id} className="flex items-center justify-between text-xs py-1 px-2 rounded bg-muted/30 animate-in fade-in slide-in-from-top-1 duration-300">
                                    <div className="flex items-center gap-1.5">
                                        <Zap className="h-3 w-3 text-amber-500" />
                                        <span className="font-mono font-medium text-foreground">
                                            {m.energy.toFixed(2)} kWh
                                        </span>
                                        <span className="text-muted-foreground">@</span>
                                        <span className="font-mono text-emerald-600 dark:text-emerald-400">
                                            ฿{m.price.toFixed(2)}
                                        </span>
                                    </div>
                                    <span className="text-[10px] text-muted-foreground">
                                        {m.timestamp.toLocaleTimeString()}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Settlement Status - Enhanced */}
            <Card className="rounded-lg border-border bg-card shadow-sm">
                <CardHeader className="pb-2 pt-3 px-3 border-b border-border bg-muted/20">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                            <div className="p-1 rounded-md bg-blue-500/10 text-blue-500">
                                <Database className="h-3.5 w-3.5" />
                            </div>
                            <span className="text-xs font-semibold">Settlements (24h)</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="text-[10px] text-muted-foreground">Total</span>
                            <span className="text-sm font-bold font-mono text-foreground">
                                ฿{(settlementStats?.total_settled_value ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-3 space-y-3">
                    {/* Progress Bar */}
                    <div className="space-y-1.5">
                        <div className="flex justify-between text-[10px]">
                            <span className="text-emerald-600 font-medium">
                                {(settlementStats?.confirmed_count || 0)} Confirmed
                            </span>
                            <span className="text-muted-foreground">
                                {((settlementStats?.confirmed_count || 0) + (settlementStats?.pending_count || 0) + (settlementStats?.failed_count || 0))} Total
                            </span>
                        </div>
                        <div className="relative h-2.5 w-full bg-muted rounded-full overflow-hidden">
                            <div
                                className="absolute top-0 left-0 h-full bg-emerald-500 transition-all duration-500 ease-out rounded-full"
                                style={{
                                    width: `${((settlementStats?.confirmed_count || 0) / (
                                        (settlementStats?.confirmed_count || 0) +
                                        (settlementStats?.failed_count || 0) +
                                        (settlementStats?.pending_count || 0) + 0.0001
                                    )) * 100}%`
                                }}
                            />
                            <div
                                className="absolute top-0 h-full bg-amber-500 transition-all duration-500 ease-out rounded-full"
                                style={{
                                    left: `${((settlementStats?.confirmed_count || 0) / (
                                        (settlementStats?.confirmed_count || 0) +
                                        (settlementStats?.failed_count || 0) +
                                        (settlementStats?.pending_count || 0) + 0.0001
                                    )) * 100}%`,
                                    width: `${((settlementStats?.pending_count || 0) / (
                                        (settlementStats?.confirmed_count || 0) +
                                        (settlementStats?.failed_count || 0) +
                                        (settlementStats?.pending_count || 0) + 0.0001
                                    )) * 100}%`
                                }}
                            />
                        </div>
                    </div>

                    {/* Status Grid */}
                    <div className="grid grid-cols-3 gap-2">
                        <div className="flex flex-col items-center p-2 rounded-md bg-emerald-500/5 border border-emerald-500/10">
                            <div className="flex items-center gap-1 text-[10px] text-emerald-600 font-medium">
                                <CheckCircle2 className="h-3 w-3" />
                                <span>Done</span>
                            </div>
                            <span className="font-mono text-base font-semibold text-emerald-600">
                                {settlementStats?.confirmed_count || 0}
                            </span>
                        </div>
                        <div className="flex flex-col items-center p-2 rounded-md bg-amber-500/5 border border-amber-500/10">
                            <div className="flex items-center gap-1 text-[10px] text-amber-600 font-medium">
                                <Clock className="h-3 w-3" />
                                <span>Pending</span>
                            </div>
                            <span className="font-mono text-base font-semibold text-amber-600">
                                {settlementStats?.pending_count || 0}
                            </span>
                        </div>
                        <div className="flex flex-col items-center p-2 rounded-md bg-destructive/5 border border-destructive/10">
                            <div className="flex items-center gap-1 text-[10px] text-destructive font-medium">
                                <AlertCircle className="h-3 w-3" />
                                <span>Failed</span>
                            </div>
                            <span className="font-mono text-base font-semibold text-destructive">
                                {settlementStats?.failed_count || 0}
                            </span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="flex justify-between items-center px-1">
                <span className="text-[9px] text-muted-foreground/50 font-mono">
                    Last updated: {lastUpdated.toLocaleTimeString()}
                </span>
                <RefreshCw className="h-3 w-3 text-muted-foreground/50 animate-spin" style={{ animationDuration: '3000ms' }} />
            </div>
        </div>
    )
})

export default P2PStatus
