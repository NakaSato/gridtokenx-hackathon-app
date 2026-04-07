'use client'

/**
 * React Hooks for API Client
 */

import { useState, useCallback, useEffect, useMemo } from 'react'
import { ApiClient, ApiResponse, createApiClient } from '../lib/api-client'
import type { Role } from '@/types/auth'

// =============================================================================
// TYPES
// =============================================================================

/** Generic API request state */
export interface ApiRequestState<T> {
  data: T | null
  loading: boolean
  error: string | null
}

/** Generic API request return type */
export interface ApiRequestResult<T> extends ApiRequestState<T> {
  execute: () => Promise<void>
  refetch: () => Promise<void>
}

// =============================================================================
// HOOKS
// =============================================================================

/**
 * Hook to access the API client with optional authentication
 */
export function useApiClient(token?: string) {
  const [client] = useState(() => createApiClient(token))

  useEffect(() => {
    if (token) {
      client.setToken(token)
    } else {
      client.clearToken()
    }
  }, [client, token])

  return client
}

/**
 * Generic hook for API requests with loading and error states
 */
export function useApiRequest<T = unknown>(
  requestFn: () => Promise<ApiResponse<T>>,
  dependencies: unknown[] = []
): ApiRequestResult<T> {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const execute = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await requestFn()

      if (response.error) {
        setError(response.error)
        setData(null)
      } else {
        setData(response.data ?? null)
        setError(null)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [requestFn])

  return {
    data,
    loading,
    error,
    execute,
    refetch: execute,
  }
}

/**
 * Hook for fetching order book data
 */
export function useOrderBook(token?: string) {
  const client = useApiClient(token)

  const { data, loading, error, refetch } = useApiRequest(
    () => client.getOrderBook(),
    [token]
  )

  return {
    orderBook: data,
    loading,
    error,
    refetch,
  }
}

/**
 * Hook for fetching market data
 */
export function useMarketData(token?: string) {
  const client = useApiClient(token)

  const { data, loading, error, refetch } = useApiRequest(
    () => client.getMarketData(),
    [token]
  )

  return {
    marketData: data,
    loading,
    error,
    refetch,
  }
}

/**
 * Hook for fetching market configurations
 */
export function useMarketConfig(token?: string) {
  const client = useApiClient(token)

  const { data, loading, error, refetch } = useApiRequest(
    () => client.getMarketConfig(),
    [token]
  )

  return {
    marketConfig: data,
    loading,
    error,
    refetch,
  }
}

/**
 * Hook for creating orders
 */
export function useCreateOrder(token?: string) {
  const client = useApiClient(token)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createOrder = useCallback(
    async (orderData: {
      energy_amount: string
      price_per_kwh: string
      order_type?: string
    }) => {
      setLoading(true)
      setError(null)

      try {
        const response = await client.createOrder(orderData)

        if (response.error) {
          setError(response.error)
          return null
        }

        return response.data
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Unknown error'
        setError(errorMessage)
        return null
      } finally {
        setLoading(false)
      }
    },
    [client]
  )

  return {
    createOrder,
    loading,
    error,
  }
}

/**
 * Hook for fetching user profile
 */
export function useUserProfile(token?: string) {
  const client = useApiClient(token)

  const { data, loading, error, refetch } = useApiRequest(
    () => client.getProfile(),
    [token]
  )

  return {
    profile: data,
    loading,
    error,
    refetch,
  }
}

/**
 * Hook for fetching user balance
 */
export function useUserBalance(token?: string, walletAddress?: string) {
  const client = useApiClient(token)

  const { data, loading, error, refetch } = useApiRequest(
    () => client.getBalance(walletAddress),
    [token, walletAddress]
  )

  return {
    balance: data,
    loading,
    error,
    refetch,
  }
}

/**
 * Hook for fetching user positions
 */
export function useUserPositions(token?: string) {
  const client = useApiClient(token)

  const { data, loading, error, refetch } = useApiRequest(
    () => client.getPositions(),
    [token]
  )

  return {
    positions: data,
    loading,
    error,
    refetch,
  }
}

/**
 * Hook for fetching trades
 */
export function useTrades(
  token?: string,
  filters?: { limit?: number; offset?: number }
) {
  const client = useApiClient(token)

  const { data, loading, error, refetch } = useApiRequest(
    () => client.getTrades(filters),
    [token, filters]
  )

  return {
    trades: data,
    loading,
    error,
    refetch,
  }
}

/**
 * Hook for authentication
 */
export function useAuth() {
  const [token, setToken] = useState<string | null>(null)
  const client = useApiClient(token ?? undefined)

  useEffect(() => {
    // Load token from localStorage on mount
    const storedToken = localStorage.getItem('auth_token')
    if (storedToken) {
      setToken(storedToken)
    }
  }, [])

  const login = useCallback(
    async (email: string, password: string) => {
      const response = await client.login(email, password)

      if (response.error) {
        throw new Error(response.error)
      }

      const newToken = response.data?.access_token
      if (newToken) {
        setToken(newToken)
        localStorage.setItem('auth_token', newToken)
      }

      return response.data
    },
    [client]
  )

  const logout = useCallback(async () => {
    await client.logout()
    setToken(null)
    localStorage.removeItem('auth_token')
  }, [client])

  const register = useCallback(
    async (userData: {
      username: string
      email: string
      password: string
      first_name: string
      last_name: string
      role?: Role
      wallet_address?: string
    }) => {
      const response = await client.register(userData)

      if (response.error) {
        throw new Error(response.error)
      }

      return response.data
    },
    [client]
  )

  return {
    token,
    login,
    logout,
    register,
    isAuthenticated: !!token,
  }
}

/**
 * Hook for tracking aggregate market statistics
 */
export function useMarketStats(token?: string) {
  const [stats, setStats] = useState<import('../types/trading').MarketStatsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const client = useMemo(() => createApiClient(token), [token])

  const fetchStats = useCallback(async () => {
    try {
      const response = await client.getMarketStats()
      if (response.error) {
        setError(response.error)
      } else if (response.data) {
        setStats(response.data)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch market stats')
    } finally {
      setLoading(false)
    }
  }, [client])

  useEffect(() => {
    fetchStats()
    const interval = setInterval(fetchStats, 30000) // Poll every 30s
    return () => clearInterval(interval)
  }, [fetchStats])

  return { stats, loading, error, refresh: fetchStats }
}

/**
 * Hook for fetching user meters
 */
export function useMeters(token?: string) {
  const client = useApiClient(token)
  const { data, loading, error, refetch } = useApiRequest(
    () => client.getMyMeters(),
    [token]
  )
  return { meters: data, loading, error, refetch }
}
