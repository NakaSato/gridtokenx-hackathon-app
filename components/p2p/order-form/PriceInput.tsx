'use client'

import React from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { TrendingUp } from 'lucide-react'

interface PriceInputProps {
  price: string
  setPrice: (price: string) => void
  priceType: 'market' | 'limit'
  setPriceType: (type: 'market' | 'limit') => void
}

export function PriceInput({
  price,
  setPrice,
  priceType,
  setPriceType,
}: PriceInputProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium text-foreground">
          Price per kWh
        </Label>
        {priceType === 'market' && (
          <span className="rounded-lg bg-amber-500/10 px-2 py-1 text-xs font-semibold text-amber-600">
            Market Price
          </span>
        )}
      </div>
      <div className="relative">
        <Input
          type="number"
          placeholder="4.00"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          min="0.01"
          step="0.01"
          disabled={priceType === 'market'}
          className={cn(
            "h-14 rounded-xl border-border bg-muted/30 pr-16 text-right font-mono text-xl font-bold transition-colors duration-200",
            "placeholder:text-muted-foreground/60",
            "focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:border-primary",
            priceType === 'market' && "cursor-not-allowed bg-muted/50 text-muted-foreground",
            price && priceType !== 'market'
              ? "text-primary bg-primary/5 border-primary/30"
              : "text-foreground bg-muted/30"
          )}
        />
        <span className={cn(
          "absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold transition-colors duration-200",
          price && priceType !== 'market' ? "text-primary/70" : "text-muted-foreground"
        )}>
          THB
        </span>
      </div>

      {/* Market/Limit Toggle */}
      <div className="flex items-center gap-1 bg-muted/80 rounded-xl p-1 border border-border/50">
        <button
          type="button"
          onClick={() => setPriceType('market')}
          className={cn(
            'px-4 py-2 text-xs font-semibold rounded-lg transition-all duration-200 flex-1',
            priceType === 'market'
              ? 'bg-background text-foreground shadow-sm border border-border/50'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
          )}
        >
          Market
        </button>
        <button
          type="button"
          onClick={() => setPriceType('limit')}
          className={cn(
            'px-4 py-2 text-xs font-semibold rounded-lg transition-all duration-200 flex-1',
            priceType === 'limit'
              ? 'bg-background text-foreground shadow-sm border border-border/50'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
          )}
        >
          Limit
        </button>
      </div>
      {priceType === 'limit' && (
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <TrendingUp className="h-3 w-3" />
          Spread: 4.20 - 4.80 THB
        </p>
      )}
    </div>
  )
}
