/**
 * Transaction types for GridTokenX Platform
 */

export type TransactionType =
  | 'EnergyTrade'
  | 'TokenMint'
  | 'TokenBurn'
  | 'Stake'
  | 'Unstake'
  | 'Reward'

export type TransactionStatus =
  | 'pending'
  | 'processing'
  | 'submitted'
  | 'confirmed'
  | 'failed'
  | 'settled'

export interface UserTransaction {
  transaction_type: TransactionType
  operation_id: string
  user_id: string
  status: TransactionStatus
  signature: string | null
  attempts: number
  last_error: string | null
  created_at: string
  submitted_at: string | null
  confirmed_at: string | null
  settled_at: string | null
  metadata?: {
    energy_amount?: number
    price_per_kwh?: number
    total_amount?: number
    wheeling_charge?: number
    loss_cost?: number
    loss_factor?: number
    effective_energy?: number
    buyer_zone_id?: number
    seller_zone_id?: number
    side?: string
    zone_id?: number
  }
}

export interface GetUserTransactionsParams {
  transaction_type?: TransactionType
  status?: TransactionStatus
  date_from?: string
  date_to?: string
  limit?: number
  offset?: number
  min_attempts?: number
  has_signature?: boolean
}

export interface UserTransactionsResponse {
  transactions: UserTransaction[]
  total: number
}
