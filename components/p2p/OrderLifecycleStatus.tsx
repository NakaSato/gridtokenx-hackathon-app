'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import {
    CheckCircle2,
    Clock,
    XCircle,
    Loader2,
    ArrowRight,
    Zap,
    RotateCcw,
    AlertCircle,
    TrendingUp,
    TrendingDown,
    Wallet,
    ArrowRightLeft
} from 'lucide-react'

export type OrderStatus =
    | 'active'
    | 'partially_filled'
    | 'completed'
    | 'cancelled'
    | 'pending'
    | 'matched'

export interface OrderLifecycle {
    orderId: string
    status: OrderStatus
    side: 'buy' | 'sell'
    amount: number
    filledAmount: number
    price: number
    createdAt: Date
    expiresAt?: Date
    matches?: MatchInfo[]
    settlementStatus?: 'pending' | 'confirmed' | 'failed'
}

export interface MatchInfo {
    matchId: string
    amount: number
    price: number
    counterparty: string
    status: 'pending' | 'confirmed' | 'failed'
    timestamp: Date
}

interface OrderLifecycleStatusProps {
    order: OrderLifecycle
    className?: string
}

export default function OrderLifecycleStatus({ order, className }: OrderLifecycleStatusProps) {
    const fillPercentage = order.amount > 0
        ? Math.min((order.filledAmount / order.amount) * 100, 100)
        : 0

    const getStatusConfig = (status: OrderStatus) => {
        switch (status) {
            case 'active':
                return {
                    label: 'Active',
                    color: 'bg-blue-500',
                    textColor: 'text-blue-500',
                    bgColor: 'bg-blue-500/10',
                    borderColor: 'border-blue-500/20',
                    icon: Clock,
                    description: 'Order is open and waiting for matches'
                }
            case 'partially_filled':
                return {
                    label: 'Partially Filled',
                    color: 'bg-amber-500',
                    textColor: 'text-amber-500',
                    bgColor: 'bg-amber-500/10',
                    borderColor: 'border-amber-500/20',
                    icon: RotateCcw,
                    description: `${fillPercentage.toFixed(1)}% filled, waiting for remaining matches`
                }
            case 'matched':
                return {
                    label: 'Matched',
                    color: 'bg-purple-500',
                    textColor: 'text-purple-500',
                    bgColor: 'bg-purple-500/10',
                    borderColor: 'border-purple-500/20',
                    icon: ArrowRightLeft,
                    description: 'Order matched, pending settlement'
                }
            case 'completed':
                return {
                    label: 'Completed',
                    color: 'bg-emerald-500',
                    textColor: 'text-emerald-500',
                    bgColor: 'bg-emerald-500/10',
                    borderColor: 'border-emerald-500/20',
                    icon: CheckCircle2,
                    description: 'Order fully filled and settled'
                }
            case 'cancelled':
                return {
                    label: 'Cancelled',
                    color: 'bg-destructive',
                    textColor: 'text-destructive',
                    bgColor: 'bg-destructive/10',
                    borderColor: 'border-destructive/20',
                    icon: XCircle,
                    description: 'Order was cancelled'
                }
            case 'pending':
                return {
                    label: 'Pending',
                    color: 'bg-muted-foreground',
                    textColor: 'text-muted-foreground',
                    bgColor: 'bg-muted',
                    borderColor: 'border-border',
                    icon: Loader2,
                    description: 'Order is being processed'
                }
            default:
                return {
                    label: 'Unknown',
                    color: 'bg-muted-foreground',
                    textColor: 'text-muted-foreground',
                    bgColor: 'bg-muted',
                    borderColor: 'border-border',
                    icon: AlertCircle,
                    description: 'Status unknown'
                }
        }
    }

    const statusConfig = getStatusConfig(order.status)
    const StatusIcon = statusConfig.icon

    return (
        <Card className={cn("overflow-hidden", className)}>
            <CardHeader className="pb-2 pt-3 px-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className={cn(
                            "p-1.5 rounded-md",
                            statusConfig.bgColor,
                            statusConfig.textColor
                        )}>
                            <StatusIcon className="h-4 w-4" />
                        </div>
                        <div>
                            <CardTitle className="text-sm font-semibold">
                                Order #{order.orderId.slice(0, 8)}
                            </CardTitle>
                            <p className="text-[10px] text-muted-foreground">
                                {order.side === 'buy' ? 'Buy' : 'Sell'} {order.amount} kWh @ ฿{order.price}/kWh
                            </p>
                        </div>
                    </div>
                    <Badge
                        variant="outline"
                        className={cn(
                            "text-[10px] border-0",
                            statusConfig.bgColor,
                            statusConfig.textColor,
                            statusConfig.borderColor
                        )}
                    >
                        {statusConfig.label}
                    </Badge>
                </div>
            </CardHeader>

            <CardContent className="p-3 pt-0 space-y-3">
                {/* Status Description */}
                <p className="text-xs text-muted-foreground">
                    {statusConfig.description}
                </p>

                {/* Progress Bar for Partially Filled */}
                {(order.status === 'partially_filled' || order.status === 'active') && (
                    <div className="space-y-1.5">
                        <div className="flex justify-between text-[10px] text-muted-foreground">
                            <span>Fill Progress</span>
                            <span className="font-mono">{order.filledAmount.toFixed(2)} / {order.amount.toFixed(2)} kWh</span>
                        </div>
                        <div className="relative h-2 w-full bg-muted rounded-full overflow-hidden">
                            <div
                                className="absolute top-0 left-0 h-full bg-amber-500 transition-all duration-500 ease-out rounded-full"
                                style={{ width: `${fillPercentage}%` }}
                            />
                        </div>
                        <div className="flex justify-between text-[10px]">
                            <span className={cn(
                                "font-medium",
                                order.side === 'buy' ? 'text-emerald-600' : 'text-destructive'
                            )}>
                                {order.side === 'buy' ? (
                                    <span className="flex items-center gap-1">
                                        <TrendingUp className="h-3 w-3" /> Buying
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-1">
                                        <TrendingDown className="h-3 w-3" /> Selling
                                    </span>
                                )}
                            </span>
                            <span className="font-mono font-medium">{fillPercentage.toFixed(1)}%</span>
                        </div>
                    </div>
                )}

                {/* Visual Lifecycle Flow */}
                <div className="pt-2">
                    <div className="flex items-center justify-between">
                        {/* Step 1: Created */}
                        <LifecycleStep
                            status="completed"
                            label="Created"
                            icon={Zap}
                            isActive={true}
                            isCurrent={order.status === 'active'}
                        />

                        <ArrowRight className="h-3 w-3 text-muted-foreground/50" />

                        {/* Step 2: Matching */}
                        <LifecycleStep
                            status={order.status === 'active' ? 'current' :
                                ['partially_filled', 'matched', 'completed'].includes(order.status) ? 'completed' : 'pending'}
                            label="Matching"
                            icon={ArrowRightLeft}
                            isActive={['active', 'partially_filled', 'matched', 'completed'].includes(order.status)}
                            isCurrent={order.status === 'active'}
                        />

                        <ArrowRight className="h-3 w-3 text-muted-foreground/50" />

                        {/* Step 3: Settlement */}
                        <LifecycleStep
                            status={order.status === 'matched' ? 'current' :
                                order.status === 'completed' ? 'completed' :
                                    order.settlementStatus === 'failed' ? 'failed' : 'pending'}
                            label="Settlement"
                            icon={Wallet}
                            isActive={['matched', 'completed'].includes(order.status) || order.settlementStatus === 'failed'}
                            isCurrent={order.status === 'matched'}
                        />

                        <ArrowRight className="h-3 w-3 text-muted-foreground/50" />

                        {/* Step 4: Complete */}
                        <LifecycleStep
                            status={order.status === 'completed' ? 'completed' :
                                order.status === 'cancelled' ? 'failed' : 'pending'}
                            label="Complete"
                            icon={CheckCircle2}
                            isActive={['completed', 'cancelled'].includes(order.status)}
                            isCurrent={order.status === 'completed'}
                        />
                    </div>
                </div>

                {/* Matches List */}
                {order.matches && order.matches.length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-border">
                        <h4 className="text-[10px] font-medium uppercase text-muted-foreground">
                            Matches ({order.matches.length})
                        </h4>
                        <div className="space-y-1.5 max-h-[120px] overflow-y-auto">
                            {order.matches.map((match) => (
                                <MatchRow key={match.matchId} match={match} side={order.side} />
                            ))}
                        </div>
                    </div>
                )}

                {/* Settlement Status */}
                {order.settlementStatus && order.status !== 'completed' && (
                    <div className={cn(
                        "flex items-center gap-2 p-2 rounded-md text-xs",
                        order.settlementStatus === 'confirmed' ? "bg-emerald-500/10 text-emerald-600" :
                            order.settlementStatus === 'failed' ? "bg-destructive/10 text-destructive" :
                                "bg-amber-500/10 text-amber-600"
                    )}>
                        {order.settlementStatus === 'confirmed' ? (
                            <CheckCircle2 className="h-3.5 w-3.5" />
                        ) : order.settlementStatus === 'failed' ? (
                            <AlertCircle className="h-3.5 w-3.5" />
                        ) : (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        )}
                        <span className="capitalize">{order.settlementStatus.replace('_', ' ')}</span>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

// Lifecycle Step Component
function LifecycleStep({
    status,
    label,
    icon: Icon,
    isActive,
    isCurrent
}: {
    status: 'completed' | 'current' | 'pending' | 'failed'
    label: string
    icon: React.ComponentType<{ className?: string }>
    isActive: boolean
    isCurrent: boolean
}) {
    const getStyles = () => {
        switch (status) {
            case 'completed':
                return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
            case 'current':
                return 'bg-primary/10 text-primary border-primary/20 ring-1 ring-primary/30'
            case 'failed':
                return 'bg-destructive/10 text-destructive border-destructive/20'
            default:
                return 'bg-muted text-muted-foreground border-border'
        }
    }

    return (
        <div className="flex flex-col items-center gap-1">
            <div className={cn(
                "flex h-7 w-7 items-center justify-center rounded-full border transition-all",
                getStyles(),
                isCurrent && "animate-pulse"
            )}>
                <Icon className="h-3.5 w-3.5" />
            </div>
            <span className={cn(
                "text-[9px] font-medium",
                isActive ? 'text-foreground' : 'text-muted-foreground'
            )}>
                {label}
            </span>
        </div>
    )
}

// Match Row Component
function MatchRow({ match, side }: { match: MatchInfo; side: 'buy' | 'sell' }) {
    return (
        <div className="flex items-center justify-between p-2 rounded-md bg-muted/50 text-xs">
            <div className="flex items-center gap-2">
                <div className={cn(
                    "flex h-5 w-5 items-center justify-center rounded-full",
                    match.status === 'confirmed' ? 'bg-emerald-500/10 text-emerald-500' :
                        match.status === 'failed' ? 'bg-destructive/10 text-destructive' :
                            'bg-amber-500/10 text-amber-500'
                )}>
                    {match.status === 'confirmed' ? (
                        <CheckCircle2 className="h-3 w-3" />
                    ) : match.status === 'failed' ? (
                        <XCircle className="h-3 w-3" />
                    ) : (
                        <Loader2 className="h-3 w-3 animate-spin" />
                    )}
                </div>
                <div className="flex flex-col">
                    <span className="font-medium">
                        {match.amount.toFixed(2)} kWh @ ฿{match.price.toFixed(2)}
                    </span>
                    <span className="text-[9px] text-muted-foreground">
                        with {match.counterparty.slice(0, 8)}...
                    </span>
                </div>
            </div>
            <Badge
                variant="outline"
                className={cn(
                    "text-[9px] h-5 px-1",
                    match.status === 'confirmed' ? 'bg-emerald-500/5 text-emerald-600 border-emerald-500/20' :
                        match.status === 'failed' ? 'bg-destructive/5 text-destructive border-destructive/20' :
                            'bg-amber-500/5 text-amber-600 border-amber-500/20'
                )}
            >
                {match.status}
            </Badge>
        </div>
    )
}
