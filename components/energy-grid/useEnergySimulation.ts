'use client'

import { useState, useEffect, useMemo } from 'react'
import type { EnergyNode, EnergyTransfer, LiveNodeData, LiveTransferData } from './types'
import { getInitialLiveValue, fluctuate, parseNumericValue } from './utils'

interface UseEnergySimulationProps {
    energyNodes: EnergyNode[]
    energyTransfers: EnergyTransfer[]
    updateIntervalMs?: number
    isLive?: boolean
    selectedTime?: Date
}

// Get time-of-day multiplier for different node types
// Returns a value between 0 and 1 that scales the energy output/consumption
function getTimeMultiplier(hour: number, nodeType: 'generator' | 'storage' | 'consumer' | 'transformer'): number {
    if (nodeType === 'generator') {
        // Solar: Peak at noon (12-14h), zero at night (19:00 - 06:00)
        if (hour >= 19 || hour < 6) return 0.05 // Night - minimal
        if (hour >= 6 && hour < 8) return 0.3 // Early morning ramp-up
        if (hour >= 8 && hour < 10) return 0.6 // Morning
        if (hour >= 10 && hour < 12) return 0.85 // Late morning
        if (hour >= 12 && hour < 14) return 1.0 // Peak solar
        if (hour >= 14 && hour < 16) return 0.9 // Early afternoon
        if (hour >= 16 && hour < 18) return 0.6 // Late afternoon
        if (hour >= 18 && hour < 19) return 0.2 // Evening decline
        return 0.5
    }

    if (nodeType === 'consumer') {
        // Consumption: Higher 8-10am and 6-8pm (work hours), lower at night
        if (hour >= 0 && hour < 6) return 0.2 // Night - low
        if (hour >= 6 && hour < 8) return 0.5 // Early morning
        if (hour >= 8 && hour < 10) return 0.9 // Morning peak
        if (hour >= 10 && hour < 12) return 0.8 // Mid-morning
        if (hour >= 12 && hour < 14) return 0.6 // Lunch dip
        if (hour >= 14 && hour < 17) return 0.85 // Afternoon work
        if (hour >= 17 && hour < 20) return 1.0 // Evening peak
        if (hour >= 20 && hour < 22) return 0.7 // Evening
        if (hour >= 22) return 0.3 // Late night
        return 0.5
    }

    if (nodeType === 'storage') {
        // Storage charge level: Charges during day (following solar), discharges evening/night
        if (hour >= 19 || hour < 6) return 0.4 // Night - discharging
        if (hour >= 6 && hour < 10) return 0.5 // Morning - starting to charge
        if (hour >= 10 && hour < 14) return 0.85 // Peak charging
        if (hour >= 14 && hour < 17) return 0.95 // Fully charged
        if (hour >= 17 && hour < 19) return 0.7 // Starting to discharge
        return 0.6
    }

    return 1
}

export function useEnergySimulation({
    energyNodes,
    energyTransfers,
    updateIntervalMs = 10000, // Optimized: 10s instead of 3s
    isLive = true,
    selectedTime,
}: UseEnergySimulationProps) {
    // Get current reference time
    const currentTime = useMemo(() => {
        return isLive ? new Date() : (selectedTime || new Date())
    }, [isLive, selectedTime])

    // Calculate time-based values
    const calculateNodeValue = (node: EnergyNode, time: Date): number => {
        const hour = time.getHours()
        const baseValue = getInitialLiveValue(node)

        // If it's a real meter (id starts with 'meter-'), we use the baseValue as is
        // since it already represents the latest real-world data.
        // We only apply the time multiplier to static/simulated nodes.
        if (node.id.startsWith('meter-')) {
            // For real meters, we return the base value directly without any multipliers or fluctuations.
            // This ensures the map shows exactly what the API reported.
            return baseValue
        }

        const multiplier = getTimeMultiplier(hour, node.type)
        // Add some minute-based variation for realism
        const minuteVariation = Math.sin((time.getMinutes() / 60) * Math.PI * 2) * 0.05

        return Math.max(0, baseValue * multiplier * (1 + minuteVariation))
    }

    // Real-time simulation state
    const [liveNodeData, setLiveNodeData] = useState<Record<string, LiveNodeData>>(() => {
        const initial: Record<string, LiveNodeData> = {}
        const time = isLive ? new Date() : (selectedTime || new Date())
        energyNodes.forEach((node) => {
            initial[node.id] = {
                nodeId: node.id,
                currentValue: calculateNodeValue(node, time),
                status: node.status,
                lastUpdate: time,
            }
        })
        return initial
    })

    const [liveTransferData, setLiveTransferData] = useState<Record<string, LiveTransferData>>(() => {
        const initial: Record<string, LiveTransferData> = {}
        energyTransfers.forEach((transfer, index) => {
            initial[`flow-${index}`] = {
                transferId: `flow-${index}`,
                currentPower: transfer.power,
            }
        })
        return initial
    })

    const [lastGlobalUpdate, setLastGlobalUpdate] = useState<Date>(new Date())

    // Update when selectedTime changes (historical mode)
    useEffect(() => {
        if (isLive) return

        const time = selectedTime || new Date()
        const hour = time.getHours()

        // Update node values based on selected time
        setLiveNodeData((prev) => {
            const updated: Record<string, LiveNodeData> = {}
            energyNodes.forEach((node) => {
                const baseValue = calculateNodeValue(node, time)
                const value = fluctuate(baseValue, 5) // Small variation

                updated[node.id] = {
                    nodeId: node.id,
                    currentValue: Math.max(0, value),
                    status: node.status,
                    lastUpdate: time,
                }
            })
            return updated
        })

        // Update transfer power based on time
        setLiveTransferData((prev) => {
            const updated: Record<string, LiveTransferData> = {}
            energyTransfers.forEach((transfer, index) => {
                // Transfer power follows generator output pattern
                const multiplier = getTimeMultiplier(hour, 'generator')
                const power = transfer.power * multiplier

                updated[`flow-${index}`] = {
                    transferId: `flow-${index}`,
                    currentPower: Math.max(50, fluctuate(power, 8)),
                }
            })
            return updated
        })

        setLastGlobalUpdate(time)
    }, [selectedTime, isLive, energyNodes, energyTransfers])

    // Live mode: Simulate real-time updates
    useEffect(() => {
        if (!isLive) return

        const interval = setInterval(() => {
            const now = new Date()

            // Update node values with fluctuation
            setLiveNodeData((prev) => {
                const updated: Record<string, LiveNodeData> = { ...prev }
                energyNodes.forEach((node) => {
                    const current = prev[node.id]
                    if (current) {
                        const isRealMeter = node.id.startsWith('meter-')
                        const baseValue = calculateNodeValue(node, now)

                        // Only fluctuate simulated/static nodes
                        const newValue = isRealMeter ? baseValue : Math.max(0, fluctuate(baseValue, 8))

                        // Occasionally change status (very rare for performance)
                        let newStatus = current.status
                        if (Math.random() < 0.005) {  // Reduced from 0.02 to 0.005
                            newStatus = Math.random() > 0.5 ? 'active' : 'idle'
                        }

                        updated[node.id] = {
                            ...current,
                            currentValue: newValue,
                            status: newStatus,
                            lastUpdate: now,
                        }
                    }
                })
                return updated
            })

            // Update transfer power with fluctuation
            setLiveTransferData((prev) => {
                const updated: Record<string, LiveTransferData> = { ...prev }
                const hour = now.getHours()
                const multiplier = getTimeMultiplier(hour, 'generator')

                energyTransfers.forEach((transfer, index) => {
                    const id = `flow-${index}`
                    const basePower = transfer.power * multiplier
                    updated[id] = {
                        transferId: id,
                        currentPower: Math.max(50, fluctuate(basePower, 12)),
                    }
                })
                return updated
            })

            setLastGlobalUpdate(now)
        }, updateIntervalMs)

        return () => clearInterval(interval)
    }, [isLive, energyNodes, energyTransfers, updateIntervalMs])

    // Calculate grid totals
    const gridTotals = useMemo(() => {
        const totalGeneration = energyNodes
            .filter((n) => n.type === 'generator')
            .reduce((sum, n) => sum + (liveNodeData[n.id]?.currentValue ?? 0), 0)

        const totalConsumption = energyNodes
            .filter((n) => n.type === 'consumer')
            .reduce((sum, n) => sum + (liveNodeData[n.id]?.currentValue ?? 0), 0)

        // Estimated CO2 saved: ~0.4 kg CO2 per kWh (Thailand grid average)
        // Since generation is in kW, this is a "rate" of CO2 saving per hour
        const co2SavedPerhour = totalGeneration * 0.431 // kg CO2/h

        return {
            totalGeneration,
            totalConsumption,
            co2Saved: co2SavedPerhour,
            activeMeters: energyNodes.filter(n => liveNodeData[n.id]?.status === 'active').length,
            avgStorage: (() => {
                const storageNodes = energyNodes.filter((n) => n.type === 'storage')
                if (storageNodes.length === 0) return 0
                const totalPercent = storageNodes.reduce(
                    (sum, n) => sum + (liveNodeData[n.id]?.currentValue ?? 0),
                    0
                )
                return totalPercent / storageNodes.length
            })(),
        }
    }, [energyNodes, liveNodeData])

    return {
        liveNodeData,
        liveTransferData,
        lastGlobalUpdate,
        gridTotals,
        currentTime,
    }
}
