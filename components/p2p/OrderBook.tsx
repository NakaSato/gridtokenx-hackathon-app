'use client'

import { useTrading, OrderAccount } from '@/contexts/TradingProvider'
import { PublicKey } from '@solana/web3.js'
import { ArrowDownLeft, ArrowUpRight, Globe, Link2, Loader2 } from 'lucide-react'
import { useState, useMemo, useEffect, useCallback } from 'react'
import { clsx } from 'clsx'
import { BN } from '@coral-xyz/anchor'
import { useWallet } from '@solana/wallet-adapter-react'
import { useAuth } from '@/contexts/AuthProvider'
import { defaultApiClient } from '@/lib/api-client'
import { useOrderBookUpdates } from '@/hooks/useTransactionUpdates'

// Unified order type for display (can come from on-chain or off-chain)
interface UnifiedOrder {
    id: string
    side: 'buy' | 'sell'
    price: number
    amount: number
    filledAmount: number
    remaining: number
    source: 'onchain' | 'offchain'
    zoneId?: number
    createdAt?: string
    // On-chain order reference for take action
    onchainOrder?: OrderAccount
}

export const OrderBook = ({ myOrdersOnly = false }: { myOrdersOnly?: boolean }) => {
    const { orders, isLoadingOrders, setActiveOrderFill } = useTrading()
    const { publicKey } = useWallet()
    const { token } = useAuth()
    const [filter, setFilter] = useState<'all' | 'buy' | 'sell'>('all')
    const [offchainOrders, setOffchainOrders] = useState<UnifiedOrder[]>([])
    const [offchainLoading, setOffchainLoading] = useState(false)
    const [animatedRows, setAnimatedRows] = useState<Set<string>>(new Set())
    
    // Helper to check if a Pubkey is "empty" (System Program or Zero)
    const isEmptyKey = (key: PublicKey) => {
        return key.equals(PublicKey.default) || key.toBase58() === '11111111111111111111111111111111'
    }

    // Precision: on-chain values are scaled by 1e6
    const fromBn = (bn: BN) => bn.toNumber() / 1_000_000

    // Fetch off-chain orders from REST API
    const fetchOffchainOrders = useCallback(async () => {
        setOffchainLoading(true)
        try {
            if (token) {
                defaultApiClient.setToken(token)
            }
            const response = await defaultApiClient.getP2POrderBook()

            if (response.data) {
                const data = response.data as any
                const rawOrders = data.data || data.orders || []

                // If data comes as { bids, asks } format
                const bids = data.bids || []
                const asks = data.asks || []
                const allOrders = rawOrders.length > 0 ? rawOrders : [...bids, ...asks]

                const unified: UnifiedOrder[] = allOrders.map((o: any) => ({
                    id: o.id || `offchain-${Math.random()}`,
                    side: (o.side || (bids.includes(o) ? 'buy' : 'sell')) as 'buy' | 'sell',
                    price: Number(o.price_per_kwh || o.price || 0),
                    amount: Number(o.energy_amount || o.amount || 0),
                    filledAmount: Number(o.filled_amount || 0),
                    remaining: Number(o.energy_amount || o.amount || 0) - Number(o.filled_amount || 0),
                    source: 'offchain' as const,
                    zoneId: o.zone_id,
                    createdAt: o.created_at,
                })).filter((o: UnifiedOrder) => o.remaining > 0 && o.price > 0)

                setOffchainOrders(unified)
            }
        } catch (err) {
            console.error('Failed to fetch off-chain order book:', err)
        } finally {
            setOffchainLoading(false)
        }
    }, [token])

    // Initial fetch
    useEffect(() => {
        fetchOffchainOrders()
    }, [fetchOffchainOrders])

    // Real-time WebSocket updates: refresh order book on snapshot
    const { latestSnapshot } = useOrderBookUpdates({ token: token || undefined })

    useEffect(() => {
        if (latestSnapshot) {
            // When we receive a WebSocket snapshot, process it
            const bids = latestSnapshot.bids || []
            const asks = latestSnapshot.asks || []
            const allOrders = [...bids, ...asks]

            if (allOrders.length > 0) {
                const unified: UnifiedOrder[] = allOrders.map((o: any) => ({
                    id: o.id || `ws-${Math.random()}`,
                    side: (bids.includes(o) ? 'buy' : (o.side || 'sell')) as 'buy' | 'sell',
                    price: Number(o.price_per_kwh || o.price || 0),
                    amount: Number(o.energy_amount || o.amount || 0),
                    filledAmount: Number(o.filled_amount || 0),
                    remaining: Number(o.remaining_amount || o.amount || 0),
                    source: 'offchain' as const,
                    zoneId: o.zone_id,
                    createdAt: o.created_at,
                })).filter((o: UnifiedOrder) => o.remaining > 0 && o.price > 0)
                
                // Diff the new snapshot against the current state to trigger animations
                setOffchainOrders(prev => {
                    const newAnimated = new Set<string>()
                    unified.forEach(newOrder => {
                        const existingOrder = prev.find(o => o.price === newOrder.price && o.side === newOrder.side)
                        // Animate if it's a completely new price point, or if the available amount has mutated
                        if (!existingOrder || existingOrder.remaining !== newOrder.remaining) {
                            newAnimated.add(newOrder.id)
                        }
                    })
                    
                    if (newAnimated.size > 0) {
                        setAnimatedRows(newAnimated)
                        // Clear the animation class after 800ms (matches CSS duration)
                        setTimeout(() => setAnimatedRows(new Set()), 800)
                    }
                    
                    return unified
                })
            } else {
                // Snapshot with no orders — trigger a REST refetch for full data
                fetchOffchainOrders()
            }
        }
    }, [latestSnapshot, fetchOffchainOrders])

    // Convert on-chain orders to unified format
    const onchainUnified = useMemo<UnifiedOrder[]>(() => {
        if (!orders) return []

        let openOrders = orders.filter(o => {
            const hasBuyer = !isEmptyKey(o.account.buyer)
            const hasSeller = !isEmptyKey(o.account.seller)
            return !(hasBuyer && hasSeller) // Filter matched orders
        })

        if (myOrdersOnly && publicKey) {
            openOrders = openOrders.filter(o => o.account.authority.equals(publicKey))
        }

        return openOrders.map(o => {
            const isBid = !isEmptyKey(o.account.buyer)
            return {
                id: o.publicKey.toBase58(),
                side: isBid ? 'buy' as const : 'sell' as const,
                price: fromBn(o.account.pricePerKwh),
                amount: fromBn(o.account.amount),
                filledAmount: fromBn(o.account.filledAmount),
                remaining: fromBn(o.account.amount.sub(o.account.filledAmount)),
                source: 'onchain' as const,
                onchainOrder: o,
            }
        })
    }, [orders, myOrdersOnly, publicKey])

    // Merge and deduplicate (on-chain takes priority for duplicates)
    const allUnified = useMemo(() => {
        // On-chain orders are the authoritative source; off-chain supplement them
        const onchainIds = new Set(onchainUnified.map(o => o.id))

        // Include off-chain orders that don't duplicate on-chain ones
        const deduped = [
            ...onchainUnified,
            ...offchainOrders.filter(o => !onchainIds.has(o.id))
        ]

        return deduped
    }, [onchainUnified, offchainOrders])

    // Split into bids and asks
    const processedOrders = useMemo(() => {
        const bids = allUnified
            .filter(o => o.side === 'buy')
            .sort((a, b) => b.price - a.price) // Descending price

        const asks = allUnified
            .filter(o => o.side === 'sell')
            .sort((a, b) => a.price - b.price) // Ascending price

        return { bids, asks }
    }, [allUnified])

    // Combine for display based on filter
    const displayOrders = useMemo(() => {
        let list: UnifiedOrder[] = []
        if (filter !== 'sell') list = list.concat(processedOrders.bids)
        if (filter !== 'buy') list = list.concat(processedOrders.asks)
        return list
    }, [processedOrders, filter])

    const handleTake = (order: UnifiedOrder) => {
        if (order.onchainOrder) {
            // On-chain: use existing TradingProvider flow
            setActiveOrderFill({
                amount: order.remaining,
                price: order.price,
                targetOrder: order.onchainOrder,
            })
        } else {
            // Off-chain: pre-fill the order form with counterparty price
            setActiveOrderFill({
                amount: order.remaining,
                price: order.price,
                targetOrder: undefined as any,
            })
        }
    }

    const isLoading = isLoadingOrders || offchainLoading

    if (isLoading && displayOrders.length === 0) {
        return (
            <div className="p-4 text-center text-muted-foreground flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading Order Book...
            </div>
        )
    }

    return (
        <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden flex flex-col h-full">
            <div className="p-4 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-foreground">
                        {myOrdersOnly ? 'My Active Orders' : 'Order Book'}
                    </h3>
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                        {displayOrders.length}
                    </span>
                </div>
                <div className="flex gap-1.5">
                    <button
                        onClick={() => setFilter('all')}
                        className={clsx(
                            "px-3 py-1 text-xs rounded-full font-medium transition-colors",
                            filter === 'all'
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-muted-foreground hover:bg-muted/80"
                        )}
                    >
                        All
                    </button>
                    <button
                        onClick={() => setFilter('buy')}
                        className={clsx(
                            "px-3 py-1 text-xs rounded-full font-medium transition-colors",
                            filter === 'buy'
                                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400"
                                : "bg-muted text-muted-foreground hover:bg-muted/80"
                        )}
                    >
                        Bids
                    </button>
                    <button
                        onClick={() => setFilter('sell')}
                        className={clsx(
                            "px-3 py-1 text-xs rounded-full font-medium transition-colors",
                            filter === 'sell'
                                ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400"
                                : "bg-muted text-muted-foreground hover:bg-muted/80"
                        )}
                    >
                        Asks
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto" style={{ contentVisibility: 'auto', containIntrinsicSize: '0 400px' }}>
                <table className="w-full text-sm">
                    <thead className="bg-muted/50 sticky top-0 z-10">
                        <tr>
                            <th className="px-4 py-2.5 text-left font-medium text-muted-foreground text-xs">Side</th>
                            <th className="px-4 py-2.5 text-right font-medium text-muted-foreground text-xs">Price (฿/kWh)</th>
                            <th className="px-4 py-2.5 text-right font-medium text-muted-foreground text-xs">Amount (kWh)</th>
                            <th className="px-4 py-2.5 text-right font-medium text-muted-foreground text-xs">Source</th>
                            <th className="px-4 py-2.5 text-right font-medium text-muted-foreground text-xs">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                        {displayOrders.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                                    No active orders found
                                </td>
                            </tr>
                        ) : (
                            displayOrders.map((order) => (
                                <tr key={order.id} className={clsx(
                                    "hover:bg-muted/30 group transition-colors",
                                    animatedRows.has(order.id) && (
                                        order.side === 'buy' ? 'animate-flash-buy' : 'animate-flash-sell'
                                    )
                                )}>
                                    <td className="px-4 py-2.5">
                                        {order.side === 'buy' ? (
                                            <span className="inline-flex items-center gap-1 text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-400 px-2 py-0.5 rounded text-xs font-medium">
                                                <ArrowDownLeft className="w-3 h-3" />
                                                Bid
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 text-red-600 bg-red-50 dark:bg-red-900/30 dark:text-red-400 px-2 py-0.5 rounded text-xs font-medium">
                                                <ArrowUpRight className="w-3 h-3" />
                                                Ask
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-4 py-2.5 text-right font-mono font-medium text-foreground">
                                        {order.price.toFixed(4)}
                                    </td>
                                    <td className="px-4 py-2.5 text-right text-muted-foreground">
                                        {order.remaining.toFixed(2)}
                                    </td>
                                    <td className="px-4 py-2.5 text-right">
                                        {order.source === 'onchain' ? (
                                            <span className="inline-flex items-center gap-1 text-[10px] text-blue-600 dark:text-blue-400" title="On-chain order">
                                                <Link2 className="w-3 h-3" />
                                                Chain
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 text-[10px] text-violet-600 dark:text-violet-400" title="Off-chain P2P order">
                                                <Globe className="w-3 h-3" />
                                                P2P
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-4 py-2.5 text-right">
                                        <button
                                            onClick={() => handleTake(order)}
                                            className={clsx(
                                                "px-3 py-1 rounded text-xs font-medium transition-all opacity-0 group-hover:opacity-100",
                                                order.side === 'sell'
                                                    ? "bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm hover:shadow"
                                                    : "bg-red-600 text-white hover:bg-red-700 shadow-sm hover:shadow"
                                            )}
                                        >
                                            {order.side === 'sell' ? 'Buy' : 'Sell'}
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
