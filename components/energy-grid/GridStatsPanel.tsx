'use client'

import { useState, memo } from 'react'
import { Zap, Battery, BatteryCharging, Leaf, Activity, ChevronUp, ChevronDown, ShieldAlert, Globe, WifiOff } from 'lucide-react'
import { ENERGY_GRID_CONFIG } from '@/lib/constants'
import { EVManagementPanel } from './EVManagementPanel'
import { FrequencyStatus, IslandStatus, ZoneGridStatus, TariffStatus, ADREvent, LoadForecast, EVFleetStatus } from '@/types/grid'

interface GridStatsPanelProps {
    totalGeneration: number
    totalConsumption: number
    avgStorage: number
    co2Saved?: number
    activeMeters?: number
    zones?: Record<string, ZoneGridStatus>
    frequency?: FrequencyStatus
    islandStatus?: IslandStatus
    healthScore?: number
    isUnderAttack?: boolean
    tariff?: TariffStatus
    adrEvent?: ADREvent
    loadForecast?: LoadForecast
    evFleet?: EVFleetStatus
}

export const GridStatsPanel = memo(function GridStatsPanel({
    totalGeneration,
    totalConsumption,
    avgStorage,
    co2Saved = 0,
    activeMeters = 0,
    zones = {},
    frequency,
    islandStatus,
    healthScore,
    isUnderAttack = false,
    tariff,
    adrEvent,
    loadForecast,
    evFleet,
}: GridStatsPanelProps) {
    const [isCollapsed, setIsCollapsed] = useState(false)

    const netBalance = totalGeneration - totalConsumption
    const totalLoad = totalGeneration + totalConsumption
    const balancePercentage = totalLoad > 0 ? (totalGeneration / totalLoad) * 100 : 50

    return (
        <div
            className={`absolute overflow-hidden rounded-xl border border-white/10 bg-black/60 shadow-2xl backdrop-blur-xl transition-all duration-500 ease-in-out hover:border-white/20
                bottom-2 right-2 sm:bottom-8 sm:right-4
                ${isCollapsed
                    ? 'w-32 sm:w-48 p-2 sm:p-3'
                    : 'w-48 sm:w-64 p-3 sm:p-4'
                }`}
        >
            {/* Header - Clickable to toggle */}
            <button
                type="button"
                className={`flex w-full items-center justify-between group appearance-none focus:outline-none ${!isCollapsed ? 'mb-4 border-b border-white/5 pb-2' : ''}`}
                onClick={() => setIsCollapsed(!isCollapsed)}
                aria-expanded={!isCollapsed}
                aria-controls="grid-stats-content"
                aria-label={isCollapsed ? "Expand grid statistics" : "Collapse grid statistics"}
            >
                <div className="flex items-center gap-1.5 sm:gap-2">
                    <Activity className={`transition-colors duration-300 ${isCollapsed ? 'h-3 w-3 sm:h-3.5 sm:w-3.5 text-blue-400/70' : 'h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-400'}`} />
                    <h4 className={`font-bold uppercase tracking-wider text-white/90 transition-all ${isCollapsed ? 'text-[9px] sm:text-[10px]' : 'text-xs sm:text-sm'}`}>
                        Grid Status
                    </h4>
                </div>
                <div className="flex items-center gap-2">
                    <div className="text-white/30 group-hover:text-white/60 transition-colors">
                        {isCollapsed ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </div>
                </div>
            </button>

            {/* Metrics Content */}
            <div className={`space-y-2 sm:space-y-3 transition-all duration-500 ${isCollapsed ? 'max-h-0 opacity-0 pointer-events-none' : 'max-h-[1000px] opacity-100'}`}>
                {/* Frequency & Islanding Section (New) */}
                <div className="space-y-2 mb-3">
                    <div className="flex flex-wrap items-center gap-1.5 px-1">
                        {tariff && (
                            <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full border ${tariff.is_peak
                                ? 'bg-orange-500/20 border-orange-500/40 text-orange-400'
                                : 'bg-blue-500/10 border-blue-500/30 text-blue-400'}`}>
                                <Zap size={8} className={tariff.is_peak ? 'animate-pulse' : ''} />
                                <span className="text-[8px] font-bold uppercase tracking-wider">
                                    {tariff.tariff_type}: {tariff.import_rate.toFixed(2)}
                                </span>
                            </div>
                        )}

                        {adrEvent?.active && (
                            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full border bg-red-500/20 border-red-500/50 text-red-400 animate-pulse">
                                <ShieldAlert size={8} />
                                <span className="text-[8px] font-bold uppercase tracking-wider">DR Alert</span>
                            </div>
                        )}

                        {isUnderAttack && (
                            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full border bg-red-500/10 border-red-500/30 text-red-400 animate-pulse">
                                <ShieldAlert size={8} />
                                <span className="text-[8px] font-bold uppercase tracking-wider">Attack</span>
                            </div>
                        )}

                        {!isUnderAttack && healthScore !== undefined && (
                            <div className="flex items-center gap-1 ml-auto">
                                <span className="text-[7px] text-white/30 uppercase font-black tracking-tighter">Health</span>
                                <span className={`text-[9px] font-mono font-bold ${healthScore > 80 ? 'text-emerald-400' : healthScore > 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                                    {Math.round(healthScore)}%
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                <EVManagementPanel fleet={evFleet} />


                {/* Generation */}
                <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                        <div className="flex items-center gap-2 text-white/60">
                            <Zap className="h-3.5 w-3.5 text-yellow-400" />
                            <span>Generation</span>
                        </div>
                        <span className="font-mono font-bold text-yellow-400">
                            {totalGeneration.toLocaleString(undefined, { maximumFractionDigits: 0 })} <span className="text-[10px]">kW</span>
                        </span>
                    </div>
                    <div className="h-1 w-full rounded-full bg-white/5 overflow-hidden">
                        <div
                            className="h-full bg-yellow-400/80 transition-all duration-1000 ease-out"
                            style={{ width: `${Math.min(100, (totalGeneration / ENERGY_GRID_CONFIG.progressBar.maxCapacity) * 100)}%` }}
                        />
                    </div>
                </div>

                {/* Consumption */}
                <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                        <div className="flex items-center gap-2 text-white/60">
                            <Battery className="h-3.5 w-3.5 text-blue-400" />
                            <span>Consumption</span>
                        </div>
                        <span className="font-mono font-bold text-blue-400">
                            {totalConsumption.toLocaleString(undefined, { maximumFractionDigits: 0 })} <span className="text-[10px]">kW</span>
                        </span>
                    </div>
                    <div className="h-1 w-full rounded-full bg-white/5 overflow-hidden">
                        <div
                            className="h-full bg-blue-400/80 transition-all duration-1000 ease-out"
                            style={{ width: `${Math.min(100, (totalConsumption / ENERGY_GRID_CONFIG.progressBar.maxCapacity) * 100)}%` }}
                        />
                    </div>
                </div>

                {/* Balance Progress Bar */}
                <div className="pt-1">
                    <div className="flex justify-between text-[10px] text-white/40 mb-1 uppercase tracking-widest font-bold">
                        <span>Load Balance</span>
                        <span className={netBalance >= 0 ? 'text-green-400' : 'text-red-400'}>
                            {netBalance >= 0 ? '+' : ''}{Math.round(netBalance)} kW
                        </span>
                    </div>
                    <div className="relative h-1.5 w-full rounded-full bg-white/5 overflow-hidden">
                        <div
                            className={`absolute inset-y-0 h-full transition-all duration-700 ease-in-out ${netBalance >= 0 ? 'bg-green-500/60' : 'bg-red-500/60'
                                }`}
                            style={{
                                left: netBalance >= 0 ? '50%' : `${balancePercentage}%`,
                                width: `${Math.abs(50 - balancePercentage)}%`
                            }}
                        />
                        <div className="absolute left-1/2 top-0 h-full w-0.5 bg-white/20 transform -translate-x-1/2" />
                    </div>
                </div>

                {/* Zone Breakdown */}
                {
                    zones && Object.keys(zones).length > 0 && (
                        <div className="mt-4 pt-3 border-t border-white/10">
                            <div className="text-[10px] text-white/40 mb-2 uppercase tracking-widest font-bold">Zone Breakdown</div>
                            <div className="space-y-2">
                                {Object.entries(zones).map(([id, zone]) => (
                                    <div key={id} className="bg-white/5 rounded p-2 border border-white/5">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-[10px] font-bold text-white/80">Zone {id}</span>
                                            <span className="text-[9px] text-white/40">{zone.active_meters} meters</span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 text-[10px]">
                                            <div className="flex items-center gap-1">
                                                <div className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
                                                <span className="text-white/60">Gen:</span>
                                                <span className="font-mono text-yellow-400">{Math.round(zone.generation)}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                                                <span className="text-white/60">Cons:</span>
                                                <span className="font-mono text-blue-400">{Math.round(zone.consumption)}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )
                }

                {/* Secondary Metrics */}
                <div className="mt-3 sm:mt-4 grid grid-cols-2 gap-1.5 sm:gap-2 pt-2 border-t border-white/5">
                    <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-1 sm:gap-1.5 text-white/40">
                            <BatteryCharging className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-emerald-400" />
                            <span className="text-[8px] sm:text-[9px] uppercase font-bold tracking-tighter">Storage</span>
                        </div>
                        <span className="text-[10px] sm:text-xs font-bold text-white/90">{avgStorage.toFixed(1)}%</span>
                    </div>
                    <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-1 sm:gap-1.5 text-white/40">
                            <Leaf className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-green-400" />
                            <span className="text-[8px] sm:text-[9px] uppercase font-bold tracking-tighter">CO₂ Saved</span>
                        </div>
                        <span className="text-[10px] sm:text-xs font-bold text-white/90">~{co2Saved.toFixed(2)} <span className="text-[7px] sm:text-[8px] text-white/40 font-normal">kg</span></span>
                    </div>
                </div>


                {/* Footer Info */}
                <div className="flex items-center justify-between pt-1 text-[8px] sm:text-[9px] text-white/30 italic">
                    <span>{activeMeters} Active Meters</span>
                    <span className="hidden sm:inline">v2.2.0-dev</span>
                </div>
            </div >

            {/* Collapsed Mini-Stats (visible only when collapsed) */}
            {
                isCollapsed && (
                    <div
                        className="mt-2 flex items-center justify-between border-t border-white/5 pt-2 animate-in fade-in slide-in-from-top-1 duration-300"
                        onClick={(e) => { e.stopPropagation(); setIsCollapsed(false); }}
                    >
                        <div className="flex flex-col">
                            <span className="text-[8px] uppercase tracking-tighter text-white/30 font-bold">Net</span>
                            <span className={`text-[10px] font-mono font-bold ${netBalance >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                {netBalance >= 0 ? '+' : ''}{Math.round(netBalance)} <span className="text-[8px] opacity-50">kW</span>
                            </span>
                        </div>
                        <div className="flex flex-col items-end">
                            <span className="text-[8px] uppercase tracking-tighter text-white/30 font-bold">Active</span>
                            <span className="text-[10px] font-mono font-bold text-white/80">{activeMeters}</span>
                        </div>
                    </div>
                )
            }
        </div >
    )
})
