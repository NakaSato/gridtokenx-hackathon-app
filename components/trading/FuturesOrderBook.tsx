'use client'

import React, { useMemo } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { ArrowUp, ArrowDown } from 'lucide-react'

interface OrderBookEntry {
  price: number
  quantity: number
  total: number
}

interface FuturesOrderBookProps {
  symbol: string
  currentPrice: number
  bids: OrderBookEntry[]
  asks: OrderBookEntry[]
}

export function FuturesOrderBook({ symbol, currentPrice, bids, asks }: FuturesOrderBookProps) {
  const maxTotal = useMemo(() => {
    const bidTotal = bids.length > 0 ? bids[bids.length - 1].total : 0
    const askTotal = asks.length > 0 ? asks[asks.length - 1].total : 0
    return Math.max(bidTotal, askTotal) || 1
  }, [bids, asks])

  const spread = useMemo(() => {
    if (bids.length > 0 && asks.length > 0) {
      return asks[0].price - bids[0].price
    }
    return 0
  }, [bids, asks])

  const spreadPercentage = useMemo(() => {
    if (spread > 0 && asks.length > 0) {
      return (spread / asks[0].price) * 100
    }
    return 0
  }, [spread, asks])

  return (
    <Card className="h-full bg-background/50 border-none flex flex-col overflow-hidden">
      <div className="p-3 border-b border-border/50 flex justify-between items-center">
        <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
          Order Book
          <Badge variant="outline" className="text-[10px] h-4 px-1 leading-none">Live</Badge>
        </h3>
        <div className="flex gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="grid grid-cols-3 px-3 py-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
          <span>Price</span>
          <span className="text-right">Size</span>
          <span className="text-right">Total</span>
        </div>

        {/* Asks (Sells) */}
        <div className="flex-1 flex flex-col-reverse justify-start overflow-hidden">
          {asks.map((ask, i) => (
            <OrderBookRow
              key={`ask-${i}`}
              entry={ask}
              maxTotal={maxTotal}
              type="ask"
            />
          ))}
        </div>

        {/* Current Price & Spread */}
        <div className="py-3 px-3 bg-muted/30 border-y border-border/50 flex flex-col items-center justify-center gap-1">
          <div className="flex items-center gap-2">
            <span className="text-lg font-mono font-black text-foreground">
              ฿{currentPrice.toFixed(2)}
            </span>
            <ArrowUp className="w-4 h-4 text-green-500" />
          </div>
          <div className="flex items-center gap-2 text-[10px] font-medium text-muted-foreground uppercase tracking-widest">
            <span>Spread</span>
            <span className="font-mono text-foreground font-bold">{spread.toFixed(2)}</span>
            <span className="text-primary">({spreadPercentage.toFixed(3)}%)</span>
          </div>
        </div>

        {/* Bids (Buys) */}
        <div className="flex-1 overflow-hidden">
          {bids.map((bid, i) => (
            <OrderBookRow
              key={`bid-${i}`}
              entry={bid}
              maxTotal={maxTotal}
              type="bid"
            />
          ))}
        </div>
      </div>
    </Card>
  )
}

function OrderBookRow({ entry, maxTotal, type }: { entry: OrderBookEntry, maxTotal: number, type: 'bid' | 'ask' }) {
  const depthPercentage = (entry.total / maxTotal) * 100

  return (
    <div className="relative group hover:bg-muted/50 transition-colors">
      {/* Depth Visualization */}
      <div
        className={cn(
          "absolute top-0 right-0 bottom-0 opacity-10 transition-all duration-500",
          type === 'bid' ? "bg-green-500" : "bg-red-500"
        )}
        style={{ width: `${depthPercentage}%` }}
      />

      <div className="grid grid-cols-3 px-3 py-1 text-xs font-mono relative z-10">
        <span className={cn(
          "font-bold",
          type === 'bid' ? "text-green-500" : "text-red-500"
        )}>
          {entry.price.toFixed(2)}
        </span>
        <span className="text-right text-foreground/80">
          {entry.quantity.toLocaleString()}
        </span>
        <span className="text-right text-muted-foreground">
          {entry.total.toLocaleString()}
        </span>
      </div>
    </div>
  )
}
