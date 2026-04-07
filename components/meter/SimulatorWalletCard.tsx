"use client"

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Wallet, RefreshCw, Coins } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface SimulatedMeterState {
    meter_id: string
    wallet_address?: string
    balance_gtx: number
    balance_nrg: number
    is_connected: boolean
}

interface SimulatorStatusResponse {
    status: string
    meters: any[]
}

export function SimulatorWalletCard() {
    const [meters, setMeters] = useState<SimulatedMeterState[]>([])
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)

    // Direct fetch from simulator since the data isn't exposed via API Gateway yet
    const fetchSimulatorData = async (silent = false) => {
        try {
            if (!silent) setRefreshing(true)
            // Use environment variable for simulator URL, fallback to localhost for development
            const simulatorUrl = process.env.NEXT_PUBLIC_SIMULATOR_URL || 'http://localhost:4000'
            const response = await fetch(`${simulatorUrl}/api/status`)
            if (response.ok) {
                const data: SimulatorStatusResponse = await response.json()
                const walletMeters = data.meters.map((m: any) => ({
                    meter_id: m.meter_id,
                    wallet_address: m.wallet_address,
                    balance_gtx: m.balance_gtx || 0,
                    balance_nrg: m.balance_nrg || 0,
                    is_connected: m.is_connected
                }))
                setMeters(walletMeters)
            }
        } catch (err) {
            console.error("Simulator fetch failed", err)
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }

    useEffect(() => {
        fetchSimulatorData()
        const interval = setInterval(() => fetchSimulatorData(true), 5000)
        return () => clearInterval(interval)
    }, [])

    if (loading) return null // Hide if loading initial data

    return (
        <Card className="border-indigo-500/20 bg-indigo-500/5 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-indigo-400">
                    Simulated Wallets (GridTokenX Devnet)
                </CardTitle>
                <Button variant="ghost" size="icon" className="h-4 w-4 text-indigo-400" onClick={() => fetchSimulatorData()}>
                    <RefreshCw className={`h-3 w-3 ${refreshing ? 'animate-spin' : ''}`} />
                </Button>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {meters.slice(0, 3).map((meter) => (
                        <div key={meter.meter_id} className="flex flex-col space-y-1 rounded-lg border border-indigo-500/20 bg-background/50 p-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Wallet className="h-4 w-4 text-indigo-400" />
                                    <span className="font-mono text-xs font-medium text-foreground">{meter.meter_id}</span>
                                </div>
                                <Badge variant="outline" className="border-indigo-500/30 text-[10px] font-mono text-indigo-400">
                                    {meter.wallet_address ? meter.wallet_address.substring(0, 6) + '...' + meter.wallet_address.substring(meter.wallet_address.length - 4) : 'No Wallet'}
                                </Badge>
                            </div>

                            <div className="grid grid-cols-2 gap-2 pt-2">
                                <div className="flex items-center justify-between rounded bg-secondary/30 px-2 py-1">
                                    <span className="text-[10px] text-muted-foreground">GTX</span>
                                    <span className="font-mono text-xs font-bold text-indigo-400">{meter.balance_gtx.toFixed(2)}</span>
                                </div>
                                <div className="flex items-center justify-between rounded bg-secondary/30 px-2 py-1">
                                    <span className="text-[10px] text-muted-foreground">NRG</span>
                                    <span className="font-mono text-xs font-bold text-amber-400">{meter.balance_nrg.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                    {meters.length === 0 && (
                        <div className="text-center text-xs text-muted-foreground">No simulation meters running</div>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
