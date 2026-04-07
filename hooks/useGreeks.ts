import {
  deltaCalc,
  gammaCalc,
  rhoCalc,
  thetaCalc,
  vegaCalc,
} from '@/lib/wasm-bridge'
import { differenceInSeconds } from 'date-fns'

interface useGreeksProps {
  type: 'Call' | 'Put'
  strikePrice: number
  currentPrice: number
  expiryDate: Date
}

export function useGreeks({
  type,
  strikePrice,
  currentPrice,
  expiryDate,
}: useGreeksProps) {
  let delta: number
  let gamma: number
  let vega: number
  let theta: number
  let rho: number

  const seconds = differenceInSeconds(expiryDate, Date.now())
  const time = seconds / (365 * 24 * 60 * 60)
  const isCall = (type: 'Call' | 'Put') => {
    return type === 'Call' ? true : false
  }

  delta = deltaCalc(currentPrice, strikePrice, time, isCall(type))
  gamma = gammaCalc(currentPrice, strikePrice, time)
  vega = vegaCalc(currentPrice, strikePrice, time)
  theta = thetaCalc(currentPrice, strikePrice, time, isCall(type))
  rho = rhoCalc(currentPrice, strikePrice, time, isCall(type))

  return { delta, gamma, vega, theta, rho }
}
