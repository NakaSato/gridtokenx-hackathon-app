'use client'

import Image from 'next/image'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { X } from 'lucide-react'

interface OpenOptionOrdersProps {
  logo: string
  token: string
  symbol: string
  type: string
  limitPrice: number
  transaction: string
  strikePrice: number
  expiry: string
  size: number
  orderDate: string
}

export default function OpenOptionOrders({
  logo,
  token,
  symbol,
  type,
  limitPrice,
  transaction,
  strikePrice,
  expiry,
  size,
  orderDate,
}: OpenOptionOrdersProps) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border bg-card p-3">
      <div className="flex items-center gap-3">
        <div className="relative h-10 w-10 overflow-hidden rounded-full">
          <Image
            src={logo}
            alt={token}
            fill
            className="object-cover"
          />
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="font-semibold">{symbol}</span>
            <Badge variant="outline" className="text-xs">
              {type}
            </Badge>
          </div>
          <div className="text-muted-foreground flex items-center gap-2 text-xs">
            <span>{transaction === 'buy' ? 'Buy' : 'Sell'} @ ${limitPrice.toFixed(4)}</span>
            <span>·</span>
            <span>Size: {size.toFixed(2)}</span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex flex-col items-end text-right">
          <span className="text-xs text-muted-foreground">{expiry}</span>
          <span className="text-xs text-muted-foreground">{orderDate}</span>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
