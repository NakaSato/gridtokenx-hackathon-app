'use client'

import { Car, Battery, Zap, ShieldCheck } from 'lucide-react'
import { EVFleetStatus } from '@/types/grid'

interface EVManagementPanelProps {
    fleet?: EVFleetStatus
}

export function EVManagementPanel({ fleet }: EVManagementPanelProps) {
    if (!fleet || fleet.total_evs === 0) {
        return (
            <div className="bg-white/5 rounded-lg p-3 border border-white/5 mb-3 hidden">
                <span className="text-[10px] text-white/20 italic">No EVs connected</span>
            </div>
        )
    }

    const socColor = fleet.avg_soc > 70 ? 'text-emerald-400' : fleet.avg_soc > 30 ? 'text-yellow-400' : 'text-red-400'
    const socBg = fleet.avg_soc > 70 ? 'bg-emerald-400/80' : fleet.avg_soc > 30 ? 'bg-yellow-400/80' : 'bg-red-400/80'

    return (
        <div className="bg-white/5 rounded-lg p-2 sm:p-3 border border-white/5 mb-3 space-y-2">
            <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5 text-white/80">
                    <Car className="h-3.5 w-3.5 text-blue-400" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">EV Fleet</span>
                </div>
                <div className="flex items-center gap-1">
                    <span className="text-[10px] font-mono text-white/90">{fleet.total_evs}</span>
                    <span className="text-[8px] text-white/30 uppercase">Units</span>
                </div>
            </div>

            {/* SoC Progress */}
            <div className="space-y-1">
                <div className="flex justify-between items-end">
                    <span className="text-[8px] text-white/40 uppercase font-bold tracking-tighter">Avg State of Charge</span>
                    <span className={`text-[10px] font-mono font-bold ${socColor}`}>{Math.round(fleet.avg_soc)}%</span>
                </div>
                <div className="h-1 w-full rounded-full bg-white/5 overflow-hidden">
                    <div
                        className={`h-full ${socBg} transition-all duration-1000 ease-out`}
                        style={{ width: `${fleet.avg_soc}%` }}
                    />
                </div>
            </div>

            {/* V2G Status */}
            <div className="grid grid-cols-2 gap-2 pt-1">
                <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-1 text-white/30">
                        <Zap className={`h-2.5 w-2.5 ${fleet.v2g_active > 0 ? 'text-orange-400 animate-pulse' : 'text-white/20'}`} />
                        <span className="text-[7px] uppercase font-bold tracking-tighter">V2G Active</span>
                    </div>
                    <span className="text-[10px] font-bold text-white/90">{fleet.v2g_active} <span className="text-[7px] text-white/40">Units</span></span>
                </div>
                <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-1 text-white/30">
                        <Battery className="h-2.5 w-2.5 text-emerald-400" />
                        <span className="text-[7px] uppercase font-bold tracking-tighter">Available</span>
                    </div>
                    <span className="text-[10px] font-bold text-white/90">{Math.round(fleet.available_capacity_kwh)} <span className="text-[7px] text-white/40">kWh</span></span>
                </div>
            </div>

            {fleet.v2g_active > 0 && (
                <div className="bg-orange-500/10 border border-orange-500/20 rounded p-1 flex items-center gap-1.5 overflow-hidden whitespace-nowrap">
                    <ShieldCheck className="h-2.5 w-2.5 text-orange-400 shrink-0" />
                    <div className="flex-1 overflow-hidden relative">
                        <div className="text-[8px] text-orange-400/90 font-medium tracking-tighter uppercase animate-marquee">
                            Active Vehicle-to-Grid Balancing initiated. Discharging {fleet.v2g_active} fleet members into Local Grid.
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
