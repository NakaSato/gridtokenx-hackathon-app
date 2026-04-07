'use client'

export interface EnergyNode {
    id: string
    name: string
    buildingCode?: string
    type: 'generator' | 'storage' | 'consumer' | 'transformer'
    longitude: number
    latitude: number
    capacity: string
    status: 'active' | 'idle' | 'maintenance'
    // Generator specific
    currentOutput?: string
    solarPanels?: number
    panelType?: string
    efficiency?: string
    peakGeneration?: string
    tiltAngle?: string
    orientation?: string
    // Storage specific
    currentCharge?: string
    batteryType?: string
    batteryPacks?: number
    chargeRate?: string
    dischargeRate?: string
    cycleCount?: number
    temperature?: string
    // Consumer specific
    currentLoad?: string
    floors?: number
    area?: string
    occupancy?: string
    hvacSystem?: string
    lighting?: string
    avgDailyConsumption?: string
    peakDemand?: string
    laboratories?: number
    studySeats?: number
    specialEquipment?: string
    // Common
    installDate?: string
    lastMaintenance?: string
    lastUpgrade?: string
    // Telemetry (from real meters)
    voltage?: number
    currentAmps?: number
    frequency?: number
    powerFactor?: number
    surplusEnergy?: number
    deficitEnergy?: number
    // Grid Topology
    zoneId?: number
}

export interface EnergyTransfer {
    from: string
    to: string
    power: number // in kW
    description?: string
}

export interface LiveNodeData {
    nodeId: string
    currentValue: number // kW for generator/consumer, % for storage
    status: 'active' | 'idle' | 'maintenance'
    lastUpdate: Date
    isCompromised?: boolean
    anomalyScore?: number
}

export interface LiveTransferData {
    transferId: string
    currentPower: number
}

export interface CampusConfig {
    name: string
    fullName: string
    description: string
    center: {
        longitude: number
        latitude: number
    }
    defaultZoom: number
    totalCapacity: string
    operationalSince: string
    efficiency: string
}
