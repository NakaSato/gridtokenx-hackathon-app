/**
 * WebSocket Client for GridTokenX Platform
 * Real-time updates for order book, trades, and epochs
 */

import { API_CONFIG, getWsUrl } from './config'

/** WebSocket message types supported by the platform */
export type WebSocketMessageType =
  | 'orderbook_update'
  | 'trade_update'
  | 'epoch_transition'
  | 'order_filled'
  | 'order_cancelled'
  | 'market_clearing'
  | 'order_matched'
  | 'transaction_status_update'
  | 'p2p_order_update'
  | 'settlement_complete'
  | 'order_book_snapshot'
  | 'conditional_order_triggered'

/** Standard WebSocket message format */
export interface WebSocketMessage<T = unknown> {
  type: WebSocketMessageType
  data: T
  timestamp: string
}

/** WebSocket connection options */
export interface WebSocketClientOptions {
  /** Whether to automatically reconnect on disconnect */
  reconnect?: boolean
  /** Delay in ms before attempting reconnect */
  reconnectDelay?: number
  /** Maximum number of reconnect attempts */
  maxReconnectAttempts?: number
  /** Authentication token for private channels */
  token?: string
  /** If true, this is a public endpoint that doesn't require authentication */
  isPublic?: boolean
}

/** Event handler type for WebSocket messages */
export type WebSocketEventHandler<T = unknown> = (message: WebSocketMessage<T>) => void

/**
 * WebSocket Client for real-time updates
 */
export class WebSocketClient {
  private ws: WebSocket | null = null
  private url: string
  public options: Required<WebSocketClientOptions>
  private reconnectAttempts = 0
  private handlers: Map<WebSocketMessageType, Set<WebSocketEventHandler>> =
    new Map()
  private reconnectTimeout?: NodeJS.Timeout

  constructor(path: string, options: WebSocketClientOptions = {}) {
    this.url = getWsUrl(path)
    this.options = {
      reconnect: options.reconnect ?? true,
      reconnectDelay: options.reconnectDelay ?? 3000,
      maxReconnectAttempts: options.maxReconnectAttempts ?? 5,
      token: options.token ?? '',
      isPublic: options.isPublic ?? false,
    }
  }

  /**
   * Connect to WebSocket server
   */
  connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      console.warn('WebSocket already connected')
      return
    }

    try {
      // Add token to URL if provided
      const url = this.options.token
        ? `${this.url}?token=${this.options.token}`
        : this.url

      // Guard: Don't connect to authenticated /ws/* paths without a valid-looking token
      // The path /api/market/ws is public and doesn't require auth
      const isAuthenticatedWsPath = this.url.match(/\/ws\/\w+/) && !this.url.includes('/api/market/ws')

      // Basic token validation (JWTs are typically long and have 3 parts)
      const isValidToken = this.options.token &&
        this.options.token.length > 20 &&
        this.options.token.split('.').length === 3;

      if (isAuthenticatedWsPath && !isValidToken && !this.options.isPublic) {
        if (this.options.token) {
          console.warn(`WebSocket connection deferred for ${this.url}: Invalid token format.`)
        } else {
          console.debug(`WebSocket connection deferred for ${this.url}: Token required.`)
        }
        return
      }

      this.ws = new WebSocket(url)

      this.ws.onopen = () => {
        this.reconnectAttempts = 0
        console.debug(`WebSocket connected [${this.url}]`)
      }

      this.ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data)
          this.handleMessage(message)
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error)
        }
      }

      this.ws.onerror = () => {
        // WebSocket onerror provides no useful detail (browser security restriction).
        // The subsequent onclose event carries the close code/reason, so we only
        // log at debug level here to avoid noisy console errors on expected
        // failures such as token expiry or server restarts.
        console.debug(`WebSocket connection error [${this.url}]`)
      }

      this.ws.onclose = (event) => {
        // 1008 = Policy Violation (often auth), 1006 = Abnormal Closure (upgrade rejected / network)
        const isAuthFailure = event.code === 1008 ||
          (event.code === 1006 && this.options.token && !this.options.isPublic)

        if (isAuthFailure) {
          // Don't reconnect for auth failures — token is likely expired/invalid
          // and retrying will just produce the same error.
          console.debug(
            `WebSocket auth failure [${this.url}] (code: ${event.code}). Not reconnecting.`
          )
          return
        }

        this.attemptReconnect()
      }
    } catch (error) {
      console.error('Failed to connect WebSocket:', error)
      this.attemptReconnect()
    }
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout)
    }

    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
  }

  /**
   * Subscribe to a specific message type
   */
  on(type: WebSocketMessageType, handler: WebSocketEventHandler): void {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, new Set())
    }
    this.handlers.get(type)!.add(handler)
  }

  /**
   * Unsubscribe from a specific message type
   */
  off(type: WebSocketMessageType, handler: WebSocketEventHandler): void {
    const handlers = this.handlers.get(type)
    if (handlers) {
      handlers.delete(handler)
    }
  }

  /**
   * Send a message to the server
   */
  send(message: any): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message))
    } else {
      console.warn('WebSocket is not connected')
    }
  }

  /**
   * Set authentication token
   */
  setToken(token: string): void {
    this.options.token = token
    // Reconnect with new token
    this.disconnect()
    this.connect()
  }

  /**
   * Get connection state
   */
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN
  }

  private handleMessage(message: WebSocketMessage): void {
    const handlers = this.handlers.get(message.type)
    if (handlers) {
      handlers.forEach((handler) => {
        try {
          handler(message)
        } catch (error) {
          console.error(
            `Error in WebSocket handler for ${message.type}:`,
            error
          )
        }
      })
    }
  }

  private attemptReconnect(): void {
    if (!this.options.reconnect) {
      return
    }

    if (this.reconnectAttempts >= this.options.maxReconnectAttempts) {
      console.debug(`WebSocket disconnected [${this.url}]: Max reconnect attempts reached`)
      return
    }

    this.reconnectAttempts++
    
    // Exponential backoff with jitter: delay = baseDelay * 2^(attempt-1) + random jitter
    // Attempt 1: 3s, Attempt 2: 6s, Attempt 3: 12s, Attempt 4: 24s, Attempt 5: 48s
    const baseDelay = this.options.reconnectDelay
    const exponentialDelay = baseDelay * Math.pow(2, this.reconnectAttempts - 1)
    // Add jitter: ±20% random variation to prevent thundering herd
    const jitter = (Math.random() - 0.5) * 0.4 * exponentialDelay
    const delay = Math.min(exponentialDelay + jitter, 60000) // Cap at 60 seconds

    console.debug(
      `WebSocket reconnecting (${this.reconnectAttempts}/${this.options.maxReconnectAttempts}) [${this.url}] in ${(delay / 1000).toFixed(1)}s...`
    )

    this.reconnectTimeout = setTimeout(() => {
      this.connect()
    }, delay)
  }
}

/**
 * Create WebSocket clients for different channels
 */

export function createOrderBookWS(token?: string): WebSocketClient {
  return new WebSocketClient('/ws/orderbook', { token })
}

export function createTradesWS(token?: string): WebSocketClient {
  return new WebSocketClient('/ws/trades', { token })
}

export function createEpochsWS(token?: string): WebSocketClient {
  return new WebSocketClient('/ws/epochs', { token })
}

/**
 * Create a public market WebSocket (no auth required)
 * Falls back to this when user is not authenticated
 */
export function createPublicMarketWS(): WebSocketClient {
  return new WebSocketClient('/api/market/ws', { isPublic: true })
}

/**
 * Hook-friendly WebSocket manager for React components
 */
export class WebSocketManager {
  private clients: Map<string, WebSocketClient> = new Map()
  private refCounts: Map<string, number> = new Map()
  private publicClient: WebSocketClient | null = null
  private publicRefCount: number = 0

  /**
   * Get or create a WebSocket client for the given channel.
   * If no token is provided, returns a public market WebSocket instead.
   */
  getOrCreate(channel: string, token?: string): WebSocketClient {
    // If no token, use public market WebSocket as fallback
    if (!token) {
      return this.getOrCreatePublic()
    }

    let client = this.clients.get(channel)
    const path = `/ws/${channel}`

    if (!client) {
      client = new WebSocketClient(path, { token })
      this.clients.set(channel, client)
      this.refCounts.set(channel, 1)
    } else {
      // Increment ref count
      const count = this.refCounts.get(channel) || 0
      this.refCounts.set(channel, count + 1)

      if (token && client.options.token !== token) {
        // Token changed, update it
        client.setToken(token)
      }
    }

    return client
  }

  /**
   * Get or create a public market WebSocket (no auth required)
   */
  getOrCreatePublic(): WebSocketClient {
    if (!this.publicClient) {
      this.publicClient = new WebSocketClient('/api/market/ws', { isPublic: true })
    }
    this.publicRefCount++
    return this.publicClient
  }

  disconnect(channel: string): void {
    const count = this.refCounts.get(channel) || 0
    if (count <= 1) {
      const client = this.clients.get(channel)
      if (client) {
        client.disconnect()
        this.clients.delete(channel)
      }
      this.refCounts.delete(channel)
    } else {
      this.refCounts.set(channel, count - 1)
    }
  }

  disconnectPublic(): void {
    this.publicRefCount--
    if (this.publicRefCount <= 0 && this.publicClient) {
      this.publicClient.disconnect()
      this.publicClient = null
      this.publicRefCount = 0
    }
  }

  disconnectAll(): void {
    this.clients.forEach((client) => client.disconnect())
    this.clients.clear()
    this.refCounts.clear()
    if (this.publicClient) {
      this.publicClient.disconnect()
      this.publicClient = null
      this.publicRefCount = 0
    }
  }

  setToken(token: string): void {
    this.clients.forEach((client) => client.setToken(token))
  }
}

export const defaultWSManager = new WebSocketManager()

