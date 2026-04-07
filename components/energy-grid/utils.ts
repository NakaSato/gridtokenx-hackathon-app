import type { EnergyNode } from './types'
import { ENERGY_GRID_CONFIG } from '@/lib/constants'

// Helper to parse numeric value from string like "280 kW" or "150 kWh"
export const parseNumericValue = (value: string | undefined): number => {
    if (!value) return 0
    const match = value.match(/[\d.]+/)
    return match ? parseFloat(match[0]) : 0
}

// Helper to generate random fluctuation within percentage range
export const fluctuate = (baseValue: number, percentRange: number = 15): number => {
    const variance = baseValue * (percentRange / 100)
    return baseValue + (Math.random() * 2 - 1) * variance
}

// Helper to get color based on power level
export const getPowerColor = (power: number): string => {
    const { high, medium, low } = ENERGY_GRID_CONFIG.powerThresholds
    if (power >= high) return '#22c55e' // Green - high power
    if (power >= medium) return '#eab308' // Yellow - medium power
    if (power >= low) return '#f97316' // Orange - low-medium power
    return '#ef4444' // Red - low power
}

// Helper to get line width based on power level
export const getPowerWidth = (power: number): number => {
    const { high, medium, low } = ENERGY_GRID_CONFIG.powerThresholds
    if (power >= high) return 4
    if (power >= medium) return 3
    if (power >= low) return 2.5
    return 2
}

// Get status color class
export const getStatusColor = (status: string): string => {
    switch (status) {
        case 'active':
            return 'bg-green-500'
        case 'idle':
            return 'bg-yellow-500'
        case 'maintenance':
            return 'bg-red-500'
        default:
            return 'bg-gray-500'
    }
}

// Get initial live value based on node type
export const getInitialLiveValue = (node: EnergyNode): number => {
    if (node.type === 'generator') {
        return parseNumericValue(node.currentOutput)
    } else if (node.type === 'consumer') {
        return parseNumericValue(node.currentLoad)
    } else if (node.type === 'storage') {
        const current = parseNumericValue(node.currentCharge)
        const capacity = parseNumericValue(node.capacity)
        return capacity > 0 ? (current / capacity) * 100 : 0
    }
    return 0
}
