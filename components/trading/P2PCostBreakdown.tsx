'use client'

import React, { useEffect, useState, useMemo } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Info,
  Zap,
  Truck,
  AlertTriangle,
  CheckCircle2,
  ArrowRightLeft,
  Coins,
  TrendingUp
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { createApiClient } from '@/lib/api-client'
import { useAuth } from '@/contexts/AuthProvider'

interface P2PCostBreakdownProps {
  amount: number
  agreedPrice?: number
  buyerZoneId?: number
  sellerZoneId?: number
  className?: string
}

export function P2PCostBreakdown({
  amount,
  agreedPrice,
  buyerZoneId = 1, // Default fallback
  sellerZoneId = 1, // Default to intra-zone
  className
}: P2PCostBreakdownProps) {
  const { token } = useAuth()
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  // Debounce amount and price changes
  useEffect(() => {
    if (!token || amount <= 0) {
      setData(null)
      return
    }

    const fetchCost = async () => {
      setLoading(true)
      setError(null)
      try {
        const api = createApiClient(token)
        const response = await api.calculateP2PCost({
          buyer_zone_id: buyerZoneId,
          seller_zone_id: sellerZoneId,
          energy_amount: amount,
          agreed_price: agreedPrice
        })

        if (response.error) {
          setError(response.error)
        } else {
          setData(response.data)
        }
      } catch (err) {
        setError('Failed to calculate costs')
      } finally {
        setLoading(false)
      }
    }

    const timer = setTimeout(fetchCost, 500)
    return () => clearTimeout(timer)
  }, [token, amount, agreedPrice, buyerZoneId, sellerZoneId])

  if (amount <= 0) return null

  return (
    <Card className={cn("p-4 bg-muted/30 border-dashed overflow-hidden relative", className)}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-primary/10 rounded-lg">
            <Coins className="h-4 w-4 text-primary" />
          </div>
          <h4 className="text-sm font-semibold">Landed Cost Breakdown</h4>
        </div>
        {loading ? (
          <Skeleton className="h-5 w-20" />
        ) : data?.is_grid_compliant ? (
          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 gap-1 h-5 text-[10px]">
            <CheckCircle2 className="h-3 w-3" />
            Grid Compliant
          </Badge>
        ) : data && (
          <Badge variant="outline" className="bg-rose-500/10 text-rose-600 border-rose-500/20 gap-1 h-5 text-[10px]">
            <AlertTriangle className="h-3 w-3" />
            Grid Congested
          </Badge>
        )
        }
      </div>

      {error ? (
        <div className="flex items-center gap-2 text-xs text-rose-500 bg-rose-500/5 p-2 rounded-lg border border-rose-500/10">
          <AlertTriangle className="h-3 w-3" />
          {error}
        </div>
      ) : loading && !data ? (
        <div className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : (
        <div className="space-y-3">
          {/* Main Totals */}
          <div className="flex items-end justify-between p-3 bg-background rounded-xl border border-border/50 shadow-sm">
            <div>
              <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-1">Total Landed Cost</p>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black text-primary">฿{data?.total_cost?.toFixed(2) || '0.00'}</span>
                <span className="text-xs text-muted-foreground font-medium">/ order</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-1">Price Per kWh</p>
              <span className="text-sm font-mono font-bold">฿{((data?.total_cost || 0) / (amount || 1)).toFixed(3)}</span>
            </div>
          </div>

          {/* Breakdown List */}
          <div className="grid grid-cols-1 gap-1.5">
            <BreakdownItem
              label="Energy Multiplier"
              value={data?.energy_cost}
              icon={Zap}
              color="text-yellow-500"
            />
            <BreakdownItem
              label="Wheeling Charge"
              value={data?.wheeling_charge}
              icon={Truck}
              color="text-blue-500"
              info={`${data?.zone_distance_km || 0} km transmission`}
            />
            <BreakdownItem
              label="Technical Loss"
              value={data?.loss_cost}
              icon={TrendingUp}
              color="text-orange-500"
              info={`${((data?.loss_factor || 0) * 100).toFixed(1)}% energy lost`}
            />
          </div>

          <div className="pt-2 border-t border-border/50">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-muted-foreground flex items-center gap-1">
                <ArrowRightLeft className="h-3 w-3" />
                Effective Energy Received
              </span>
              <span className="font-bold text-foreground">{data?.effective_energy?.toFixed(2) || '0.00'} kWh</span>
            </div>
          </div>

          {data?.grid_violation_reason && (
            <div className="mt-2 text-[10px] text-rose-500 bg-rose-500/5 p-2 rounded-lg border border-rose-500/10 italic">
              * {data.grid_violation_reason}
            </div>
          )}
        </div>
      )}
    </Card>
  )
}

function BreakdownItem({ label, value, icon: Icon, color, info }: { label: string; value: number; icon: any; color: string; info?: string }) {
  return (
    <div className="flex items-center justify-between py-1 px-1">
      <div className="flex items-center gap-2">
        <div className={cn("p-1 rounded-md bg-muted", color)}>
          <Icon className="h-3 w-3" />
        </div>
        <div className="flex flex-col">
          <span className="text-xs text-muted-foreground">{label}</span>
          {info && <span className="text-[9px] text-muted-foreground/60 leading-none">{info}</span>}
        </div>
      </div>
      <span className="text-xs font-mono font-semibold">฿{value?.toFixed(2) || '0.00'}</span>
    </div>
  )
}
