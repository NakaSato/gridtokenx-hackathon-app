/**
 * Application Configuration
 * Centralized configuration using environment variables with type safety
 */

import { isExternalUrl } from './links'

// =============================================================================
// Type Definitions
// =============================================================================

export interface SolanaConfig {
  readonly network: string
  readonly rpcUrl: string
  readonly wsUrl: string
}

export interface ApiConfig {
  readonly baseUrl: string
  readonly wsBaseUrl: string
}

export interface MapboxConfig {
  readonly token: string
}

export interface FeatureFlags {
  readonly enableAnalytics: boolean
  readonly enableDebug: boolean
  readonly showDevTools: boolean
}

// =============================================================================
// Configuration Objects
// =============================================================================
export const SOLANA_CONFIG = {
  network: process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'localnet',
  rpcUrl: process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'http://localhost:4000/api/v1/rpc',
  wsUrl: process.env.NEXT_PUBLIC_SOLANA_WS_URL || 'ws://localhost:8900',
} as const

// -----------------------------------------------------------------------------
// API Gateway Configuration
// -----------------------------------------------------------------------------
export const API_CONFIG = {
  baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000',
  wsBaseUrl: process.env.NEXT_PUBLIC_WS_BASE_URL || 'ws://localhost:4000',
} as const

// -----------------------------------------------------------------------------
// Mapbox Configuration
// -----------------------------------------------------------------------------
export const MAPBOX_CONFIG = {
  token: process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '',
} as const

// -----------------------------------------------------------------------------
// Feature Flags
// -----------------------------------------------------------------------------
export const FEATURE_FLAGS = {
  enableAnalytics: process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === 'true',
  enableDebug: process.env.NEXT_PUBLIC_ENABLE_DEBUG === 'true',
  showDevTools: process.env.NEXT_PUBLIC_SHOW_DEV_TOOLS === 'true',
} as const

// -----------------------------------------------------------------------------
// API Endpoints
// -----------------------------------------------------------------------------
export const API_ENDPOINTS = {
  // Authentication
  auth: {
    login: `${API_CONFIG.baseUrl}/api/v1/auth/login`,
    register: `${API_CONFIG.baseUrl}/api/v1/auth/register`,
    logout: `${API_CONFIG.baseUrl}/api/v1/auth/logout`,
    refresh: `${API_CONFIG.baseUrl}/api/v1/auth/refresh`,
  },
  // Trading
  trading: {
    orders: `${API_CONFIG.baseUrl}/api/v1/trading/orders`,
    orderBook: `${API_CONFIG.baseUrl}/api/v1/trading/orderbook`,
    marketData: `${API_CONFIG.baseUrl}/api/v1/analytics/market`,
    trades: `${API_CONFIG.baseUrl}/api/v1/analytics/my-history`,
  },
  // User
  user: {
    profile: `${API_CONFIG.baseUrl}/api/v1/users/me`,
    balance: `${API_CONFIG.baseUrl}/api/v1/wallets`, // Base for balance, append address in usage
    positions: `${API_CONFIG.baseUrl}/api/v1/futures/positions`,
  },
  // Meters
  meters: {
    data: `${API_CONFIG.baseUrl}/api/v1/meters`,
    submit: `${API_CONFIG.baseUrl}/api/v1/meters`, // Base for submit, append {serial}/readings in usage
  },
  // Grid
  grid: {
    status: `${API_CONFIG.baseUrl}/api/v1/public/grid-status`,
    topology: `${API_CONFIG.baseUrl}/api/zones`,
  },
  // WebSocket
  ws: {
    orderBook: `${API_CONFIG.wsBaseUrl}/ws/orderbook`,
    trades: `${API_CONFIG.wsBaseUrl}/ws/trades`,
    epochs: `${API_CONFIG.wsBaseUrl}/ws/epochs`,
  },
} as const

// -----------------------------------------------------------------------------
// Helper Functions
// -----------------------------------------------------------------------------

/**
 * Check if running in development mode
 */
export const isDevelopment = () => process.env.NODE_ENV === 'development'

/**
 * Check if running in production mode
 */
export const isProduction = () => process.env.NODE_ENV === 'production'

/**
 * Get full API URL for a given path
 * Validates the path to prevent double slashes
 */
export const getApiUrl = (path: string): string => {
  const cleanPath = path.startsWith('/') ? path : `/${path}`
  return `${API_CONFIG.baseUrl}${cleanPath}`
}

/**
 * Get full WebSocket URL for a given path
 * Validates the path to prevent double slashes
 */
export const getWsUrl = (path: string): string => {
  const cleanPath = path.startsWith('/') ? path : `/${path}`
  return `${API_CONFIG.wsBaseUrl}${cleanPath}`
}

/**
 * Validate configuration on app startup
 */
export const validateConfig = (): { valid: boolean; errors: string[] } => {
  const errors: string[] = []

  if (!SOLANA_CONFIG.rpcUrl) {
    errors.push('NEXT_PUBLIC_SOLANA_RPC_URL is required')
  }

  if (!API_CONFIG.baseUrl) {
    errors.push('NEXT_PUBLIC_API_BASE_URL is required')
  }

  if (FEATURE_FLAGS.enableAnalytics && !MAPBOX_CONFIG.token) {
    errors.push(
      'NEXT_PUBLIC_MAPBOX_TOKEN is required when analytics is enabled'
    )
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

// Validate config in development mode
if (isDevelopment() && typeof window !== 'undefined') {
  const validation = validateConfig()
  if (!validation.valid) {
    console.warn('⚠️ Configuration validation warnings:', validation.errors)
  }
}
