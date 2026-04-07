'use client'

import { useMemo, useState, useEffect, useRef, memo } from 'react'
import { Source, Layer } from 'react-map-gl/mapbox'
import type { EnergyNode } from './types'
import type { ActiveTrade } from './useActiveTrades'

interface TradeFlowLayersProps {
    trades: ActiveTrade[]
    transformers: EnergyNode[]
    visible?: boolean
}

// Generate curved line between two points
function generateCurvedLine(
    from: [number, number],
    to: [number, number],
    curveIntensity: number = 0.25,
    segments: number = 24
): [number, number][] {
    const [x1, y1] = from
    const [x2, y2] = to

    const midX = (x1 + x2) / 2
    const midY = (y1 + y2) / 2

    const dx = x2 - x1
    const dy = y2 - y1
    const distance = Math.sqrt(dx * dx + dy * dy)

    const perpX = -dy / distance
    const perpY = dx / distance

    // Alternate curve direction
    const direction = (x1 + y1) % 2 === 0 ? 1 : -1
    const offset = distance * curveIntensity * direction

    const cx = midX + perpX * offset
    const cy = midY + perpY * offset

    const points: [number, number][] = []
    for (let i = 0; i <= segments; i++) {
        const t = i / segments
        const oneMinusT = 1 - t

        const x = oneMinusT * oneMinusT * x1 + 2 * oneMinusT * t * cx + t * t * x2
        const y = oneMinusT * oneMinusT * y1 + 2 * oneMinusT * t * cy + t * t * y2

        points.push([x, y])
    }

    return points
}

// Get trade flow color based on energy amount
function getTradeColor(quantity: number, isActive: boolean): string {
    if (!isActive) return 'rgba(0, 212, 255, 0.4)' // Faded cyan for completed

    // Active trades: brighter cyan to green based on quantity
    if (quantity >= 100) return '#00ff88' // High energy - green
    if (quantity >= 50) return '#00d4ff'  // Medium - cyan
    return '#00aaff' // Low - lighter blue
}

function getTradeWidth(quantity: number): number {
    if (quantity >= 100) return 4
    if (quantity >= 50) return 3
    return 2
}

export const TradeFlowLayers = memo(function TradeFlowLayers({
    trades,
    transformers,
    visible = true,
}: TradeFlowLayersProps) {
    // Animation state
    const [dashOffset, setDashOffset] = useState(0)
    const [glowPulse, setGlowPulse] = useState(0.3)
    const animationRef = useRef<number | null>(null)

    // Animation loop for active trades
    useEffect(() => {
        if (!visible || trades.length === 0) {
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

            if (time - lastTime > 50) { // ~20fps
                setDashOffset(prev => (prev + 0.5) % 20)

                // Pulsing glow
                const pulseValue = Math.sin(time / 500)
                setGlowPulse(0.25 + pulseValue * 0.15)

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
    }, [visible, trades.length])

    // Build zone centroid lookup from transformers
    const zoneCentroids = useMemo(() => {
        const centroids: Record<number, { lat: number; lng: number }> = {}

        transformers.forEach(transformer => {
            // Parse zone ID from transformer ID (format: "transformer-{zoneId}")
            const match = transformer.id.match(/transformer-(\d+)/)
            if (match) {
                const zoneId = parseInt(match[1])
                centroids[zoneId] = {
                    lat: transformer.latitude,
                    lng: transformer.longitude,
                }
            }
        })

        return centroids
    }, [transformers])

    // Generate GeoJSON for trade flows
    const tradeFlowsGeoJSON = useMemo(() => {
        const features = trades
            .filter(trade => {
                const sellerZone = zoneCentroids[trade.seller_zone_id!]
                const buyerZone = zoneCentroids[trade.buyer_zone_id!]
                return sellerZone && buyerZone && trade.seller_zone_id !== trade.buyer_zone_id
            })
            .map((trade, index) => {
                const sellerZone = zoneCentroids[trade.seller_zone_id!]
                const buyerZone = zoneCentroids[trade.buyer_zone_id!]

                const quantity = parseFloat(trade.quantity) || 0

                // Generate curved line from seller to buyer
                const curvedCoordinates = generateCurvedLine(
                    [sellerZone.lng, sellerZone.lat],
                    [buyerZone.lng, buyerZone.lat],
                    0.2,
                    24
                )

                return {
                    type: 'Feature' as const,
                    properties: {
                        id: `trade-${trade.id}`,
                        color: getTradeColor(quantity, trade.isActive),
                        width: getTradeWidth(quantity),
                        quantity,
                        isActive: trade.isActive,
                        sellerZone: trade.seller_zone_id,
                        buyerZone: trade.buyer_zone_id,
                        description: `${quantity.toFixed(1)} kWh`,
                    },
                    geometry: {
                        type: 'LineString' as const,
                        coordinates: curvedCoordinates,
                    },
                }
            })

        return {
            type: 'FeatureCollection' as const,
            features,
        }
    }, [trades, zoneCentroids])

    if (!visible || tradeFlowsGeoJSON.features.length === 0) return null

    return (
        <>
            {/* Glow Layer */}
            <Source
                id="trade-flows-glow"
                type="geojson"
                data={tradeFlowsGeoJSON as GeoJSON.FeatureCollection}
            >
                <Layer
                    id="trade-flow-glow"
                    type="line"
                    layout={{
                        'line-cap': 'round',
                        'line-join': 'round',
                    }}
                    paint={{
                        'line-color': ['get', 'color'],
                        'line-width': ['+', ['get', 'width'], 8],
                        'line-opacity': glowPulse,
                        'line-blur': 12,
                    }}
                />
            </Source>

            {/* Main Line Layer */}
            <Source
                id="trade-flows"
                type="geojson"
                data={tradeFlowsGeoJSON as GeoJSON.FeatureCollection}
            >
                <Layer
                    id="trade-flow-line"
                    type="line"
                    layout={{
                        'line-cap': 'round',
                        'line-join': 'round',
                    }}
                    paint={{
                        'line-color': ['get', 'color'],
                        'line-width': ['get', 'width'],
                        'line-opacity': 0.9,
                        'line-dasharray': [2, 2],
                    }}
                />
            </Source>

            {/* Animated dots overlay */}
            <Source
                id="trade-flows-dots"
                type="geojson"
                data={tradeFlowsGeoJSON as GeoJSON.FeatureCollection}
            >
                <Layer
                    id="trade-flow-dots"
                    type="line"
                    layout={{
                        'line-cap': 'round',
                        'line-join': 'round',
                    }}
                    paint={{
                        'line-color': '#ffffff',
                        'line-width': 2,
                        'line-opacity': 0.8,
                        'line-dasharray': [
                            0.5,
                            Math.max(0.5, 6 + (dashOffset % 6)),
                            0.5,
                            Math.max(0.5, 6 - (dashOffset % 6)),
                        ],
                    }}
                />
            </Source>

            {/* Direction arrows */}
            <Source
                id="trade-flows-arrows"
                type="geojson"
                data={tradeFlowsGeoJSON as GeoJSON.FeatureCollection}
            >
                <Layer
                    id="trade-flow-arrows"
                    type="symbol"
                    layout={{
                        'symbol-placement': 'line',
                        'symbol-spacing': 100,
                        'text-field': '▶',
                        'text-size': 12,
                        'text-rotation-alignment': 'map',
                        'text-allow-overlap': true,
                        'text-ignore-placement': true,
                    }}
                    paint={{
                        'text-color': ['get', 'color'],
                        'text-opacity': 0.9,
                        'text-halo-color': 'rgba(0,0,0,0.6)',
                        'text-halo-width': 1,
                    }}
                />
            </Source>
        </>
    )
})
