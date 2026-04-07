'use client'

import { useState, useEffect, useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { FrequencyStatus } from '@/types/grid'

interface GridFrequencyChartProps {
    currentFrequency?: FrequencyStatus
    maxPoints?: number
}

interface DataPoint {
    time: string
    frequency: number
    rocof: number
}

export function GridFrequencyChart({ currentFrequency, maxPoints = 30 }: GridFrequencyChartProps) {
    const [data, setData] = useState<DataPoint[]>([])

    useEffect(() => {
        if (!currentFrequency) return

        const now = new Date()
        const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })

        setData(prev => {
            const newData = [...prev, {
                time: timeStr,
                frequency: currentFrequency.value,
                rocof: currentFrequency.rocof
            }]
            if (newData.length > maxPoints) {
                return newData.slice(newData.length - maxPoints)
            }
            return newData
        })
    }, [currentFrequency, maxPoints])

    // Calculate dynamic Y-axis domain for better visibility of small deviations
    const domain = useMemo(() => {
        if (data.length === 0) return [49.5, 50.5]
        const vals = data.map(d => d.frequency)
        const min = Math.min(...vals)
        const max = Math.max(...vals)
        const margin = Math.max(0.1, (max - min) * 0.2)
        return [Math.min(49.8, min - margin), Math.max(50.2, max + margin)]
    }, [data])

    return (
        <div className="h-20 w-full rounded-lg bg-black/20 p-1 border border-white/5">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis dataKey="time" hide />
                    <YAxis
                        domain={domain}
                        hide
                        tick={{ fontSize: 8 }}
                    />
                    <Tooltip
                        contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: 'none', borderRadius: '4px', fontSize: '9px', padding: '4px' }}
                        itemStyle={{ padding: '0px', color: '#10b981' }}
                        labelStyle={{ display: 'none' }}
                        formatter={(value: number) => [`${value.toFixed(3)} Hz`, 'Freq']}
                    />
                    <ReferenceLine y={50} stroke="#10b981" strokeDasharray="3 3" strokeOpacity={0.3} />
                    <Line
                        type="monotone"
                        dataKey="frequency"
                        stroke="#10b981"
                        strokeWidth={1.5}
                        dot={false}
                        isAnimationActive={false}
                    />
                </LineChart>
            </ResponsiveContainer>
            <div className="absolute top-1 right-2 flex flex-col items-end pointer-events-none">
                <span className="text-[10px] font-mono font-bold text-emerald-400">
                    {currentFrequency?.value.toFixed(3) ?? '50.000'} <span className="text-[8px] opacity-70">Hz</span>
                </span>
                <span className={`text-[8px] font-mono ${Math.abs(currentFrequency?.rocof ?? 0) > 0.1 ? 'text-orange-400' : 'text-white/30'}`}>
                    RoCoF: {currentFrequency?.rocof.toFixed(3) ?? '0.000'}
                </span>
            </div>
            <div className="absolute top-1 left-2 flex flex-col pointer-events-none">
                <span className="text-[8px] uppercase font-bold tracking-widest text-white/20">Frequency</span>
            </div>
        </div>
    )
}
