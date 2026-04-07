'use client'

import React from 'react'
import { Separator } from '@/components/ui/separator'

interface OrderSummaryProps {
  amount: string
  price: string
}

export function OrderSummary({ amount, price }: OrderSummaryProps) {
  const totalValue =
    amount && price
      ? (parseFloat(amount) * parseFloat(price)).toFixed(2)
      : '0.00'

  return (
    <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-3">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground font-medium">Amount</span>
        <span className="font-mono font-semibold">{amount || '0'} kWh</span>
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground font-medium">Price</span>
        <span className="font-mono font-semibold">฿{price || '0'}/kWh</span>
      </div>
      <Separator className="my-2" />
      <div className="flex items-center justify-between">
        <span className="text-base font-semibold text-foreground">Total</span>
        <span className="font-mono text-2xl font-bold text-foreground">
          ฿{totalValue}
        </span>
      </div>
    </div>
  )
}
