'use client'

import { useEffect, useState, useCallback } from 'react'
import { format } from 'date-fns'
import { Loader2, Copy, ExternalLink, RefreshCw } from 'lucide-react'
import { Separator } from './ui/separator'
import { ScrollArea } from './ui/scroll-area'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { cn } from '@/lib/utils'
import { createApiClient } from '@/lib/api-client'
import { useAuth } from '@/contexts/AuthProvider'
import { useTransactionUpdates } from '@/hooks/useTransactionUpdates'
import type { UserTransaction } from '@/types/transactions'
import toast from 'react-hot-toast'

type ActivityTab = 'all' | 'buy' | 'sell' | 'p2p'

/**
 * Get human-readable label for transaction type
 */
function getTransactionTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    EnergyTrade: 'Energy Trade',
    TokenMint: 'Token Mint',
    TokenBurn: 'Token Burn',
    Stake: 'Stake',
    Unstake: 'Unstake',
    Reward: 'Reward',
  }
  return labels[type] || type
}

/**
 * Get status badge color classes
 */
function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    confirmed: 'bg-green-500/10 text-green-500 border-green-500/20',
    settled: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    pending: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    processing: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    submitted: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20',
    failed: 'bg-red-500/10 text-red-500 border-red-500/20',
  }
  return colors[status] || 'bg-secondary text-secondary-foreground'
}

/**
 * Get icon for transaction type
 */
function getTransactionIcon(type: string, side?: string): string {
  if (side === 'buy') return '🟢'
  if (side === 'sell') return '🔴'

  const icons: Record<string, string> = {
    EnergyTrade: '⚡',
    TokenMint: '🪙',
    TokenBurn: '🔥',
    Stake: '📥',
    Unstake: '📤',
    Reward: '🎁',
  }
  return icons[type] || '📋'
}

export default function WalletActivity() {
  const { token, user } = useAuth()
  const [transactions, setTransactions] = useState<UserTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<ActivityTab>('all')

  // Real-time updates
  const { latestUpdate } = useTransactionUpdates({
    showToasts: false, // We handle display in the list
    onUpdate: (update) => {
      // Update the transaction in our list if it exists
      setTransactions((prev) =>
        prev.map((tx) =>
          tx.operation_id === update.operation_id
            ? { ...tx, status: update.new_status as any, signature: update.signature }
            : tx
        )
      )
    },
  })

  // Fetch transactions from API
  const fetchTransactions = useCallback(async () => {
    if (!token) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const apiClient = createApiClient(token)
      const response = await apiClient.getUserTransactions({ limit: 50 })

      if (response.error) {
        setError(response.error)
      } else if (response.data) {
        setTransactions(response.data.transactions || [])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch transactions')
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    fetchTransactions()
  }, [fetchTransactions])

  // Filter transactions based on active tab
  const filteredTransactions = transactions.filter((tx) => {
    if (activeTab === 'all') return true
    if (activeTab === 'buy') return tx.metadata?.side === 'buy'
    if (activeTab === 'sell') return tx.metadata?.side === 'sell'
    if (activeTab === 'p2p') return tx.transaction_type === 'EnergyTrade'
    return true
  })

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard')
  }

  const truncateId = (id: string) => `${id.slice(0, 8)}...${id.slice(-4)}`

  return (
    <div className="flex h-[calc(100vh-280px)] flex-col space-y-3">
      {/* Tab Navigation */}
      <div className="grid grid-cols-12 gap-0 border-b border-primary">
        <Button
          variant="ghost"
          className={cn(
            'col-span-3 rounded-none border-x border-t border-primary px-0 text-sm shadow-none',
            activeTab === 'all'
              ? 'rounded-t-sm border-b-transparent bg-primary text-black hover:bg-primary hover:text-black'
              : 'border-x-0 border-b border-t-0 border-primary bg-inherit text-foreground'
          )}
          onClick={() => setActiveTab('all')}
        >
          All
        </Button>

        <Button
          variant="ghost"
          className={cn(
            'col-span-3 rounded-none border-x border-t border-primary px-0 text-sm shadow-none',
            activeTab === 'buy'
              ? 'rounded-t-sm border-b-transparent bg-primary text-black hover:bg-primary hover:text-black'
              : 'border-x-0 border-b border-t-0 border-primary bg-inherit text-foreground'
          )}
          onClick={() => setActiveTab('buy')}
        >
          Buy
        </Button>

        <Button
          variant="ghost"
          className={cn(
            'col-span-3 rounded-none border-x border-t border-primary px-0 text-sm shadow-none',
            activeTab === 'sell'
              ? 'rounded-t-sm border-b-transparent bg-primary text-black hover:bg-primary hover:text-black'
              : 'border-x-0 border-b border-t-0 border-primary bg-inherit text-foreground'
          )}
          onClick={() => setActiveTab('sell')}
        >
          Sell
        </Button>

        <div className="col-span-3 flex items-center justify-end border-b border-primary pr-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={fetchTransactions}
            disabled={loading}
          >
            <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
          </Button>
        </div>
      </div>

      {/* Transaction List */}
      <ScrollArea className="flex-grow pr-3">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="space-y-2">
            <div className="rounded-sm border border-red-500/20 bg-red-500/10 p-3 text-center text-xs text-red-500">
              {error}
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={fetchTransactions}
            >
              Retry
            </Button>
          </div>
        ) : !token ? (
          <div className="py-4 text-center text-xs text-secondary-foreground">
            Please connect your wallet to view activity
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="py-4 text-center text-xs text-secondary-foreground">
            No transactions found
          </div>
        ) : (
          <div className="flex w-full flex-col space-y-2">
            {filteredTransactions.map((tx, index) => (
              <div
                key={tx.operation_id}
                className={cn(
                  'rounded-md border border-secondary bg-secondary/30 p-3 transition-colors hover:bg-secondary/50',
                  latestUpdate?.operation_id === tx.operation_id && 'ring-1 ring-primary'
                )}
              >
                <div className="mb-2 flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">
                      {getTransactionIcon(tx.transaction_type, tx.metadata?.side)}
                    </span>
                    <div>
                      <span className="text-sm font-medium">
                        {getTransactionTypeLabel(tx.transaction_type)}
                      </span>
                      {tx.metadata?.energy_amount && (
                        <span className="ml-2 text-xs text-secondary-foreground">
                          {tx.metadata.energy_amount.toFixed(2)} kWh
                        </span>
                      )}
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={cn('text-[10px] font-semibold uppercase', getStatusColor(tx.status))}
                  >
                    {tx.status}
                  </Badge>
                </div>

                {/* Transaction Details */}
                <div className="space-y-1 text-xs text-secondary-foreground">
                  <div className="flex items-center justify-between">
                    <span>ID:</span>
                    <div className="flex items-center gap-1">
                      <span className="font-mono">{truncateId(tx.operation_id)}</span>
                      <button
                        onClick={() => copyToClipboard(tx.operation_id)}
                        className="text-primary hover:text-primary/80"
                      >
                        <Copy className="h-3 w-3" />
                      </button>
                    </div>
                  </div>

                  {tx.signature && (
                    <div className="flex items-center justify-between">
                      <span>Signature:</span>
                      <div className="flex items-center gap-1">
                        <span className="font-mono">{truncateId(tx.signature)}</span>
                        <button
                          onClick={() => copyToClipboard(tx.signature!)}
                          className="text-primary hover:text-primary/80"
                        >
                          <Copy className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  )}

                  {tx.metadata?.total_amount && (
                    <div className="flex items-center justify-between">
                      <span>Amount:</span>
                      <span className="font-medium text-foreground">
                        ฿{tx.metadata.total_amount.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                  )}

                  {tx.last_error && (
                    <div className="mt-1 rounded bg-red-500/10 px-2 py-1 text-red-500">
                      Error: {tx.last_error}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-1 text-[10px]">
                    <span>{format(new Date(tx.created_at), 'MMM d, h:mm a')}</span>
                    {tx.confirmed_at && (
                      <span className="text-green-500">
                        Confirmed {format(new Date(tx.confirmed_at), 'h:mm a')}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  )
}
