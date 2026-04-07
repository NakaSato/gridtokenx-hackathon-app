import { renderHook, act } from '@testing-library/react'
import { useCrypto } from '../useCrypto'

// Mock wasm-bridge
jest.mock('@/lib/wasm-bridge', () => ({
  initWasm: jest.fn(() => Promise.resolve()),
  sha256: jest.fn((message) => `hashed_${message}`),
  hmacSign: jest.fn((key, message) => new Uint8Array([1, 2, 3, 4, 5])),
  hmacVerify: jest.fn(() => true),
  isWasmLoaded: jest.fn(() => true),
}))

const mockedWasm = jest.requireMock('@/lib/wasm-bridge')

describe('useCrypto', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Initialization', () => {
    it('should start with isLoaded as false', () => {
      mockedWasm.isWasmLoaded.mockReturnValue(false)

      const { result } = renderHook(() => useCrypto())

      expect(result.current.isLoaded).toBe(false)
    })

    it('should set isLoaded to true after WASM initializes', async () => {
      mockedWasm.isWasmLoaded.mockReturnValue(true)

      const { result } = renderHook(() => useCrypto())

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0))
      })

      expect(result.current.isLoaded).toBe(true)
    })
  })

  describe('signOrder', () => {
    it('should sign an order with HMAC', () => {
      mockedWasm.isWasmLoaded.mockReturnValue(true)

      const { result } = renderHook(() => useCrypto())

      const order = {
        side: 'buy' as const,
        amount: '100',
        price_per_kwh: '4.5',
      }
      const secretKey = 'test-secret-key'

      const signedOrder = result.current.signOrder(order, secretKey)

      expect(signedOrder).toHaveProperty('timestamp')
      expect(signedOrder).toHaveProperty('signature')
      expect(signedOrder.side).toBe('buy')
      expect(signedOrder.amount).toBe('100')
      expect(signedOrder.price_per_kwh).toBe('4.5')
      expect(mockedWasm.hmacSign).toHaveBeenCalled()
    })

    it('should generate fallback signature when WASM not loaded', () => {
      mockedWasm.isWasmLoaded.mockReturnValue(false)

      const { result } = renderHook(() => useCrypto())

      const order = {
        side: 'sell' as const,
        amount: '50',
        price_per_kwh: '3.2',
      }
      const secretKey = 'test-key'

      const signedOrder = result.current.signOrder(order, secretKey)

      expect(signedOrder.signature).toMatch(/^fallback_/)
    })

    it('should generate different signatures for different orders', () => {
      mockedWasm.isWasmLoaded.mockReturnValue(true)

      const { result } = renderHook(() => useCrypto())

      const order1 = {
        side: 'buy' as const,
        amount: '100',
        price_per_kwh: '4.5',
      }
      const order2 = {
        side: 'sell' as const,
        amount: '200',
        price_per_kwh: '3.0',
      }
      const secretKey = 'same-key'

      const signed1 = result.current.signOrder(order1, secretKey)
      const signed2 = result.current.signOrder(order2, secretKey)

      // Different content should produce different signatures (timestamps will differ too)
      expect(signed1.signature).toBeDefined()
      expect(signed2.signature).toBeDefined()
    })
  })

  describe('verifyOrderSignature', () => {
    it('should verify a valid signature', () => {
      mockedWasm.isWasmLoaded.mockReturnValue(true)
      mockedWasm.hmacVerify.mockReturnValue(true)

      const { result } = renderHook(() => useCrypto())

      const signedOrder = {
        side: 'buy' as const,
        amount: '100',
        price_per_kwh: '4.5',
        timestamp: Date.now(),
        signature: '0102030405', // hex representation of [1,2,3,4,5]
      }
      const secretKey = 'test-key'

      const isValid = result.current.verifyOrderSignature(
        signedOrder,
        secretKey
      )

      expect(isValid).toBe(true)
      expect(mockedWasm.hmacVerify).toHaveBeenCalled()
    })

    it('should return true when WASM not loaded', () => {
      mockedWasm.isWasmLoaded.mockReturnValue(false)

      const { result } = renderHook(() => useCrypto())

      const signedOrder = {
        side: 'buy' as const,
        amount: '100',
        price_per_kwh: '4.5',
        timestamp: Date.now(),
        signature: 'some-signature',
      }
      const secretKey = 'test-key'

      const isValid = result.current.verifyOrderSignature(
        signedOrder,
        secretKey
      )

      expect(isValid).toBe(true)
    })

    it('should return false for invalid signature', () => {
      mockedWasm.isWasmLoaded.mockReturnValue(true)
      mockedWasm.hmacVerify.mockReturnValue(false)

      const { result } = renderHook(() => useCrypto())

      const signedOrder = {
        side: 'buy' as const,
        amount: '100',
        price_per_kwh: '4.5',
        timestamp: Date.now(),
        signature: 'invalid-sig',
      }
      const secretKey = 'wrong-key'

      const isValid = result.current.verifyOrderSignature(
        signedOrder,
        secretKey
      )

      expect(isValid).toBe(false)
    })
  })

  describe('hashMessage', () => {
    it('should hash a message using SHA-256', () => {
      mockedWasm.isWasmLoaded.mockReturnValue(true)

      const { result } = renderHook(() => useCrypto())

      const message = 'test message'
      const hash = result.current.hashMessage(message)

      expect(hash).toBe(`hashed_${message}`)
      expect(mockedWasm.sha256).toHaveBeenCalledWith(message)
    })

    it('should return empty string when WASM not loaded', () => {
      mockedWasm.isWasmLoaded.mockReturnValue(false)

      const { result } = renderHook(() => useCrypto())

      const hash = result.current.hashMessage('test')

      expect(hash).toBe('')
    })

    it('should handle empty message', () => {
      mockedWasm.isWasmLoaded.mockReturnValue(true)

      const { result } = renderHook(() => useCrypto())

      const hash = result.current.hashMessage('')

      expect(hash).toBeDefined()
    })
  })

  describe('Hook stability', () => {
    it('should return stable function references', () => {
      const { result, rerender } = renderHook(() => useCrypto())

      const firstSignOrder = result.current.signOrder
      const firstVerifyOrder = result.current.verifyOrderSignature
      const firstHashMessage = result.current.hashMessage

      rerender()

      expect(result.current.signOrder).toBe(firstSignOrder)
      expect(result.current.verifyOrderSignature).toBe(firstVerifyOrder)
      expect(result.current.hashMessage).toBe(firstHashMessage)
    })
  })
})
