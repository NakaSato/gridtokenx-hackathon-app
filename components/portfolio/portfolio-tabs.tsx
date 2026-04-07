'use client'

import { ChevronDown, Loader2 } from 'lucide-react'
import { Button } from '../ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { Card, CardContent } from '../ui/card'
import ProtectedRoute from '../ProtectedRoute'
import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthProvider'
import { usePortfolioPositions, usePortfolioOrders, usePortfolioTradeHistory, useExpiredOptions, useOptionSettlement } from '@/hooks/usePortfolio'
import { format } from 'date-fns'
import OpenPositions from '../OpenPositions'
import OpenOptionOrders from '../OpenOptionOrders'
import OrderHistory from '../OrderHistory'
import { useContext } from 'react'
import { ContractContext } from '@/contexts/contractProvider'
import { useWallet } from '@solana/wallet-adapter-react'
import { connection } from '@/utils/const'
import ExpiredOptions from '../ExpiredOptions'
import { CarbonCredits } from './carbon-credits'

export function PortfolioTabs() {
  const [activeTab, setActiveTab] = useState('positions')
  const { data: positions = [], isLoading: positionsLoading } = usePortfolioPositions()
  const { data: orders = [], isLoading: ordersLoading } = usePortfolioOrders()
  const { data: history = [], isLoading: historyLoading } = usePortfolioTradeHistory()
  const { publicKey, sendTransaction } = useWallet()

  const { program } = useContext(ContractContext)

  const { data: expiredInfos = [], isLoading: expiredLoading } = useExpiredOptions(program, publicKey)
  const { claimMutation, exerciseMutation } = useOptionSettlement(program, connection, publicKey, sendTransaction)

  const onClaim = (optionindex: number, solPrice: number) => {
    claimMutation.mutate({ index: optionindex, solPrice })
  }
  const onExercise = (index: number) => {
    exerciseMutation.mutate(index)
  }

  const loading = positionsLoading || ordersLoading || historyLoading || expiredLoading

  const renderEmptyState = (message: string, subMessage: string) => (
    <Card className="h-full rounded-sm border-dashed">
      <CardContent className="flex h-full min-h-[300px] flex-col items-center justify-center p-8 text-center">
        <p className="font-medium text-foreground">{message}</p>
        <p className="mt-2 text-sm text-muted-foreground">{subMessage}</p>
      </CardContent>
    </Card>
  )

  const renderLoading = () => (
    <div className="flex min-h-[300px] w-full items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  )

  return (
    <Tabs
      defaultValue="positions"
      className="flex w-full flex-1 flex-col space-y-4"
      onValueChange={setActiveTab}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <TabsList className="grid h-fit w-full grid-cols-2 rounded-sm border bg-inherit p-1 sm:w-fit sm:grid-cols-6">
          <TabsTrigger value="positions" className="text-xs sm:text-sm">Positions</TabsTrigger>
          <TabsTrigger value="orders" className="text-xs sm:text-sm">Orders</TabsTrigger>
          <TabsTrigger value="order-history" className="text-xs sm:text-sm">Order History</TabsTrigger>
          <TabsTrigger value="trade-history" className="text-xs sm:text-sm">Trade History</TabsTrigger>
          <TabsTrigger value="funding-history" className="text-xs sm:text-sm">Funding</TabsTrigger>
          <TabsTrigger value="carbon-credits" className="text-xs sm:text-sm">Carbon Credits</TabsTrigger>
        </TabsList>
        <Button variant={'outline'} className="h-fit py-2 text-sm">
          Filter
          <ChevronDown className="ml-2 h-4 w-4" />
        </Button>
      </div>

      <TabsContent value="positions" className="mt-2 min-h-[300px]">
        <ProtectedRoute requireWallet={false} requireAuth={true}>
          {loading ? renderLoading() : (
            <div className="flex flex-col gap-3">
              {positions.length > 0 || expiredInfos.length > 0 ? (
                <>
                  {positions.map((pos, idx) => (
                    <OpenPositions key={idx} {...pos} onExercise={() => onExercise(pos.index)} />
                  ))}
                  {expiredInfos.length > 0 && (
                    <div className="mt-4">
                      <h4 className="mb-2 text-sm font-medium text-muted-foreground">Expired Positions</h4>
                      <ExpiredOptions infos={expiredInfos} onClaim={onClaim} />
                    </div>
                  )}
                </>
              ) : renderEmptyState("No open positions", "Your trading positions will appear here")}
            </div>
          )}
        </ProtectedRoute>
      </TabsContent>

      <TabsContent value="orders" className="mt-2 min-h-[300px]">
        <ProtectedRoute requireWallet={false} requireAuth={true}>
          {loading ? renderLoading() : (
            <div className="flex flex-col gap-3">
              {orders.length > 0 ? (
                orders.map((order, idx) => (
                  <OpenOptionOrders key={idx} {...order} />
                ))
              ) : renderEmptyState("No open orders", "Your pending orders will appear here")}
            </div>
          )}
        </ProtectedRoute>
      </TabsContent>

      <TabsContent value="order-history" className="mt-2 min-h-[300px]">
        <ProtectedRoute requireWallet={false} requireAuth={true}>
          {loading ? renderLoading() : (
            history.length > 0 ? (
              <OrderHistory doneOptioninfos={history} />
            ) : renderEmptyState("No order history", "Your order history will appear here")
          )}
        </ProtectedRoute>
      </TabsContent>

      <TabsContent value="trade-history" className="mt-2 min-h-[300px]">
        <ProtectedRoute requireWallet={false} requireAuth={true}>
          {loading ? renderLoading() : (
            history.length > 0 ? (
              <OrderHistory doneOptioninfos={history.filter((t: any) => t.transactionType === 'Buy' || t.transactionType === 'Sell')} />
            ) : renderEmptyState("No trade history", "Your completed trades will appear here")
          )}
        </ProtectedRoute>
      </TabsContent>

      <TabsContent value="funding-history" className="mt-2 min-h-[300px]">
        <ProtectedRoute requireWallet={false} requireAuth={true}>
          {renderEmptyState("No funding history", "Funding payments will appear here")}
        </ProtectedRoute>
      </TabsContent>

      <TabsContent value="carbon-credits" className="mt-2 min-h-[300px]">
        <ProtectedRoute requireWallet={false} requireAuth={true}>
          <CarbonCredits />
        </ProtectedRoute>
      </TabsContent>
    </Tabs>
  )
}
