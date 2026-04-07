'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { createApiClient } from '@/lib/api-client'
import { useAuth } from '@/contexts/AuthProvider'
import { format } from 'date-fns'
import type { ApiFuturesPosition, ApiOrder, TradeRecord } from '@/types/trading'
import type { UserProfile, TokenBalance } from '@/types/auth'
import type { Position, Order } from '@/lib/data/Positions'
import type { Transaction } from '@/lib/data/WalletActivity'

/**
 * Hook for fetching user profile
 */
export function useProfile() {
    const { token, isAuthenticated } = useAuth()
    const apiClient = createApiClient(token || '')

    return useQuery<UserProfile | null>({
        queryKey: ['user-profile', token],
        queryFn: async () => {
            if (!token) throw new Error('Authentication required')
            const response = await apiClient.getProfile()
            if (response.error) throw new Error(response.error)
            // API returns flat UserResponse (not wrapped in { user: ... })
            return (response.data as UserProfile) || null
        },
        enabled: !!token && isAuthenticated,
    })
}

/**
 * Hook for fetching wallet balance
 */
export function useWalletBalance(walletAddress?: string) {
    const { token } = useAuth()
    const apiClient = createApiClient(token || '')

    return useQuery<TokenBalance>({
        queryKey: ['wallet-balance', token, walletAddress],
        queryFn: async () => {
            if (!token) throw new Error('Authentication required')
            if (!walletAddress) throw new Error('Wallet address required')
            const response = await apiClient.getBalance(walletAddress)
            if (response.error) throw new Error(response.error)
            return response.data
        },
        enabled: !!token && !!walletAddress,
        refetchInterval: 10000,
    })
}

/**
 * Hook for fetching portfolio positions with mapping
 */
export function usePortfolioPositions() {
    const { token } = useAuth()
    const apiClient = createApiClient(token || '')

    const query = useQuery<Position[]>({
        queryKey: ['portfolio-positions', token],
        queryFn: async () => {
            if (!token) throw new Error('Authentication required')
            const response = await apiClient.getFuturesPositions()
            const rawData = ((response.data as { data?: unknown[] })?.data || response.data || []) as ApiFuturesPosition[]

            return rawData.map((pos) => ({
                index: pos.id,
                token: pos.product_symbol || 'Unknown',
                logo: '/images/solana.png',
                symbol: pos.product_symbol || 'GRX',
                type: pos.side === 'long' ? 'Call' : 'Put',
                strikePrice: parseFloat(pos.entry_price),
                expiry: 'Perpetual',
                size: parseFloat(pos.quantity),
                pnl: parseFloat(pos.unrealized_pnl || '0'),
                greeks: { delta: 0, gamma: 0, theta: 0, vega: 0 },
            }))
        },
        enabled: !!token,
    })

    const queryClient = useQueryClient()
    useEffect(() => {
        const handleWsMessage = (event: Event) => {
            const customEvent = event as CustomEvent
            const message = customEvent.detail
            const refreshEvents = ['TradeExecuted', 'OrderMatched', 'PositionClosed', 'PositionUpdated']

            if (refreshEvents.includes(message.type)) {
                queryClient.invalidateQueries({ queryKey: ['portfolio-positions'] })
            }
        }

        window.addEventListener('ws-message', handleWsMessage)
        return () => window.removeEventListener('ws-message', handleWsMessage)
    }, [queryClient])

    return query
}

/**
 * Hook for fetching portfolio orders with mapping
 */
export function usePortfolioOrders() {
    const { token } = useAuth()
    const apiClient = createApiClient(token || '')

    const query = useQuery<Order[]>({
        queryKey: ['portfolio-orders', token],
        queryFn: async () => {
            if (!token) throw new Error('Authentication required')
            // Match the envelope seen in legacy code
            const response = await apiClient.getOrders({ status: 'active' })
            const data = (response.data as { data?: ApiOrder[] })?.data || response.data || []

            return data.map((order: ApiOrder) => ({
                index: order.id,
                token: 'GRID',
                logo: '/images/grid.png',
                symbol: 'GRX',
                type: order.order_type || 'Limit',
                transaction: order.side.toLowerCase(),
                limitPrice: parseFloat(order.price_per_kwh),
                strikePrice: 0,
                expiry: order.expires_at
                    ? format(new Date(order.expires_at), 'MM/dd/yyyy')
                    : 'N/A',
                orderDate: format(new Date(order.created_at), 'MM/dd/yyyy'),
                size: parseFloat(order.energy_amount),
            }))
        },
        enabled: !!token,
    })

    const queryClient = useQueryClient()
    useEffect(() => {
        const handleWsMessage = (event: Event) => {
            const customEvent = event as CustomEvent
            const message = customEvent.detail
            const refreshEvents = ['OrderCreated', 'OrderCancelled', 'OrderMatched', 'OrderUpdated']

            if (refreshEvents.includes(message.type)) {
                queryClient.invalidateQueries({ queryKey: ['portfolio-orders'] })
            }
        }

        window.addEventListener('ws-message', handleWsMessage)
        return () => window.removeEventListener('ws-message', handleWsMessage)
    }, [queryClient])

    return query
}

/**
 * Hook for fetching portfolio trade history with mapping
 */
export function usePortfolioTradeHistory(limit = 50) {
    const { token } = useAuth()
    const apiClient = createApiClient(token || '')

    const query = useQuery<Transaction[]>({
        queryKey: ['portfolio-trade-history', token, limit],
        queryFn: async () => {
            if (!token) throw new Error('Authentication required')
            const response = await apiClient.getTrades({ limit })
            const rawData = ((response.data as { trades?: unknown[] })?.trades || response.data || []) as TradeRecord[]

            return rawData.map((trade) => ({
                transactionID: trade.id,
                token: {
                    name: 'GridToken',
                    symbol: 'GRX',
                    logo: '/images/grid.png',
                },
                transactionType: trade.role === 'buyer' ? 'Buy' : 'Sell',
                optionType: 'Spot',
                strikePrice: parseFloat(trade.price),
                expiry: format(new Date(trade.executed_at), 'dd MMM, yyy HH:mm:ss'),
                quantity: parseFloat(trade.quantity),
                totalValue: parseFloat(trade.total_value),
                wheelingCharge: trade.wheeling_charge ? parseFloat(trade.wheeling_charge) : undefined,
                lossCost: trade.loss_cost ? parseFloat(trade.loss_cost) : undefined,
                effectiveEnergy: trade.effective_energy ? parseFloat(trade.effective_energy) : undefined,
                buyerZoneId: trade.buyer_zone_id,
                sellerZoneId: trade.seller_zone_id,
            })) as Transaction[]
        },
        enabled: !!token,
    })

    const queryClient = useQueryClient()
    useEffect(() => {
        const handleWsMessage = (event: Event) => {
            const customEvent = event as CustomEvent
            const message = customEvent.detail
            const refreshEvents = ['TradeExecuted', 'OrderMatched']

            if (refreshEvents.includes(message.type)) {
                queryClient.invalidateQueries({ queryKey: ['portfolio-trade-history'] })
            }
        }

        window.addEventListener('ws-message', handleWsMessage)
        return () => window.removeEventListener('ws-message', handleWsMessage)
    }, [queryClient])

    return query
}

// Re-export Option hooks for convenience
export { useExpiredOptions, useOptionSettlement } from './useOptions'
