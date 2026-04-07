'use client'

import { useState, useEffect, useMemo } from 'react'
import type { PublicMeterResponse } from '@/types/meter'
import type { EnergyNode } from './types'
import { ENERGY_GRID_CONFIG } from '@/lib/constants'
import { useQuery } from '@tanstack/react-query'
import { defaultApiClient } from '@/lib/api-client'

export interface UseMeterMapDataOptions {
    /** Whether to include static config nodes alongside real meters */
    includeStaticNodes?: boolean
    /** Static nodes to include if includeStaticNodes is true */
    staticNodes?: EnergyNode[]
    /** Refresh interval in milliseconds (0 to disable auto-refresh) */
    refreshIntervalMs?: number
}

export interface UseMeterMapDataResult {
    /** Combined list of energy nodes (real meters + optional static nodes) */
    nodes: EnergyNode[]
    /** Just the real meters converted to EnergyNode format */
    realMeterNodes: EnergyNode[]
    /** Raw meter responses from API */
    meters: PublicMeterResponse[]
    /** Loading state */
    isLoading: boolean
    /** Error message if any */
    error: string | null
    /** Manually refresh meter data */
    refresh: () => Promise<void>
}

/**
 * Generate a unique ID from meter data since public API no longer exposes id/serial_number.
 * Uses location + coordinates to create a deterministic unique identifier.
 */
function generateMeterId(meter: PublicMeterResponse, index: number): string {
    // Create a unique ID from location and coordinates
    const locationKey = meter.location.replace(/\s+/g, '_').toLowerCase()
    const latKey = meter.latitude?.toFixed(4) || '0'
    const lngKey = meter.longitude?.toFixed(4) || '0'
    return `meter-${locationKey}-${latKey}-${lngKey}-${index}`
}

/**
 * Convert a PublicMeterResponse to an EnergyNode for map display.
 * Uses default UTCC campus coordinates if meter has no location data.
 */
function meterToEnergyNode(meter: PublicMeterResponse, index: number): EnergyNode {
    const { defaultLocation } = ENERGY_GRID_CONFIG

    // Use meter coordinates if available, otherwise use default location
    const lat = (meter.latitude !== undefined && meter.latitude !== null)
        ? meter.latitude
        : defaultLocation.latitude
    const lng = (meter.longitude !== undefined && meter.longitude !== null)
        ? meter.longitude
        : defaultLocation.longitude

    // Determine node type based on meter_type
    let nodeType: 'generator' | 'consumer' | 'storage' = 'consumer'
    const meterTypeLower = (meter.meter_type || '').toLowerCase()
    if (meterTypeLower.includes('solar') || meterTypeLower.includes('generator') || meterTypeLower.includes('producer') || meterTypeLower.includes('prosumer')) {
        nodeType = 'generator'
    } else if (meterTypeLower.includes('battery') || meterTypeLower.includes('storage')) {
        nodeType = 'storage'
    }

    return {
        id: generateMeterId(meter, index),
        name: meter.location || 'Unknown Meter',
        buildingCode: meter.location.slice(0, 10).toUpperCase().replace(/\s+/g, '-'),
        type: nodeType,
        longitude: lng,
        latitude: lat,
        capacity: '100 kWh',
        status: meter.is_verified ? 'active' : 'idle',
        // Telemetry from real meters
        voltage: meter.voltage,
        currentAmps: meter.current,
        frequency: meter.frequency,
        powerFactor: meter.power_factor,
        surplusEnergy: meter.surplus_energy,
        deficitEnergy: meter.deficit_energy,
        zoneId: meter.zone_id,
        // Add type-specific defaults or real data if available
        ...(nodeType === 'generator' && {
            currentOutput: `${(meter.current_generation ?? 0).toFixed(2)} kW`,
            solarPanels: 4,
            efficiency: meter.power_factor ? `${(meter.power_factor * 100).toFixed(0)}%` : '94%',
        }),
        ...(nodeType === 'consumer' && {
            currentLoad: `${(meter.current_consumption ?? 0).toFixed(2)} kW`,
        }),
        ...(nodeType === 'storage' && {
            currentCharge: '50 kWh',
            batteryType: 'Li-ion',
        }),
    }
}

/**
 * Hook to fetch real meter data from the PUBLIC API and convert it to map-compatible EnergyNode format.
 * Uses public endpoint - no authentication required.
 */
export function useMeterMapData(options: UseMeterMapDataOptions = {}): UseMeterMapDataResult {
    const {
        includeStaticNodes = true,
        staticNodes = [],
        refreshIntervalMs = 60000,
    } = options

    const { data: meters = [], isLoading, error, refetch } = useQuery({
        queryKey: ['public-meters'],
        queryFn: async () => {
            const response = await defaultApiClient.getPublicMeters()
            if (response.error) throw new Error(response.error)
            return response.data || []
        },
        refetchInterval: refreshIntervalMs > 0 ? refreshIntervalMs : false,
    })

    // Convert meters to EnergyNodes with generated unique IDs - only include active (verified) meters
    const realMeterNodes: EnergyNode[] = useMemo(() =>
        meters
            .filter(meter => meter.is_verified) // Only show active/verified meters on map
            .map((meter, index) => meterToEnergyNode(meter, index)),
        [meters]
    )

    // Combine with static nodes if requested
    const nodes: EnergyNode[] = useMemo(() =>
        includeStaticNodes ? [...staticNodes, ...realMeterNodes] : realMeterNodes,
        [includeStaticNodes, staticNodes, realMeterNodes]
    )

    return {
        nodes,
        realMeterNodes,
        meters,
        isLoading,
        error: error ? (error as Error).message : null,
        refresh: async () => { await refetch() },
    }
}
