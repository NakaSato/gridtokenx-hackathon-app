import { useQuery } from '@tanstack/react-query'
import { createApiClient } from '@/lib/api-client'
import { useAuth } from '@/contexts/AuthProvider'
import { useWallet } from '@solana/wallet-adapter-react'
import { useProfile } from '@/hooks/usePortfolio'
import type { TokenBalance } from '@/types/auth'

/**
 * Standalone hook for fetching wallet balance.
 * Resolves wallet address from profile or Solana wallet adapter.
 */
export function useWalletBalance() {
    const { token } = useAuth()
    const { publicKey } = useWallet()
    const { data: profile } = useProfile()
    const apiClient = createApiClient(token || '')

    const walletAddress = profile?.wallet_address || publicKey?.toString()

    return useQuery<TokenBalance>({
        queryKey: ['wallet-balance', token, walletAddress],
        queryFn: async () => {
            if (!token) throw new Error('Authentication required')
            if (!walletAddress) throw new Error('Wallet address required')
            const response = await apiClient.getBalance(walletAddress)
            if (response.error) throw new Error(response.error)
            return response.data
        },
        enabled: !!token && !!walletAddress,
        refetchInterval: 10000, // Balance refreshes more frequently
    })
}
