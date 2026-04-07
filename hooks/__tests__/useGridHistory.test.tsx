import { renderHook, waitFor } from '@testing-library/react'
import { useGridHistory } from '../useGridHistory'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactNode } from 'react'

// Mock api-client
jest.mock('@/lib/api-client', () => ({
  defaultApiClient: {
    getGridHistory: jest.fn(),
  },
}))

const { defaultApiClient } = jest.requireMock('@/lib/api-client')

// Create wrapper for React Query
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })

  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )

  return Wrapper
}

describe('useGridHistory', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Successful data fetching', () => {
    it('should fetch and return grid history data', async () => {
      const mockData = [
        { id: 1, timestamp: '2024-01-01', power: 100 },
        { id: 2, timestamp: '2024-01-02', power: 150 },
        { id: 3, timestamp: '2024-01-03', power: 200 },
      ]

      defaultApiClient.getGridHistory.mockResolvedValueOnce({
        data: mockData,
        error: null,
      })

      const { result } = renderHook(() => useGridHistory(30), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.history).toHaveLength(3)
      expect(result.current.error).toBeNull()
    })

    it('should reverse data for chronological order', async () => {
      const mockData = [
        { id: 3, timestamp: '2024-01-03', power: 200 },
        { id: 2, timestamp: '2024-01-02', power: 150 },
        { id: 1, timestamp: '2024-01-01', power: 100 },
      ]

      defaultApiClient.getGridHistory.mockResolvedValueOnce({
        data: mockData,
        error: null,
      })

      const { result } = renderHook(() => useGridHistory(30), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Data should be reversed (oldest to newest)
      expect(result.current.history[0].id).toBe(1)
      expect(result.current.history[2].id).toBe(3)
    })

    it('should return empty array when no data', async () => {
      defaultApiClient.getGridHistory.mockResolvedValueOnce({
        data: null,
        error: null,
      })

      const { result } = renderHook(() => useGridHistory(30), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.history).toEqual([])
    })
  })

  describe('Error handling', () => {
    it('should handle API errors', async () => {
      defaultApiClient.getGridHistory.mockResolvedValueOnce({
        data: null,
        error: 'Failed to fetch history',
      })

      const { result } = renderHook(() => useGridHistory(30), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.error).toBe('Failed to fetch history')
      })
    })

    it('should handle network errors', async () => {
      defaultApiClient.getGridHistory.mockRejectedValueOnce(
        new Error('Network error')
      )

      const { result } = renderHook(() => useGridHistory(30), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.error).toBeDefined()
      })
    })
  })

  describe('Parameters', () => {
    it('should use default limit of 30', async () => {
      defaultApiClient.getGridHistory.mockResolvedValueOnce({
        data: [],
        error: null,
      })

      renderHook(() => useGridHistory(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(defaultApiClient.getGridHistory).toHaveBeenCalledWith(30)
      })
    })

    it('should use custom limit', async () => {
      defaultApiClient.getGridHistory.mockResolvedValueOnce({
        data: [],
        error: null,
      })

      renderHook(() => useGridHistory(50), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(defaultApiClient.getGridHistory).toHaveBeenCalledWith(50)
      })
    })

    it('should pass limit to API call', async () => {
      defaultApiClient.getGridHistory.mockResolvedValueOnce({
        data: [],
        error: null,
      })

      renderHook(() => useGridHistory(100), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(defaultApiClient.getGridHistory).toHaveBeenCalledWith(100)
      })
    })
  })

  describe('Refresh functionality', () => {
    it('should provide refresh function', async () => {
      defaultApiClient.getGridHistory.mockResolvedValueOnce({
        data: [],
        error: null,
      })

      const { result } = renderHook(() => useGridHistory(30), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.refresh).toBeDefined()
      expect(typeof result.current.refresh).toBe('function')
    })

    it('should refresh data when refresh is called', async () => {
      defaultApiClient.getGridHistory
        .mockResolvedValueOnce({
          data: [{ id: 1 }],
          error: null,
        })
        .mockResolvedValueOnce({
          data: [{ id: 1 }, { id: 2 }],
          error: null,
        })

      const { result } = renderHook(() => useGridHistory(30), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
        expect(result.current.history).toHaveLength(1)
      })

      await result.current.refresh()

      await waitFor(() => {
        expect(defaultApiClient.getGridHistory).toHaveBeenCalledTimes(2)
      })
    })
  })

  describe('Loading state', () => {
    it('should start with loading state', () => {
      defaultApiClient.getGridHistory.mockImplementation(
        () => new Promise(() => {}) // Never resolves
      )

      const { result } = renderHook(() => useGridHistory(30), {
        wrapper: createWrapper(),
      })

      expect(result.current.isLoading).toBe(true)
    })

    it('should set loading to false after fetch', async () => {
      defaultApiClient.getGridHistory.mockResolvedValueOnce({
        data: [],
        error: null,
      })

      const { result } = renderHook(() => useGridHistory(30), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })
    })
  })
})
