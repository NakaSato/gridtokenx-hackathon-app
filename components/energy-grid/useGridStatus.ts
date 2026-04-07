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
 * Supports both polling and persistent WebSocket updates.
 */
export function useGridStatus(refreshIntervalMs = 30000): UseGridStatusResult {
    const queryClient = useQueryClient()
    const wsRef = useRef<WebSocket | null>(null)

    const { data: status = null, isLoading, error, refetch } = useQuery({
        queryKey: ['grid-status'],
        queryFn: async () => {
            const response = await defaultApiClient.getGridStatus()
            if (response.error) throw new Error(response.error)
            return response.data || null
        },
        refetchInterval: refreshIntervalMs > 0 ? refreshIntervalMs : false,
    })

    // WebSocket connection logic
    useEffect(() => {
        const wsUrl = `${API_CONFIG.wsBaseUrl}/api/market/ws`

        const connectWs = () => {
            if (wsRef.current?.readyState === WebSocket.OPEN) return

            const ws = new WebSocket(wsUrl)
            wsRef.current = ws

            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data)
                    if (data.type === 'grid_status_updated') {
                        const updatedStatus: GridStatus = {
                            total_generation: data.total_generation,
                            total_consumption: data.total_consumption,
                            net_balance: data.net_balance,
                            active_meters: data.active_meters,
                            co2_saved_kg: data.co2_saved_kg,
                            timestamp: data.timestamp,
                            zones: data.zones,
                            frequency: data.frequency,
                            island_status: data.island_status,
                            health_score: data.health_score,
                            is_under_attack: data.is_under_attack,
                            tariff: data.tariff,
                            adr_event: data.adr_event,
                            load_forecast: data.load_forecast,
                            ev_fleet: data.ev_fleet,
                            avg_nodal_price: data.avg_nodal_price,
                            carbon_intensity: data.carbon_intensity
                        }
                        // Update cache immediately on WS message
                        queryClient.setQueryData(['grid-status'], updatedStatus)
                    }
                } catch (e) {
                    console.error('Failed to parse WS message:', e)
                }
            }

            ws.onclose = () => {
                setTimeout(connectWs, 5000)
            }

            ws.onerror = () => {
                ws.close()
            }
        }

        connectWs()

        return () => {
            if (wsRef.current) {
                wsRef.current.close()
            }
        }
    }, [queryClient])

    return {
        status,
        isLoading,
        error: error ? (error as Error).message : null,
        refresh: async () => { await refetch() }
    }
}
