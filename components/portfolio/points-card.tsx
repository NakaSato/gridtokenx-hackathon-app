'use client'

import { useQuery } from '@tanstack/react-query'
import { Card, CardContent } from '../ui/card'
import { Zap, Award, RefreshCw } from 'lucide-react'
import { useAuth } from '@/contexts/AuthProvider'
import { useWallet } from '@solana/wallet-adapter-react'
import { createApiClient } from '@/lib/api-client'
import { Skeleton } from '../ui/skeleton'
import { Button } from '../ui/button'

export function PointsCard() {
  const { user, token, isAuthenticated } = useAuth()
  const { publicKey } = useWallet()
  const walletAddress = user?.wallet_address || publicKey?.toString()

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['energy-credits', token, walletAddress],
    queryFn: async () => {
      if (!walletAddress) {
        return { balance: 0, tokenMint: null }
      }

      const apiClient = createApiClient(token || '')
      const response = await apiClient.getBalance(walletAddress)

      if (response.error) {
        throw new Error(response.error)
      }

      return {
        balance: response.data?.token_balance_raw ?? response.data?.token_balance ?? 0,
        tokenMint: response.data?.token_mint ?? null,
        solBalance: response.data?.balance_sol ?? 0,
      }
    },
    enabled: !!walletAddress,
    staleTime: 15000,
    refetchInterval: 30000,
  })

  const points = typeof data?.balance === 'string' ? parseFloat(data.balance) : (data?.balance ?? 0)

  const formatPoints = (value: number): string => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(2)}M`
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(2)}K`
    }
    return value.toFixed(0)
  }

  if (!isAuthenticated && !walletAddress) {
    return (
      <Card className="w-full rounded-sm">
        <CardContent className="p-6">
          <div className="mb-4 flex items-start justify-between">
            <div className="flex items-center gap-2">
              <Award className="h-4 w-4 text-primary" />
              <h1 className="text-sm font-medium text-muted-foreground">Energy Credits</h1>
            </div>
            <Zap className="h-5 w-5 text-green-500" />
          </div>
          <div className="text-sm text-muted-foreground">Connect wallet to view</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full rounded-sm">
      <CardContent className="p-6">
        <div className="mb-4 flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Award className="h-4 w-4 text-primary" />
            <h1 className="text-sm font-medium text-muted-foreground">Energy Credits</h1>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => refetch()}
              disabled={isLoading || isRefetching}
            >
              <RefreshCw className={`h-3 w-3 ${isRefetching ? 'animate-spin' : ''}`} />
            </Button>
            <Zap className="h-5 w-5 text-green-500" />
          </div>
        </div>
        {isLoading ? (
          <Skeleton className="h-9 w-20" />
        ) : (
          <>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold text-foreground">{formatPoints(points)}</span>
              <span className="text-sm text-muted-foreground">GRX</span>
            </div>
            {data?.solBalance !== undefined && data.solBalance > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                + {data.solBalance.toFixed(4)} SOL
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
