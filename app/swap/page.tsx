'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  PublicKey,
  Connection,
  Transaction,
  TransactionInstruction,
  SystemProgram,
} from '@solana/web3.js'
import { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from '@solana/spl-token'
import { useWallet } from '@solana/wallet-adapter-react'
import toast from 'react-hot-toast'
import ProtectedRoute from '@/components/ProtectedRoute'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ArrowDownUp, Wallet, Zap, Info, ExternalLink, Loader2, Check } from 'lucide-react'
import {
  discriminator,
  getAssociatedTokenAddress,
  formatTokenAmount,
  parseTokenAmount,
  ENERGY_TOKEN_PROGRAM_ID,
  getGridMintPda,
  getGrxMintPda,
  getTokenConfigPda,
} from '@/lib/energy-utils'

// ── Configuration ──────────────────────────────────────────────────────────
const RPC_URL =
  process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'http://localhost:8899'

const SYSVAR_RENT = new PublicKey('SysvarRent111111111111111111111111111111111')

// ── Main Page ──────────────────────────────────────────────────────────────
export default function SwapPage() {
  const { publicKey, signTransaction, connected } = useWallet()
  const [gridAmount, setGridAmount] = useState('')
  const [estimatedGrx, setEstimatedGrx] = useState('0')
  const [swapRate, setSwapRate] = useState(1.0)
  const [loading, setLoading] = useState(false)
  const [swapStatus, setSwapStatus] = useState<'idle' | 'loading' | 'confirming' | 'done' | 'error'>('idle')
  const [gridBalance, setGridBalance] = useState(0)
  const [grxBalance, setGrxBalance] = useState(0)
  const [connection] = useState(() => new Connection(RPC_URL, 'confirmed'))

  // ── Fetch balances ───────────────────────────────────────────────────
  const fetchBalances = useCallback(async () => {
    if (!publicKey) return
    try {
      const gridMint = getGridMintPda()
      const grxMint = getGrxMintPda()
      const gridAta = getAssociatedTokenAddress(gridMint, publicKey)
      const grxAta = getAssociatedTokenAddress(grxMint, publicKey)

      const gridInfo = await connection.getAccountInfo(gridAta)
      const grxInfo = await connection.getAccountInfo(grxAta)

      if (gridInfo && gridInfo.data.length >= 72) {
        // SPL Token account: amount is bytes 64-72 (u64 LE)
        const gridAmount = Number(gridInfo.data.readBigUInt64LE(64))
        setGridBalance(gridAmount / 10 ** 9)
      }
      if (grxInfo && grxInfo.data.length >= 72) {
        const grxAmount = Number(grxInfo.data.readBigUInt64LE(64))
        setGrxBalance(grxAmount / 10 ** 9)
      }
    } catch {
      // Balances not found (accounts don't exist yet)
    }
  }, [publicKey, connection])

  useEffect(() => {
    if (connected) fetchBalances()
  }, [connected, fetchBalances])

  // ── Calculate swap ───────────────────────────────────────────────────
  useEffect(() => {
    const amount = parseFloat(gridAmount)
    if (isNaN(amount) || amount <= 0) {
      setEstimatedGrx('0')
      return
    }
    // 1:1 swap rate (1 GRID = 1 GRX by default)
    // In production this would read the actual rate from on-chain state
    const grxAmount = amount * swapRate
    setEstimatedGrx(grxAmount.toFixed(2))
  }, [gridAmount, swapRate])

  // ── Execute swap ─────────────────────────────────────────────────────
  const handleSwap = async () => {
    if (!publicKey || !signTransaction || !gridAmount) return

    const amount = parseFloat(gridAmount)
    if (isNaN(amount) || amount <= 0) {
      toast.error('Enter a valid amount')
      return
    }
    if (amount > gridBalance) {
      toast.error('Insufficient GRID balance')
      return
    }

    setLoading(true)
    setSwapStatus('loading')

    try {
      const gridMint = getGridMintPda()
      const grxMint = getGrxMintPda()
      const tokenConfig = getTokenConfigPda()
      const gridAta = getAssociatedTokenAddress(gridMint, publicKey)
      const grxAta = getAssociatedTokenAddress(grxMint, publicKey)

      const gridAmountLamports = parseTokenAmount(gridAmount)

      // Convert bigint to LE bytes
      const num = Number(gridAmountLamports)
      const amountBytes = new Uint8Array(8)
      for (let i = 0; i < 8; i++) {
        amountBytes[i] = (num >> (8 * i)) & 0xff
      }

      // Build swap instruction
      const ix = new TransactionInstruction({
        programId: ENERGY_TOKEN_PROGRAM_ID,
        keys: [
          { pubkey: tokenConfig, isSigner: false, isWritable: true },
          { pubkey: gridMint, isSigner: false, isWritable: true },
          { pubkey: grxMint, isSigner: false, isWritable: true },
          { pubkey: gridAta, isSigner: false, isWritable: true },
          { pubkey: grxAta, isSigner: false, isWritable: true },
          { pubkey: publicKey, isSigner: true, isWritable: true },
          { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
        ],
        data: Buffer.concat([
          discriminator('global:swap_grid_to_grx'),
          Buffer.from(amountBytes),
        ]),
      })

      const blockhash = await connection.getLatestBlockhash('confirmed')
      const tx = new Transaction()
      tx.recentBlockhash = blockhash.blockhash
      tx.lastValidBlockHeight = blockhash.lastValidBlockHeight
      tx.feePayer = publicKey
      tx.add(ix)

      const signedTx = await signTransaction(tx)
      setSwapStatus('confirming')

      const signature = await connection.sendRawTransaction(signedTx.serialize())
      await connection.confirmTransaction({
        signature,
        blockhash: blockhash.blockhash,
        lastValidBlockHeight: blockhash.lastValidBlockHeight,
      })

      setSwapStatus('done')
      toast.success(`Swapped ${gridAmount} GRID → ${estimatedGrx} GRX`)
      fetchBalances()

      setTimeout(() => {
        setSwapStatus('idle')
        setGridAmount('')
      }, 3000)
    } catch (e: any) {
      console.error('Swap failed:', e)
      setSwapStatus('error')
      toast.error(e?.message || 'Swap failed')
    } finally {
      setLoading(false)
    }
  }

  const handleMax = () => {
    setGridAmount(gridBalance.toFixed(2))
  }

  return (
    <ProtectedRoute requireWallet={true} requireAuth={true}>
      <main className="flex h-[calc(100vh-4rem)] flex-1 flex-col items-center justify-center gap-6 p-6 overflow-y-auto">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2 justify-center">
            <ArrowDownUp className="h-7 w-7 text-purple-400" />
            GRID → GRX Swap
          </h1>
          <p className="mt-1 text-muted-foreground">
            Convert your energy credits to AI computing credits.
          </p>
        </div>

        {/* Swap Card */}
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Token Swap</CardTitle>
            <CardDescription>
              Swap GRID tokens (1 kWh energy) for GRX tokens (AI computing credits).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Balances */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-border bg-muted/30 p-3">
                <p className="text-xs text-muted-foreground">GRID Balance</p>
                <p className="text-lg font-bold text-foreground">
                  {gridBalance.toFixed(2)}
                </p>
              </div>
              <div className="rounded-lg border border-border bg-muted/30 p-3">
                <p className="text-xs text-muted-foreground">GRX Balance</p>
                <p className="text-lg font-bold text-foreground">
                  {grxBalance.toFixed(2)}
                </p>
              </div>
            </div>

            {/* From: GRID */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground flex items-center justify-between">
                From
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs"
                  onClick={handleMax}
                >
                  Max
                </Button>
              </label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  placeholder="0.00"
                  value={gridAmount}
                  onChange={(e) => setGridAmount(e.target.value)}
                  className="text-lg"
                  step="0.01"
                  min="0"
                />
                <Badge variant="outline" className="shrink-0 px-3 py-1">
                  <Zap className="mr-1 h-3 w-3" />
                  GRID
                </Badge>
              </div>
            </div>

            {/* Swap Arrow */}
            <div className="flex justify-center">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-500/20">
                <ArrowDownUp className="h-4 w-4 text-purple-400" />
              </div>
            </div>

            {/* To: GRX */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                To (estimated)
              </label>
              <div className="flex items-center gap-2">
                <div className="flex-1 rounded-lg border border-border bg-muted/30 px-3 py-2 text-lg text-muted-foreground">
                  {estimatedGrx}
                </div>
                <Badge variant="outline" className="shrink-0 px-3 py-1">
                  <Zap className="mr-1 h-3 w-3" />
                  GRX
                </Badge>
              </div>
            </div>

            {/* Swap Rate */}
            <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Swap Rate</span>
                <span className="text-foreground font-mono">
                  1 GRID = {swapRate.toFixed(2)} GRX
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Fee</span>
                <span className="text-foreground">0%</span>
              </div>
            </div>

            {/* Status / Action */}
            {swapStatus === 'loading' && (
              <div className="flex items-center justify-center gap-2 py-2">
                <Loader2 className="h-4 w-4 animate-spin text-purple-400" />
                <span className="text-sm text-muted-foreground">
                  Sending transaction...
                </span>
              </div>
            )}

            {swapStatus === 'confirming' && (
              <div className="space-y-2">
                <Progress value={50} />
                <p className="text-xs text-center text-muted-foreground">
                  Confirming on-chain...
                </p>
              </div>
            )}

            {swapStatus === 'done' && (
              <div className="flex items-center justify-center gap-2 py-2 text-green-400">
                <Check className="h-4 w-4" />
                <span className="text-sm">Swap confirmed!</span>
              </div>
            )}

            {swapStatus === 'error' && (
              <p className="text-sm text-center text-red-400">
                Swap failed. Please try again.
              </p>
            )}

            <Button
              className="w-full bg-gradient-to-r from-purple-500 to-purple-400 text-white hover:from-purple-600 hover:to-purple-500"
              disabled={
                loading ||
                !gridAmount ||
                parseFloat(gridAmount) <= 0 ||
                parseFloat(gridAmount) > gridBalance
              }
              onClick={handleSwap}
            >
              <ArrowDownUp className="mr-2 h-4 w-4" />
              {loading
                ? 'Swapping...'
                : `Swap ${gridAmount || '0'} GRID → ${estimatedGrx} GRX`}
            </Button>
          </CardContent>
        </Card>

        {/* Info */}
        <div className="w-full max-w-md rounded-lg border border-purple-400/20 bg-purple-500/5 p-4">
          <div className="flex items-start gap-3">
            <Info className="mt-0.5 h-5 w-5 shrink-0 text-purple-400" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-purple-300">
                How the swap works
              </p>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• 1 GRID = 1 kWh of verified P2P solar energy</li>
                <li>• 1 GRX = 1 AI computing credit (access Claude, GPT, etc.)</li>
                <li>• Swap rate is 1:1 (adjustable by governance)</li>
                <li>• One-way only: GRID → GRX (no reverse)</li>
                <li>• After swap, use GRX at /credits for AI access</li>
              </ul>
            </div>
          </div>
        </div>

        {/* View on Explorer */}
        <a
          href={`https://explorer.solana.com/address/${ENERGY_TOKEN_PROGRAM_ID.toBase58()}?cluster=devnet`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-xs text-purple-400 hover:underline"
        >
          <ExternalLink className="h-3 w-3" />
          View Energy Token Program on Solana Explorer
        </a>
      </main>
    </ProtectedRoute>
  )
}
