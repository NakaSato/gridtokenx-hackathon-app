import { PublicKey } from '@solana/web3.js'
import { BN } from '@coral-xyz/anchor'

export interface OptionPosition {
    index: number
    token: string
    logo: string
    symbol: string
    strikePrice: number
    type: 'Call' | 'Put'
    expiry: string
    size: number
    pnl: number
    greeks: {
        delta: number
        gamma: number
        theta: number
        vega: number
    }
}

export interface Custody {
    mint: PublicKey
    oracle: PublicKey
    tokenAccount: PublicKey
    // add more fields as needed
}

export type ExpiredOption = {
    index: any
    token: any
    transaction: any
    strikePrice: any
    qty: any
    expiryPrice: any
    tokenAmount: any
    dollarAmount: any
    iconPath: any
}
