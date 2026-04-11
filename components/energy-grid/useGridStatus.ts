'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { API_ENDPOINTS, API_CONFIG } from '@/lib/config'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { defaultApiClient } from '@/lib/api-client'
import { GridStatus, ZoneGridStatus } from '@/types/grid'

// Interfaces moved to types/grid.ts

export interface UseGridStatusResult {
    status: GridStatus | null
    isLoading: boolean
    error: string | null
    refresh: () => Promise<void>
}

/**
 * Hook to fetch real-time aggregate grid status from the PUBLIC API.
 * Supports polling only (WebSocket removed).
 */
export function useGridStatus(refreshIntervalMs = 30000): UseGridStatusResult {
    const queryClient = useQueryClient()

    const { data: status = null, isLoading, error, refetch } = useQuery({
        queryKey: ['grid-status'],
        queryFn: async () => {
            const response = await defaultApiClient.getGridStatus()
            if (response.error) throw new Error(response.error)
            return response.data || null
        },
        refetchInterval: refreshIntervalMs > 0 ? refreshIntervalMs : false,
    })

    return {
        status,
        isLoading,
        error: error ? (error as Error).message : null,
        refresh: async () => { await refetch() }
    }
}
