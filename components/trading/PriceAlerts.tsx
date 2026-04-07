'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthProvider'
import { createApiClient } from '@/lib/api-client'
import type { PriceAlert } from '@/types/features'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader2, Bell, BellOff, Trash2, TrendingUp, TrendingDown, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function PriceAlerts() {
    const { token } = useAuth()
    const [alerts, setAlerts] = useState<PriceAlert[]>([])
    const [loading, setLoading] = useState(false)
    const [showForm, setShowForm] = useState(false)
    const [newAlert, setNewAlert] = useState({
        symbol: 'GRX',
        target_price: '',
        condition: 'above' as 'above' | 'below'
    })
    const [actionLoading, setActionLoading] = useState<string | null>(null)

    const fetchAlerts = useCallback(async () => {
        if (!token) return
        setLoading(true)
        try {
            const apiClient = createApiClient(token)
            const response = await apiClient.listPriceAlerts()
            if (response.data) {
                setAlerts(response.data)
            }
        } catch (error) {
            console.error('Failed to fetch price alerts:', error)
        } finally {
            setLoading(false)
        }
    }, [token])

    useEffect(() => {
        fetchAlerts()
    }, [fetchAlerts])

    const createAlert = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!token || !newAlert.target_price) return
        setActionLoading('create')
        try {
            const apiClient = createApiClient(token)
            const response = await apiClient.createPriceAlert({
                symbol: newAlert.symbol,
                target_price: newAlert.target_price,
                condition: newAlert.condition
            })
            if (response.data) {
                setAlerts(prev => [response.data as PriceAlert, ...prev])
                setShowForm(false)
                setNewAlert({ symbol: 'GRX', target_price: '', condition: 'above' })
            }
        } catch (error) {
            console.error('Failed to create price alert:', error)
        } finally {
            setActionLoading(null)
        }
    }

    const deleteAlert = async (id: string) => {
        if (!token) return
        setActionLoading(`delete-${id}`)
        try {
            const apiClient = createApiClient(token)
            await apiClient.deletePriceAlert(id)
            setAlerts(prev => prev.filter(a => a.id !== id))
        } catch (error) {
            console.error('Failed to delete price alert:', error)
        } finally {
            setActionLoading(null)
        }
    }

    if (loading && alerts.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-10 space-y-2 opacity-50">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <span className="text-sm">Loading price alerts...</span>
            </div>
        )
    }

    return (
        <div className="flex flex-col space-y-3">
            <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Active Alerts</h3>
                {!showForm && (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-[10px] gap-1 px-2 text-primary hover:text-primary/80 hover:bg-primary/5"
                        onClick={() => setShowForm(true)}
                    >
                        <Plus size={12} />
                        New Alert
                    </Button>
                )}
            </div>

            {showForm && (
                <form onSubmit={createAlert} className="p-4 rounded-sm border border-primary/20 bg-primary/5 space-y-4 mb-2 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-[10px] text-muted-foreground uppercase font-semibold">Condition</label>
                            <div className="flex bg-background border rounded-sm p-1">
                                <button
                                    type="button"
                                    className={cn(
                                        "flex-1 text-[10px] py-1 rounded-sm transition-all",
                                        newAlert.condition === 'above' ? "bg-primary text-primary-foreground shadow-sm" : "hover:bg-muted"
                                    )}
                                    onClick={() => setNewAlert(prev => ({ ...prev, condition: 'above' }))}
                                >
                                    Above
                                </button>
                                <button
                                    type="button"
                                    className={cn(
                                        "flex-1 text-[10px] py-1 rounded-sm transition-all",
                                        newAlert.condition === 'below' ? "bg-red-500 text-white shadow-sm" : "hover:bg-muted"
                                    )}
                                    onClick={() => setNewAlert(prev => ({ ...prev, condition: 'below' }))}
                                >
                                    Below
                                </button>
                            </div>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] text-muted-foreground uppercase font-semibold">Target Price</label>
                            <div className="relative">
                                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">$</span>
                                <input
                                    type="number"
                                    step="0.01"
                                    className="w-full bg-background border h-8 rounded-sm pl-5 pr-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                                    placeholder="0.00"
                                    value={newAlert.target_price}
                                    onChange={(e) => setNewAlert(prev => ({ ...prev, target_price: e.target.value }))}
                                    autoFocus
                                />
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            type="submit"
                            size="sm"
                            className="flex-1 h-8 text-[11px]"
                            disabled={actionLoading === 'create' || !newAlert.target_price}
                        >
                            {actionLoading === 'create' ? <Loader2 size={12} className="animate-spin mr-2" /> : <Bell size={12} className="mr-2" />}
                            Create Alert
                        </Button>
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-8 text-[11px]"
                            onClick={() => setShowForm(false)}
                        >
                            Cancel
                        </Button>
                    </div>
                </form>
            )}

            {alerts.length > 0 ? (
                <div className="grid gap-2">
                    {alerts.map((alert: PriceAlert) => (
                        <div key={alert.id} className="flex items-center justify-between p-3 rounded-sm border bg-muted/10 group transition-all hover:bg-muted/20">
                            <div className="flex items-center gap-3">
                                <div className={cn(
                                    "p-2 rounded-full",
                                    alert.condition === 'above' ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
                                )}>
                                    {alert.condition === 'above' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-xs font-bold">{alert.symbol}</span>
                                    <span className="text-[10px] text-muted-foreground uppercase">
                                        {alert.condition === 'above' ? 'Price crosses above' : 'Price falls below'}
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                <div className="text-sm font-mono font-medium">
                                    ${parseFloat(alert.target_price).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </div>
                                <Badge variant={alert.is_active ? "secondary" : "outline"} className="text-[8px] h-4 px-1 opacity-70">
                                    {alert.is_active ? 'Active' : 'Triggered'}
                                </Badge>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-muted-foreground hover:text-red-500 hover:bg-red-500/5 transition-colors group-hover:opacity-100"
                                    onClick={() => deleteAlert(alert.id)}
                                    disabled={actionLoading === `delete-${alert.id}`}
                                >
                                    {actionLoading === `delete-${alert.id}` ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : !showForm ? (
                <div className="flex flex-col items-center justify-center py-10 space-y-3 text-center border border-dashed rounded-sm bg-muted/5">
                    <div className="p-3 rounded-full bg-muted/10">
                        <BellOff size={24} className="text-muted-foreground/50" />
                    </div>
                    <div className="space-y-1">
                        <p className="text-sm font-medium">No Alerts Set</p>
                        <p className="text-xs text-muted-foreground">Get notified when tokens reach your target price.</p>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-[11px] gap-2 mt-2"
                        onClick={() => setShowForm(true)}
                    >
                        <Plus size={14} />
                        Set Your First Alert
                    </Button>
                </div>
            ) : null}
        </div>
    )
}

