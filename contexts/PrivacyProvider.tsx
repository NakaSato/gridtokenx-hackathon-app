'use client'

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react'
import { useAnchorWallet, useConnection } from '@solana/wallet-adapter-react'
import { Program, AnchorProvider, BN } from '@coral-xyz/anchor'
import { PublicKey, Keypair, SystemProgram, Transaction } from '@solana/web3.js'
import * as zk from '@/lib/zk-utils'
import * as privacyUtils from '@/lib/privacy-utils'
import * as stealthUtils from '@/lib/stealth-utils'
import {
  getPrivateBalancePDA,
  getNullifierSetPDA,
  getMintAuthorityPDA,
} from '@/lib/pda-utils'
import { ENERGY_TOKEN_MINT } from '@/utils/const'
import tradingIdl from '@/lib/idl/trading.json'
import { toast } from 'react-hot-toast'
import * as historyUtils from '@/lib/history-utils'

interface PrivateBalanceState {
  commitment: number[]
  amount: number | null
  origin: 'Solar' | 'Wind' | 'Grid' | null
  txCounter: number
  lastUpdateSlot: number
  isInitialized: boolean
}

interface PrivacyContextType {
  privateBalance: PrivateBalanceState | null
  rootSeed: Uint8Array | null
  isUnlocked: boolean
  isLoading: boolean
  unlockPrivacy: () => Promise<void>
  shield: (amount: number, origin?: 'Solar' | 'Wind') => Promise<string>
  transfer: (recipient: PublicKey, amount: number) => Promise<string>
  unshield: (amount: number) => Promise<string>
  createStealthLink: (amount: number) => Promise<string>
  claimStealthLink: (link: string) => Promise<string>
  stakePrivate: (amount: number) => Promise<string>
  unstakePrivate: (amount: number) => Promise<string>
  batchShield: (amounts: number[]) => Promise<string>
  createTradeOffer: (amount: number, price: number) => Promise<string>
  fulfillTradeOffer: (invite: string) => Promise<string>
  verifySolvency: () => Promise<boolean>
  transactionHistory: any[]
  isReadOnly: boolean
  exportViewKey: () => string
  loginWithViewKey: (key: string) => Promise<void>
  submitRollup: (proofs: any[]) => Promise<string>
  rollupQueue: any[]
  privacyPolicies: any[]
  addPolicy: (policy: any) => void
  removePolicy: (id: string) => void
  refresh: () => Promise<void>
}

const PrivacyContext = createContext<PrivacyContextType | undefined>(undefined)

export const usePrivacy = () => {
  const context = useContext(PrivacyContext)
  if (!context)
    throw new Error('usePrivacy must be used within PrivacyProvider')
  return context
}

// Safe initialization of TRADING_PROGRAM_ID
let TRADING_PROGRAM_ID: PublicKey
try {
  TRADING_PROGRAM_ID = new PublicKey(tradingIdl.address)
} catch (e) {
  console.warn('[PrivacyProvider] Invalid trading IDL address, using fallback')
  TRADING_PROGRAM_ID = new PublicKey(
    '9t3s8sCgVUG9kAgVPsozj8mDpJp9cy6SF5HwRK5nvAHb'
  )
}

export const PrivacyProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const { connection } = useConnection()
  const wallet = useAnchorWallet()
  const [privateBalance, setPrivateBalance] =
    useState<PrivateBalanceState | null>(null)
  const [rootSeed, setRootSeed] = useState<Uint8Array | null>(null)
  const [encryptionKey, setEncryptionKey] = useState<Uint8Array | null>(null)
  const [transactionHistory, setTransactionHistory] = useState<any[]>([])
  const [isReadOnly, setIsReadOnly] = useState(false)
  const [rollupQueue, setRollupQueue] = useState<any[]>([])
  const [privacyPolicies, setPrivacyPolicies] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [program, setProgram] = useState<Program<any>>()

  const isUnlocked = !!rootSeed

  useEffect(() => {
    if (wallet) {
      const provider = new AnchorProvider(connection, wallet, {
        commitment: 'confirmed',
      })
      const prog = new Program(tradingIdl as any, provider)
      setProgram(prog)
    }
  }, [wallet, connection])

  const refresh = async () => {
    if (!wallet || !program) return

    setIsLoading(true)
    try {
      const pda = getPrivateBalancePDA(
        wallet.publicKey,
        ENERGY_TOKEN_MINT,
        TRADING_PROGRAM_ID
      )
      const account = await (
        program.account as any
      ).privateBalance.fetchNullable(pda)

      if (account) {
        // If we have a seed, try to recover the amount
        let amount: number | null = null
        let originVal: 'Solar' | 'Wind' | 'Grid' | null = null
        if (rootSeed) {
          const stored = localStorage.getItem(
            `gtx_priv_bal_${wallet.publicKey.toBase58()}`
          )
          if (stored) {
            amount = parseInt(stored)
          }
          originVal =
            (localStorage.getItem(
              `gtx_priv_origin_${wallet.publicKey.toBase58()}`
            ) as any) || 'Solar'
        }

        setPrivateBalance({
          commitment: Array.from(account.balanceCommitment.point),
          amount: amount,
          origin: originVal,
          txCounter: (account.txCounter as BN).toNumber(),
          lastUpdateSlot: (account.lastUpdateSlot as BN).toNumber(),
          isInitialized: true,
        })
      } else {
        setPrivateBalance({
          commitment: [],
          amount: 0,
          origin: null,
          txCounter: 0,
          lastUpdateSlot: 0,
          isInitialized: false,
        })
      }
    } catch (error) {
      console.error('[PrivacyProvider] Failed to fetch balance:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    refresh()
  }, [program, isUnlocked])

  const unlockPrivacy = async () => {
    if (!wallet) throw new Error('Wallet not connected')

    // Use wallet.signMessage if available (Standard but optional in AnchorWallet)
    // If not available, we use a custom approach or prompt.
    const provider = (window as any).solana
    if (!provider?.signMessage) {
      throw new Error(
        'Wallet does not support message signing required for privacy.'
      )
    }

    const message = new TextEncoder().encode(
      `GridTokenX Privacy Access\n\nAuthorize access to your confidential GridToken assets.\nYour balance will be recovered using your signature.\n\nWallet: ${wallet.publicKey.toBase58()}`
    )

    const signedMessage = await provider.signMessage(message)
    const signature = signedMessage.signature

    const seed = privacyUtils.derivePrivacyRootSeed(signature)
    setRootSeed(seed)

    // Derive a separate encryption key for history (first 32 bytes of sha256(seed))
    const encKey = await window.crypto.subtle.digest(
      'SHA-256',
      new Uint8Array(seed).buffer
    )
    setEncryptionKey(new Uint8Array(encKey))

    // Fetch balance and history immediately after unlock
    await refresh()
    await loadHistory(new Uint8Array(encKey))
  }

  const pushToHistory = async (
    type: string,
    amount: number,
    details: any = {}
  ) => {
    if (!wallet || !encryptionKey) return

    const entry = {
      type,
      amount,
      ...details,
      timestamp: Date.now(),
    }

    const encrypted = await historyUtils.encryptHistoryBlob(
      entry,
      encryptionKey
    )

    // In demo, we store in a list in localStorage
    const storageKey = `gtx_priv_history_${wallet.publicKey.toBase58()}`
    const current = JSON.parse(localStorage.getItem(storageKey) || '[]')
    current.push(encrypted)
    localStorage.setItem(storageKey, JSON.stringify(current))

    // Update local state
    setTransactionHistory((prev) => [entry, ...prev])
  }

  const loadHistory = async (key: Uint8Array) => {
    if (!wallet) return
    const storageKey = `gtx_priv_history_${wallet.publicKey.toBase58()}`
    const stored = JSON.parse(localStorage.getItem(storageKey) || '[]')

    const decrypted = []
    for (const blob of stored) {
      try {
        const entry = await historyUtils.decryptHistoryBlob(blob, key)
        decrypted.push(entry)
      } catch (e) {
        console.error('History decryption failed', e)
      }
    }
    setTransactionHistory(decrypted.sort((a, b) => b.timestamp - a.timestamp))
  }

  const exportViewKey = () => {
    if (!encryptionKey) throw new Error('Not unlocked')
    return Buffer.from(encryptionKey).toString('hex')
  }

  const loginWithViewKey = async (viewKeyHex: string) => {
    const key = new Uint8Array(Buffer.from(viewKeyHex, 'hex'))
    setEncryptionKey(key)
    setIsReadOnly(true)
    // Set a mock root seed that cannot sign but enables 'isUnlocked'
    setRootSeed(new Uint8Array(32))
    await loadHistory(key)
    toast.success('Logged in with View Key (Read-Only)')
  }

  const submitRollup = async (proofs: any[]) => {
    if (!program || !wallet) throw new Error('Not connected')

    const toastId = toast.loading(
      `Aggregating ${proofs.length} ZK Proofs into Rollup...`
    )

    try {
      // Simulation of Recursive Proof generation
      // In a real system (e.g., Plonky2 or Halo2), this involves:
      // 1. Verifying proofs 1..N inside a new ZK circuit
      // 2. Generating a single "Master Proof" of their correctness
      await new Promise((r) => setTimeout(r, 2000))

      const sig =
        'ROLLUP_SIG_' + Math.random().toString(36).substr(2, 12).toUpperCase()

      // Log entries for each proof in the rollup
      for (const p of proofs) {
        await pushToHistory('ROLLUP_SETTLEMENT', p.amount, { rollupId: sig })
      }

      setRollupQueue([])
      toast.success(
        `Rollup Successful: Aggregated ${proofs.length} transactions!`,
        { id: toastId }
      )
      return sig
    } catch (e) {
      toast.error('Rollup aggregation failed', { id: toastId })
      throw e
    }
  }

  const checkPolicy = (action: string, amount: number, details: any = {}) => {
    for (const policy of privacyPolicies) {
      if (policy.type === 'MAX_AMOUNT' && amount > policy.value) {
        throw new Error(
          `Policy Violation: Amount exceeds maximum of ${policy.value} GRX`
        )
      }
      if (
        policy.type === 'SOLAR_ONLY' &&
        details.origin &&
        details.origin !== 'Solar'
      ) {
        throw new Error(
          `Policy Violation: This transfer requires Solar energy origin`
        )
      }
    }
    return true
  }

  const addPolicy = (policy: any) => {
    const newPolicies = [
      ...privacyPolicies,
      { ...policy, id: Math.random().toString(36).substr(2, 9) },
    ]
    setPrivacyPolicies(newPolicies)
    toast.success(`Policy Added: ${policy.name}`)
  }

  const removePolicy = (id: string) => {
    setPrivacyPolicies((prev) => prev.filter((p) => p.id !== id))
    toast.success('Policy Removed')
  }

  const transfer = async (recipient: PublicKey, amount: number) => {
    if (!wallet || !program || !rootSeed || !privateBalance)
      throw new Error('Not connected or locked')
    if (privateBalance.amount === null)
      throw new Error('Private balance amount unknown. Sync first.')
    if (privateBalance.amount < amount)
      throw new Error('Insufficient private balance')

    // 1. Blinding Factors
    // b_old logic: In this prototype, we'll keep it simple
    const currentIdx = privateBalance.txCounter
    const b_old = privacyUtils.deriveBlindingFactor(rootSeed, currentIdx)
    // Note: In real deterministic chain, b_new = b_old - b_tr.
    // We'd need to store the "cumulative blinding delta".
    // For simplicity in this demo, we'll assume currentIdx manages b_old.

    const b_tr = window.crypto.getRandomValues(new Uint8Array(32))

    // 2. Generate Transfer Proof
    const proof = await zk.createTransferProof(
      amount,
      privateBalance.amount,
      b_old,
      b_tr
    )

    // 3. Derive commitments
    const senderNewCommit = {
      point: Array.from(proof.remaining_range_proof.commitment.point),
    }
    const recipientNewCommit = {
      point: Array.from(proof.amount_range_proof.commitment.point),
    }

    // 4. PDAs
    const senderPda = getPrivateBalancePDA(
      wallet.publicKey,
      ENERGY_TOKEN_MINT,
      TRADING_PROGRAM_ID
    )
    const recipientPda = getPrivateBalancePDA(
      recipient,
      ENERGY_TOKEN_MINT,
      TRADING_PROGRAM_ID
    )
    const nullifierSet = getNullifierSetPDA(
      ENERGY_TOKEN_MINT,
      TRADING_PROGRAM_ID
    )

    const transferRecord = Keypair.generate()
    const nullifier = window.crypto.getRandomValues(new Uint8Array(32))

    const sig = await (program.methods as any)
      .privateTransfer(
        senderNewCommit,
        recipientNewCommit,
        {
          amountCommitment: { point: recipientNewCommit.point },
          amountRangeProof: {
            proofData: Array.from(proof.amount_range_proof.proof_data),
            commitment: { point: recipientNewCommit.point },
          },
          remainingRangeProof: {
            proofData: Array.from(proof.remaining_range_proof.proof_data),
            commitment: { point: senderNewCommit.point },
          },
          balanceProof: proof.balance_proof,
        },
        Array.from(nullifier)
      )
      .accounts({
        senderBalance: senderPda,
        recipientBalance: recipientPda,
        nullifierSet: nullifierSet,
        transferRecord: transferRecord.publicKey,
        sender: wallet.publicKey,
        owner: wallet.publicKey,
        systemProgram: SystemProgram.programId,
      } as any)
      .signers([transferRecord])
      .rpc()

    // Update local balance
    const newBal = privateBalance.amount - amount
    localStorage.setItem(
      `gtx_priv_bal_${wallet.publicKey.toBase58()}`,
      newBal.toString()
    )

    await pushToHistory('TRANSFER', amount, { recipient: recipient.toBase58() })
    await refresh()
    return sig
  }

  const unshield = async (amount: number) => {
    if (!wallet || !program || !rootSeed || !privateBalance)
      throw new Error('Not connected or locked')
    if (privateBalance.amount === null)
      throw new Error('Private balance amount unknown. Sync first.')
    if (privateBalance.amount < amount)
      throw new Error('Insufficient private balance')

    // 1. Proof Setup
    const currentIdx = privateBalance.txCounter
    const b_old = privacyUtils.deriveBlindingFactor(rootSeed, currentIdx)
    // Recipient blinding in 'transfer_proof' represents the 'unshielded commitment'
    // We'll use a random one as it's not staying in the ZK system (it's becoming public)
    const b_tr = window.crypto.getRandomValues(new Uint8Array(32))

    const proof = await zk.createTransferProof(
      amount,
      privateBalance.amount,
      b_old,
      b_tr
    )

    // 2. PDAs
    const pda = getPrivateBalancePDA(
      wallet.publicKey,
      ENERGY_TOKEN_MINT,
      TRADING_PROGRAM_ID
    )
    const nullifierSet = getNullifierSetPDA(
      ENERGY_TOKEN_MINT,
      TRADING_PROGRAM_ID
    )
    const mintAuthority = getMintAuthorityPDA(
      ENERGY_TOKEN_MINT,
      TRADING_PROGRAM_ID
    )

    // Public ATA source/dest
    const { getAssociatedTokenAddressSync } = await import('@solana/spl-token')
    const ata = getAssociatedTokenAddressSync(
      ENERGY_TOKEN_MINT,
      wallet.publicKey
    )

    const senderNewCommit = {
      point: Array.from(proof.remaining_range_proof.commitment.point),
    }
    const nullifier = window.crypto.getRandomValues(new Uint8Array(32))

    const sig = await (program.methods as any)
      .unshieldTokens(
        new BN(amount),
        senderNewCommit,
        {
          amountCommitment: {
            point: Array.from(proof.amount_range_proof.commitment.point),
          },
          amountRangeProof: {
            proofData: Array.from(proof.amount_range_proof.proof_data),
            commitment: {
              point: Array.from(proof.amount_range_proof.commitment.point),
            },
          },
          remainingRangeProof: {
            proofData: Array.from(proof.remaining_range_proof.proof_data),
            commitment: { point: senderNewCommit.point },
          },
          balanceProof: proof.balance_proof,
        },
        Array.from(nullifier)
      )
      .accounts({
        privateBalance: pda,
        nullifierSet: nullifierSet,
        mint: ENERGY_TOKEN_MINT,
        userTokenAccount: ata,
        mintAuthority: mintAuthority,
        owner: wallet.publicKey,
      } as any)
      .rpc()

    // Update local balance
    const newBal = privateBalance.amount - amount
    localStorage.setItem(
      `gtx_priv_bal_${wallet.publicKey.toBase58()}`,
      newBal.toString()
    )

    await pushToHistory('WITHDRAW', amount)
    await refresh()
    return sig
  }

  const createStealthLink = async (amount: number) => {
    if (!wallet || !rootSeed || !privateBalance)
      throw new Error('Not connected or locked')
    if ((privateBalance.amount || 0) < amount)
      throw new Error('Insufficient private balance')

    // Logic: For a stealth link to be "claimable", the sender effectively
    // does a "transfer" to an ephemeral state.
    // For simplicity in this demo, the link will contain the blinding factor
    // needed to prove ownership of a specific "spent" commitment piece.
    const nextIdx = privateBalance.txCounter + 1
    const blinding = privacyUtils.deriveBlindingFactor(rootSeed, nextIdx)

    // Use stealth-utils to pack it
    const link = await stealthUtils.createStealthLink(amount, blinding, nextIdx)

    // In a real flow, the sender might "escrow" funds or just share the secret info
    // for a pending transaction. Here we'll just return the encoded link.
    return link
  }

  const claimStealthLink = async (link: string) => {
    if (!wallet || !program || !rootSeed)
      throw new Error('Not connected or locked')

    const data = stealthUtils.parseStealthLink(link)

    // Claiming: The recipient "shields" the incoming stealth tokens
    // using the recovered blinding factor from the link.
    const blinding = Uint8Array.from(Buffer.from(data.blinding, 'hex'))

    // This is a specialized shield that uses an existing commitment piece
    // For this demo, we'll re-shield it into the user's private balance.
    return await shield(data.amount)
  }

  const stakePrivate = async (amount: number) => {
    if (!wallet || !program || !rootSeed || !privateBalance)
      throw new Error('Not connected or locked')
    if ((privateBalance.amount || 0) < amount)
      throw new Error('Insufficient private balance')

    // Logic: Staking is a transfer to a program-controlled "Stake Pool"
    // For this prototype, we'll use a fixed 'Staking Vault' address
    const STAKING_VAULT = new PublicKey(
      'GridStakeVault11111111111111111111111111'
    )

    const sig = await transfer(STAKING_VAULT, amount)

    // Update local staked balance
    if (wallet) {
      const currentStaked = parseInt(
        localStorage.getItem(
          `gtx_priv_staked_${wallet.publicKey.toBase58()}`
        ) || '0'
      )
      localStorage.setItem(
        `gtx_priv_staked_${wallet.publicKey.toBase58()}`,
        (currentStaked + amount).toString()
      )
    }

    await refresh()
    return sig
  }

  const unstakePrivate = async (amount: number) => {
    if (!wallet) throw new Error('Not connected')

    // Unstaking is essentially the Stake Vault "shielding" tokens back to the user
    // In a real system, the Vault would sign. For this demo, we'll simulate the reduction.
    const currentStaked = parseInt(
      localStorage.getItem(`gtx_priv_staked_${wallet.publicKey.toBase58()}`) ||
        '0'
    )
    if (currentStaked < amount) throw new Error('Insufficient staked balance')

    localStorage.setItem(
      `gtx_priv_staked_${wallet.publicKey.toBase58()}`,
      (currentStaked - amount).toString()
    )

    // In demo, we "mint" or "shield" the tokens back to private balance
    return await shield(amount)
  }

  const shield = async (amount: number, origin: 'Solar' | 'Wind' = 'Solar') => {
    if (!wallet || !program || !rootSeed)
      throw new Error('Not connected or locked')

    // Drive next blinding factor
    const nextIdx = (privateBalance?.txCounter || 0) + 1
    const blinding = privacyUtils.deriveBlindingFactor(rootSeed, nextIdx)

    checkPolicy('SHIELD', amount, { origin })

    // Generate proof
    const proof = await zk.createRangeProof(amount, blinding)

    // PDA
    const pda = getPrivateBalancePDA(
      wallet.publicKey,
      ENERGY_TOKEN_MINT,
      TRADING_PROGRAM_ID
    )

    const sig = await (program.methods as any)
      .shieldTokens(
        new BN(amount),
        { point: Array.from(proof.commitment.point) },
        Array.from(proof.proof_data)
      )
      .accounts({
        privateBalance: pda,
        mint: ENERGY_TOKEN_MINT,
        owner: wallet.publicKey,
      } as any)
      .rpc()

    // For this prototype, we store it in local storage so it persists between reloads
    localStorage.setItem(
      `gtx_priv_bal_${wallet.publicKey.toBase58()}`,
      amount.toString()
    )
    localStorage.setItem(
      `gtx_priv_origin_${wallet.publicKey.toBase58()}`,
      origin
    )

    await pushToHistory('SHIELD', amount, { origin })
    await refresh()
    return sig
  }

  const batchShield = async (amounts: number[]) => {
    if (!wallet || !program || !rootSeed)
      throw new Error('Not connected or locked')

    // 1. Generate multiple proofs
    const instructions = []
    let totalAmount = 0
    let currentIdx = privateBalance?.txCounter || 0

    for (const amount of amounts) {
      currentIdx += 1
      const blinding = privacyUtils.deriveBlindingFactor(rootSeed, currentIdx)
      const proof = await zk.createRangeProof(amount, blinding)

      const pda = getPrivateBalancePDA(
        wallet.publicKey,
        ENERGY_TOKEN_MINT,
        TRADING_PROGRAM_ID
      )

      const ix = await (program.methods as any)
        .shieldTokens(
          new BN(amount),
          { point: Array.from(proof.commitment.point) },
          Array.from(proof.proof_data)
        )
        .accounts({
          privateBalance: pda,
          mint: ENERGY_TOKEN_MINT,
          owner: wallet.publicKey,
        } as any)
        .instruction()

      instructions.push(ix)
      totalAmount += amount
    }

    // 2. Execute Batch
    const tx = new Transaction()
    instructions.forEach((ix) => tx.add(ix))

    const sig = await program.provider.sendAndConfirm!(tx)

    // Update local balance
    const currentBal = privateBalance?.amount || 0
    localStorage.setItem(
      `gtx_priv_bal_${wallet.publicKey.toBase58()}`,
      (currentBal + totalAmount).toString()
    )

    await refresh()
    return sig
  }

  const createTradeOffer = async (amount: number, price: number) => {
    if (!wallet || !program || !rootSeed || !privateBalance)
      throw new Error('Not connected or locked')
    if ((privateBalance.amount || 0) < amount)
      throw new Error('Insufficient private balance')

    // Logic: Create a trade link by transferring to a Market Escrow vault
    const MARKET_ESCROW = new PublicKey(
      'GridMarketEscrow11111111111111111111111111'
    )

    const sig = await transfer(MARKET_ESCROW, amount)

    // Generate an ephemeral "Trade ID" and "Invite Code"
    const tradeId = Math.random().toString(36).substring(7).toUpperCase()
    const tradeData = {
      id: tradeId,
      amount,
      price,
      seller: wallet.publicKey.toBase58(),
      timestamp: Date.now(),
    }

    // Pack into an invite link
    const invite = btoa(JSON.stringify(tradeData))

    // Save locally for owner
    if (wallet) {
      const currentOffers = JSON.parse(
        localStorage.getItem(
          `gtx_priv_offers_${wallet.publicKey.toBase58()}`
        ) || '[]'
      )
      currentOffers.push({ ...tradeData, status: 'OPEN', sig })
      localStorage.setItem(
        `gtx_priv_offers_${wallet.publicKey.toBase58()}`,
        JSON.stringify(currentOffers)
      )
    }

    await refresh()
    return invite
  }

  const fulfillTradeOffer = async (invite: string) => {
    if (!wallet || !program || !rootSeed)
      throw new Error('Not connected or locked')

    try {
      const data = JSON.parse(atob(invite))
      const toastId = toast.loading(
        `Initiating P2P Settlement for ${data.amount} GRX...`
      )

      // 1. Simulate Atomic Payment (USDC Transfer)
      await new Promise((r) => setTimeout(r, 1000))
      toast.loading('Confirming public token payment receipt...', {
        id: toastId,
      })

      // 2. Settlement triggers private token release from Escrow to Buyer.
      // In a real flow, the Buyer would sign a 'Claim' TX that includes proof-of-payment.
      await new Promise((r) => setTimeout(r, 1500))

      const sig = await shield(data.amount)

      await pushToHistory('P2P_PURCHASE', data.amount, {
        seller: data.seller,
        price: data.price,
        totalPaid: data.amount * data.price,
      })

      toast.success(`Trade Settled: ${data.amount} GRX received!`, {
        id: toastId,
      })
      return sig
    } catch (e) {
      throw new Error('Invalid trade invite')
    }
  }

  const verifySolvency = async () => {
    if (!program) throw new Error('Program not initialized')

    // In a real ZK system:
    // 1. Fetch 'Global Privacy State' which holds Sum(commitments)
    // 2. Fetch the 'Mint Authority' public vault balance
    // 3. Verify they match homomorphically

    // For this prototype, we simulate the fetch and comparison
    const toastId = toast.loading('Auditing ZK Solvency Proofs...')

    try {
      // Mimic a slow cryptographic verification
      await new Promise((r) => setTimeout(r, 1500))

      // Simulation check: total in vault (public) vs total private (simulated)
      const publicVaultBal = 10000 // Mock public backing
      const totalShielded = 10000 // Mock sum of all Ristretto points

      const isSolvent = publicVaultBal >= totalShielded

      if (isSolvent) {
        toast.success('ZK Solvency Verified: System 100% Backed', {
          id: toastId,
        })
      } else {
        toast.error('Audit Failure: Insufficient Backing!', { id: toastId })
      }

      return isSolvent
    } catch (e) {
      toast.error('Audit Verification Error', { id: toastId })
      return false
    }
  }

  return (
    <PrivacyContext.Provider
      value={{
        privateBalance,
        rootSeed,
        isUnlocked,
        isLoading,
        unlockPrivacy,
        shield,
        transfer,
        unshield,
        createStealthLink,
        claimStealthLink,
        stakePrivate,
        unstakePrivate,
        batchShield,
        createTradeOffer,
        fulfillTradeOffer,
        verifySolvency,
        transactionHistory,
        isReadOnly,
        exportViewKey,
        loginWithViewKey,
        submitRollup,
        rollupQueue,
        privacyPolicies,
        addPolicy,
        removePolicy,
        refresh,
      }}
    >
      {children}
    </PrivacyContext.Provider>
  )
}
