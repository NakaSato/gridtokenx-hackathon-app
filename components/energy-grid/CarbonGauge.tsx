'use client'

import { memo } from 'react'
import { Leaf } from 'lucide-react'

interface CarbonGaugeProps {
    intensity: number // gCO2/kWh
}

export const CarbonGauge = memo(function CarbonGauge({ intensity }: CarbonGaugeProps) {
    // Determine color and label based on intensity
    // Standard intensity levels (approximate):
    // < 100: Very Clean (Green)
    // 100-300: Clean (Lime)
    // 300-500: Moderate (Yellow)
    // 500-750: High (Orange)
    // > 750: Very High (Red)

    const getStatus = (val: number) => {
        if (val < 150) return { label: 'LOW CARBON', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', bar: 'bg-emerald-500' }
        if (val < 350) return { label: 'OPTIMAL', color: 'text-lime-400', bg: 'bg-lime-500/10', border: 'border-lime-500/20', bar: 'bg-lime-500' }
        if (val < 550) return { label: 'MODERATE', color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', bar: 'bg-yellow-500' }
        if (val < 750) return { label: 'HIGH', color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20', bar: 'bg-orange-500' }
        return { label: 'CRITICAL', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', bar: 'bg-red-500' }
    }

    const status = getStatus(intensity)
    const percentage = Math.min(100, (intensity / 1000) * 100)

    return (
        <div className={`p-2.5 rounded-lg border ${status.bg} ${status.border} transition-all duration-500 overflow-hidden relative group`}>
            {/* Background Glow */}
            <div className={`absolute -right-4 -top-4 w-12 h-12 rounded-full blur-2xl opacity-20 ${status.bar}`} />

            <div className="flex items-center justify-between mb-1.5 relative">
                <div className="flex items-center gap-1.5">
                    <div className={`p-1 rounded-md ${status.bg} border ${status.border} group-hover:scale-110 transition-transform`}>
                        <Leaf className={`h-3 w-3 ${status.color}`} />
                    </div>
                    <span className="text-[9px] font-black uppercase tracking-widest text-white/40">Carbon Intensity</span>
                </div>
                <div className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter ${status.color} bg-black/40 border ${status.border}`}>
                    {status.label}
                </div>
            </div>

            <div className="flex items-baseline gap-1 relative">
                <span className={`text-lg font-mono font-black tracking-tighter ${status.color}`}>
                    {Math.round(intensity)}
                </span>
                <span className="text-[10px] font-bold text-white/30 uppercase tracking-tighter">gCO₂/kWh</span>
            </div>

            {/* Premium Progress Bar */}
            <div className="mt-2 h-1 w-full bg-white/5 rounded-full overflow-hidden relative">
                <div
                    className={`h-full ${status.bar} transition-all duration-1000 ease-out relative`}
                    style={{ width: `${percentage}%` }}
                >
                    {/* Inner highlight */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
                </div>
            </div>

            {/* Dynamic Comparison */}
            <div className="mt-1.5 flex justify-between items-center text-[8px] font-bold text-white/20 uppercase tracking-tight">
                <span>0</span>
                <span>500</span>
                <span>1000+</span>
            </div>
        </div>
    )
})
