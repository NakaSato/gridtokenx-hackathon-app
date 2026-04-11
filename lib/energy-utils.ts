/**
 * Energy token utilities — PDA derivation, ATA, token formatting.
 * Uses the correct Anchor program ID and seeds for the dual-token architecture.
 */

import { PublicKey } from '@solana/web3.js'
import { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from '@solana/spl-token'
import { discriminator as disc } from './discriminators'

// ── Program IDs ────────────────────────────────────────────────────────────
export const ENERGY_TOKEN_PROGRAM_ID = new PublicKey(
  process.env.NEXT_PUBLIC_ENERGY_TOKEN_PROGRAM_ID ||
    'B9LnEVqqz8ZVgZ4zELtxXYozXQbm1eo1KD2x3rAMMcTH'
)

export const REGISTRY_PROGRAM_ID = new PublicKey(
  process.env.NEXT_PUBLIC_REGISTRY_PROGRAM_ID ||
    'C5HLtbZHgwVU2oMirgd9f62Zeig7hZFKyJuB9AqVcsn6'
)

export const TRADING_PROGRAM_ID = new PublicKey(
  process.env.NEXT_PUBLIC_TRADING_PROGRAM_ID ||
    '5e8URdeycFDUZL33HYhhEMY928BJCTPn4xAnhJhKb3SA'
)

// ── PDAs ───────────────────────────────────────────────────────────────────
export function getTokenConfigPda(programId = ENERGY_TOKEN_PROGRAM_ID): PublicKey {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('token_config')],
    programId
  )[0]
}

export function getGridMintPda(programId = ENERGY_TOKEN_PROGRAM_ID): PublicKey {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('grid_mint')],
    programId
  )[0]
}

export function getGrxMintPda(programId = ENERGY_TOKEN_PROGRAM_ID): PublicKey {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('grx_mint')],
    programId
  )[0]
}

export function getRegistryPda(programId = REGISTRY_PROGRAM_ID): PublicKey {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('registry')],
    programId
  )[0]
}

export function getTradingConfigPda(programId = TRADING_PROGRAM_ID): PublicKey {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('trading_config')],
    programId
  )[0]
}

// ── Associated Token Accounts ──────────────────────────────────────────────
export function getAssociatedTokenAddress(
  mint: PublicKey,
  owner: PublicKey
): PublicKey {
  return PublicKey.findProgramAddressSync(
    [owner.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), mint.toBuffer()],
    ASSOCIATED_TOKEN_PROGRAM_ID
  )[0]
}

// ── Token Formatting ───────────────────────────────────────────────────────
const DECIMALS = 9

export function formatTokenAmount(rawAmount: bigint | number): string {
  const num = typeof rawAmount === 'bigint' ? Number(rawAmount) : rawAmount
  return (num / 10 ** DECIMALS).toFixed(2)
}

export function parseTokenAmount(input: string): bigint {
  const num = parseFloat(input)
  if (isNaN(num) || num <= 0) return BigInt(0)
  return BigInt(Math.floor(num * 10 ** DECIMALS))
}

// ── Discriminator Export ───────────────────────────────────────────────────
export { disc as discriminator }
