'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { X, Link } from 'lucide-react'
import { OrderAccount } from '@/contexts/TradingProvider'

interface MatchTargetIndicatorProps {
  targetMatchOrder: OrderAccount | null
  onClear: () => void
}

export function MatchTargetIndicator({
  targetMatchOrder,
  onClear,
}: MatchTargetIndicatorProps) {
  if (!targetMatchOrder) return null

  return (
    <div className="flex items-center justify-between rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
          <Link className="h-4 w-4 text-primary" />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-foreground">Matching Order</span>
          <span className="text-xs text-muted-foreground font-mono">
            #{targetMatchOrder.publicKey.toString().slice(0, 8)}...
          </span>
        </div>
      </div>
      <Button
        variant="ghost"
        size="sm"
        className="h-8 w-8 rounded-full p-0 hover:bg-rose-500/10 hover:text-rose-500 focus-visible:ring-2 focus-visible:ring-rose-500/50"
        onClick={onClear}
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  )
}
