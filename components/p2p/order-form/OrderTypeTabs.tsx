'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import { TrendingDown, TrendingUp, Repeat } from 'lucide-react'

interface OrderTypeTabsProps {
  orderType: 'buy' | 'sell' | 'recurring'
  setOrderType: (type: 'buy' | 'sell' | 'recurring') => void
}

export function OrderTypeTabs({
  orderType,
  setOrderType,
}: OrderTypeTabsProps) {
  return (
    <div className="flex items-center border-b border-border bg-muted/50 px-4 py-3">
      <div className="flex gap-1 p-1 bg-background rounded-xl border border-border/50 shadow-sm flex-1">
        {/* Buy Tab */}
        <button
          type="button"
          onClick={() => setOrderType('buy')}
          className={cn(
            'relative flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 flex-1 justify-center',
            orderType === 'buy'
              ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30 scale-[1.02]'
              : 'text-muted-foreground hover:text-emerald-600 hover:bg-emerald-500/10'
          )}
        >
          <TrendingDown className="h-4 w-4" />
          <span>Buy</span>
        </button>

        {/* Sell Tab */}
        <button
          type="button"
          onClick={() => setOrderType('sell')}
          className={cn(
            'relative flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 flex-1 justify-center',
            orderType === 'sell'
              ? 'bg-rose-500 text-white shadow-md shadow-rose-500/30 scale-[1.02]'
              : 'text-muted-foreground hover:text-rose-600 hover:bg-rose-500/10'
          )}
        >
          <TrendingUp className="h-4 w-4" />
          <span>Sell</span>
        </button>

        {/* DCA Tab */}
        <button
          type="button"
          onClick={() => setOrderType('recurring')}
          className={cn(
            'relative flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 flex-1 justify-center',
            orderType === 'recurring'
              ? 'bg-blue-500 text-white shadow-md shadow-blue-500/30 scale-[1.02]'
              : 'text-muted-foreground hover:text-blue-600 hover:bg-blue-500/10'
          )}
        >
          <Repeat className="h-4 w-4" />
          <span>DCA</span>
        </button>
      </div>
    </div>
  )
}
