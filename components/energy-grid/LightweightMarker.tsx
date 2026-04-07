'use client'

import { memo, useCallback } from 'react'
import { Zap, Battery, BatteryCharging, ShoppingCart } from 'lucide-react'
import { Marker } from 'react-map-gl/mapbox'
import type { EnergyNode, LiveNodeData } from './types'

interface LightweightMarkerProps {
    node: EnergyNode
    liveData?: LiveNodeData
    isSelected: boolean
    onSelect: (node: EnergyNode) => void
    onDoubleClick: (node: EnergyNode) => void
    onTradeClick?: (node: EnergyNode) => void
}

// Get status color - simple inline function
const getStatusColor = (status: string) => {
    switch (status) {
        case 'active': return 'bg-green-500'
        case 'idle': return 'bg-yellow-500'
        case 'warning': return 'bg-orange-500'
        case 'critical': return 'bg-red-500'
        default: return 'bg-gray-500'
    }
}

// Simple inline icon component
const MarkerIcon = memo(({ type }: { type: string }) => {
    switch (type) {
        case 'generator':
            return <Zap className="h-3 w-3 text-yellow-500" />
        case 'storage':
            return <BatteryCharging className="h-3 w-3 text-green-500" />
        default:
            return <Battery className="h-3 w-3 text-blue-500" />
    }
})
MarkerIcon.displayName = 'MarkerIcon'

/**
 * Lightweight marker for maximum rendering performance
 * - No Popover/Accordion (heavy components)
 * - Minimal DOM nodes
 * - Simple click to select
 * - Trade button when selected
 */
function LightweightMarkerComponent({
    node,
    liveData,
    isSelected,
    onSelect,
    onDoubleClick,
    onTradeClick,
}: LightweightMarkerProps) {
    const status = liveData?.status ?? node.status
    const liveValue = liveData?.currentValue ?? 0
    const isCompromised = liveData?.isCompromised ?? false
    const anomalyScore = liveData?.anomalyScore ?? 0

    const handleClick = useCallback((e: React.MouseEvent) => {
        e.stopPropagation()
        onSelect(node)
    }, [node, onSelect])

    const handleDoubleClick = useCallback((e: React.MouseEvent) => {
        e.stopPropagation()
        onDoubleClick(node)
    }, [node, onDoubleClick])

    const handleTradeClick = useCallback((e: React.MouseEvent) => {
        e.stopPropagation()
        onTradeClick?.(node)
    }, [node, onTradeClick])

    // Generate accessible label based on node type and status
    const ariaLabel = `${node.name}, ${node.type}, ${status}, ${node.type === 'storage' ? `${liveValue.toFixed(0)}% charged` : `${liveValue.toFixed(1)} kilowatts`}`

    return (
        <Marker longitude={node.longitude} latitude={node.latitude}>
            <div
                className="relative"
                style={{
                    contain: 'layout style',
                }}
                title={isCompromised ? `${node.name} - COMPROMISED (Anomaly: ${anomalyScore.toFixed(2)})` : node.name}
                onClick={handleClick}
                onDoubleClick={handleDoubleClick}
            >
                {/* Status dot - top right */}
                <div
                    className={`absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full ${isCompromised ? 'bg-red-500 animate-pulse' : getStatusColor(status)} z-10 border border-background/50`}
                    aria-hidden="true"
                />

                {/* Pulsing Alert Ring for Compromised Nodes */}
                {isCompromised && (
                    <div className="absolute inset-0 rounded-full bg-red-500/30 animate-ping" aria-hidden="true" />
                )}

                {/* Main marker - simplified */}
                <div className={`rounded-full p-1.5 shadow-md backdrop-blur-sm bg-background/80 border ${isCompromised ? 'border-red-500 shadow-red-500/40' : 'border-primary/40'}`} aria-hidden="true">
                    <MarkerIcon type={isCompromised ? 'critical' : node.type} />
                </div>
            </div>
        </Marker>
    )
}

// Export memoized version with strict equality check
export const LightweightMarker = memo(LightweightMarkerComponent, (prev, next) => {
    return (
        prev.node.id === next.node.id &&
        prev.isSelected === next.isSelected &&
        prev.liveData?.status === next.liveData?.status &&
        prev.liveData?.currentValue === next.liveData?.currentValue &&
        prev.liveData?.isCompromised === next.liveData?.isCompromised
    )
})

LightweightMarker.displayName = 'LightweightMarker'

