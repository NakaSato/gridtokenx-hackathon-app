'use client'

import React from 'react'
import ProtectedRoute from '@/components/ProtectedRoute'
import TradingPositionsFallback from '@/components/TradingPositionsFallback'
import TradingPositions from '@/components/TradingPositions'
import { useWalletBalance } from '@/hooks/useWalletBalance'
import { useAuth } from '@/contexts/AuthProvider'
import { Wallet } from 'lucide-react'

const TradingPositionsPanel = React.memo(function TradingPositionsPanel() {
  const { token } = useAuth()
  const { data: balanceData, isLoading: balanceLoading } = useWalletBalance()
  const rawBalance = balanceData?.token_balance
  const balance = rawBalance != null ? Number(rawBalance) : null

  return (
    <div className="border-border/50 w-full flex-shrink-0 border-t bg-card delay-200 duration-700 animate-in fade-in slide-in-from-bottom-4">
      <div className="p-0">
        {/* Available Balance from API */}
        {token && (
          <div className="flex items-center justify-end gap-2 border-b border-border/50 px-4 py-1.5">
            <Wallet className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Available Balance:</span>
            <span className="font-mono text-xs font-semibold text-foreground">
              {balanceLoading ? '...' : balance?.toFixed(2) || '0.00'} GRX
            </span>
          </div>
        )}
        <div className="m-0 border-none p-0">
          <ProtectedRoute fallback={<TradingPositionsFallback />}>
            <TradingPositions />
          </ProtectedRoute>
        </div>
      </div>
    </div>
  )
})

export default TradingPositionsPanel
