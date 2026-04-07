'use client'

import React, { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  TrendingUp,
  TrendingDown,
  XCircle,
  ShieldAlert,
  ExternalLink,
  RefreshCw
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { FuturesPosition } from '@/types/futures'
import { createApiClient } from '@/lib/api-client'
import { useAuth } from '@/contexts/AuthProvider'
import { toast } from 'react-hot-toast'

interface FuturesPositionListProps {
  positions: FuturesPosition[]
  onRefresh: () => void
  loading?: boolean
}

export function FuturesPositionList({ positions, onRefresh, loading }: FuturesPositionListProps) {
  const { token } = useAuth()
  const [closingId, setClosingId] = useState<string | null>(null)

  const handleClosePosition = async (positionId: string) => {
    if (!token) return

    setClosingId(positionId)
    try {
      const api = createApiClient(token)
      const response = await api.closeFuturesPosition(positionId)

      if (response.error) {
        toast.error(response.error)
      } else {
        toast.success('Position close order submitted')
        onRefresh()
      }
    } catch (err) {
      toast.error('Failed to close position')
    } finally {
      setClosingId(null)
    }
  }

  if (positions.length === 0 && !loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 bg-muted/20 rounded-xl border border-dashed text-center">
        <div className="p-3 bg-muted/50 rounded-full mb-3">
          <TrendingUp className="w-6 h-6 text-muted-foreground/50" />
        </div>
        <h4 className="text-sm font-bold text-foreground mb-1">No Active Positions</h4>
        <p className="text-xs text-muted-foreground max-w-[200px]">
          Your open futures positions will appear here.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Open Positions</h3>
          <Badge variant="secondary" className="h-5 text-[10px]">{positions.length}</Badge>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 hover:bg-primary/5 hover:text-primary transition-colors"
          onClick={onRefresh}
          disabled={loading}
        >
          <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
        </Button>
      </div>

      <div className="rounded-xl border border-border/50 overflow-hidden bg-background/50">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow className="hover:bg-transparent border-border/50">
              <TableHead className="text-[10px] font-bold uppercase py-3">Market</TableHead>
              <TableHead className="text-[10px] font-bold uppercase py-3">Size/Leverage</TableHead>
              <TableHead className="text-[10px] font-bold uppercase py-3">Entry/Mark</TableHead>
              <TableHead className="text-[10px] font-bold uppercase py-3">Unrealized PnL</TableHead>
              <TableHead className="text-[10px] font-bold uppercase py-3 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {positions.map((pos) => {
              const pnl = parseFloat(pos.unrealized_pnl)
              const isPositive = pnl >= 0
              const margin = parseFloat(pos.margin_used)
              const roi = (pnl / margin) * 100

              return (
                <TableRow key={pos.id} className="border-border/50 hover:bg-muted/20 transition-colors">
                  <TableCell className="py-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-foreground">{pos.product_symbol}</span>
                      <Badge
                        className={cn(
                          "w-fit h-4 text-[9px] px-1 py-0 border-none font-bold",
                          pos.side === 'long' ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
                        )}
                        variant="outline"
                      >
                        {pos.side.toUpperCase()}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-xs font-mono font-medium">{parseFloat(pos.quantity).toFixed(2)} kWh</span>
                      <span className="text-[10px] text-muted-foreground font-bold">{pos.leverage}x Leverage</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col font-mono">
                      <span className="text-xs text-muted-foreground">฿{parseFloat(pos.entry_price).toFixed(2)}</span>
                      <span className="text-xs text-foreground font-bold italic">฿{parseFloat(pos.current_price).toFixed(2)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col font-mono">
                      <span className={cn(
                        "text-xs font-black",
                        isPositive ? "text-green-500" : "text-red-500"
                      )}>
                        {isPositive ? '+' : ''}฿{pnl.toFixed(2)}
                      </span>
                      <span className={cn(
                        "text-[10px] font-bold",
                        isPositive ? "text-green-500/70" : "text-red-500/70"
                      )}>
                        ({isPositive ? '+' : ''}{roi.toFixed(2)}%)
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="flex flex-col items-end mr-2">
                        <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-tighter">Liq. Price</span>
                        <span className="text-[10px] font-mono font-black text-orange-500">฿{parseFloat(pos.liquidation_price).toFixed(2)}</span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 border-rose-500/20 text-rose-500 hover:bg-rose-500 hover:text-white transition-all gap-1.5"
                        onClick={() => handleClosePosition(pos.id)}
                        disabled={closingId === pos.id}
                      >
                        <XCircle className="h-3.5 w-3.5" />
                        Close
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
