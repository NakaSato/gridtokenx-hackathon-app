'use client'

import { useState, useMemo } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/contexts/AuthProvider'
import { createApiClient } from '@/lib/api-client'
import { Loader2, CheckCircle2, AlertCircle, Repeat, ArrowRight, TrendingUp, TrendingDown, Sun, CalendarDays, CalendarRange, Clock, Hash, Sparkles, Zap, Coins, Shield, ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card } from '@/components/ui/card'
import type { IntervalType } from '@/types/features'
import { P2PCostBreakdown } from './P2PCostBreakdown'
import { useMeters } from '@/hooks/useApi'

export function RecurringOrderForm() {
    const { token } = useAuth()
    const [side, setSide] = useState<'buy' | 'sell'>('buy')
    const [amount, setAmount] = useState('')
    const [priceLimit, setPriceLimit] = useState('')
    const [intervalType, setIntervalType] = useState<IntervalType>('daily')
    const [intervalValue, setIntervalValue] = useState('1')
    const [maxExecutions, setMaxExecutions] = useState('')
    const [name, setName] = useState('')
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState('')
    const [isSuccess, setIsSuccess] = useState(false)
    const { meters } = useMeters(token ?? undefined)
    const [sellerZoneId, setSellerZoneId] = useState(1)
    const [isCollapsed, setIsCollapsed] = useState(false)

    // Quick amount presets
    const amountPresets = ['10', '50', '100', '500']

    const buyerZoneId = useMemo(() => {
        const m = meters as any[] | null
        return m?.[0]?.zone_id || 1
    }, [meters])

    const frequencyConfig: Record<IntervalType, { label: string; icon: string; desc: string; color: string; bg: string }> = {
        hourly: { label: 'Hourly', icon: 'Clock', desc: 'Every N hours', color: 'text-cyan-500', bg: 'bg-cyan-500/10' },
        daily: { label: 'Daily', icon: 'Sun', desc: 'Every N days', color: 'text-amber-500', bg: 'bg-amber-500/10' },
        weekly: { label: 'Weekly', icon: 'CalendarDays', desc: 'Every N weeks', color: 'text-blue-500', bg: 'bg-blue-500/10' },
        monthly: { label: 'Monthly', icon: 'CalendarRange', desc: 'Every N months', color: 'text-purple-500', bg: 'bg-purple-500/10' }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!token) return

        setLoading(true)
        setMessage('')
        setIsSuccess(false)

        try {
            const apiClient = createApiClient(token)
            const payload: any = {
                side,
                energy_amount: amount,
                interval_type: intervalType,
                interval_value: parseInt(intervalValue) || 1,
            }

            // Add price limit based on side
            if (priceLimit) {
                if (side === 'buy') {
                    payload.max_price_per_kwh = priceLimit
                } else {
                    payload.min_price_per_kwh = priceLimit
                }
            }

            if (maxExecutions) {
                payload.max_executions = parseInt(maxExecutions)
            }

            if (name.trim()) {
                payload.name = name.trim()
            }

            const response = await apiClient.createRecurringOrder(payload)

            if (response.error) {
                setMessage(response.error)
            } else {
                const data = response.data as any
                const nextRun = data?.next_execution_at
                    ? new Date(data.next_execution_at).toLocaleString()
                    : 'soon'
                setMessage(`DCA strategy created! First execution: ${nextRun}`)
                setIsSuccess(true)
                setAmount('')
                setPriceLimit('')
                setName('')
            }
        } catch (err) {
            setMessage('Failed to schedule recurring order')
        } finally {
            setLoading(false)
        }
    }

    const intervalLabel = intervalType === 'hourly' ? 'hour' : intervalType === 'daily' ? 'day' : intervalType === 'weekly' ? 'week' : 'month'

    return (
        <div className="flex flex-col h-full">
            {/* Collapsible Header */}
            <div className="flex items-center justify-between p-2 border-b border-border/50 bg-muted/20 rounded-t-xl">
                <div className="flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10">
                        <Repeat className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <span className="text-xs font-semibold text-foreground">DCA Strategy</span>
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-muted-foreground hover:text-primary"
                    onClick={() => setIsCollapsed(!isCollapsed)}
                >
                    {isCollapsed ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
                </Button>
            </div>

            {!isCollapsed && (
                <div className="flex-1 overflow-y-auto p-3 space-y-4" style={{ minHeight: '380px' }}>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Side Selector */}
                        <div className="flex gap-1 p-1 bg-background rounded-xl border border-border/50 shadow-sm">
                            <button
                                type="button"
                                onClick={() => setSide('buy')}
                                className={cn(
                                    "relative flex items-center gap-2 px-3 py-2.5 text-xs font-semibold rounded-lg transition-all duration-200 flex-1 justify-center",
                                    side === 'buy'
                                        ? "bg-gradient-to-b from-emerald-500 to-emerald-600 text-white shadow-md shadow-emerald-500/30"
                                        : "text-muted-foreground hover:text-emerald-600 hover:bg-emerald-500/10"
                                )}
                            >
                                <TrendingDown className="h-3.5 w-3.5" />
                                <span>Buy</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setSide('sell')}
                                className={cn(
                                    "relative flex items-center gap-2 px-3 py-2.5 text-xs font-semibold rounded-lg transition-all duration-200 flex-1 justify-center",
                                    side === 'sell'
                                        ? "bg-gradient-to-b from-rose-500 to-rose-600 text-white shadow-md shadow-rose-500/30"
                                        : "text-muted-foreground hover:text-rose-600 hover:bg-rose-500/10"
                                )}
                            >
                                <TrendingUp className="h-3.5 w-3.5" />
                                <span>Sell</span>
                            </button>
                        </div>

            <div className="space-y-4">
                {/* Strategy Name */}
                <div className="space-y-2">
                    <Label className="text-sm font-medium text-foreground">Strategy Name <span className="text-muted-foreground text-xs">(optional)</span></Label>
                    <Input
                        type="text"
                        placeholder="e.g. Daily Solar Buy"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="h-10 rounded-xl border-border bg-muted/30 text-sm"
                    />
                </div>

                {/* Amount Input */}
                <div className="space-y-2">
                    <Label className="text-sm font-medium text-foreground flex items-center justify-between">
                        <span>Amount per execution</span>
                        <span className="text-xs text-muted-foreground">Min: 0.1 kWh</span>
                    </Label>
                    <div className="relative">
                        <Input
                            type="number"
                            placeholder="0.00"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            min="0.01"
                            step="0.01"
                            className={cn(
                                "h-14 rounded-xl border-border bg-muted/30 pr-14 text-right font-mono text-xl font-bold transition-colors duration-200",
                                "placeholder:text-muted-foreground/60",
                                "focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:border-primary",
                                amount
                                    ? "text-primary bg-primary/5 border-primary/30"
                                    : "text-foreground bg-muted/30"
                            )}
                        />
                        <span className={cn(
                            "absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold transition-colors duration-200",
                            amount ? "text-primary/70" : "text-muted-foreground"
                        )}>
                            kWh
                        </span>
                    </div>
                </div>

                {/* Price Limit */}
                <div className="space-y-2">
                    <Label className="text-sm font-medium text-foreground flex items-center justify-between">
                        <span>{side === 'buy' ? 'Max Price' : 'Min Price'} <span className="text-muted-foreground text-xs">(optional)</span></span>
                        <span className="text-xs text-muted-foreground">{side === 'buy' ? 'Skip if price exceeds' : 'Skip if price below'}</span>
                    </Label>
                    <div className="relative">
                        <Input
                            type="number"
                            placeholder="No limit"
                            value={priceLimit}
                            onChange={(e) => setPriceLimit(e.target.value)}
                            min="0.01"
                            step="0.01"
                            className="h-10 rounded-xl border-border bg-muted/30 pr-16 text-right font-mono text-sm"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                            ฿/kWh
                        </span>
                    </div>
                </div>

                {/* Frequency */}
                <div className="space-y-3">
                    <Label className="text-sm font-medium text-foreground flex items-center gap-2">
                        <Repeat className="h-4 w-4 text-muted-foreground" />
                        Frequency
                    </Label>
                    <div className="grid grid-cols-4 gap-2">
                        {(Object.keys(frequencyConfig) as IntervalType[]).map((key) => {
                            const config = frequencyConfig[key]
                            const isActive = intervalType === key
                            const Icon = { Clock, Sun, CalendarDays, CalendarRange }[config.icon] || Sun
                            return (
                                <button
                                    key={key}
                                    type="button"
                                    onClick={() => setIntervalType(key)}
                                    className={cn(
                                        "flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all duration-200",
                                        isActive
                                            ? cn("border-primary bg-primary/5 shadow-md shadow-primary/10", config.color)
                                            : "border-border bg-muted/30 text-muted-foreground hover:border-primary/30 hover:bg-muted/50"
                                    )}
                                >
                                    <div className={cn(
                                        "flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-200",
                                        isActive ? config.bg : "bg-muted"
                                    )}>
                                        <Icon className={cn("h-4 w-4", isActive ? config.color : "text-muted-foreground")} />
                                    </div>
                                    <span className={cn(
                                        "text-xs font-bold transition-colors",
                                        isActive ? "text-foreground" : "text-muted-foreground"
                                    )}>{config.label}</span>
                                </button>
                            )
                        })}
                    </div>
                </div>

                {/* Interval Value + Max Executions */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                        <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                            <Hash className="h-3 w-3" />
                            Every N {intervalLabel}s
                        </Label>
                        <Input
                            type="number"
                            value={intervalValue}
                            onChange={(e) => setIntervalValue(e.target.value)}
                            min="1"
                            max="30"
                            className="h-10 rounded-xl border-border bg-muted/30 text-center font-mono text-sm"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-xs font-medium text-muted-foreground">
                            Max Executions <span className="text-muted-foreground/60">(∞ if empty)</span>
                        </Label>
                        <Input
                            type="number"
                            placeholder="∞"
                            value={maxExecutions}
                            onChange={(e) => setMaxExecutions(e.target.value)}
                            min="1"
                            className="h-10 rounded-xl border-border bg-muted/30 text-center font-mono text-sm"
                        />
                    </div>
                </div>
            </div>

            {/* Strategy Summary Card */}
            <div className="rounded-xl border border-border bg-muted/20 p-4">
                <div className="flex items-center gap-2 mb-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                        <Repeat className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                        <h4 className="text-sm font-semibold text-foreground">Strategy Summary</h4>
                        <p className="text-xs text-muted-foreground">Automated DCA orders</p>
                    </div>
                </div>
                <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Action</span>
                        <span className={cn(
                            "font-semibold",
                            side === 'buy' ? "text-emerald-500" : "text-rose-500"
                        )}>
                            {side === 'buy' ? 'Buy' : 'Sell'}
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Amount</span>
                        <span className="font-mono font-semibold text-foreground">{amount || '0'} kWh</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Schedule</span>
                        <span className="font-semibold text-foreground">
                            Every {intervalValue !== '1' ? `${intervalValue} ` : ''}{frequencyConfig[intervalType].label.toLowerCase()}{intervalValue !== '1' ? 's' : ''}
                        </span>
                    </div>
                    {priceLimit && (
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">{side === 'buy' ? 'Max Price' : 'Min Price'}</span>
                            <span className="font-mono font-semibold text-foreground">฿{priceLimit}/kWh</span>
                        </div>
                    )}
                    {maxExecutions && (
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Limit</span>
                            <span className="font-mono font-semibold text-foreground">{maxExecutions} executions</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Seller Scenario Selector */}
            <div className="space-y-2 px-1">
                <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest flex items-center justify-between">
                    <span>Simulated Matching Scenario</span>
                    <span className="text-primary italic normal-case">Affects fees</span>
                </Label>
                <div className="grid grid-cols-3 gap-1.5">
                    {[
                        { id: buyerZoneId, label: 'Intra-zone', desc: 'Neighbor' },
                        { id: (buyerZoneId % 3) + 1, label: 'Inter-zone', desc: 'Nearby' },
                        { id: 0, label: 'Main Grid', desc: 'Import' }
                    ].map((scenario) => (
                        <button
                            key={scenario.label}
                            type="button"
                            onClick={() => setSellerZoneId(scenario.id)}
                            className={cn(
                                "flex flex-col items-center py-2 px-1 rounded-xl border transition-all duration-200",
                                sellerZoneId === scenario.id
                                    ? "bg-primary/5 border-primary shadow-sm"
                                    : "bg-muted/30 border-transparent text-muted-foreground hover:bg-muted/50"
                            )}
                        >
                            <span className="text-[10px] font-bold">{scenario.label}</span>
                            <span className="text-[9px] opacity-70 leading-none">{scenario.desc}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* P2P Cost Breakdown */}
            <P2PCostBreakdown
                amount={parseFloat(amount) || 0}
                agreedPrice={parseFloat(priceLimit) || undefined}
                buyerZoneId={buyerZoneId}
                sellerZoneId={sellerZoneId}
            />

            <Button
                type="submit"
                size="lg"
                className={cn(
                    "w-full h-12 font-semibold text-sm shadow-xl transition-all duration-200 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-offset-2 rounded-xl",
                    side === 'buy'
                        ? "bg-gradient-to-b from-emerald-500 to-emerald-600 text-white shadow-emerald-500/25 hover:from-emerald-400 hover:to-emerald-500 hover:shadow-emerald-500/30 focus-visible:ring-emerald-500/50"
                        : "bg-gradient-to-b from-rose-500 to-rose-600 text-white shadow-rose-500/25 hover:from-rose-400 hover:to-rose-500 hover:shadow-rose-500/30 focus-visible:ring-rose-500/50"
                )}
                disabled={loading || !token || !amount}
            >
                {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                    <div className="flex items-center gap-2">
                        <Zap className="h-4 w-4" />
                        <span>Start {side === 'buy' ? 'Buying' : 'Selling'}</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                    </div>
                )}
            </Button>

            {message && (
                <div className={cn(
                    "flex items-start gap-3 rounded-xl p-3 text-xs",
                    isSuccess
                        ? "border border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                        : "border border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-400"
                )}>
                    {isSuccess ? (
                        <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-500" />
                    ) : (
                        <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-rose-500" />
                    )}
                    <span className="leading-relaxed">{message}</span>
                </div>
            )}
                    </form>
                </div>
            )}
        </div>
    )
}
