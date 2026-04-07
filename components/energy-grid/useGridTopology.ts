'use client'

import { useState, useEffect, useMemo } from 'react'
import type { EnergyNode, EnergyTransfer } from './types'
import { API_ENDPOINTS, API_CONFIG } from '@/lib/config'
import { useQuery } from '@tanstack/react-query'
import { defaultApiClient } from '@/lib/api-client'
import { GridTopologyResponse } from '@/types/grid'

// Types moved to types/grid.ts

interface UseGridTopologyResult {
    transformers: EnergyNode[]
    transfers: EnergyTransfer[]
    isLoading: boolean
    error: string | null
    refresh: () => Promise<void>
}

export function useGridTopology(): UseGridTopologyResult {
    const { data, isLoading, error, refetch } = useQuery({
        queryKey: ['grid-topology'],
        queryFn: async () => {
            const response = await defaultApiClient.getGridTopology()

            if (response.error || !response.data) {
                // Fallback to thailand data if main endpoint fails
                try {
                    const demoResponse = await fetch(`${API_CONFIG.baseUrl}/api/thailand/data`)
                    if (!demoResponse.ok) throw new Error(response.error || 'Failed to fetch topology')
                    return await demoResponse.json() as GridTopologyResponse
                } catch (e) {
                    throw new Error(response.error || 'Failed to fetch topology')
                }
            }
            return response.data
        },
        staleTime: 300000, // Topology doesn't change often
    })

    const processedData = useMemo(() => {
        if (!data) return { transformers: [], transfers: [] }

        const newTransformers: EnergyNode[] = []
        const newTransfers: EnergyTransfer[] = []

        // Process Zones (Transformers) - Add safety check for data.zones
        if (data.zones) {
            Object.values(data.zones).forEach((zone) => {
                const transformerId = `transformer-${zone.zone_id}`
                newTransformers.push({
                    id: transformerId,
                    name: zone.transformer_name || `Transformer Zone ${zone.zone_id}`,
                    type: 'transformer',
                    latitude: zone.centroid_lat,
                    longitude: zone.centroid_lon,
                    capacity: '500 kVA',
                    status: 'active',
                    buildingCode: `TR-${zone.zone_id}`,
                })
            })
        }

        // Process Meters connections - Add safety check for data.meters
        if (data.meters) {
            data.meters.forEach((meter) => {
                if (meter.zone_id === null) return
                const transformerId = `transformer-${meter.zone_id}`
                newTransfers.push({
                    from: transformerId,
                    to: meter.meter_id,
                    power: 0,
                    description: 'Service Line'
                })
            })
        }

        return { transformers: newTransformers, transfers: newTransfers }
    }, [data])

    return {
        transformers: processedData.transformers,
        transfers: processedData.transfers,
        isLoading,
        error: error ? (error as Error).message : null,
        refresh: async () => { await refetch() }
    }
}
