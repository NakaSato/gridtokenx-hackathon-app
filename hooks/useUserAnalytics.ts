import { useQuery } from '@tanstack/react-query'
import { createApiClient } from '@/lib/api-client'
import { useAuth } from '@/contexts/AuthProvider'

/**
 * Hook for fetching user energy and performance statistics
 */
export function useUserStats() {
    const { token } = useAuth()
    const apiClient = createApiClient(token || '')

    return useQuery({
        queryKey: ['user-stats', token],
        queryFn: async () => {
            if (!token) throw new Error('Authentication required')
            const response = await apiClient.getUserAnalytics({ timeframe: 'all' })
            if (response.error) throw new Error(response.error)
            return response.data || {
                total_energy_produced: 0,
                total_energy_consumed: 0,
                net_energy: 0,
                token_balance: 0,
                total_orders: 0,
                successful_trades: 0,
                total_profit_loss: 0
            }
        },
        enabled: !!token,
        refetchInterval: 30000, // Sync with the original 30s interval
    })
}

/**
 * Hook for fetching user meter readings
 */
export function useEnergyReadings(limit = 24) {
    const { token } = useAuth()
    const apiClient = createApiClient(token || '')

    return useQuery({
        queryKey: ['energy-readings', token, limit],
        queryFn: async () => {
            if (!token) throw new Error('Authentication required')
            const response = await apiClient.getMyReadings(limit)
            if (response.error) throw new Error(response.error)
            return response.data || []
        },
        enabled: !!token,
        refetchInterval: 30000,
    })
}

/**
 * Hook for fetching user trade history
 */
export function useTradeHistory(limit = 10) {
    const { token } = useAuth()
    const apiClient = createApiClient(token || '')

    return useQuery({
        queryKey: ['user-trade-history', token, limit],
        queryFn: async () => {
            if (!token) throw new Error('Authentication required')
            const response = await apiClient.getUserHistory({ timeframe: 'all' })
            if (response.error) throw new Error(response.error)
            // Note: Use limit on the client side or update API client if needed
            const data = response.data || []
            return data.slice(0, limit)
        },
        enabled: !!token,
        refetchInterval: 60000,
    })
}
