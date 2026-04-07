'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useAnchorWallet, useWallet } from '@solana/wallet-adapter-react'
import { AnchorProvider, getProvider, Program, Provider, BN } from '@coral-xyz/anchor'
import { PublicKey, Connection, TransactionSignature } from '@solana/web3.js'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { OptionContract } from '@/lib/idl/option_contract'
import idl from '../lib/idl/option_contract.json'
import { connection } from '@/utils/const'
import { getOptionDetailPDA } from '@/lib/pda-utils'
import { useOptionPositions, useCustodies } from '@/hooks/useOptions'
import { ExpiredOption } from '@/types/contract'
import * as actions from '@/lib/contract-actions'

export type { ExpiredOption }

interface ContractContextType {
  program: Program<OptionContract> | undefined
  pub: PublicKey | undefined
  getCustodies: (arg1?: any) => Promise<any>
  getDetailInfos: (arg1?: any, arg2?: any) => Promise<any>
  onOpenOption: (amount: number, strike: number, period: number, expiredTime: number, isCall: boolean, paySol: boolean, quoteToken?: 'USDC' | 'THB') => Promise<boolean>
  onCloseOption: (index: number) => Promise<boolean>
  onClaimOption: (index: number, solPrice: number) => Promise<boolean>
  onExerciseOption: (index: number) => Promise<boolean>
  onAddLiquidity: (amount: number, program: Program<OptionContract> | undefined, asset: PublicKey, poolName: string) => Promise<boolean>
  onRemoveLiquidity: (amount: number, program: Program<OptionContract> | undefined, asset: PublicKey, poolName: string) => Promise<boolean>
  getOptionDetailAccount: (index: number, pool: PublicKey, custody: PublicKey) => PublicKey | undefined
}

export const ContractContext = createContext<ContractContextType>({
  program: undefined,
  pub: undefined,
  getCustodies: async () => [new Map(), new Map()],
  getDetailInfos: async () => [[], [], []],
  onOpenOption: async () => false,
  onCloseOption: async () => false,
  onClaimOption: async () => false,
  onExerciseOption: async () => false,
  onAddLiquidity: async () => false,
  onRemoveLiquidity: async () => false,
  getOptionDetailAccount: () => undefined,
})

// Inlined from useContractMutations hook
function useContractMutations(
  program: Program<OptionContract> | undefined,
  conn: Connection,
  publicKey: PublicKey | null,
  sendTransaction: (tx: any, connection: Connection) => Promise<TransactionSignature>
) {
  const queryClient = useQueryClient()
  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['optionPositions'] })
    queryClient.invalidateQueries({ queryKey: ['custodies'] })
  }

  const openOptionMutation = useMutation({
    mutationFn: async (params: Parameters<typeof actions.openOption>[4]) => {
      if (!program || !publicKey) throw new Error('Not connected')
      return actions.openOption(program, conn, publicKey, sendTransaction, params)
    },
    onSuccess: (success) => { if (success) invalidateAll() }
  })

  const closeOptionMutation = useMutation({
    mutationFn: async (index: number) => {
      if (!program || !publicKey) throw new Error('Not connected')
      return actions.closeOption(program, conn, publicKey, sendTransaction, index)
    },
    onSuccess: (success) => { if (success) invalidateAll() }
  })

  const claimOptionMutation = useMutation({
    mutationFn: async ({ index, solPrice }: { index: number, solPrice: number }) => {
      if (!program || !publicKey) throw new Error('Not connected')
      return actions.claimOption(program, conn, publicKey, sendTransaction, index, solPrice)
    },
    onSuccess: (success) => { if (success) invalidateAll() }
  })

  const exerciseOptionMutation = useMutation({
    mutationFn: async (index: number) => {
      if (!program || !publicKey) throw new Error('Not connected')
      return actions.exerciseOption(program, conn, publicKey, sendTransaction, index)
    },
    onSuccess: (success) => { if (success) invalidateAll() }
  })

  const addLiquidityMutation = useMutation({
    mutationFn: async (params: Parameters<typeof actions.addLiquidity>[4]) => {
      if (!program || !publicKey) throw new Error('Not connected')
      return actions.addLiquidity(program, conn, publicKey, sendTransaction, params)
    },
    onSuccess: (success) => { if (success) invalidateAll() }
  })

  const removeLiquidityMutation = useMutation({
    mutationFn: async (params: Parameters<typeof actions.removeLiquidity>[4]) => {
      if (!program || !publicKey) throw new Error('Not connected')
      return actions.removeLiquidity(program, conn, publicKey, sendTransaction, params)
    },
    onSuccess: (success) => { if (success) invalidateAll() }
  })

  return {
    openOptionMutation,
    closeOptionMutation,
    claimOptionMutation,
    exerciseOptionMutation,
    addLiquidityMutation,
    removeLiquidityMutation
  }
}

export const ContractProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { connected, publicKey, sendTransaction } = useWallet()
  const wallet = useAnchorWallet()
  const [program, setProgram] = useState<Program<OptionContract>>()
  const [pub, setPubKey] = useState<PublicKey>()

  // Use the new TanStack Query hooks internally
  const { data: positions } = useOptionPositions(program, publicKey || null)
  const { data: custodies } = useCustodies(program, publicKey || null)

  useEffect(() => {
    if (wallet && publicKey) {
      let provider: Provider
      try {
        provider = getProvider()
      } catch {
        provider = new AnchorProvider(connection, wallet, {})
      }
      const prog = new Program<OptionContract>(idl as OptionContract, provider)
      setProgram(prog)
      setPubKey(publicKey)
    }
  }, [wallet, publicKey])

  const {
    openOptionMutation,
    closeOptionMutation,
    claimOptionMutation,
    exerciseOptionMutation,
    addLiquidityMutation,
    removeLiquidityMutation
  } = useContractMutations(program, connection, publicKey, sendTransaction)

  // Maintain backwards compatibility for existing components
  const getOptionDetailAccount = (index: number, pool: PublicKey, custody: PublicKey) => {
    if (publicKey && program) {
      return getOptionDetailPDA(publicKey, index, pool, custody, program.programId)
    }
  }

  const getDetailInfos = async (arg1?: any, arg2?: any) => {
    if (!positions) return [[], [], []]
    return [positions.active, positions.expired, positions.history]
  }

  const getCustodies = async (arg1?: any) => {
    if (!custodies) return [new Map(), new Map()]
    return [custodies, new Map()]
  }

  const handleOpenOption = async (amount: number, strike: number, period: number, expiredTime: number, isCall: boolean, paySol: boolean, quoteToken: 'USDC' | 'THB' = 'THB') => {
    try {
      return await openOptionMutation.mutateAsync({ amount, strike, period, expiredTime, isCall, paySol, quoteToken })
    } catch {
      return false
    }
  }

  const handleCloseOption = async (index: number) => {
    try {
      return await closeOptionMutation.mutateAsync(index)
    } catch {
      return false
    }
  }

  const handleClaimOption = async (index: number, solPrice: number) => {
    try {
      return await claimOptionMutation.mutateAsync({ index, solPrice })
    } catch {
      return false
    }
  }

  const handleExerciseOption = async (index: number) => {
    try {
      return await exerciseOptionMutation.mutateAsync(index)
    } catch {
      return false
    }
  }

  const handleAddLiquidity = async (amount: number, prog: Program<OptionContract> | undefined, asset: PublicKey, poolName: string) => {
    try {
      return await addLiquidityMutation.mutateAsync({ amount, asset, poolName })
    } catch {
      return false
    }
  }

  const handleRemoveLiquidity = async (amount: number, prog: Program<OptionContract> | undefined, asset: PublicKey, poolName: string) => {
    try {
      return await removeLiquidityMutation.mutateAsync({ amount, asset, poolName })
    } catch {
      return false
    }
  }

  return (
    <ContractContext.Provider value={{
      program,
      pub,
      getCustodies,
      getDetailInfos,
      onOpenOption: handleOpenOption,
      onCloseOption: handleCloseOption,
      onClaimOption: handleClaimOption,
      onExerciseOption: handleExerciseOption,
      onAddLiquidity: handleAddLiquidity,
      onRemoveLiquidity: handleRemoveLiquidity,
      getOptionDetailAccount,
    }}>
      {children}
    </ContractContext.Provider>
  )
}

