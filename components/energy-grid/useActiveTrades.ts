'use client'

import { useQuery } from '@tanstack/react-query'
import { defaultApiClient } from '@/lib/api-client'
import type { TradeRecord } from '@/types/trading'

export interface ActiveTrade extends TradeRecord {
    isActive: boolean
}

interface UseActiveTradesResult {
    trades: ActiveTrade[]
    isLoading: boolean
    error: string | null
    refresh: () => Promise<void>
}

export function useActiveTrades(): UseActiveTradesResult {
    const { data, isLoading, error, refetch } = useQuery({
        queryKey: ['active-trades'],
        queryFn: async () => {
            const response = await defaultApiClient.getTrades({ limit: 20 })

            if (response.error || !response.data) {
                throw new Error(response.error || 'Failed to fetch trades')
            }

            return response.data
        },
        staleTime: 10000, // Refresh every 10 seconds
        refetchInterval: 10000,
    })

    // Process trades - mark active ones
    const trades: ActiveTrade[] = (data?.trades || [])
        .filter(trade =>
            // Only include trades with zone info for visualization
            trade.buyer_zone_id !== undefined &&
            trade.seller_zone_id !== undefined
        )
        .map(trade => ({
            ...trade,
            // Consider trades active if status is executing, matched, or very recent
            isActive: ['executing', 'matched', 'pending_settlement'].includes(trade.status) ||
                (trade.status === 'completed' &&
                    new Date(trade.executed_at).getTime() > Date.now() - 60000) // Last minute
        }))

    return {
        trades,
        isLoading,
        error: error ? (error as Error).message : null,
        refresh: async () => { await refetch() },
    }
}
