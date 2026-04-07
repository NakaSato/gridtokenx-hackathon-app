'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import {
  TrendingUp,
  TrendingDown,
  Zap,
  Info,
  AlertTriangle,
  ArrowRightLeft,
  ShieldAlert
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthProvider'
import { createApiClient } from '@/lib/api-client'
import { toast } from 'react-hot-toast'
import { Loader2 } from 'lucide-react'

interface FuturesOrderFormProps {
  productId: string
  symbol: string
  currentPrice: number
  onOrderCreated?: () => void
}

export function FuturesOrderForm({
  productId,
  symbol,
  currentPrice,
  onOrderCreated
}: FuturesOrderFormProps) {
  const { token } = useAuth()
  const [side, setSide] = useState<'long' | 'short'>('long')
  const [orderType, setOrderType] = useState<'market' | 'limit'>('market')
  const [quantity, setQuantity] = useState('')
  const [price, setPrice] = useState(currentPrice.toString())
  const [leverage, setLeverage] = useState(10)
  const [loading, setLoading] = useState(false)

  // Sync price if market order
  useEffect(() => {
    if (orderType === 'market') {
      setPrice(currentPrice.toString())
    }
  }, [currentPrice, orderType])

  const numericQuantity = parseFloat(quantity) || 0
  const numericPrice = parseFloat(price) || currentPrice

  const marginRequirement = useMemo(() => {
    if (numericQuantity <= 0) return 0
    return (numericQuantity * numericPrice) / leverage
  }, [numericQuantity, numericPrice, leverage])

  const liquidationPrice = useMemo(() => {
    // Simple liquidation calculation for demonstration
    // maintenance margin assumed at 5%
    const mm = 0.05
    if (side === 'long') {
      return numericPrice * (1 - (1 / leverage) + mm)
    } else {
      return numericPrice * (1 + (1 / leverage) - mm)
    }
  }, [numericPrice, leverage, side])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) {
      toast.error('Authentication required')
      return
    }

    if (numericQuantity <= 0) {
      toast.error('Please enter a valid quantity')
      return
    }

    setLoading(true)
    try {
      const api = createApiClient(token)
      const response = await api.createFuturesOrder({
        product_id: productId,
        side,
        order_type: orderType,
        quantity: numericQuantity,
        price: numericPrice,
        leverage
      })

      if (response.error) {
        toast.error(response.error)
      } else {
        toast.success(`${side.toUpperCase()} order placed successfully`)
        setQuantity('')
        onOrderCreated?.()
      }
    } catch (err) {
      toast.error('Failed to place order')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-2 p-1 bg-muted/50 rounded-lg">
        <Button
          type="button"
          variant="ghost"
          onClick={() => setSide('long')}
          className={cn(
            "h-10 rounded-md transition-all",
            side === 'long'
              ? "bg-green-500 text-white hover:bg-green-600 shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <TrendingUp className="w-4 h-4 mr-2" />
          Buy / Long
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => setSide('short')}
          className={cn(
            "h-10 rounded-md transition-all",
            side === 'short'
              ? "bg-red-500 text-white hover:bg-red-600 shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <TrendingDown className="w-4 h-4 mr-2" />
          Sell / Short
        </Button>
      </div>

      <div className="space-y-4">
        <div className="flex gap-2 border-b border-border/50 pb-2">
          <button
            type="button"
            onClick={() => setOrderType('market')}
            className={cn(
              "text-xs font-bold uppercase tracking-wider pb-1 transition-colors",
              orderType === 'market' ? "text-primary border-b-2 border-primary" : "text-muted-foreground"
            )}
          >
            Market
          </button>
          <button
            type="button"
            onClick={() => setOrderType('limit')}
            className={cn(
              "text-xs font-bold uppercase tracking-wider pb-1 transition-colors",
              orderType === 'limit' ? "text-primary border-b-2 border-primary" : "text-muted-foreground"
            )}
          >
            Limit
          </button>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center px-1">
            <Label className="text-xs text-muted-foreground">Price</Label>
            <span className="text-[10px] text-muted-foreground font-mono">USDC</span>
          </div>
          <div className="relative">
            <Input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              disabled={orderType === 'market'}
              className="bg-muted/30 border-none font-mono text-sm h-10"
            />
            {orderType === 'market' && (
              <div className="absolute inset-0 flex items-center px-3 pointer-events-none">
                <span className="text-sm font-mono text-muted-foreground">Market Price</span>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center px-1">
            <Label className="text-xs text-muted-foreground">Amount</Label>
            <span className="text-[10px] text-muted-foreground font-mono">kWh</span>
          </div>
          <Input
            type="number"
            placeholder="0.00"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="bg-muted/30 border-none font-mono text-sm h-10"
          />
        </div>

        <div className="space-y-4 pt-2">
          <div className="flex justify-between items-center px-1">
            <Label className="text-xs text-muted-foreground">Leverage</Label>
            <Badge variant="outline" className="font-mono text-primary bg-primary/5 border-primary/20">
              {leverage}x
            </Badge>
          </div>
          <Slider
            value={[leverage]}
            min={1}
            max={50}
            step={1}
            onValueChange={([val]) => setLeverage(val)}
            className="py-2"
          />
          <div className="flex justify-between px-1 text-[10px] text-muted-foreground font-medium">
            <span>1x</span>
            <span>10x</span>
            <span>25x</span>
            <span>50x</span>
          </div>
        </div>
      </div>

      <div className="p-3 bg-muted/30 rounded-xl space-y-2 border border-dashed border-border/50">
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">Margin Required</span>
          <span className="font-mono font-bold">฿{marginRequirement.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">Liquidation Price</span>
          <span className={cn(
            "font-mono font-bold",
            side === 'long' ? "text-red-500" : "text-green-500"
          )}>
            ฿{liquidationPrice.toFixed(2)}
          </span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">Trading Fee (0.05%)</span>
          <span className="font-mono text-muted-foreground">
            ฿{(numericQuantity * numericPrice * 0.0005).toFixed(4)}
          </span>
        </div>
      </div>

      <Button
        type="submit"
        disabled={loading}
        className={cn(
          "w-full h-12 text-sm font-bold uppercase tracking-wider shadow-lg",
          side === 'long'
            ? "bg-green-500 hover:bg-green-600"
            : "bg-red-500 hover:bg-red-600"
        )}
      >
        {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
        {side === 'long' ? 'Open Long Position' : 'Open Short Position'}
      </Button>

      <div className="flex items-center gap-2 p-2 bg-yellow-500/5 rounded-lg border border-yellow-500/10">
        <ShieldAlert className="w-4 h-4 text-yellow-500 shrink-0" />
        <p className="text-[10px] text-yellow-600 leading-tight">
          Futures involve high risk. Leverage can lead to complete loss of margin. Use with caution.
        </p>
      </div>
    </form>
  )
}
