'use client'

import React from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { P2P_CONFIG } from '@/lib/constants'

interface AmountInputProps {
  amount: string
  setAmount: (amount: string) => void
  balance: number | null
}

export function AmountInput({
  amount,
  setAmount,
  balance,
}: AmountInputProps) {
  const handleQuickAmount = (percent: number) => {
    if (balance && balance > 0) {
      setAmount(((balance * percent) / 100).toFixed(2))
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium text-foreground">
          Amount
        </Label>
        <span className="text-xs text-muted-foreground">
          Min: 0.1 kWh
        </span>
      </div>
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
      {/* Quick Amount Pills - Design System */}
      <div className="flex gap-2">
        {P2P_CONFIG.quickAmountPercentages.map((percent) => (
          <Button
            key={percent}
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleQuickAmount(percent)}
            className="h-8 flex-1 rounded-lg border-border bg-transparent text-xs font-medium text-muted-foreground transition-all hover:border-primary hover:text-primary hover:bg-primary/5 focus-visible:ring-2 focus-visible:ring-primary/50"
          >
            {percent}%
          </Button>
        ))}
      </div>
    </div>
  )
}
