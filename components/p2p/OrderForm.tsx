'use client'

import React, { useState, useEffect } from 'react'
import { Separator } from '@/components/ui/separator'
import { createApiClient } from '@/lib/api-client'
import { useAuth } from '@/contexts/AuthProvider'
import { useTrading, OrderAccount } from '@/contexts/TradingProvider'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import P2PCostBreakdown from './P2PCostBreakdown'
import OrderBookDepth from './OrderBookDepth'
import type { EnergyNode } from '@/components/energy-grid/types'
import { RecurringOrderForm } from '../trading/RecurringOrderForm'
import { useCrypto } from '@/hooks/useCrypto'
import { useWalletBalance } from '@/hooks/useWalletBalance'
import { useMarketConfig } from '@/hooks/useApi'
import {
  OrderTypeTabs,
  MatchTargetIndicator,
  BalanceDisplay,
  SelectedNodeCard,
  ZoneSelector,
  AmountInput,
  PriceInput,
  OrderSummary,
  SubmitButton,
  FeedbackMessage,
} from './order-form'

interface OrderFormProps {
  onOrderPlaced?: () => void
  selectedNode?: EnergyNode | null
  onClearNode?: () => void
}

const OrderForm = React.memo(function OrderForm({
  onOrderPlaced,
  selectedNode,
  onClearNode,
}: OrderFormProps) {
  const { token } = useAuth()
  const [orderType, setOrderType] = useState<'buy' | 'sell' | 'recurring'>('buy')
  const [priceType, setPriceType] = useState<'market' | 'limit'>('limit')
  const [amount, setAmount] = useState('')
  const [price, setPrice] = useState('')
  const [buyerZone, setBuyerZone] = useState<number>(0)
  const [sellerZone, setSellerZone] = useState<number>(0)
  const [message, setMessage] = useState('')
  const [isSuccess, setIsSuccess] = useState(false)
  const [showCostBreakdown, setShowCostBreakdown] = useState(true)
  const [targetMatchOrder, setTargetMatchOrder] = useState<OrderAccount | null>(null)
  const { isLoaded: cryptoLoaded } = useCrypto()
  const queryClient = useQueryClient()
  const { marketConfig } = useMarketConfig(token ?? undefined)
  const { activeOrderFill, setActiveOrderFill } = useTrading()

  const { data: balanceData, isLoading: balanceLoading } = useWalletBalance()
  const rawBalance = balanceData?.token_balance
  const balance = rawBalance != null ? Number(rawBalance) : null

  // Consume activeOrderFill if present
  useEffect(() => {
    if (activeOrderFill) {
      let side: 'buy' | 'sell' = 'buy'

      if (activeOrderFill.targetOrder) {
        const target = activeOrderFill.targetOrder
        const isSellerSet =
          target.account.seller.toString() !==
          '11111111111111111111111111111111'
        if (isSellerSet) {
          side = 'buy'
        } else {
          side = 'sell'
        }
        setTargetMatchOrder(target)
      }

      setOrderType(side)
      setAmount(activeOrderFill.amount.toFixed(2))
      if (activeOrderFill.price) {
        setPrice(activeOrderFill.price.toFixed(2))
      }
      setActiveOrderFill(null)
    }
  }, [activeOrderFill, setActiveOrderFill])

  // Pre-fill amount and zone when a node is selected from the map
  useEffect(() => {
    if (selectedNode) {
      if (selectedNode.surplusEnergy && selectedNode.surplusEnergy > 0) {
        setOrderType('sell')
        setAmount(selectedNode.surplusEnergy.toFixed(2))
      } else if (selectedNode.deficitEnergy && selectedNode.deficitEnergy > 0) {
        setOrderType('buy')
        setAmount(selectedNode.deficitEnergy.toFixed(2))
      }

      if (selectedNode.zoneId) {
        if (orderType === 'buy') {
          setBuyerZone(selectedNode.zoneId)
          if (sellerZone === 0) setSellerZone(selectedNode.zoneId)
        } else if (orderType === 'sell') {
          setSellerZone(selectedNode.zoneId)
          if (buyerZone === 0) setBuyerZone(selectedNode.zoneId)
        }
      }
    }
  }, [selectedNode])

  useEffect(() => {
    if (isSuccess) {
      const timer = setTimeout(() => {
        setMessage('')
        setIsSuccess(false)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [isSuccess])

  const orderMutation = useMutation({
    mutationFn: async (orderPayload: {
      side: 'buy' | 'sell'
      amount: string
      price_per_kwh: string
      zone_id: number
    }) => {
      if (!token) throw new Error('Please log in to create orders')

      const apiClient = createApiClient(token)
      const apiResult = await apiClient.createP2POrder({
        side: orderPayload.side,
        amount: orderPayload.amount,
        price_per_kwh: orderPayload.price_per_kwh,
        zone_id: orderPayload.zone_id || undefined,
      })

      if (apiResult.error) {
        throw new Error(apiResult.error)
      }

      return apiResult.data
    },
    onSuccess: () => {
      setMessage(
        'Order placed successfully! The matching engine will find the best counterparty.'
      )
      setIsSuccess(true)
      setAmount('')
      setPrice('')
      setTargetMatchOrder(null)
      queryClient.invalidateQueries({ queryKey: ['wallet-balance'] })
      queryClient.invalidateQueries({ queryKey: ['user-stats'] })
      queryClient.invalidateQueries({ queryKey: ['p2p-orders'] })
      queryClient.invalidateQueries({ queryKey: ['orderbook'] })
      onOrderPlaced?.()
    },
    onError: (error) => {
      setMessage(
        error instanceof Error ? error.message : 'Failed to place order'
      )
    },
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!amount || parseFloat(amount) <= 0) {
      setMessage('Please enter a valid amount')
      return
    }
    if (parseFloat(amount) < 0.1) {
      setMessage('Minimum order amount is 0.1 kWh')
      return
    }
    if (!price || parseFloat(price) <= 0) {
      setMessage('Please enter a valid price')
      return
    }

    if (marketConfig) {
      const priceVal = parseFloat(price)
      if (priceVal < marketConfig.min_price_per_kwh) {
        setMessage(`Price cannot be lower than the minimum limit (฿${marketConfig.min_price_per_kwh})`)
        return
      }
      if (priceVal > marketConfig.max_price_per_kwh) {
        setMessage(`Price cannot be higher than the maximum limit (฿${marketConfig.max_price_per_kwh})`)
        return
      }
    }

    if (orderType === 'sell' && balance !== null && parseFloat(amount) > balance) {
      setMessage(`Insufficient balance. You have ${balance.toFixed(2)} GRX available.`)
      return
    }

    const zone_id = orderType === 'buy' ? buyerZone : sellerZone

    orderMutation.mutate({
      side: orderType as 'buy' | 'sell',
      amount,
      price_per_kwh: price,
      zone_id,
    })
  }

  const loading = orderMutation.isPending
  const energyAmount = parseFloat(amount) || 0
  const agreedPrice = parseFloat(price) || undefined

  return (
    <div className="flex w-full flex-col space-y-0 overflow-hidden rounded-2xl border border-border bg-card shadow-lg">
      <OrderTypeTabs
        orderType={orderType}
        setOrderType={setOrderType}
      />

      <div className="flex flex-col space-y-4 p-4">
        <MatchTargetIndicator
          targetMatchOrder={targetMatchOrder}
          onClear={() => setTargetMatchOrder(null)}
        />

        <BalanceDisplay
          token={token}
          balance={balance}
          balanceLoading={balanceLoading}
        />

        {orderType === 'recurring' ? (
          <RecurringOrderForm />
        ) : (
          <>
            <SelectedNodeCard
              selectedNode={selectedNode || null}
              onClearNode={onClearNode}
            />

            <form onSubmit={handleSubmit} className="flex flex-col space-y-4">
              <ZoneSelector
                orderType={orderType as 'buy' | 'sell'}
                buyerZone={buyerZone}
                sellerZone={sellerZone}
                setBuyerZone={setBuyerZone}
                setSellerZone={setSellerZone}
                selectedNode={selectedNode || null}
              />

              <AmountInput
                amount={amount}
                setAmount={setAmount}
                balance={balance}
              />

              <PriceInput
                price={price}
                setPrice={setPrice}
                priceType={priceType}
                setPriceType={setPriceType}
              />

              {energyAmount > 0 && (
                <Accordion
                  type="single"
                  collapsible
                  defaultValue={showCostBreakdown ? 'breakdown' : undefined}
                >
                  <AccordionItem value="breakdown" className="border-0">
                    <AccordionTrigger
                      onClick={() => setShowCostBreakdown(!showCostBreakdown)}
                      className="flex h-12 items-center justify-between rounded-xl border border-border bg-muted/30 px-4 py-0 text-sm font-semibold text-foreground hover:bg-muted hover:text-foreground hover:no-underline [&[data-state=open]>svg]:rotate-180 focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:rounded-xl"
                    >
                      <span>Cost Breakdown</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-base font-bold text-foreground">
                          ฿{(energyAmount * (agreedPrice || 0)).toFixed(2)}
                        </span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-3">
                      <div className="rounded-xl border border-border bg-muted/20 p-4">
                        <P2PCostBreakdown
                          buyerZone={buyerZone}
                          sellerZone={sellerZone}
                          energyAmount={energyAmount}
                          agreedPrice={agreedPrice}
                        />
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              )}

              {token && energyAmount > 0 && (
                <OrderBookDepth
                  side={orderType as 'buy' | 'sell'}
                  amount={energyAmount}
                  currentPrice={agreedPrice}
                />
              )}

              <Separator />

              <OrderSummary amount={amount} price={price} />

              <SubmitButton
                token={token}
                loading={loading}
                orderType={orderType as 'buy' | 'sell'}
                amount={amount}
                price={price}
                cryptoLoaded={cryptoLoaded}
                disabled={loading || !amount || parseFloat(amount) <= 0}
              />

              <FeedbackMessage message={message} isSuccess={isSuccess} />
            </form>
          </>
        )}
      </div>
    </div>
  )
})

export default OrderForm
