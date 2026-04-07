'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthProvider'
import { createApiClient } from '@/lib/api-client'
import type { RecurringOrder } from '@/types/features'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader2, Repeat, Play, Pause, Trash2, TrendingUp, TrendingDown, Activity, Clock, Calendar, ChevronRight, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

export default function RecurringOrdersList() {
    const { token } = useAuth()
    const [orders, setOrders] = useState<RecurringOrder[]>([])
    const [loading, setLoading] = useState(false)
    const [actionLoading, setActionLoading] = useState<string | null>(null)

    const fetchOrders = useCallback(async () => {
        if (!token) return
        setLoading(true)
        try {
            const apiClient = createApiClient(token)
            const response = await apiClient.listRecurringOrders()
            if (response.data) {
                setOrders(response.data)
            }
        } catch (error) {
            console.error('Failed to fetch recurring orders:', error)
        } finally {
            setLoading(false)
        }
    }, [token])

    useEffect(() => {
        fetchOrders()
    }, [fetchOrders])

    const handleAction = async (id: string, action: 'cancel' | 'pause' | 'resume') => {
        if (!token) return
        setActionLoading(`${action}-${id}`)
        try {
            const apiClient = createApiClient(token)
            let res;
            if (action === 'cancel') res = await apiClient.cancelRecurringOrder(id)
            else if (action === 'pause') res = await apiClient.pauseRecurringOrder(id)
            else res = await apiClient.resumeRecurringOrder(id)

            if (res.error) {
                toast.error(res.error)
            } else {
                const actionPastTense = action === 'cancel' ? 'canceled' : action === 'pause' ? 'paused' : 'resumed'
                toast.success(`Order ${actionPastTense} successfully`)
                // Refetch to get updated data from server
                fetchOrders()
            }
        } catch (error) {
            toast.error(`Failed to ${action} order`)
        } finally {
            setActionLoading(null)
        }
    }

    const formatInterval = (type: string, value: number) => {
        const labels: Record<string, string> = { hourly: 'hour', daily: 'day', weekly: 'week', monthly: 'month' }
        const label = labels[type] || type
        return value === 1 ? `Every ${label}` : `Every ${value} ${label}s`
    }

    if (loading && orders.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-10 space-y-3 opacity-50">
                <div className="relative">
                    <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
                    <Loader2 className="h-6 w-6 animate-spin text-primary relative z-10" />
                </div>
                <span className="text-xs font-medium text-muted-foreground">Loading strategies...</span>
            </div>
        )
    }

    return (
        <div className="flex flex-col space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-700">
            <div className="flex items-center justify-between px-1">
                <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <Activity className="h-3 w-3" /> DCA Strategies
                </h3>
                <Badge variant="secondary" className="text-[10px] h-4 px-1.5 font-normal bg-secondary rounded-sm">
                    {orders.filter(o => o.status === 'active').length} Active
                </Badge>
            </div>

            {orders.length > 0 ? (
                <div className="grid gap-2.5">
                    {orders.map((order) => {
                        const executionProgress = order.max_executions
                            ? (order.total_executions / order.max_executions) * 100
                            : null
                        const priceLimit = order.side === 'buy' ? order.max_price_per_kwh : order.min_price_per_kwh

                        return (
                            <div
                                key={order.id}
                                className="group relative flex flex-col gap-2 p-3 rounded-lg border border-border bg-card hover:border-primary/20 transition-all duration-300 shadow-sm"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={cn(
                                            "p-2 rounded-lg transition-colors",
                                            order.side === 'buy'
                                                ? "bg-emerald-500/10 text-emerald-500"
                                                : "bg-destructive/10 text-destructive"
                                        )}>
                                            {order.side === 'buy' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                                        </div>
                                        <div className="flex flex-col">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-semibold tracking-tight">
                                                    {order.name || `${order.side === 'buy' ? 'Buy' : 'Sell'} DCA`}
                                                </span>
                                                <Badge variant="outline" className="text-[9px] h-4 px-1.5 uppercase opacity-70 border-primary/20 text-primary rounded-sm">
                                                    {formatInterval(order.interval_type, order.interval_value)}
                                                </Badge>
                                            </div>
                                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                <span className={cn(
                                                    "font-medium",
                                                    order.side === 'buy' ? "text-emerald-500" : "text-destructive"
                                                )}>
                                                    {order.side === 'buy' ? 'Buy' : 'Sell'}
                                                </span>
                                                <span className="font-mono font-medium text-foreground">{order.energy_amount} kWh</span>
                                                {priceLimit && (
                                                    <>
                                                        <ChevronRight className="h-3 w-3 opacity-40" />
                                                        <span className="text-muted-foreground">
                                                            {order.side === 'buy' ? 'max' : 'min'} ฿{priceLimit}
                                                        </span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <Badge variant="outline" className={cn(
                                        "text-[9px] h-5 px-2 font-medium border-0 ring-1 ring-inset rounded-sm",
                                        order.status === 'active'
                                            ? "bg-emerald-500/5 text-emerald-500 ring-emerald-500/20"
                                            : order.status === 'paused'
                                                ? "bg-amber-500/5 text-amber-500 ring-amber-500/20"
                                                : order.status === 'completed'
                                                    ? "bg-blue-500/5 text-blue-500 ring-blue-500/20"
                                                    : "bg-muted text-muted-foreground ring-border"
                                    )}>
                                        <span className={cn(
                                            "mr-1.5 h-1.5 w-1.5 rounded-full inline-block",
                                            order.status === 'active' ? "bg-emerald-500 animate-pulse"
                                                : order.status === 'paused' ? "bg-amber-500"
                                                    : order.status === 'completed' ? "bg-blue-500"
                                                        : "bg-muted-foreground"
                                        )} />
                                        {order.status}
                                    </Badge>
                                </div>

                                {/* Execution Progress */}
                                <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                                    <div className="flex items-center gap-1">
                                        <Zap className="h-3 w-3" />
                                        <span className="font-mono font-medium text-foreground">
                                            {order.total_executions}
                                        </span>
                                        <span>
                                            {order.max_executions ? `/ ${order.max_executions}` : ''} runs
                                        </span>
                                    </div>
                                    {executionProgress !== null && (
                                        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-primary/60 rounded-full transition-all duration-500"
                                                style={{ width: `${Math.min(executionProgress, 100)}%` }}
                                            />
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center justify-between pt-2 border-t border-border/50 mt-1">
                                    <div className="flex flex-col gap-0.5">
                                        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                                            <Clock className="h-3 w-3" />
                                            <span>Last run:</span>
                                            <span className="font-mono text-foreground">
                                                {order.last_executed_at ? format(new Date(order.last_executed_at), 'MMM dd, HH:mm') : 'Pending'}
                                            </span>
                                        </div>
                                        {order.status === 'active' && order.next_execution_at && (
                                            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                                                <Calendar className="h-3 w-3" />
                                                <span>Next:</span>
                                                <span className="font-mono text-primary font-medium">
                                                    {format(new Date(order.next_execution_at), 'MMM dd, HH:mm')}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-1">
                                        {order.status === 'active' ? (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6 text-muted-foreground hover:text-amber-500 hover:bg-amber-500/10 rounded-sm"
                                                onClick={() => handleAction(order.id, 'pause')}
                                                disabled={!!actionLoading}
                                                title="Pause Strategy"
                                            >
                                                {actionLoading === `pause-${order.id}` ? (
                                                    <Loader2 size={10} className="animate-spin" />
                                                ) : (
                                                    <Pause size={12} />
                                                )}
                                            </Button>
                                        ) : order.status === 'paused' ? (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6 text-muted-foreground hover:text-emerald-500 hover:bg-emerald-500/10 rounded-sm"
                                                onClick={() => handleAction(order.id, 'resume')}
                                                disabled={!!actionLoading}
                                                title="Resume Strategy"
                                            >
                                                {actionLoading === `resume-${order.id}` ? (
                                                    <Loader2 size={10} className="animate-spin" />
                                                ) : (
                                                    <Play size={12} />
                                                )}
                                            </Button>
                                        ) : null}
                                        {(order.status === 'active' || order.status === 'paused') && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-sm"
                                                onClick={() => handleAction(order.id, 'cancel')}
                                                disabled={!!actionLoading}
                                                title="Cancel Strategy"
                                            >
                                                {actionLoading === `cancel-${order.id}` ? (
                                                    <Loader2 size={10} className="animate-spin" />
                                                ) : (
                                                    <Trash2 size={12} />
                                                )}
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-8 space-y-3 text-center border border-dashed border-border rounded-lg bg-muted/5">
                    <div className="p-3 rounded-full bg-primary/5">
                        <Repeat size={20} className="text-primary/50" />
                    </div>
                    <div className="space-y-1 px-4">
                        <p className="text-xs font-semibold">No DCA Strategies</p>
                        <p className="text-[10px] text-muted-foreground">
                            Create a DCA strategy above to automate your energy trading.
                        </p>
                    </div>
                </div>
            )}
        </div>
    )
}
