import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Zap, Activity, BatteryCharging, CheckCircle2, Coins } from 'lucide-react'
import { format } from 'date-fns'

interface MeterStatsProps {
    totalGenerated: number
    totalMinted: number
    mintedCount: number
    pendingToMint: number
    pendingCount: number
    netEnergy: number
    meterCount: number
    lastUpdate: Date | null
    lastRefreshed: Date | null
}

export function MeterStats({
    totalGenerated,
    totalMinted,
    mintedCount,
    pendingToMint,
    pendingCount,
    netEnergy,
    meterCount,
    lastUpdate,
    lastRefreshed
}: MeterStatsProps) {
    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            {/* Total Generation */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Generation</CardTitle>
                    <Zap className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{totalGenerated.toFixed(2)} kWh</div>
                    <p className="text-xs text-muted-foreground">
                        Lifetime production
                    </p>
                </CardContent>
            </Card>

            {/* Minted Tokens */}
            <Card className="bg-gradient-to-br from-green-900/20 to-emerald-900/20 border-green-800/50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Minted Tokens</CardTitle>
                    <Coins className="h-4 w-4 text-green-400" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-green-400">{totalMinted.toFixed(2)} GRX</div>
                    <p className="text-xs text-muted-foreground">
                        {mintedCount} readings minted
                    </p>
                </CardContent>
            </Card>

            {/* Pending Mints */}
            <Card className={pendingCount > 0 ? "bg-gradient-to-br from-yellow-900/20 to-amber-900/20 border-yellow-800/50" : ""}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Pending Mints</CardTitle>
                    <Activity className="h-4 w-4 text-yellow-500" />
                </CardHeader>
                <CardContent>
                    <div className={`text-2xl font-bold ${pendingCount > 0 ? 'text-yellow-400' : ''}`}>
                        {pendingToMint.toFixed(2)} kWh
                    </div>
                    <p className="text-xs text-muted-foreground">
                        {pendingCount} readings ready to mint
                    </p>
                </CardContent>
            </Card>

            {/* Net Energy */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Net Energy</CardTitle>
                    <BatteryCharging className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                    <div className={`text-2xl font-bold ${netEnergy >= 0 ? 'text-green-500' : 'text-orange-500'}`}>
                        {netEnergy > 0 ? '+' : ''}{netEnergy.toFixed(2)} kWh
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Generation - Consumption
                    </p>
                </CardContent>
            </Card>

            {/* Active Meters */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active Meters</CardTitle>
                    <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{meterCount}</div>
                    <div className="flex flex-col gap-0.5 mt-1">
                        <p className="text-[10px] text-muted-foreground">
                            {lastUpdate ? `Last reading: ${format(lastUpdate, 'HH:mm')}` : 'No readings yet'}
                        </p>
                        <p className="text-[10px] text-green-600/80 flex items-center gap-1">
                            {lastRefreshed ? (
                                <>
                                    <span className="relative flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                    </span>
                                    Synced: {format(lastRefreshed, 'HH:mm:ss')}
                                </>
                            ) : 'Syncing...'}
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

export const MemoizedMeterStats = React.memo(MeterStats)
