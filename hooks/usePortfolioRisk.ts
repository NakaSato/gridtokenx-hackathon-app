'use client'

import { useMemo } from 'react'
import { calculatePortfolioRisk } from '@/lib/wasm-bridge'
import type { Position } from '@/lib/data/Positions'

export interface PortfolioRisk {
  totalDelta: number
  totalGamma: number
  totalVega: number
  totalTheta: number
  totalRho: number
  totalPnl: number
  netExposure: number
}

export function usePortfolioRisk(positions: Position[] | undefined) {
  const risk = useMemo(() => {
    if (!positions || positions.length === 0) {
      return {
        totalDelta: 0,
        totalGamma: 0,
        totalVega: 0,
        totalTheta: 0,
        totalRho: 0,
        totalPnl: 0,
        netExposure: 0,
      }
    }

    // Map positions to the format expected by WASM
    const wasmPositions = positions.map(pos => ({
      symbol: pos.symbol,
      size: pos.size,
      delta: pos.greeks?.delta || 0,
      gamma: pos.greeks?.gamma || 0,
      vega: pos.greeks?.vega || 0,
      theta: pos.greeks?.theta || 0,
      rho: 0, // Not currently in Position type
      pnl: pos.pnl || 0,
    }))

    const result = calculatePortfolioRisk(wasmPositions)

    if (!result) {
      return {
        totalDelta: 0,
        totalGamma: 0,
        totalVega: 0,
        totalTheta: 0,
        totalRho: 0,
        totalPnl: 0,
        netExposure: 0,
      }
    }

    return {
      totalDelta: result.total_delta,
      totalGamma: result.total_gamma,
      totalVega: result.total_vega,
      totalTheta: result.total_theta,
      totalRho: result.total_rho,
      totalPnl: result.total_pnl,
      netExposure: result.net_exposure,
    }
  }, [positions])

  return risk
}
