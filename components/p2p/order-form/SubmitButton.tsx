'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Loader2, Shield, Wallet2 } from 'lucide-react'

interface SubmitButtonProps {
  token: string | null
  loading: boolean

  orderType: 'buy' | 'sell'
  amount: string
  price: string
  cryptoLoaded: boolean
  disabled?: boolean
}

export function SubmitButton({
  token,
  loading,

  orderType,
  amount,
  price,
  cryptoLoaded,
  disabled = false,
}: SubmitButtonProps) {
  const totalValue =
    amount && price
      ? (parseFloat(amount) * parseFloat(price)).toFixed(2)
      : '0.00'

  if (!token) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border-2 border-dashed border-border bg-muted/10 p-6 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <Wallet2 className="h-6 w-6 text-muted-foreground" />
        </div>
        <span className="text-sm font-medium text-muted-foreground">
          Connect your wallet to start trading energy
        </span>
      </div>
    )
  }

  return (
    <Button
      type="submit"
      size="lg"
      className={cn(
        'h-14 w-full rounded-xl font-semibold text-base shadow-xl transition-all duration-200 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-offset-2',
        orderType === 'buy'
          ? 'bg-gradient-to-b from-emerald-500 to-emerald-600 text-white shadow-emerald-500/25 hover:from-emerald-400 hover:to-emerald-500 hover:shadow-emerald-500/30 focus-visible:ring-emerald-500/50'
          : 'bg-gradient-to-b from-rose-500 to-rose-600 text-white shadow-rose-500/25 hover:from-rose-400 hover:to-rose-500 hover:shadow-rose-500/30 focus-visible:ring-rose-500/50'
      )}
      disabled={disabled}
    >
      {loading ? (
        <div className="flex items-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Processing...</span>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          {cryptoLoaded && <Shield className="h-5 w-5" />}
          <span>
            {orderType === 'buy' ? 'Buy' : 'Sell'} {amount || '0'} kWh
          </span>
          {amount && price && (
            <span className="ml-1 text-white/80 font-mono">
              · ฿{totalValue}
            </span>
          )}
        </div>
      )}
    </Button>
  )
}
