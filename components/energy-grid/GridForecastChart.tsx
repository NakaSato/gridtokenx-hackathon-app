'use client'

import { useMemo } from 'react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { LoadForecast } from '@/types/grid'

interface GridForecastChartProps {
    forecast?: LoadForecast
}

export function GridForecastChart({ forecast }: GridForecastChartProps) {
    const data = useMemo(() => {
        if (!forecast) return []

        return forecast.consumption.map((cons, i) => ({
            time: `${i}:00`,
            consumption: cons,
            generation: forecast.generation[i]
        }))
    }, [forecast])

    return (
        <div className="h-28 w-full rounded-lg bg-black/20 p-1 border border-white/5 relative overflow-hidden">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data}>
                    <defs>
                        <linearGradient id="colorCons" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorGen" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis dataKey="time" hide />
                    <YAxis hide />
                    <Tooltip
                        contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: 'none', borderRadius: '4px', fontSize: '9px', padding: '4px' }}
                        itemStyle={{ padding: '0px' }}
                        labelStyle={{ display: 'none' }}
                        formatter={(value: number, name: string) => [
                            `${value.toFixed(2)} MW`,
                            name === 'consumption' ? 'Demand' : 'Solar'
                        ]}
                    />
                    <Area
                        type="monotone"
                        dataKey="consumption"
                        stroke="#ef4444"
                        fillOpacity={1}
                        fill="url(#colorCons)"
                        strokeWidth={1.5}
                        isAnimationActive={false}
                    />
                    <Area
                        type="monotone"
                        dataKey="generation"
                        stroke="#10b981"
                        fillOpacity={1}
                        fill="url(#colorGen)"
                        strokeWidth={1.5}
                        isAnimationActive={false}
                    />
                </AreaChart>
            </ResponsiveContainer>

            <div className="absolute top-1 right-2 flex flex-col items-end pointer-events-none">
                <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span className="text-[8px] font-mono text-emerald-400/70 uppercase">Gen Forecast</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                    <span className="text-[8px] font-mono text-red-400/70 uppercase">Load Forecast</span>
                </div>
            </div>


        </div>
    )
}
