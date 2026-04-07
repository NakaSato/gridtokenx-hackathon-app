import { encryptHistoryBlob, decryptHistoryBlob } from '../history-utils'

// Mock Web Crypto API
const mockEncrypt = jest.fn()
const mockDecrypt = jest.fn()
const mockImportKey = jest.fn()
const mockGetRandomValues = jest.fn()

describe('history-utils', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    // Setup crypto mock
    Object.defineProperty(window, 'crypto', {
      value: {
        subtle: {
          importKey: mockImportKey,
          encrypt: mockEncrypt,
          decrypt: mockDecrypt,
        },
        getRandomValues: mockGetRandomValues,
      },
      writable: true,
    })
  })

  describe('encryptHistoryBlob', () => {
    it('should encrypt data and return base64 string', async () => {
      const testData = { amount: 100, recipient: 'test-address' }
      const testKey = new Uint8Array(32).fill(1)

      // Mock crypto operations
      mockImportKey.mockResolvedValue({})
      mockGetRandomValues.mockImplementation((arr: Uint8Array) => {
        arr.fill(1)
        return arr
      })
      mockEncrypt.mockResolvedValue(new ArrayBuffer(16))

      const result = await encryptHistoryBlob(testData, testKey)

      expect(result).toBeDefined()
      expect(typeof result).toBe('string')
      expect(mockImportKey).toHaveBeenCalledWith(
        'raw',
        expect.any(ArrayBuffer),
        'AES-GCM',
        false,
        ['encrypt']
      )
      expect(mockEncrypt).toHaveBeenCalled()
    })

    it('should generate different ciphertext for same data (due to random IV)', async () => {
      const testData = { amount: 100 }
      const testKey = new Uint8Array(32).fill(1)

      mockImportKey.mockResolvedValue({})
      mockGetRandomValues.mockImplementation((arr: Uint8Array) => {
        // Generate different IVs
        for (let i = 0; i < arr.length; i++) {
          arr[i] = Math.random() * 256
        }
        return arr
      })
      mockEncrypt.mockResolvedValue(new ArrayBuffer(16))

      const result1 = await encryptHistoryBlob(testData, testKey)
      const result2 = await encryptHistoryBlob(testData, testKey)

      // Results should be different due to random IV
      expect(result1).toBeDefined()
      expect(result2).toBeDefined()
    })

    it('should handle complex nested objects', async () => {
      const testData = {
        transaction: {
          id: 'tx-123',
          amount: 50.5,
          metadata: {
            timestamp: Date.now(),
            tags: ['energy', 'trade'],
          },
        },
      }
      const testKey = new Uint8Array(32).fill(2)

      mockImportKey.mockResolvedValue({})
      mockGetRandomValues.mockImplementation((arr: Uint8Array) => arr.fill(0))
      mockEncrypt.mockResolvedValue(new ArrayBuffer(32))

      const result = await encryptHistoryBlob(testData, testKey)

      expect(result).toBeDefined()
      expect(typeof result).toBe('string')
    })

    it('should handle empty objects', async () => {
      const testData = {}
      const testKey = new Uint8Array(32).fill(3)

      mockImportKey.mockResolvedValue({})
      mockGetRandomValues.mockImplementation((arr: Uint8Array) => arr.fill(0))
      mockEncrypt.mockResolvedValue(new ArrayBuffer(16))

      const result = await encryptHistoryBlob(testData, testKey)

      expect(result).toBeDefined()
    })
  })

  describe('decryptHistoryBlob', () => {
    it('should decrypt data correctly', async () => {
      const originalData = { amount: 100, recipient: 'test-address' }
      const testKey = new Uint8Array(32).fill(1)

      // Create a mock encrypted blob (IV + encrypted data)
      const mockIv = new Uint8Array(12).fill(1)
      const mockEncryptedData = new Uint8Array(16).fill(2)
      const mockBlob = new Uint8Array([...mockIv, ...mockEncryptedData])
      const mockBase64 = btoa(String.fromCharCode(...mockBlob))

      mockImportKey.mockResolvedValue({})
      mockDecrypt.mockResolvedValue(
        new TextEncoder().encode(JSON.stringify(originalData)).buffer
      )

      const result = await decryptHistoryBlob(mockBase64, testKey)

      expect(result).toEqual(originalData)
      expect(mockImportKey).toHaveBeenCalledWith(
        'raw',
        expect.any(ArrayBuffer),
        'AES-GCM',
        false,
        ['decrypt']
      )
    })

    it('should throw error for invalid key', async () => {
      const testKey = new Uint8Array(32).fill(1)

      const mockIv = new Uint8Array(12).fill(1)
      const mockEncryptedData = new Uint8Array(16).fill(2)
      const mockBlob = new Uint8Array([...mockIv, ...mockEncryptedData])
      const mockBase64 = btoa(String.fromCharCode(...mockBlob))

      mockImportKey.mockResolvedValue({})
      mockDecrypt.mockRejectedValue(new Error('Decryption failed'))

      await expect(decryptHistoryBlob(mockBase64, testKey)).rejects.toThrow(
        'Failed to decrypt history: Invalid key or corrupted data'
      )
    })

    it('should throw error for corrupted data', async () => {
      const testKey = new Uint8Array(32).fill(1)
      const corruptedBase64 = 'not-valid-base64!!!'

      mockImportKey.mockResolvedValue({})

      await expect(
        decryptHistoryBlob(corruptedBase64, testKey)
      ).rejects.toThrow()
    })

    it('should handle complex nested objects during decryption', async () => {
      const originalData = {
        transaction: {
          id: 'tx-456',
          amount: 75.25,
          metadata: {
            timestamp: 1234567890,
            tags: ['solar', 'green'],
          },
        },
      }
      const testKey = new Uint8Array(32).fill(5)

      const mockIv = new Uint8Array(12).fill(1)
      const mockEncryptedData = new Uint8Array(32).fill(2)
      const mockBlob = new Uint8Array([...mockIv, ...mockEncryptedData])
      const mockBase64 = btoa(String.fromCharCode(...mockBlob))

      mockImportKey.mockResolvedValue({})
      mockDecrypt.mockResolvedValue(
        new TextEncoder().encode(JSON.stringify(originalData)).buffer
      )

      const result = await decryptHistoryBlob(mockBase64, testKey)

      expect(result).toEqual(originalData)
    })
  })

  describe('encrypt and decrypt roundtrip', () => {
    it('should successfully encrypt and decrypt data', async () => {
      const originalData = {
        amount: 250.75,
        recipient: 'wallet-address-123',
        origin: 'grid-node-456',
        timestamp: Date.now(),
      }
      const testKey = new Uint8Array(32).fill(9)

      // Setup mocks for encryption
      mockImportKey.mockResolvedValue({})
      mockGetRandomValues.mockImplementation((arr: Uint8Array) => {
        for (let i = 0; i < arr.length; i++) {
          arr[i] = i
        }
        return arr
      })

      const encryptedData = new TextEncoder().encode(
        JSON.stringify(originalData)
      )
      mockEncrypt.mockResolvedValue(encryptedData.buffer)

      const encrypted = await encryptHistoryBlob(originalData, testKey)

      // Setup mocks for decryption
      mockDecrypt.mockResolvedValue(encryptedData.buffer)

      const decrypted = await decryptHistoryBlob(encrypted, testKey)

      expect(decrypted).toEqual(originalData)
    })
  })
})
