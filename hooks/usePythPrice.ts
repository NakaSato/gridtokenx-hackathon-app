import { useState, useEffect, useRef, useMemo } from 'react'
import { PRICE_FEEDS } from '../lib/data/price-feed'
import { HermesClient } from '@pythnetwork/hermes-client'
import { useQuery, useQueryClient } from '@tanstack/react-query'

const PYTH_ENDPOINT = 'https://hermes.pyth.network'
const POLLING_INTERVAL = 15000
const HISTORICAL_INTERVAL = 45000

export interface PythPriceState {
  price: number | null
  confidence: number | null
  timestamp: number | null
}

interface UsePythPriceResult {
  priceData: PythPriceState
  loading: boolean
  error: string | null
}

interface PriceChangeState {
  currentPrice: number | null
  pastPrice: number | null
  change: number | null
  percentChange: number | null
  loading: boolean
  error: string | null
}

export function usePythPrice(token: string): UsePythPriceResult {
  const feed = PRICE_FEEDS.find((f) => f.token === token)

  const queryClient = useQueryClient()
  const { data, isLoading, error } = useQuery({
    queryKey: ['pythPrice', token],
    queryFn: async () => {
      if (!feed) throw new Error('Invalid token')

      const res = await fetch(`/api/pyth-price?id=${feed.id}`)
      if (!res.ok) throw new Error(`Fetch failed: ${res.statusText}`)

      const data = await res.json()
      const price =
        parseFloat(data.parsed[0].price.price) *
        Math.pow(10, data.parsed[0].price.expo)
      const confidence =
        parseFloat(data.parsed[0].price.conf) *
        Math.pow(10, data.parsed[0].price.expo)
      const timestamp = data.parsed[0].price.publish_time * 1000

      return { price, confidence, timestamp }
    },
    enabled: !!feed,
    refetchInterval: POLLING_INTERVAL,
    staleTime: 5000,
  })

  // WebSocket real-time updates
  useEffect(() => {
    const handleWsMessage = (event: Event) => {
      const customEvent = event as CustomEvent
      const message = customEvent.detail

      if (message.type === 'PriceUpdated' && message.symbol === token) {
        queryClient.invalidateQueries({ queryKey: ['pythPrice', token] })
      }
    }

    window.addEventListener('ws-message', handleWsMessage)
    return () => window.removeEventListener('ws-message', handleWsMessage)
  }, [queryClient, token])

  const result = useMemo(() => ({
    priceData: data || { price: null, confidence: null, timestamp: null },
    loading: isLoading,
    error: error ? (error as Error).message : null
  }), [data, isLoading, error])

  return result
}

export function usePyth24hChange(token: string): PriceChangeState {
  const feed = PRICE_FEEDS.find((f) => f.token === token)

  const { data, isLoading, error } = useQuery({
    queryKey: ['pyth24hChange', token],
    queryFn: async () => {
      if (!feed) throw new Error('Invalid token')

      const [nowRes, pastRes] = await Promise.all([
        fetch(`/api/pyth-price?id=${feed.id}`),
        fetch(`/api/pyth-price-history?id=${feed.id}&ago=24h`),
      ])

      const nowData = await nowRes.json()
      const pastData = await pastRes.json()

      const currentPrice = parseFloat(nowData.parsed[0].price.price)
      const pastPrice = parseFloat(pastData.parsed[0].price.price)
      const change = currentPrice - pastPrice
      const percentChange = (change / pastPrice) * 100

      return {
        currentPrice,
        pastPrice,
        change,
        percentChange,
      }
    },
    enabled: !!feed,
    refetchInterval: HISTORICAL_INTERVAL,
    staleTime: 30000,
  })

  return {
    currentPrice: data?.currentPrice ?? null,
    pastPrice: data?.pastPrice ?? null,
    change: data?.change ?? null,
    percentChange: data?.percentChange ?? null,
    loading: isLoading,
    error: error ? (error as Error).message : null,
  }
}

export const getPythPrice = async (token: string, timestamp: number) => {
  const priceFeed = PRICE_FEEDS.find((feed) => feed.token === token)
  const globalConnection = new HermesClient(PYTH_ENDPOINT)
  if (!priceFeed) return 0
  const priceData = await globalConnection.getPriceUpdatesAtTimestamp(
    Math.round(timestamp / 1000),
    [priceFeed.id],
    { parsed: true, ignoreInvalidPriceIds: true }
  )
  if (priceData) {
    //TODO: to update on Mainnet
    // const price = priceData.getEmaPriceNoOlderThan(300); // Historical price data
    const price = priceData.parsed?.find((feed) =>
      priceFeed.id.includes(feed.id)
    )

    if (!price) return 0
    // Adjust price and confidence with exponent
    return parseFloat(price.price.price) * Math.pow(10, price.price.expo)
  } else {
    return 0
  }
}
