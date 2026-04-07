import { Connection, PublicKey } from '@solana/web3.js'

// Use environment variables for Solana connection
export const clusterUrl =
  process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.devnet.solana.com'

// Create connection with error handling
let connectionInstance: Connection | null = null
try {
  connectionInstance = new Connection(clusterUrl, 'confirmed')
} catch (e) {
  console.error('[const] Failed to create Solana connection:', e)
}
export const connection = connectionInstance!

// Helper function to safely create PublicKey
function safePublicKey(address: string, name: string): PublicKey {
  try {
    return new PublicKey(address)
  } catch (e) {
    console.error(`[const] Invalid PublicKey for ${name}:`, address, e)
    // Return a fallback valid public key (system program)
    return new PublicKey('11111111111111111111111111111111')
  }
}

// Energy Token Mint
export const ENERGY_TOKEN_MINT = safePublicKey(
  process.env.NEXT_PUBLIC_ENERGY_TOKEN_MINT ||
    '12EMWFUfreZR7QkgEs3N34EoJFvQyLfx7iBB5JdbKvib',
  'ENERGY_TOKEN_MINT'
)

// Mainnet
export const USDC_MINT = safePublicKey(
  'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  'USDC_MINT'
)
export const USDC_DECIMALS = 6

export const USDC_ORACLE = safePublicKey(
  '5SSkXsEKQepHHAewytPVwdej4epN1nxgLVM84L4KXgy7',
  'USDC_ORACLE'
)

// Devnet
export const THB_MINT = safePublicKey(
  '3d79oe7AKxxHfLz11BXAnWqBX72rubLiQppUNoKGhMPk',
  'THB_MINT'
)
export const THB_DECIMALS = 6
export const WSOL_MINT = safePublicKey(
  '349kUpx5gmhFhy3bmYFW6SqNteDyc4uUt4Do5nSRM5B7',
  'WSOL_MINT'
)
export const WSOL_DECIMALS = 9
export const LP_DECIMALS = 6
export const SOL_USD_PYTH_ACCOUNT = safePublicKey(
  'J83w4HKfqxwcq3BEMMkPFSppX3gqekLyLJBexebFVkix',
  'SOL_USD_PYTH_ACCOUNT'
)
export const Option_Program_Address = safePublicKey(
  process.env.NEXT_PUBLIC_TRADING_PROGRAM_ID ||
    '9t3s8sCgVUG9kAgVPsozj8mDpJp9cy6SF5HwRK5nvAHb',
  'Option_Program_Address'
)

export const WSOL_ORACLE = safePublicKey(
  'J83w4HKfqxwcq3BEMMkPFSppX3gqekLyLJBexebFVkix',
  'WSOL_ORACLE'
)
export const THB_ORACLE = safePublicKey(
  '5SSkXsEKQepHHAewytPVwdej4epN1nxgLVM84L4KXgy7',
  'THB_ORACLE'
)

export const HERMES_URL = 'https://hermes.pyth.network/'
export const SOL_PRICE_FEED_ID =
  '0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d'
export const HELIUS_API_KEY = '0b2c2894-dced-471c-a773-f7b4d6ff1671'
export const HELIUS_ENDPOINT = `https://api-devnet.helius.xyz/v0/addresses`
export const HELIUS_RPC_ENDPOINT = `https://devnet.helius-rpc.com/`
