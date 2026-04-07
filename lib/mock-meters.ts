import type { PublicMeterResponse } from '@/types/meter'
import type { EnergyNode, EnergyTransfer } from '@/components/energy-grid/types'
import { ENERGY_GRID_CONFIG } from '@/lib/constants'

/**
 * Simple mock data for 2 meters - useful for testing when API is unavailable
 */
export const MOCK_METERS: PublicMeterResponse[] = [
    {
        location: 'Solar Farm Alpha',
        meter_type: 'solar',
        is_verified: true,
        latitude: 13.7856,
        longitude: 100.5661,
        current_generation: 45.2,
        current_consumption: 2.1,
        voltage: 220.5,
        current: 18.3,
        frequency: 50.02,
        power_factor: 0.95,
        surplus_energy: 43.1,
        deficit_energy: 0,
        zone_id: 1,
    },
    {
        location: 'Building B Consumer',
        meter_type: 'consumer',
        is_verified: true,
        latitude: 13.7880,
        longitude: 100.5680,
        current_generation: 0,
        current_consumption: 38.7,
        voltage: 219.8,
        current: 12.5,
        frequency: 50.01,
        power_factor: 0.92,
        surplus_energy: 0,
        deficit_energy: 38.7,
        zone_id: 1,
    },
]

/**
 * Mock transformer for the 2 meters
 */
export const MOCK_TRANSFORMER: EnergyNode = {
    id: 'transformer-mock-1',
    name: 'Mock Transformer Zone 1',
    type: 'transformer',
    latitude: 13.7868,
    longitude: 100.5670,
    capacity: '500 kVA',
    status: 'active',
    buildingCode: 'TR-MOCK-1',
}

/**
 * Mock transfers connecting the 2 meters through the transformer
 * This creates the power flow lines on the map
 */
export const MOCK_TRANSFERS: EnergyTransfer[] = [
    {
        from: 'meter-solar_farm_alpha-13.7856-100.5661-0', // Solar Farm Alpha ID
        to: 'transformer-mock-1',
        power: 43.1, // surplus energy flowing to transformer
        description: 'Solar → Grid (43.1 kW)',
    },
    {
        from: 'transformer-mock-1',
        to: 'meter-building_b_consumer-13.7880-100.5680-1', // Building B Consumer ID
        power: 38.7, // deficit energy from transformer
        description: 'Grid → Building (38.7 kW)',
    },
]

/**
 * Convert PublicMeterResponse to EnergyNode for map display
 */
function mockMeterToEnergyNode(meter: PublicMeterResponse, index: number): EnergyNode {
    const { defaultLocation } = ENERGY_GRID_CONFIG

    const lat = meter.latitude ?? defaultLocation.latitude
    const lng = meter.longitude ?? defaultLocation.longitude

    let nodeType: 'generator' | 'consumer' | 'storage' = 'consumer'
    const meterTypeLower = (meter.meter_type || '').toLowerCase()
    if (meterTypeLower.includes('solar') || meterTypeLower.includes('generator') || meterTypeLower.includes('producer') || meterTypeLower.includes('prosumer')) {
        nodeType = 'generator'
    } else if (meterTypeLower.includes('battery') || meterTypeLower.includes('storage')) {
        nodeType = 'storage'
    }

    // Create unique ID from location and coordinates
    const locationKey = meter.location.replace(/\s+/g, '_').toLowerCase()
    const latKey = lat.toFixed(4)
    const lngKey = lng.toFixed(4)
    const id = `meter-${locationKey}-${latKey}-${lngKey}-${index}`

    return {
        id,
        name: meter.location,
        buildingCode: meter.location.slice(0, 10).toUpperCase().replace(/\s+/g, '-'),
        type: nodeType,
        longitude: lng,
        latitude: lat,
        capacity: '100 kWh',
        status: meter.is_verified ? 'active' : 'idle',
        voltage: meter.voltage,
        currentAmps: meter.current,
        frequency: meter.frequency,
        powerFactor: meter.power_factor,
        surplusEnergy: meter.surplus_energy,
        deficitEnergy: meter.deficit_energy,
        zoneId: meter.zone_id,
        ...(nodeType === 'generator' && {
            currentOutput: `${(meter.current_generation ?? 0).toFixed(2)} kW`,
            solarPanels: 4,
            efficiency: meter.power_factor ? `${(meter.power_factor * 100).toFixed(0)}%` : '94%',
        }),
        ...(nodeType === 'consumer' && {
            currentLoad: `${(meter.current_consumption ?? 0).toFixed(2)} kW`,
        }),
    }
}

/**
 * Get 2 mock energy nodes for simple testing
 */
export function getMockEnergyNodes(): EnergyNode[] {
    return MOCK_METERS.map((meter, index) => mockMeterToEnergyNode(meter, index))
}

/**
 * Hook-compatible mock function - returns same shape as useMeterMapData
 */
export function useMockMeters() {
    return {
        nodes: getMockEnergyNodes(),
        realMeterNodes: getMockEnergyNodes(),
        meters: MOCK_METERS,
        isLoading: false,
        error: null,
        refresh: async () => { },
    }
}
