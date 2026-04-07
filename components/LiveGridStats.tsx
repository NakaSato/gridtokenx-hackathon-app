'use client'

import { useOracle, MeterReadingEvent } from '@/hooks/useOracle'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Activity, Zap, Server, Database, Wifi, ShieldCheck, ArrowRight } from 'lucide-react'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import { useTrading } from '@/contexts/TradingProvider'
import { toast } from 'react-hot-toast'

export default function LiveGridStats() {
    const { isConnected, oracleState, recentReadings, error } = useOracle()
    const { setActiveOrderFill } = useTrading()

    const handleSell = (reading: MeterReadingEvent) => {
        if (reading.energyProduced <= 0) {
            toast.error("Cannot sell 0 energy")
            return
        }
        setActiveOrderFill({
            amount: reading.energyProduced,
            price: 4.50 // Default/Suggested price
        })
        toast.success(`Pre-filled sell order for ${reading.energyProduced} kWh`)
        // Ideally we would also scroll to or focus the OrderForm here
    }

    return (
        <div className="flex flex-col h-full space-y-4 p-1">
            {/* Status Header */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="bg-muted/20 border-border">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                            <Wifi className={`h-4 w-4 ${isConnected ? 'text-green-500' : 'text-red-500'}`} />
                            <span className="text-xs font-medium text-muted-foreground">Oracle Status</span>
                        </div>
                        <Badge variant={isConnected ? "default" : "destructive"} className="text-[10px]">
                            {isConnected ? 'OPERATIONAL' : 'DISCONNECTED'}
                        </Badge>
                    </CardContent>
                </Card>
                <Card className="bg-muted/20 border-border">
                    <CardContent className="p-4 flex flex-col justify-center">
                        <span className="text-[10px] text-muted-foreground uppercase font-bold">Total Readings</span>
                        <span className="text-lg font-mono font-bold text-foreground">
                            {oracleState?.totalValidReadings.toLocaleString() ?? '-'}
                        </span>
                    </CardContent>
                </Card>
                <Card className="bg-muted/20 border-border">
                    <CardContent className="p-4 flex flex-col justify-center">
                        <span className="text-[10px] text-muted-foreground uppercase font-bold">Avg Interval</span>
                        <span className="text-lg font-mono font-bold text-foreground">
                            {oracleState ? (oracleState.averageReadingInterval / 1000).toFixed(1) + 's' : '-'}
                        </span>
                    </CardContent>
                </Card>
                <Card className="bg-muted/20 border-border">
                    <CardContent className="p-4 flex flex-col justify-center">
                        <span className="text-[10px] text-muted-foreground uppercase font-bold">Data Quality</span>
                        <span className="text-lg font-mono font-bold text-green-500">
                            {oracleState?.lastQualityScore ?? '-'}%
                        </span>
                    </CardContent>
                </Card>
            </div>

            {/* Live Feed */}
            <div className="flex-1 min-h-0 border border-border rounded-lg bg-card flex flex-col overflow-hidden">
                <div className="p-3 border-b border-border bg-muted/10 flex items-center justify-between">
                    <h3 className="text-sm font-bold flex items-center">
                        <Activity className="mr-2 h-4 w-4 text-primary" /> Live Meter Feed
                    </h3>
                    <div className="flex items-center space-x-2 text-[10px] text-muted-foreground">
                        <span className="flex items-center"><Server size={10} className="mr-1" /> {oracleState?.apiGateway.slice(0, 8)}...</span>
                    </div>
                </div>

                <ScrollArea className="flex-1">
                    <div className="divide-y divide-border">
                        {/* Header Row */}
                        <div className="grid grid-cols-6 gap-2 p-3 text-[10px] uppercase font-bold text-muted-foreground bg-muted/5">
                            <div className="col-span-1">Meter ID</div>
                            <div className="col-span-1 text-right">Produced</div>
                            <div className="col-span-1 text-right">Consumed</div>
                            <div className="col-span-1 text-right">Time</div>
                            <div className="col-span-1 text-center">Verification</div>
                            <div className="col-span-1 text-center">Action</div>
                        </div>

                        {recentReadings.length === 0 && (
                            <div className="p-8 text-center text-xs text-muted-foreground">
                                Waiting for relay data...
                            </div>
                        )}

                        {recentReadings.map((reading, i) => (
                            <div key={i} className="grid grid-cols-6 gap-2 p-3 text-xs hover:bg-muted/10 transition-colors items-center group">
                                <div className="col-span-1 font-mono text-primary truncate" title={reading.meterId}>
                                    {reading.meterId.split('-')[0]}...
                                </div>
                                <div className="col-span-1 text-right font-mono font-bold text-green-500">
                                    {reading.energyProduced.toFixed(2)} kWh
                                </div>
                                <div className="col-span-1 text-right font-mono text-red-500">
                                    {reading.energyConsumed.toFixed(2)} kWh
                                </div>
                                <div className="col-span-1 text-right text-muted-foreground font-mono">
                                    {format(reading.timestamp, 'HH:mm:ss')}
                                </div>
                                <div className="col-span-1 flex justify-center">
                                    <Badge variant="outline" className="text-[9px] h-5 border-primary/20 text-primary bg-primary/5">
                                        <ShieldCheck size={10} className="mr-1" /> VALIDIFIED
                                    </Badge>
                                </div>
                                <div className="col-span-1 flex justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button
                                        size="sm"
                                        variant="secondary"
                                        className="h-6 text-[10px] px-2"
                                        onClick={() => handleSell(reading)}
                                    >
                                        Sell <ArrowRight size={10} className="ml-1" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </div>
        </div>
    )
}
