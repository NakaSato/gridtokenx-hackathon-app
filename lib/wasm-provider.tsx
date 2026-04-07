'use client'

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react'
import { initWasm, isWasmLoaded } from './wasm-bridge'

interface WasmContextType {
  isLoaded: boolean
  isLoading: boolean
  error: Error | null
}

const WasmContext = createContext<WasmContextType>({
  isLoaded: false,
  isLoading: true,
  error: null,
})

export function useWasm() {
  return useContext(WasmContext)
}

interface WasmProviderProps {
  children: ReactNode
}

/**
 * Provider component that initializes WASM on app startup.
 * Wrap your app with this provider to enable WASM-accelerated calculations.
 *
 * @example
 * ```tsx
 * // In app/layout.tsx or app/providers.tsx
 * import { WasmProvider } from '@/lib/wasm-provider'
 *
 * export default function Layout({ children }) {
 *   return (
 *     <WasmProvider>
 *       {children}
 *     </WasmProvider>
 *   )
 * }
 * ```
 */
export function WasmProvider({ children }: WasmProviderProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    // Skip WASM loading on server side
    if (typeof window === 'undefined') {
      return
    }

    // Only initialize once
    if (isWasmLoaded()) {
      setIsLoaded(true)
      return
    }

    // Defer WASM loading to not block initial render
    const loadWasm = async () => {
      try {
        await initWasm('/gridtokenx_wasm.wasm')
        setIsLoaded(true)
        console.log('[WasmProvider] WASM module loaded successfully')
      } catch (err) {
        console.warn(
          '[WasmProvider] Failed to initialize WASM, using JS fallbacks:',
          err
        )
        // Don't set error state - app works with JS fallbacks
        // Just mark as "loaded" so the app can proceed
        setIsLoaded(true)
      }
    }

    // Use requestIdleCallback for better performance
    if ('requestIdleCallback' in window) {
      ;(
        window as Window & { requestIdleCallback: (cb: () => void) => void }
      ).requestIdleCallback(loadWasm)
    } else {
      // Fallback: load after a short delay to not block paint
      setTimeout(loadWasm, 100)
    }
  }, [])

  return (
    <WasmContext.Provider value={{ isLoaded, isLoading: !isLoaded, error }}>
      {children}
    </WasmContext.Provider>
  )
}
