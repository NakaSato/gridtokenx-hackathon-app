import { renderHook } from '@testing-library/react'
import { useGreeks } from '../useGreeks'

// Mock wasm-bridge functions
jest.mock('@/lib/wasm-bridge', () => ({
  deltaCalc: jest.fn((price, strike, time, isCall) => {
    // Simplified delta calculation for testing
    if (time <= 0) return isCall ? 0 : 0
    const intrinsic = isCall
      ? (price - strike) / price
      : (strike - price) / price
    return Math.max(-1, Math.min(1, intrinsic + 0.5 * time))
  }),
  gammaCalc: jest.fn(() => 0.05),
  vegaCalc: jest.fn(() => 0.2),
  thetaCalc: jest.fn(() => -0.01),
  rhoCalc: jest.fn(() => 0.02),
}))

// Mock date-fns
jest.mock('date-fns', () => ({
  differenceInSeconds: jest.fn((future, _now) => {
    // Return a positive value for future dates
    const futureDate = new Date(future)
    const now = new Date()
    return Math.max(
      0,
      Math.floor((futureDate.getTime() - now.getTime()) / 1000)
    )
  }),
}))

describe('useGreeks', () => {
  const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Call options', () => {
    it('should calculate greeks for in-the-money call', () => {
      const { result } = renderHook(() =>
        useGreeks({
          type: 'Call',
          strikePrice: 90,
          currentPrice: 100,
          expiryDate: futureDate,
        })
      )

      expect(result.current.delta).toBeDefined()
      expect(result.current.gamma).toBeDefined()
      expect(result.current.vega).toBeDefined()
      expect(result.current.theta).toBeDefined()
      expect(result.current.rho).toBeDefined()
    })

    it('should calculate greeks for out-of-the-money call', () => {
      const { result } = renderHook(() =>
        useGreeks({
          type: 'Call',
          strikePrice: 110,
          currentPrice: 100,
          expiryDate: futureDate,
        })
      )

      expect(result.current.delta).toBeDefined()
      expect(result.current.gamma).toBe(0.05)
      expect(result.current.vega).toBe(0.2)
      expect(result.current.theta).toBe(-0.01)
      expect(result.current.rho).toBe(0.02)
    })

    it('should calculate greeks for at-the-money call', () => {
      const { result } = renderHook(() =>
        useGreeks({
          type: 'Call',
          strikePrice: 100,
          currentPrice: 100,
          expiryDate: futureDate,
        })
      )

      expect(result.current.delta).toBeDefined()
      expect(result.current.gamma).toBeDefined()
    })
  })

  describe('Put options', () => {
    it('should calculate greeks for in-the-money put', () => {
      const { result } = renderHook(() =>
        useGreeks({
          type: 'Put',
          strikePrice: 110,
          currentPrice: 100,
          expiryDate: futureDate,
        })
      )

      expect(result.current.delta).toBeDefined()
      expect(result.current.gamma).toBeDefined()
      expect(result.current.vega).toBeDefined()
      expect(result.current.theta).toBeDefined()
      expect(result.current.rho).toBeDefined()
    })

    it('should calculate greeks for out-of-the-money put', () => {
      const { result } = renderHook(() =>
        useGreeks({
          type: 'Put',
          strikePrice: 90,
          currentPrice: 100,
          expiryDate: futureDate,
        })
      )

      expect(result.current.delta).toBeDefined()
      expect(result.current.gamma).toBe(0.05)
      expect(result.current.vega).toBe(0.2)
    })

    it('should calculate greeks for at-the-money put', () => {
      const { result } = renderHook(() =>
        useGreeks({
          type: 'Put',
          strikePrice: 100,
          currentPrice: 100,
          expiryDate: futureDate,
        })
      )

      expect(result.current.delta).toBeDefined()
    })
  })

  describe('Time decay', () => {
    it('should handle near-expiry options', () => {
      const nearExpiry = new Date(Date.now() + 60 * 1000) // 1 minute from now

      const { result } = renderHook(() =>
        useGreeks({
          type: 'Call',
          strikePrice: 100,
          currentPrice: 105,
          expiryDate: nearExpiry,
        })
      )

      expect(result.current.delta).toBeDefined()
    })

    it('should handle long-dated options', () => {
      const longDated = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year from now

      const { result } = renderHook(() =>
        useGreeks({
          type: 'Call',
          strikePrice: 100,
          currentPrice: 100,
          expiryDate: longDated,
        })
      )

      expect(result.current.delta).toBeDefined()
    })
  })

  describe('Edge cases', () => {
    it('should handle zero strike price', () => {
      const { result } = renderHook(() =>
        useGreeks({
          type: 'Call',
          strikePrice: 0,
          currentPrice: 100,
          expiryDate: futureDate,
        })
      )

      expect(result.current.delta).toBeDefined()
    })

    it('should handle very high prices', () => {
      const { result } = renderHook(() =>
        useGreeks({
          type: 'Call',
          strikePrice: 10000,
          currentPrice: 100000,
          expiryDate: futureDate,
        })
      )

      expect(result.current.delta).toBeDefined()
    })

    it('should handle very low prices', () => {
      const { result } = renderHook(() =>
        useGreeks({
          type: 'Call',
          strikePrice: 0.01,
          currentPrice: 0.02,
          expiryDate: futureDate,
        })
      )

      expect(result.current.delta).toBeDefined()
    })
  })

  describe('Return values', () => {
    it('should return all five greeks', () => {
      const { result } = renderHook(() =>
        useGreeks({
          type: 'Call',
          strikePrice: 100,
          currentPrice: 100,
          expiryDate: futureDate,
        })
      )

      const greeks = result.current
      expect(Object.keys(greeks)).toEqual([
        'delta',
        'gamma',
        'vega',
        'theta',
        'rho',
      ])
    })

    it('should return numeric values for all greeks', () => {
      const { result } = renderHook(() =>
        useGreeks({
          type: 'Call',
          strikePrice: 100,
          currentPrice: 100,
          expiryDate: futureDate,
        })
      )

      Object.values(result.current).forEach((value) => {
        expect(typeof value).toBe('number')
      })
    })
  })
})
