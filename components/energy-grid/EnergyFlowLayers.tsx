'use client'

import { useMemo, useRef, useState, useEffect, memo } from 'react'
import { Source, Layer } from 'react-map-gl/mapbox'
import type { EnergyNode, EnergyTransfer, LiveTransferData } from './types'
import { getPowerColor, getPowerWidth } from './utils'
import { ENERGY_GRID_CONFIG } from '@/lib/constants'

// Calculate animation speed multiplier based on power (1.0 - 2.0)
function getSpeedMultiplier(power: number): number {
    // Higher power = faster animation
    // 0-100 kW = 1.0x, 300+ kW = 2.0x
    const normalized = Math.min(1, Math.max(0, (power - 100) / 200))
    return 1 + normalized
}

interface EnergyFlowLayersProps {
    energyNodes: EnergyNode[]
    energyTransfers: EnergyTransfer[]
    liveTransferData: Record<string, LiveTransferData>
    dashOffset: number
    visible: boolean
    highlightedPath?: string[] // Array of node IDs forming the highlighted path
}

// Generate smooth curved line with multiple points using quadratic Bezier
function generateCurvedLine(
    from: [number, number],
    to: [number, number],
    curveIntensity: number = 0.2,
    segments: number = 20
): [number, number][] {
    const [x1, y1] = from
    const [x2, y2] = to

    // Calculate midpoint
    const midX = (x1 + x2) / 2
    const midY = (y1 + y2) / 2

    // Calculate perpendicular offset for control point
    const dx = x2 - x1
    const dy = y2 - y1
    const distance = Math.sqrt(dx * dx + dy * dy)

    // Perpendicular direction (rotated 90 degrees)
    const perpX = -dy / distance
    const perpY = dx / distance

    // Control point offset - alternate direction based on coordinates for variety
    const direction = (x1 + y1) % 2 === 0 ? 1 : -1
    const offset = distance * curveIntensity * direction

    // Control point
    const cx = midX + perpX * offset
    const cy = midY + perpY * offset

    // Generate points along the quadratic Bezier curve
    const points: [number, number][] = []
    for (let i = 0; i <= segments; i++) {
        const t = i / segments
        const oneMinusT = 1 - t

        // Quadratic Bezier formula: B(t) = (1-t)²P0 + 2(1-t)tP1 + t²P2
        const x = oneMinusT * oneMinusT * x1 + 2 * oneMinusT * t * cx + t * t * x2
        const y = oneMinusT * oneMinusT * y1 + 2 * oneMinusT * t * cy + t * t * y2

        points.push([x, y])
    }

    return points
}

import { useWasmMath } from './useWasmMath'

// ... existing imports ...

export const EnergyFlowLayers = memo(function EnergyFlowLayers({
    energyNodes,
    energyTransfers,
    liveTransferData,
    visible,
    highlightedPath,
}: Omit<EnergyFlowLayersProps, 'dashOffset'>) {
    // Animation state
    const [dashOffset, setDashOffset] = useState(0)
    const [glowPulse, setGlowPulse] = useState(0.25)
    const animationRef = useRef<number | null>(null)

    // Animation loop
    useEffect(() => {
        if (!visible) {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current)
            }
            return
        }

        let lastTime = 0
        const animate = (time: number) => {
            if (document.hidden) {
                animationRef.current = requestAnimationFrame(animate)
                return
            }

            if (time - lastTime > 50) { // ~20fps for smooth animation
                setDashOffset(prev => (prev + 0.3) % 16)

                // Pulsing glow effect
                const pulseValue = Math.sin(time / 600)
                setGlowPulse(0.2 + pulseValue * 0.1)

                lastTime = time
            }
            animationRef.current = requestAnimationFrame(animate)
        }

        animationRef.current = requestAnimationFrame(animate)

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current)
            }
        }
    }, [visible])

    const pulseOpacity = 0.85

    // Curve geometry cache - persists across renders, keyed by "fromId-toId"
    const curveCache = useRef<Map<string, [number, number][]>>(new Map())

    // Wasm hook
    const { isLoaded: wasmLoaded, generateCurvedLineWasm } = useWasmMath()

    // Cache curved line geometry separately (only depends on node positions)
    const cachedCurves = useMemo(() => {
        const curves = new Map<string, [number, number][]>()

        energyTransfers.forEach((transfer) => {
            const cacheKey = `${transfer.from}-${transfer.to}`

            // Check if we already have this curve cached
            const existingCurve = curveCache.current.get(cacheKey)
            if (existingCurve) {
                curves.set(cacheKey, existingCurve)
                return
            }

            const fromNode = energyNodes.find((n) => n.id === transfer.from)
            const toNode = energyNodes.find((n) => n.id === transfer.to)
            if (!fromNode || !toNode) return

            // Generate new curve
            let curvedCoordinates: [number, number][] | null = null

            if (wasmLoaded) {
                curvedCoordinates = generateCurvedLineWasm(
                    [fromNode.longitude, fromNode.latitude],
                    [toNode.longitude, toNode.latitude],
                    0.15,
                    24
                )
            }

            if (!curvedCoordinates) {
                curvedCoordinates = generateCurvedLine(
                    [fromNode.longitude, fromNode.latitude],
                    [toNode.longitude, toNode.latitude],
                    0.15,
                    24
                )
            }

            curves.set(cacheKey, curvedCoordinates)
            curveCache.current.set(cacheKey, curvedCoordinates)
        })

        return curves
    }, [energyNodes, energyTransfers, wasmLoaded, generateCurvedLineWasm])

    // Generate GeoJSON for curved energy flow lines with live data
    // Now uses cached curves - only power/color updates trigger re-render
    const flowLinesGeoJSON = useMemo(() => {
        const features = energyTransfers
            .map((transfer, index) => {
                const cacheKey = `${transfer.from}-${transfer.to}`
                const curvedCoordinates = cachedCurves.get(cacheKey)

                if (!curvedCoordinates) {
                    console.warn(`[EnergyFlow] No curve for transfer ${index}: ${cacheKey}`, {
                        from: transfer.from,
                        to: transfer.to,
                        availableKeys: Array.from(cachedCurves.keys())
                    })
                    return null
                }

                // Get live power value
                const liveTransfer = liveTransferData[`flow-${index}`]
                const power = liveTransfer?.currentPower ?? transfer.power

                return {
                    type: 'Feature' as const,
                    properties: {
                        id: `flow-${index}`,
                        power: power,
                        description: transfer.description || `${Math.round(power)} kW`,
                        color: getPowerColor(power),
                        width: getPowerWidth(power),
                        speedMultiplier: getSpeedMultiplier(power),
                    },
                    geometry: {
                        type: 'LineString' as const,
                        coordinates: curvedCoordinates,
                    },
                }
            })
            .filter(Boolean)

        console.log(`[EnergyFlow] Generated ${features.length} flow lines from ${energyTransfers.length} transfers`)

        return {
            type: 'FeatureCollection' as const,
            features,
        }
    }, [energyTransfers, liveTransferData, cachedCurves])

    // Generate highlighted path GeoJSON
    const highlightedFlowsGeoJSON = useMemo(() => {
        if (!highlightedPath || highlightedPath.length < 2) {
            return { type: 'FeatureCollection' as const, features: [] }
        }

        const features = []

        // Find transfers that are part of the path
        for (let i = 0; i < highlightedPath.length - 1; i++) {
            const fromId = highlightedPath[i]
            const toId = highlightedPath[i + 1]

            const fromNode = energyNodes.find(n => n.id === fromId)
            const toNode = energyNodes.find(n => n.id === toId)

            if (!fromNode || !toNode) continue

            // Generate curved line
            let curvedCoordinates: [number, number][] | null = null
            if (wasmLoaded) {
                curvedCoordinates = generateCurvedLineWasm(
                    [fromNode.longitude, fromNode.latitude],
                    [toNode.longitude, toNode.latitude],
                    0.15, 24
                )
            }
            if (!curvedCoordinates) {
                curvedCoordinates = generateCurvedLine(
                    [fromNode.longitude, fromNode.latitude],
                    [toNode.longitude, toNode.latitude],
                    0.15, 24
                )
            }

            features.push({
                type: 'Feature' as const,
                properties: {
                    id: `path-${i}`,
                    from: fromNode.name,
                    to: toNode.name,
                },
                geometry: {
                    type: 'LineString' as const,
                    coordinates: curvedCoordinates,
                },
            })
        }

        return { type: 'FeatureCollection' as const, features }
    }, [highlightedPath, energyNodes, wasmLoaded, generateCurvedLineWasm])

    if (!visible) return null

    return (
        <>
            {/* Glow Layer (background) */}
            <Source
                id="energy-flows-glow"
                type="geojson"
                data={flowLinesGeoJSON as GeoJSON.FeatureCollection}
            >
                <Layer
                    id="energy-flow-glow"
                    type="line"
                    layout={{
                        'line-cap': 'round',
                        'line-join': 'round',
                    }}
                    paint={{
                        'line-color': ['get', 'color'],
                        'line-width': ['+', ['get', 'width'], 8],
                        'line-opacity': glowPulse,
                        'line-blur': 10,
                    }}
                />
            </Source>

            {/* Main animated layer - dashOffset drives movement on the dashes */}
            <Source
                id="energy-flows"
                type="geojson"
                data={flowLinesGeoJSON as GeoJSON.FeatureCollection}
            >
                <Layer
                    id="energy-flow-line"
                    type="line"
                    layout={{
                        'line-cap': 'round',
                        'line-join': 'round',
                    }}
                    paint={{
                        'line-color': ['get', 'color'],
                        'line-width': ['get', 'width'],
                        'line-opacity': pulseOpacity,
                        'line-dasharray': [
                            Math.max(0.1, 2 + (dashOffset % 5) * 0.2),
                            Math.max(0.5, 3 - (dashOffset % 5) * 0.1),
                        ],
                    }}
                />
            </Source>

            {/* Animated dots overlay - brighter for high power */}
            <Source
                id="energy-flows-dots"
                type="geojson"
                data={flowLinesGeoJSON as GeoJSON.FeatureCollection}
            >
                <Layer
                    id="energy-flow-dots"
                    type="line"
                    layout={{
                        'line-cap': 'round',
                        'line-join': 'round',
                    }}
                    paint={{
                        'line-color': '#ffffff',
                        // Higher power = thicker dots (2-4px based on speedMultiplier)
                        'line-width': ['+', 1.5, ['*', ['get', 'speedMultiplier'], 1.5]],
                        // Higher power = more visible dots
                        'line-opacity': ['+', 0.6, ['*', ['get', 'speedMultiplier'], 0.2]],
                        'line-dasharray': [
                            0.3,
                            Math.max(0.5, 8 + (dashOffset % 8)),
                            0.3,
                            Math.max(0.5, 8 - (dashOffset % 8)),
                        ],
                    }}
                />
            </Source>

            {/* Directional arrows along the flow - text-only, no icon-image to avoid silent sprite failures */}
            <Source
                id="energy-flows-arrows"
                type="geojson"
                data={flowLinesGeoJSON as GeoJSON.FeatureCollection}
            >
                <Layer
                    id="energy-flow-arrows"
                    type="symbol"
                    layout={{
                        'symbol-placement': 'line',
                        'symbol-spacing': 80,
                        'text-field': '▶',
                        'text-size': 10,
                        'text-rotation-alignment': 'map',
                        'text-allow-overlap': true,
                        'text-ignore-placement': true,
                    }}
                    paint={{
                        'text-color': ['get', 'color'],
                        'text-opacity': 0.9,
                        'text-halo-color': 'rgba(0,0,0,0.5)',
                        'text-halo-width': 1,
                    }}
                />
            </Source>

            {/* Highlighted Path Layer - shows selected route */}
            {highlightedPath && highlightedPath.length >= 2 && (
                <>
                    {/* Glow for highlighted path */}
                    <Source
                        id="highlighted-path-glow"
                        type="geojson"
                        data={highlightedFlowsGeoJSON as GeoJSON.FeatureCollection}
                    >
                        <Layer
                            id="highlighted-path-glow-layer"
                            type="line"
                            layout={{
                                'line-cap': 'round',
                                'line-join': 'round',
                            }}
                            paint={{
                                'line-color': '#00ffff',
                                'line-width': 16,
                                'line-opacity': 0.4,
                                'line-blur': 8,
                            }}
                        />
                    </Source>

                    {/* Main highlighted path */}
                    <Source
                        id="highlighted-path"
                        type="geojson"
                        data={highlightedFlowsGeoJSON as GeoJSON.FeatureCollection}
                    >
                        <Layer
                            id="highlighted-path-layer"
                            type="line"
                            layout={{
                                'line-cap': 'round',
                                'line-join': 'round',
                            }}
                            paint={{
                                'line-color': '#00ffff',
                                'line-width': 4,
                                'line-opacity': 1,
                                'line-dasharray': [3, 1],
                            }}
                        />
                    </Source>
                </>
            )}
        </>
    )
})
