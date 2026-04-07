'use client'

import { useCallback, useContext, useEffect, useState, memo } from 'react'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader } from './ui/card'
import { Skeleton } from './ui/skeleton'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Tabs, TabsList, TabsTrigger } from './ui/tabs'
import {
  Activity,
  History,
  BookOpen,
  Clock,
  RotateCw,
  Ban,
  Bell,
  Repeat,
  AlertCircle,
  Zap,
  type LucideIcon,
} from 'lucide-react'
import OpenPositions from './OpenPositions'
import OrderHistory from './OrderHistory'
import { Position } from '@/lib/data/Positions'
import LiveGridStats from './LiveGridStats'
import ExpiredOptions from './ExpiredOptions'
import PriceAlerts from './trading/PriceAlerts'
import RecurringOrdersList from './trading/RecurringOrdersList'
import { RecurringOrderForm } from './trading/RecurringOrderForm'
import { ContractContext } from '@/contexts/contractProvider'
import { Transaction } from '@/lib/data/WalletActivity'
import Pagination from './Pagination'
import OpenOptionOrders from './OpenOptionOrders'
import { useAuth } from '@/contexts/AuthProvider'
import { createApiClient } from '@/lib/api-client'
import type { Order } from '@/lib/data/Positions'
import { format } from 'date-fns'
import { useOptionPositions } from '@/hooks/useOptions'
import {
  ApiFuturesPosition,
  ApiOrder,
  TradeRecord,
  OnChainTradeRecord,
} from '@/types/trading'

import { PublicKey } from '@solana/web3.js'

// ─────────────────────────────────────────────────────────────────────────────
// Tab Configuration
// ─────────────────────────────────────────────────────────────────────────────

type TabValue =
  | 'Positions'
  | 'OpenOrders'
  | 'History'
  | 'Alerts'
  | 'Expired'
  | 'DCA'
  | 'LiveGrid'
  | 'OrderBook'

interface TabConfig {
  value: TabValue
  label: string
  icon: LucideIcon
  showBadge?: boolean
}

const TABS: TabConfig[] = [
  { value: 'Positions', label: 'Positions', icon: Activity, showBadge: true },
  { value: 'LiveGrid', label: 'Live Grid', icon: Zap },

  { value: 'OpenOrders', label: 'My Orders', icon: BookOpen },
  { value: 'History', label: 'History', icon: History },
  { value: 'Alerts', label: 'Alerts', icon: Bell },
  { value: 'Expired', label: 'Expired', icon: Ban },
  { value: 'DCA', label: 'DCA', icon: Repeat },
]

// ─────────────────────────────────────────────────────────────────────────────
// EmptyState Component
// ─────────────────────────────────────────────────────────────────────────────

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
}

function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center space-y-4 py-10 text-center">
      <div className="bg-muted/50 flex h-12 w-12 items-center justify-center rounded-full">
        <Icon className="h-6 w-6 text-muted-foreground" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      {actionLabel && onAction && (
        <Button
          variant="outline"
          size="sm"
          className="mt-2 text-xs"
          onClick={onAction}
        >
          {actionLabel}
        </Button>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// ErrorState Component
// ─────────────────────────────────────────────────────────────────────────────

interface ErrorStateProps {
  message: string
  onRetry: () => void
}

function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center space-y-4 py-10 text-center">
      <div className="bg-destructive/10 flex h-12 w-12 items-center justify-center rounded-full">
        <AlertCircle className="h-6 w-6 text-destructive" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium">Failed to load data</p>
        <p className="text-xs text-muted-foreground">{message}</p>
      </div>
      <Button
        variant="outline"
        size="sm"
        className="mt-2 text-xs"
        onClick={onRetry}
      >
        <RotateCw className="mr-1 h-3 w-3" />
        Retry
      </Button>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────

export default memo(function TradingPositions() {
  const { token } = useAuth()
  const [activeTab, setActiveTab] = useState<TabValue>('Positions')
  const [optioninfos, setOptionInfos] = useState<Position[]>([])
  const [orderInfos, setOrderInfos] = useState<Order[]>([])
  const [doneInfo, setDoneInfo] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date())

  const { program, pub, onClaimOption, onExerciseOption } =
    useContext(ContractContext)

  const { data: blockchainPositions } = useOptionPositions(program, pub || null)

  // Reset pagination when switching tabs
  const handleTabChange = useCallback((value: string) => {
    setActiveTab(value as TabValue)
    setCurrentPage(1)
  }, [])

  const onClaim = useCallback(
    (optionindex: number, solPrice: number) => {
      onClaimOption(optionindex, solPrice)
    },
    [onClaimOption]
  )

  const onExercise = useCallback(
    (index: number) => {
      onExerciseOption(index)
    },
    [onExerciseOption]
  )

  const fetchData = useCallback(async () => {
    if (!token) return
    setLoading(true)
    setError(null)
    try {
      const apiClient = createApiClient(token)

      // 1. Fetch Futures Positions
      const positionsRes =
        (await apiClient.getFuturesPositions()) as unknown as {
          data: { data: ApiFuturesPosition[] }
        }
      if (positionsRes.data?.data) {
        const mappedPositions: Position[] = positionsRes.data.data.map(
          (pos: ApiFuturesPosition) => ({
            index: pos.id,
            token: pos.product_symbol || 'Unknown',
            logo: '/images/solana.png',
            symbol: pos.product_symbol || 'GRX',
            type: pos.side === 'long' ? 'Call' : 'Put',
            strikePrice: parseFloat(pos.entry_price),
            expiry: 'Perpetual',
            size: parseFloat(pos.quantity),
            pnl: parseFloat(pos.unrealized_pnl || '0'),
            greeks: { delta: 0, gamma: 0, theta: 0, vega: 0 },
          })
        )
        setOptionInfos(mappedPositions)
      }

      // 2. Fetch Trading Orders
      const ordersRes = (await apiClient.getOrders({
        status: 'active',
      })) as unknown as { data: { data: ApiOrder[] } }
      if (ordersRes.data?.data) {
        const mappedOrders: Order[] = ordersRes.data.data.map(
          (order: ApiOrder) => ({
            index: order.id,
            token: 'GRID',
            logo: '/images/grid.png',
            symbol: 'GRX',
            type: order.order_type || 'Limit',
            transaction: order.side.toLowerCase(),
            limitPrice: parseFloat(order.price_per_kwh),
            strikePrice: 0,
            expiry: order.expires_at
              ? format(new Date(order.expires_at), 'MM/dd/yyyy')
              : 'N/A',
            orderDate: format(new Date(order.created_at), 'MM/dd/yyyy'),
            size: parseFloat(order.energy_amount),
          })
        )
        setOrderInfos(mappedOrders)
      }

      // 3. Fetch Trade History from Blockchain
      if (program && pub) {
        try {
          // @ts-ignore
          const tradeRecordsRaw = await program.account.tradeRecord.all()
          const userTrades = tradeRecordsRaw
            .map((r: any) => r.account as OnChainTradeRecord)
            .filter(
              (t: OnChainTradeRecord) =>
                t.buyer.toBase58() === pub.toBase58() ||
                t.seller.toBase58() === pub.toBase58()
            )
            .sort(
              (a: OnChainTradeRecord, b: OnChainTradeRecord) =>
                b.executedAt.toNumber() - a.executedAt.toNumber()
            )

          const mappedHistory: Transaction[] = userTrades.map(
            (trade: OnChainTradeRecord) => ({
              transactionID: trade.executedAt.toString(), // Using timestamp as ID for now
              token: {
                name: 'GridToken',
                symbol: 'GRX',
                logo: '/images/grid.png',
              },
              transactionType:
                trade.buyer.toBase58() === pub.toBase58() ? 'Buy' : 'Sell',
              optionType: 'Spot',
              strikePrice: trade.pricePerKwh.toNumber() / 1000000, // micro-units to standard
              quantity: trade.amount.toNumber() / 1000, // Wh to kWh
              totalValue: trade.totalValue.toNumber() / 1000000, // micro-units
              expiry: format(
                new Date(trade.executedAt.toNumber() * 1000),
                'dd MMM, yyy HH:mm:ss'
              ),
            })
          )
          setDoneInfo(mappedHistory)
        } catch (e) {
          console.error('Failed to fetch on-chain trade history', e)
        }
      } else {
        // Fallback to API if program not ready (or keep existing logic)
        const tradesRes = (await apiClient.getTrades({
          limit: 50,
        })) as unknown as { data: { trades: TradeRecord[] } }
        if (tradesRes.data?.trades) {
          const mappedHistory: Transaction[] = tradesRes.data.trades.map(
            (trade: TradeRecord) => ({
              transactionID: trade.id,
              token: {
                name: 'GridToken',
                symbol: 'GRX',
                logo: '/images/grid.png',
              },
              transactionType: trade.role === 'buyer' ? 'Buy' : 'Sell',
              optionType: 'Spot',
              strikePrice: parseFloat(trade.price),
              expiry: format(
                new Date(trade.executed_at),
                'dd MMM, yyy HH:mm:ss'
              ),
            })
          )
          setDoneInfo(mappedHistory)
        }
      }
      setLastRefreshed(new Date())
    } catch (err) {
      console.error('Error fetching trading data:', err)
      setError(
        err instanceof Error ? err.message : 'An unexpected error occurred'
      )
    } finally {
      setLoading(false)
    }
  }, [token, program, pub])

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 60000)
    return () => clearInterval(interval)
  }, [fetchData])

  // Consolidate positions: futures + blockchain options
  const allPositions = [...optioninfos, ...(blockchainPositions?.active || [])]
  const expiredInfos = blockchainPositions?.expired || []

  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage

  // Get badge count for tabs
  const getBadgeCount = (tabValue: TabValue): number | null => {
    switch (tabValue) {
      case 'Positions':
        return allPositions.length > 0 ? allPositions.length : null
      case 'OpenOrders':
        return orderInfos.length > 0 ? orderInfos.length : null
      default:
        return null
    }
  }

  return (
    <Card className="flex h-full w-full flex-col overflow-hidden rounded-lg border border-border bg-card shadow-sm">
      <CardHeader className="bg-muted/20 border-b p-0">
        <div className="flex w-full items-center justify-between">
          <Tabs
            value={activeTab}
            onValueChange={handleTabChange}
            className="h-6"
          >
            <TabsList className="bg-secondary/50 h-full gap-0.5 rounded-md p-0.5">
              {TABS.map(({ value, label, icon: Icon, showBadge }) => {
                const badgeCount = showBadge ? getBadgeCount(value) : null
                return (
                  <TabsTrigger
                    key={value}
                    value={value}
                    className="h-full rounded-sm px-2 text-[10px] data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
                  >
                    <div className="flex items-center gap-1">
                      <Icon className="h-3 w-3" />
                      <span>{label}</span>
                      {badgeCount !== null && (
                        <Badge
                          variant="secondary"
                          className="h-3.5 px-1 text-[8px]"
                        >
                          {badgeCount}
                        </Badge>
                      )}
                    </div>
                  </TabsTrigger>
                )
              })}
            </TabsList>
          </Tabs>

          <div className="flex h-6 items-center gap-1.5">
            <div className="hidden items-center gap-1 text-[10px] text-muted-foreground md:flex">
              <Clock className="h-3 w-3" />
              <span>
                {lastRefreshed.toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="h-6 px-2 text-[10px] font-medium leading-none"
            >
              Liq
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-6 px-2 text-[10px] font-medium leading-none"
            >
              TP/SL
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-muted-foreground hover:text-foreground"
              onClick={fetchData}
            >
              <RotateCw
                className={cn('h-3.5 w-3.5', loading && 'animate-spin')}
              />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="min-h-0 flex-1 overflow-hidden p-0">
        <div className="flex h-full flex-col">
          {loading ? (
            <div className="flex flex-1 flex-col space-y-3 p-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex flex-col space-y-2">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-5 w-24" />
                  </div>
                  <Skeleton className="h-12 w-full" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="flex flex-1 items-center justify-center">
              <ErrorState message={error} onRetry={fetchData} />
            </div>
          ) : (
            <div className="min-h-0 flex-1 overflow-hidden">
              {activeTab === 'Positions' && (
                <div className="flex h-full flex-col">
                  {allPositions.length > 0 ? (
                    <>
                      <div className="min-h-0 flex-1 overflow-y-auto">
                        <div className="flex flex-col space-y-3">
                          {allPositions
                            .slice(indexOfFirstItem, indexOfLastItem)
                            .map((position, index) => (
                              <OpenPositions
                                key={position.index ?? index}
                                index={position.index}
                                token={position.token}
                                logo={position.logo}
                                symbol={position.symbol}
                                type={position.type}
                                strikePrice={position.strikePrice}
                                expiry={position.expiry}
                                size={position.size}
                                pnl={position.pnl}
                                greeks={position.greeks}
                                onExercise={() => onExercise(position.index)}
                              />
                            ))}
                        </div>
                      </div>
                      <div className="flex-shrink-0 border-t border-border">
                        <Pagination
                          currentPage={currentPage}
                          totalItems={allPositions.length}
                          itemsPerPage={itemsPerPage}
                          onPageChange={setCurrentPage}
                        />
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-1 items-center justify-center">
                      <EmptyState
                        icon={Activity}
                        title="No Positions Open"
                        description="Your active futures and options will appear here."
                        actionLabel="Start Trading"
                        onAction={() => {}}
                      />
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'OpenOrders' && (
                <div className="flex h-full flex-col">
                  {orderInfos.length > 0 ? (
                    <>
                      <div className="min-h-0 flex-1 overflow-y-auto">
                        <div className="flex flex-col space-y-3">
                          {orderInfos
                            .slice(indexOfFirstItem, indexOfLastItem)
                            .map((pos, idx) => (
                              <OpenOptionOrders
                                key={pos.index ?? idx}
                                logo={pos.logo}
                                token={pos.token}
                                symbol={pos.symbol}
                                type={pos.type}
                                limitPrice={pos.limitPrice}
                                transaction={pos.transaction}
                                strikePrice={pos.strikePrice}
                                expiry={pos.expiry}
                                size={pos.size}
                                orderDate={pos.orderDate}
                              />
                            ))}
                        </div>
                      </div>
                      <div className="flex-shrink-0 border-t border-border">
                        <Pagination
                          currentPage={currentPage}
                          totalItems={orderInfos.length}
                          itemsPerPage={itemsPerPage}
                          onPageChange={setCurrentPage}
                        />
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-1 items-center justify-center">
                      <EmptyState
                        icon={BookOpen}
                        title="No Orders Open"
                        description="Your pending limit orders will be listed here."
                      />
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'History' && (
                <div
                  className={cn(
                    'flex h-full flex-col overflow-y-auto',
                    doneInfo.length > 0 ? '' : 'items-center justify-center'
                  )}
                >
                  {doneInfo.length > 0 ? (
                    <OrderHistory doneOptioninfos={doneInfo} />
                  ) : (
                    <EmptyState
                      icon={History}
                      title="No History Available"
                      description="Your trade history will be compiled once you start trading."
                    />
                  )}
                </div>
              )}

              {activeTab === 'Alerts' && (
                <div className="flex h-full flex-col overflow-y-auto">
                  <PriceAlerts />
                </div>
              )}

              {activeTab === 'Expired' && (
                <div
                  className={cn(
                    'flex h-full flex-col overflow-y-auto',
                    expiredInfos.length > 0 ? '' : 'items-center justify-center'
                  )}
                >
                  {expiredInfos.length > 0 ? (
                    <ExpiredOptions infos={expiredInfos} onClaim={onClaim} />
                  ) : (
                    <EmptyState
                      icon={Ban}
                      title="No Expired Positions"
                      description="Your expired options and claims will appear here."
                    />
                  )}
                </div>
              )}

              {activeTab === 'DCA' && (
                <div className="flex h-full flex-col gap-4 overflow-y-auto">
                  <RecurringOrderForm />
                  <RecurringOrdersList />
                </div>
              )}

              {activeTab === 'LiveGrid' && <LiveGridStats />}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
})
