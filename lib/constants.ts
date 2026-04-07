/**
 * Centralized constants for the GridTokenX Trading application.
 */

export const CAMPUS_CONFIG = {
    name: "UTCC Smart Grid",
    fullName: "University of the Thai Chamber of Commerce",
    description: "Real-time energy distribution across University of the Thai Chamber of Commerce campus",
    center: {
        longitude: 100.560237,
        latitude: 13.780157
    },
    defaultZoom: 15,
    totalCapacity: "2950 kWh",
    operationalSince: "2024",
    efficiency: "94.5%"
} as const

/** Type for campus configuration */
export type CampusConfig = typeof CAMPUS_CONFIG

/**
 * Energy Grid Map Configuration
 * Centralized settings for the energy grid visualization components.
 */
export const ENERGY_GRID_CONFIG = {
    // Default coordinates (fallback when meter has no location)
    defaultLocation: {
        latitude: 13.7856,
        longitude: 100.5661,
    },

    // Animation settings
    animation: {
        throttleMs: 33,  // ~30fps
        dashSpeed: 0.05,
        pulseCycle: 800,
    },

    // Power level thresholds (kW)
    powerThresholds: {
        high: 300,    // Green
        medium: 200,  // Yellow
        low: 100,     // Orange
        // Below low = Red
    },

    // Progress bar max values
    progressBar: {
        maxCapacity: 500,  // kW
    },
} as const

/** Type for energy grid configuration */
export type EnergyGridConfig = typeof ENERGY_GRID_CONFIG

/**
 * P2P Trading Configuration
 * Centralized settings for peer-to-peer energy trading.
 */
export const P2P_CONFIG = {
    // Available trading zones
    zones: [
        { id: 1, name: 'Zone 1 - Residential' },
        { id: 2, name: 'Zone 2 - Commercial' },
        { id: 3, name: 'Zone 3 - Industrial' },
        { id: 4, name: 'Zone 4 - Mixed Use' },
    ] as const,

    // Default price per kWh (THB)
    defaultPrice: 4.0,

    // Quick amount percentages
    quickAmountPercentages: [25, 50, 75, 100] as const,

    // Grid pricing defaults (THB/kWh)
    defaultGridImportPrice: 4.50,
    defaultGridExportPrice: 2.20,

    // Pagination
    itemsPerPage: 10,
} as const

/** Trading zone type */
export type TradingZone = typeof P2P_CONFIG.zones[number]

/** Type for P2P configuration */
export type P2PConfig = typeof P2P_CONFIG
