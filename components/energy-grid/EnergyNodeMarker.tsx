'use client'

import React from 'react'

import { Zap, Battery, BatteryCharging, X, Gauge, TrendingUp, Building2 } from 'lucide-react'
import { Marker } from 'react-map-gl/mapbox'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion'
import type { EnergyNode, LiveNodeData } from './types'
import { getStatusColor, parseNumericValue } from './utils'

interface EnergyNodeMarkerProps {
    node: EnergyNode
    liveData?: LiveNodeData
    isSelected: boolean
    onSelect: (node: EnergyNode) => void
    onDeselect: () => void
    onDoubleClick: (node: EnergyNode) => void
}

function getMarkerIcon(type: string) {
    switch (type) {
        case 'generator':
            return <Zap className="h-4 w-4 text-yellow-500" />
        case 'storage':
            return <BatteryCharging className="h-4 w-4 text-green-500" />
        case 'consumer':
            return <Battery className="h-4 w-4 text-blue-500" />
        default:
            return <Zap className="h-4 w-4" />
    }
}

export function EnergyNodeMarker({
    node,
    liveData,
    isSelected,
    onSelect,
    onDeselect,
    onDoubleClick,
}: EnergyNodeMarkerProps) {
    const status = liveData?.status ?? node.status
    const liveValue = liveData?.currentValue ?? 0

    // Check if telemetry sections have data
    const hasTelemetry = node.voltage || node.currentAmps || node.frequency || node.powerFactor
    const hasEnergyTrading = (node.surplusEnergy !== undefined && node.surplusEnergy > 0) ||
        (node.deficitEnergy !== undefined && node.deficitEnergy > 0)
    const hasBuildingInfo = node.floors || node.area || node.occupancy

    return (
        <Marker longitude={node.longitude} latitude={node.latitude}>
            <Popover open={isSelected} onOpenChange={(open) => !open && onDeselect()}>
                <PopoverTrigger asChild>
                    <div
                        className="group relative cursor-pointer transition-all duration-300 hover:scale-125"
                        onClick={(e) => {
                            e.stopPropagation()
                            onSelect(node)
                        }}
                        onDoubleClick={(e) => {
                            e.stopPropagation()
                            onDoubleClick(node)
                        }}
                        title={`${node.name} - Double click to zoom`}
                    >
                        {/* Status indicator */}
                        <div
                            className={`absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full ${getStatusColor(status)} z-10 border border-background`}
                        />
                        {/* Main marker */}
                        <div className="from-background/95 to-background/80 relative rounded-full border border-primary/60 bg-gradient-to-br p-2 shadow-xl backdrop-blur-md transition-all group-hover:border-primary group-hover:shadow-primary/50">
                            {getMarkerIcon(node.type)}
                        </div>
                        {/* Glow effect */}
                        <div className="absolute inset-0 rounded-full bg-primary/20 opacity-0 blur-md transition-opacity group-hover:opacity-100" />
                    </div>
                </PopoverTrigger>

                {isSelected && (
                    <PopoverContent
                        className="min-w-[280px] max-w-[320px] border border-primary/40 p-0"
                        side="top"
                        align="center"
                        sideOffset={10}
                    >
                        <div className="to-background/95 relative bg-gradient-to-br from-background p-4 text-foreground">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="absolute right-2 top-2 h-6 w-6 p-0"
                                onClick={onDeselect}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                            <h3 className="mb-2 flex items-center gap-2 pr-8 text-base font-bold text-primary">
                                {getMarkerIcon(node.type)}
                                <span className="flex-1">{node.name}</span>
                                {/* LIVE Badge */}
                                <span className="flex items-center gap-1 rounded-full bg-green-500/20 px-2 py-0.5 text-[10px] font-medium text-green-500">
                                    <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                                    LIVE
                                </span>
                            </h3>
                            {node.buildingCode && (
                                <p className="mb-3 font-mono text-xs text-secondary-foreground">
                                    {node.buildingCode}
                                </p>
                            )}

                            <div className="custom-scrollbar max-h-[400px] space-y-2 overflow-y-auto text-xs">
                                {/* Live Values Section - Always visible */}
                                <div className="space-y-1 rounded-lg border border-green-500/20 bg-gradient-to-r from-green-500/10 to-transparent p-2">
                                    <div className="flex items-center justify-between">
                                        <span className="font-medium text-secondary-foreground">
                                            {node.type === 'generator'
                                                ? 'Current Output:'
                                                : node.type === 'consumer'
                                                    ? 'Current Load:'
                                                    : 'Charge Level:'}
                                        </span>
                                        <span className="font-bold text-green-500 transition-all duration-500">
                                            {node.type === 'storage'
                                                ? `${liveValue.toFixed(1)}%`
                                                : `${liveValue.toFixed(1)} kW`}
                                        </span>
                                    </div>

                                    {/* Progress bar */}
                                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary/40">
                                        <div
                                            className="h-full rounded-full bg-gradient-to-r from-green-500 to-green-400 transition-all duration-500"
                                            style={{
                                                width: `${Math.min(
                                                    100,
                                                    node.type === 'storage'
                                                        ? liveValue
                                                        : (liveValue / parseNumericValue(node.capacity)) * 100
                                                )}%`,
                                            }}
                                        />
                                    </div>
                                </div>

                                {/* Status Section - Always visible */}
                                <div className="space-y-1 rounded-lg bg-secondary/20 p-2">
                                    <div className="flex items-center justify-between">
                                        <span className="font-medium text-secondary-foreground">Type:</span>
                                        <span className="font-semibold capitalize text-foreground">{node.type}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="font-medium text-secondary-foreground">Status:</span>
                                        <span className="flex items-center gap-2">
                                            <span className={`h-2.5 w-2.5 rounded-full ${getStatusColor(status)}`} />
                                            <span className="font-semibold capitalize text-foreground">{status}</span>
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="font-medium text-secondary-foreground">Capacity:</span>
                                        <span className="font-semibold text-foreground">{node.capacity}</span>
                                    </div>
                                    {/* Last Update */}
                                    <div className="flex items-center justify-between pt-1 text-[10px] text-secondary-foreground/70">
                                        <span>Last update:</span>
                                        <span>{liveData?.lastUpdate.toLocaleTimeString() ?? '--'}</span>
                                    </div>
                                </div>

                                {/* Accordion for detailed sections */}
                                {(hasTelemetry || hasEnergyTrading || hasBuildingInfo) && (
                                    <Accordion type="multiple" className="w-full">
                                        {/* Electrical Telemetry Accordion */}
                                        {hasTelemetry && (
                                            <AccordionItem value="telemetry" className="border-blue-500/20">
                                                <AccordionTrigger className="py-2 text-xs hover:no-underline">
                                                    <div className="flex items-center gap-2 text-blue-400">
                                                        <Gauge className="h-3.5 w-3.5" />
                                                        <span className="font-semibold">Electrical Telemetry</span>
                                                    </div>
                                                </AccordionTrigger>
                                                <AccordionContent className="pb-2 pt-0">
                                                    <div className="space-y-1.5 rounded-lg bg-blue-500/5 p-2">
                                                        {node.voltage !== undefined && (
                                                            <div className="flex items-center justify-between">
                                                                <span className="text-secondary-foreground">Voltage:</span>
                                                                <span className="font-semibold text-foreground">{node.voltage.toFixed(1)} V</span>
                                                            </div>
                                                        )}
                                                        {node.currentAmps !== undefined && (
                                                            <div className="flex items-center justify-between">
                                                                <span className="text-secondary-foreground">Current:</span>
                                                                <span className="font-semibold text-foreground">{node.currentAmps.toFixed(2)} A</span>
                                                            </div>
                                                        )}
                                                        {node.frequency !== undefined && (
                                                            <div className="flex items-center justify-between">
                                                                <span className="text-secondary-foreground">Frequency:</span>
                                                                <span className="font-semibold text-foreground">{node.frequency.toFixed(2)} Hz</span>
                                                            </div>
                                                        )}
                                                        {node.powerFactor !== undefined && (
                                                            <div className="flex items-center justify-between">
                                                                <span className="text-secondary-foreground">Power Factor:</span>
                                                                <span className="font-semibold text-foreground">{(node.powerFactor * 100).toFixed(0)}%</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </AccordionContent>
                                            </AccordionItem>
                                        )}

                                        {/* Energy Trading Accordion */}
                                        {hasEnergyTrading && (
                                            <AccordionItem value="trading" className="border-yellow-500/20">
                                                <AccordionTrigger className="py-2 text-xs hover:no-underline">
                                                    <div className="flex items-center gap-2 text-yellow-400">
                                                        <TrendingUp className="h-3.5 w-3.5" />
                                                        <span className="font-semibold">Energy Trading</span>
                                                    </div>
                                                </AccordionTrigger>
                                                <AccordionContent className="pb-2 pt-0">
                                                    <div className="space-y-1.5 rounded-lg bg-yellow-500/5 p-2">
                                                        {node.surplusEnergy !== undefined && node.surplusEnergy > 0 && (
                                                            <div className="flex items-center justify-between">
                                                                <span className="text-secondary-foreground">Surplus:</span>
                                                                <span className="font-semibold text-green-400">+{node.surplusEnergy.toFixed(2)} kWh</span>
                                                            </div>
                                                        )}
                                                        {node.deficitEnergy !== undefined && node.deficitEnergy > 0 && (
                                                            <div className="flex items-center justify-between">
                                                                <span className="text-secondary-foreground">Deficit:</span>
                                                                <span className="font-semibold text-red-400">-{node.deficitEnergy.toFixed(2)} kWh</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </AccordionContent>
                                            </AccordionItem>
                                        )}

                                        {/* Building Info Accordion */}
                                        {hasBuildingInfo && (
                                            <AccordionItem value="building" className="border-secondary/20">
                                                <AccordionTrigger className="py-2 text-xs hover:no-underline">
                                                    <div className="flex items-center gap-2 text-foreground">
                                                        <Building2 className="h-3.5 w-3.5" />
                                                        <span className="font-semibold">Building Info</span>
                                                    </div>
                                                </AccordionTrigger>
                                                <AccordionContent className="pb-2 pt-0">
                                                    <div className="space-y-1.5 rounded-lg bg-secondary/10 p-2">
                                                        {node.floors && (
                                                            <div className="flex items-center justify-between">
                                                                <span className="text-secondary-foreground">Floors:</span>
                                                                <span className="font-semibold text-foreground">{node.floors}</span>
                                                            </div>
                                                        )}
                                                        {node.area && (
                                                            <div className="flex items-center justify-between">
                                                                <span className="text-secondary-foreground">Area:</span>
                                                                <span className="font-semibold text-foreground">{node.area}</span>
                                                            </div>
                                                        )}
                                                        {node.occupancy && (
                                                            <div className="flex items-center justify-between">
                                                                <span className="text-secondary-foreground">Use:</span>
                                                                <span className="font-semibold text-foreground">{node.occupancy}</span>
                                                            </div>
                                                        )}
                                                        {node.studySeats && (
                                                            <div className="flex items-center justify-between">
                                                                <span className="text-secondary-foreground">Seats:</span>
                                                                <span className="font-semibold text-foreground">{node.studySeats}</span>
                                                            </div>
                                                        )}
                                                        {node.laboratories && (
                                                            <div className="flex items-center justify-between">
                                                                <span className="text-secondary-foreground">Labs:</span>
                                                                <span className="font-semibold text-foreground">{node.laboratories}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </AccordionContent>
                                            </AccordionItem>
                                        )}
                                    </Accordion>
                                )}
                            </div>
                        </div>
                    </PopoverContent>
                )}
            </Popover>
        </Marker>
    )
}

// Memoized version to prevent unnecessary re-renders
export const MemoizedEnergyNodeMarker = React.memo(EnergyNodeMarker, (prev, next) => {
    // Only re-render if these props changed
    return (
        prev.node.id === next.node.id &&
        prev.isSelected === next.isSelected &&
        prev.liveData?.currentValue === next.liveData?.currentValue &&
        prev.liveData?.status === next.liveData?.status
    )
})
