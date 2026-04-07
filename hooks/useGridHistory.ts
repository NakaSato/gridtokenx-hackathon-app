'use client'

import { useQuery } from '@tanstack/react-query'
import { defaultApiClient } from '@/lib/api-client'
import { useMemo } from 'react'

export function useGridHistory(limit = 30, refreshIntervalMs = 30000) {
    const { data, isLoading, error, refetch } = useQuery({
        queryKey: ['grid-history', limit],
        queryFn: async () => {
            const response = await defaultApiClient.getGridHistory(limit)
            if (response.error) throw new Error(response.error)
            return response.data || []
        },
        refetchInterval: refreshIntervalMs > 0 ? refreshIntervalMs : false,
    })

    const history = useMemo(() => {
        if (!data) return []
        // Return reversed to have chronological order (oldest to newest) for charts
        return [...data].reverse()
    }, [data])

    return {
        history,
        isLoading,
        error: error ? (error as Error).message : null,
        refresh: async () => { await refetch() }
    }
}
