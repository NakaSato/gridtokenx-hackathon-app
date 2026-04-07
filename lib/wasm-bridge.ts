/**
 * WASM Bridge for GridTokenX Platform
 *
 * TypeScript wrapper to load and call WASM functions
 */

import init, {
  InitOutput,
  Simulation,
  OrderBook as WasmOrderBook,
  AuctionSimulator as WasmAuctionSimulator,
  black_scholes as wasm_black_scholes,
  calculate_bezier,
  calculate_portfolio_risk as wasm_calculate_portfolio_risk,
  aggregate_readings as wasm_aggregate_readings,
  calculate_greeks as wasm_calculate_greeks,
  create_commitment as wasm_create_commitment,
  create_range_proof as wasm_create_range_proof,
  create_transfer_proof as wasm_create_transfer_proof,
  crypto_verify as wasm_crypto_verify,
  delta_calc as wasm_delta_calc,
  derive_stealth_key as wasm_derive_stealth_key,
  gamma_calc as wasm_gamma_calc,
  hmac_sha256 as wasm_hmac_sha256,
  perform_clustering as wasm_perform_clustering,
  recover_amount_from_commitment as wasm_recover_amount_from_commitment,
  rho_calc as wasm_rho_calc,
  sha256 as wasm_sha256,
  theta_calc as wasm_theta_calc,
  vega_calc as wasm_vega_calc,
} from './wasm/gridtokenx_wasm.js'

export interface Greeks {
  delta: number
  gamma: number
  vega: number
  theta: number
  rho: number
}

export interface PnLData {
  prices: number[]
  pnlData: number[]
  minPnL: number
  maxPnL: number
}

export interface ZkCommitment {
  point: number[]
}

export interface ZkRangeProof {
  proof_data: number[]
  commitment: ZkCommitment
}

export interface ZkEqualityProof {
  challenge: number[]
  response: number[]
}

export interface ZkTransferProof {
  amount_commitment: ZkCommitment
  amount_range_proof: ZkRangeProof
  remaining_range_proof: ZkRangeProof
  balance_proof: ZkEqualityProof
}

export type WasmExports = InitOutput

// Export classes for use in other components
export { Simulation, WasmOrderBook, WasmAuctionSimulator }

let wasmExports: WasmExports | null = null
let wasmLoadPromise: Promise<WasmExports | null> | null = null
let wasmLoadAttempted = false

// Singleton instances for common shared state
let orderBookInstance: WasmOrderBook | null = null
let auctionSimulatorInstance: WasmAuctionSimulator | null = null

// Helper to check if wasm is loaded
export function isWasmLoaded(): boolean {
  return wasmExports !== null
}

// Helper to check if wasm loading was attempted (even if it failed)
export function wasWasmLoadAttempted(): boolean {
  return wasmLoadAttempted
}

/**
 * Initialize the WASM module
 * Falls back gracefully if WASM is not available
 */
export async function initWasm(
  wasmPath: string = '/gridtokenx_wasm.wasm'
): Promise<WasmExports | null> {
  // Skip on server side
  if (typeof window === 'undefined') {
    console.log('[WASM] Skipping initialization on server side')
    return null
  }

  if (wasmExports) {
    return wasmExports
  }

  if (wasmLoadPromise) {
    return wasmLoadPromise
  }

  wasmLoadAttempted = true

  wasmLoadPromise = (async () => {
    try {
      // Dynamic import with error handling
      const exports = await init(wasmPath)
      wasmExports = exports
      console.log('[WASM] Module initialized successfully')
      return wasmExports
    } catch (error) {
      console.warn(
        '[WASM] Failed to load module, JS fallbacks will be used:',
        error instanceof Error ? error.message : error
      )
      wasmLoadPromise = null
      // Don't throw - allow app to continue with JS fallbacks
      return null
    }
  })()

  return wasmLoadPromise
}

/**
 * Simple currency conversion utility
 * @param amount Amount in base currency
 * @param price Current price multiplier
 * @returns Converted value
 */
export function convertPrice(amount: number, price: number): number {
  return amount * price
}

/**
 * Defer WASM initialization to not block main thread
 */
export function deferWasmInit(): void {
  if (typeof window === 'undefined') return

  if ('requestIdleCallback' in window) {
    ; (
      window as Window & { requestIdleCallback: (cb: () => void) => void }
    ).requestIdleCallback(() => {
      initWasm().catch(() => { })
    })
  } else {
    setTimeout(() => {
      initWasm().catch(() => { })
    }, 100)
  }
}

/**
 * Get raw WASM exports (for advanced usage)
 */
export function getWasmExports(): WasmExports | null {
  return wasmExports
}

// =============================================================================
// OPTIONS PRICING FUNCTIONS (JS Fallbacks)
// =============================================================================

const R = 0.0
const SIGMA = 0.5

/** Calculate Black-Scholes option price */
export function blackScholes(
  s: number,
  k: number,
  t: number,
  isCall: boolean
): number {
  if (isWasmLoaded()) {
    return wasm_black_scholes(s, k, t, isCall)
  }
  return blackScholesJS(s, k, t, isCall)
}

/** Calculate option Greeks (delta, gamma, vega, theta, rho) */
export function calculateGreeks(
  s: number,
  k: number,
  t: number,
  isCall: boolean
): Greeks {
  if (isWasmLoaded()) {
    const greeks = wasm_calculate_greeks(s, k, t, isCall)
    return {
      delta: greeks.delta,
      gamma: greeks.gamma,
      vega: greeks.vega,
      theta: greeks.theta,
      rho: greeks.rho,
    }
  }
  return {
    delta: deltaCalcJS(s, k, t, isCall),
    gamma: gammaCalcJS(s, k, t),
    vega: vegaCalcJS(s, k, t),
    theta: thetaCalcJS(s, k, t, isCall),
    rho: rhoCalcJS(s, k, t, isCall),
  }
}

/** Calculate individual Greek values */
export const deltaCalc = (s: number, k: number, t: number, isCall: boolean): number =>
  isWasmLoaded() ? wasm_delta_calc(s, k, t, isCall) : deltaCalcJS(s, k, t, isCall)
export const gammaCalc = (s: number, k: number, t: number): number =>
  isWasmLoaded() ? wasm_gamma_calc(s, k, t) : gammaCalcJS(s, k, t)
export const vegaCalc = (s: number, k: number, t: number): number =>
  isWasmLoaded() ? wasm_vega_calc(s, k, t) : vegaCalcJS(s, k, t)
export const thetaCalc = (s: number, k: number, t: number, isCall: boolean): number =>
  isWasmLoaded() ? wasm_theta_calc(s, k, t, isCall) : thetaCalcJS(s, k, t, isCall)
export const rhoCalc = (s: number, k: number, t: number, isCall: boolean): number =>
  isWasmLoaded() ? wasm_rho_calc(s, k, t, isCall) : rhoCalcJS(s, k, t, isCall)

// =============================================================================
// JAVASCRIPT FALLBACKS
// =============================================================================

function normalCdf(z: number): number {
  const beta1 = -0.0004406
  const beta2 = 0.0418198
  const beta3 = 0.9
  const exponent =
    -Math.sqrt(Math.PI) *
    (beta1 * Math.pow(z, 5) + beta2 * Math.pow(z, 3) + beta3 * z)
  return 1.0 / (1.0 + Math.exp(exponent))
}

function normalPdf(x: number): number {
  return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI)
}

function blackScholesJS(
  s: number,
  k: number,
  t: number,
  isCall: boolean
): number {
  if (t <= 0 || s <= 0 || k <= 0) return 0
  const d1 =
    (Math.log(s / k) + (R + 0.5 * SIGMA * SIGMA) * t) / (SIGMA * Math.sqrt(t))
  const d2 = d1 - SIGMA * Math.sqrt(t)
  if (isCall) return s * normalCdf(d1) - k * Math.exp(-R * t) * normalCdf(d2)
  return k * Math.exp(-R * t) * normalCdf(-d2) - s * normalCdf(-d1)
}

function deltaCalcJS(s: number, k: number, t: number, isCall: boolean): number {
  if (t <= 0 || s <= 0 || k <= 0) return 0
  const d1 =
    (Math.log(s / k) + (R + Math.pow(SIGMA, 2) / 2) * t) /
    (SIGMA * Math.sqrt(t))
  return isCall ? normalCdf(d1) : -normalCdf(-d1)
}

function gammaCalcJS(s: number, k: number, t: number): number {
  if (t <= 0 || s <= 0 || k <= 0) return 0
  const d1 =
    (Math.log(s / k) + (R + Math.pow(SIGMA, 2) / 2) * t) /
    (SIGMA * Math.sqrt(t))
  return normalPdf(d1) / (s * SIGMA * Math.sqrt(t))
}

function vegaCalcJS(s: number, k: number, t: number): number {
  if (t <= 0 || s <= 0 || k <= 0) return 0
  const d1 =
    (Math.log(s / k) + (R + Math.pow(SIGMA, 2) / 2) * t) /
    (SIGMA * Math.sqrt(t))
  return s * normalPdf(d1) * Math.sqrt(t) * 0.01
}

function thetaCalcJS(s: number, k: number, t: number, isCall: boolean): number {
  if (t <= 0 || s <= 0 || k <= 0) return 0
  const d1 =
    (Math.log(s / k) + (R + Math.pow(SIGMA, 2) / 2) * t) /
    (SIGMA * Math.sqrt(t))
  const d2 = d1 - SIGMA * Math.sqrt(t)
  let thetaValue =
    (-s * normalPdf(d1) * SIGMA) / (2 * Math.sqrt(t)) -
    R * k * Math.exp(-R * t) * normalCdf(isCall ? d2 : -d2)
  return thetaValue / 365
}

function rhoCalcJS(s: number, k: number, t: number, isCall: boolean): number {
  if (t <= 0 || s <= 0 || k <= 0) return 0
  const d1 =
    (Math.log(s / k) + (R + Math.pow(SIGMA, 2) / 2) * t) /
    (SIGMA * Math.sqrt(t))
  const d2 = d1 - SIGMA * Math.sqrt(t)
  return (
    (isCall ? 1 : -1) *
    k *
    t *
    Math.exp(-R * t) *
    normalCdf(isCall ? d2 : -d2) *
    0.01
  )
}

// =============================================================================
// ENERGY GRID FUNCTIONS
// =============================================================================

/** Calculate Bezier curve points for energy grid visualization */
export function calculateBezier(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  intensity: number,
  segments: number
): [number, number][] {
  if (!isWasmLoaded()) return []

  const points = calculate_bezier(x1, y1, x2, y2, intensity, segments)
  const result: [number, number][] = []

  for (let i = 0; i < points.length; i += 2) {
    result.push([points[i], points[i + 1]])
  }

  return result
}

// =============================================================================
// CRYPTO & ZK
// =============================================================================

export function sha256(message: string): string {
  if (!isWasmLoaded()) return ''
  const encoder = new TextEncoder()
  return wasm_sha256(encoder.encode(message))
}

export function hmacSign(key: string, message: string): Uint8Array {
  if (!isWasmLoaded()) return new Uint8Array(32)
  const encoder = new TextEncoder()
  const hex = wasm_hmac_sha256(encoder.encode(key), encoder.encode(message))
  // Convert hex result to Uint8Array
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16)
  }
  return bytes
}

export function hmacVerify(
  key: string,
  message: string,
  signature: Uint8Array
): boolean {
  if (!isWasmLoaded()) return false
  const encoder = new TextEncoder()
  const sigHex = Array.from(signature)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
  return wasm_crypto_verify(
    encoder.encode(key),
    encoder.encode(message),
    sigHex
  )
}

/**
 * High-level wrapper for P2P order signing
 * NOTE: This function is currently disabled as wasm_sign_p2p_order is not available
 */
export function signP2POrder(
  side: string,
  amount: string,
  price: string,
  timestamp: number,
  secret_key: Uint8Array
): string {
  console.warn('[WASM] signP2POrder is not implemented in WASM module')
  return ''
}

export async function createCommitment(
  value: number,
  blinding: Uint8Array
): Promise<ZkCommitment> {
  if (!isWasmLoaded()) throw new Error('WASM not loaded')
  return wasm_create_commitment(BigInt(value), blinding)
}

export async function createRangeProof(
  amount: number,
  blinding: Uint8Array
): Promise<ZkRangeProof> {
  if (!isWasmLoaded()) throw new Error('WASM not loaded')
  return wasm_create_range_proof(BigInt(amount), blinding)
}

export async function createTransferProof(
  amount: number,
  balance: number,
  senderBlinding: Uint8Array,
  amountBlinding: Uint8Array
): Promise<ZkTransferProof> {
  if (!isWasmLoaded()) throw new Error('WASM not loaded')
  return wasm_create_transfer_proof(
    BigInt(amount),
    BigInt(balance),
    senderBlinding,
    amountBlinding
  )
}

/**
 * Perform high-performance clustering for energy profiles
 */
export function performClustering(characteristics: {
  peak_to_avg_ratio: number
  daytime_ratio: number
}): any {
  if (!isWasmLoaded()) return null
  return wasm_perform_clustering(characteristics)
}

/**
 * Perform high-performance data aggregation for energy readings
 */
export function aggregateReadings(readings: any[]): any {
  if (!isWasmLoaded()) return null
  return wasm_aggregate_readings(readings)
}

/**
 * Recover hidden amount from a Pedersen commitment
 */
export function recoverAmount(commitment: number[], blinding: Uint8Array): number | null {
  if (!isWasmLoaded()) return null
  const result = wasm_recover_amount_from_commitment(commitment, blinding)
  return result !== undefined ? Number(result) : null
}

/**
 * Derive stealth key for private links
 */
export function deriveStealthKey(rootSeed: Uint8Array, index: number): Uint8Array | null {
  if (!isWasmLoaded()) return null
  return wasm_derive_stealth_key(rootSeed, index)
}

/**
 * Calculate aggregated risk for a portfolio of positions
 */
export function calculatePortfolioRisk(positions: any[]): any {
  if (!isWasmLoaded()) return null
  return wasm_calculate_portfolio_risk(positions)
}
