'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { PublicKey, Connection, clusterApiUrl } from '@solana/web3.js'
import { findReference, validateTransfer } from '@solana/pay'
import BigNumber from 'bignumber.js'
import { QRCodeSVG } from 'qrcode.react'
import toast from 'react-hot-toast'
import ProtectedRoute from '@/components/ProtectedRoute'
import { discriminator } from '@/lib/discriminators'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import { Cpu, Check, Wallet, ArrowRight, Loader2, Copy, ExternalLink, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'

// ── Types ──────────────────────────────────────────────────────────────────
interface AICreditTier {
  id: string
  name: string
  credits: number
  priceUSDC: number
  description: string
  badge?: string
  models: string[]
}

interface PaymentState {
  status: 'idle' | 'generating' | 'waiting' | 'detected' | 'confirmed' | 'failed'
  reference?: PublicKey
  solanaPayURL?: string
  signature?: string
  progress: number
}

// ── Constants ──────────────────────────────────────────────────────────────
const AI_TIERS: AICreditTier[] = [
  {
    id: 'starter',
    name: 'Starter',
    credits: 100,
    priceUSDC: 5,
    description: 'Try frontier AI models — perfect for testing.',
    models: ['Claude 3.5 Sonnet', 'GPT-4o Mini', 'Gemini Flash'],
  },
  {
    id: 'pro',
    name: 'Pro',
    credits: 500,
    priceUSDC: 20,
    description: 'Serious AI access for daily use.',
    badge: 'POPULAR',
    models: ['Claude 3.5 Sonnet', 'GPT-4o', 'Gemini Pro', 'Mistral Large'],
  },
  {
    id: 'power',
    name: 'Power',
    credits: 2000,
    priceUSDC: 75,
    description: 'Heavy usage — unlock all models.',
    badge: 'BEST VALUE',
    models: ['All models', 'Priority access', 'Custom prompts', 'API access'],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    credits: 10000,
    priceUSDC: 300,
    description: 'Team access with dedicated support.',
    models: ['All models', 'Dedicated support', 'Custom fine-tuning', 'SLA'],
  },
]

// GridTokenX treasury wallet (receiving USDC payments)
// Replace with your actual treasury/merchant wallet address
const MERCHANT_WALLET = new PublicKey('BT9ESAZoNGnvPswpeHNLgt582GTQrAUv21ZLkk4H6Bad')

// USDC mint on Solana (mainnet/devnet)
const USDC_MINT = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v')

const CONNECTION = new Connection(
  process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'http://localhost:8899',
  'confirmed'
)

const AI_PROVIDER_URL = process.env.NEXT_PUBLIC_AI_PROVIDER_URL || 'https://ai.gridtokenx.xyz'

// ── Helper: Generate Solana Pay URL ────────────────────────────────────────
async function generateSolanaPayURL(
  recipient: PublicKey,
  amount: number,
  reference: PublicKey,
  label: string,
  message: string
): Promise<string> {
  const url = new URL(recipient.toBase58())
  url.searchParams.append('amount', amount.toFixed(2))
  url.searchParams.append('reference', reference.toBase58())
  url.searchParams.append('label', label)
  url.searchParams.append('message', message)
  url.searchParams.append('memo', `GridTokenX AI Credits: ${label}`)
  return `solana:${url.toString()}`
}

// ── Component: Solana Pay Checkout Modal ──────────────────────────────────
interface CheckoutModalProps {
  tier: AICreditTier | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CheckoutModal({ tier, open, onOpenChange }: CheckoutModalProps) {
  const [payment, setPayment] = useState<PaymentState>({
    status: 'idle',
    progress: 0,
  })
  const [countdown, setCountdown] = useState(300) // 5 min timeout
  const [copied, setCopied] = useState(false)

  const solanaPayURL = payment.solanaPayURL || ''

  // Reset when modal opens/closes or tier changes
  useEffect(() => {
    if (open && tier) {
      startPayment()
    } else if (!open) {
      resetPayment()
    }
  }, [open, tier])

  // Countdown timer
  useEffect(() => {
    if (payment.status !== 'waiting') return
    if (countdown <= 0) {
      setPayment((p) => ({ ...p, status: 'failed', progress: 0 }))
      toast.error('Payment timed out. Please try again.')
      return
    }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000)
    return () => clearTimeout(timer)
  }, [countdown, payment.status])

  // Poll for payment
  useEffect(() => {
    if (payment.status !== 'waiting' || !payment.reference) return

    const pollInterval = setInterval(async () => {
      try {
        const sigInfo = await findReference(CONNECTION, payment.reference!, {
          finality: 'confirmed',
        })
        if (sigInfo?.signature) {
          setPayment((p) => ({
            ...p,
            status: 'detected',
            signature: sigInfo.signature,
            progress: 70,
          }))

          // Validate transfer
          const validated = await validateTransfer(
            CONNECTION,
            sigInfo.signature,
            {
              recipient: MERCHANT_WALLET,
              amount: new BigNumber(tier!.priceUSDC) as any,
              splToken: USDC_MINT,
              reference: payment.reference,
            }
          )

          if (validated) {
            setPayment((p) => ({
              ...p,
              status: 'confirmed',
              progress: 100,
            }))
            toast.success(`Payment confirmed! ${tier!.credits} AI credits added.`)

            // Redirect to AI provider after short delay
            setTimeout(() => {
              window.open(
                `${AI_PROVIDER_URL}/redeem?credits=${tier!.credits}&tx=${sigInfo.signature}`,
                '_blank'
              )
            }, 2000)
          } else {
            setPayment((p) => ({ ...p, status: 'failed', progress: 0 }))
            toast.error('Payment validation failed. Please contact support.')
          }
        }
      } catch {
        // No payment yet — keep polling
      }
    }, 3000)

    return () => clearInterval(pollInterval)
  }, [payment.status, payment.reference, tier])

  const resetPayment = () => {
    setPayment({ status: 'idle', progress: 0 })
    setCountdown(300)
  }

  const startPayment = useCallback(async () => {
    if (!tier) return
    setPayment({ status: 'generating', progress: 10 })

    try {
      const referenceKeypair = new PublicKey(
        crypto.getRandomValues(new Uint8Array(32))
      )

      // For Solana Pay, we need an actual keypair to use as reference
      // Since we can't sign here, we use a deterministic PDA-like reference
      const referenceBytes = new Uint8Array(32)
      crypto.getRandomValues(referenceBytes)
      const reference = new PublicKey(referenceBytes)

      const url = await generateSolanaPayURL(
        MERCHANT_WALLET,
        tier.priceUSDC,
        reference,
        `GridTokenX — ${tier.name}`,
        `${tier.credits} AI Credits`
      )

      setPayment({
        status: 'waiting',
        reference,
        solanaPayURL: url,
        progress: 30,
      })
    } catch (e: any) {
      console.error('Failed to generate payment URL:', e)
      setPayment({ status: 'failed', progress: 0 })
      toast.error('Failed to generate payment. Please try again.')
    }
  }, [tier])

  const copyToClipboard = async () => {
    if (!solanaPayURL) return
    await navigator.clipboard.writeText(solanaPayURL)
    setCopied(true)
    toast.success('Payment URL copied!')
    setTimeout(() => setCopied(false), 2000)
  }

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  if (!tier) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-purple-400" />
            Pay with Solana
          </DialogTitle>
          <DialogDescription>
            Scan the QR code with your Solana wallet to pay for {tier.name} credits.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-6 py-4">
          {/* Amount */}
          <div className="text-center">
            <p className="text-3xl font-bold text-foreground">
              ${tier.priceUSDC.toFixed(2)}
            </p>
            <p className="text-sm text-muted-foreground">
              {tier.credits.toLocaleString()} AI Credits
            </p>
          </div>

          {/* Payment States */}
          {payment.status === 'generating' && (
            <div className="flex flex-col items-center gap-3 py-8">
              <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
              <p className="text-sm text-muted-foreground">
                Generating payment link...
              </p>
            </div>
          )}

          {payment.status === 'waiting' && (
            <>
              {/* QR Code */}
              <div className="rounded-xl border border-border bg-background p-4">
                <QRCodeSVG
                  value={solanaPayURL}
                  size={220}
                  level="M"
                  includeMargin
                  bgColor="#ffffff"
                  fgColor="#000000"
                />
              </div>

              {/* Timer */}
              <div className="flex w-full items-center gap-3">
                <span className="text-xs text-muted-foreground">
                  {formatTime(countdown)}
                </span>
                <Progress
                  value={(countdown / 300) * 100}
                  className="flex-1"
                />
              </div>

              {/* Instructions */}
              <div className="w-full space-y-2 rounded-lg border border-border bg-muted/30 p-4">
                <p className="text-sm font-medium text-foreground">
                  How to pay:
                </p>
                <ol className="text-xs text-muted-foreground space-y-1">
                  <li>1. Open your Solana wallet app (Phantom, Solflare, etc.)</li>
                  <li>2. Scan the QR code or copy the payment link below</li>
                  <li>3. Confirm the USDC transfer</li>
                </ol>
              </div>

              {/* Copy URL Button */}
              <div className="flex w-full gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={copyToClipboard}
                >
                  {copied ? (
                    <Check className="mr-1 h-3 w-3" />
                  ) : (
                    <Copy className="mr-1 h-3 w-3" />
                  )}
                  {copied ? 'Copied!' : 'Copy Link'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => {
                    window.open(
                      `https://phantom.app/ul/transfer?recipient=${MERCHANT_WALLET.toBase58()}&amount=${tier.priceUSDC}&spl-token=${USDC_MINT.toBase58()}`,
                      '_blank'
                    )
                  }}
                >
                  <Wallet className="mr-1 h-3 w-3" />
                  Open Phantom
                </Button>
              </div>
            </>
          )}

          {payment.status === 'detected' && (
            <div className="flex flex-col items-center gap-3 py-8">
              <Loader2 className="h-8 w-8 animate-spin text-yellow-400" />
              <p className="text-sm text-muted-foreground">
                Payment detected — confirming...
              </p>
              <Progress value={payment.progress} className="w-full" />
            </div>
          )}

          {payment.status === 'confirmed' && (
            <div className="flex flex-col items-center gap-3 py-8">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500/20">
                <Check className="h-8 w-8 text-green-400" />
              </div>
              <p className="text-lg font-semibold text-foreground">
                Payment Confirmed!
              </p>
              <p className="text-sm text-muted-foreground">
                {tier.credits.toLocaleString()} AI credits added. Opening AI provider...
              </p>
              <Button
                size="sm"
                onClick={() =>
                  window.open(
                    `${AI_PROVIDER_URL}/redeem?credits=${tier.credits}&tx=${payment.signature}`,
                    '_blank'
                  )
                }
              >
                <ExternalLink className="mr-1 h-3 w-3" />
                Open AI Provider
              </Button>
            </div>
          )}

          {payment.status === 'failed' && (
            <div className="flex flex-col items-center gap-3 py-8">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500/20">
                <span className="text-2xl text-red-400">✕</span>
              </div>
              <p className="text-lg font-semibold text-foreground">
                Payment Failed
              </p>
              <p className="text-sm text-muted-foreground">
                Please try again or contact support.
              </p>
              <Button size="sm" onClick={startPayment}>
                Try Again
              </Button>
            </div>
          )}

          {/* Transaction Link (if confirmed) */}
          {payment.signature && payment.status === 'confirmed' && (
            <a
              href={`https://explorer.solana.com/tx/${payment.signature}?cluster=devnet`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-purple-400 hover:underline"
            >
              View on Solana Explorer →
            </a>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ── Component: AICreditCard ───────────────────────────────────────────────
interface AICreditCardProps {
  tier: AICreditTier
  isSelected: boolean
  onSelect: (tier: AICreditTier) => void
}

function AICreditCard({ tier, isSelected, onSelect }: AICreditCardProps) {
  return (
    <Card
      className={cn(
        'cursor-pointer transition-all duration-200 hover:border-purple-400/50 hover:shadow-lg hover:shadow-purple-500/10',
        isSelected && 'border-purple-400 ring-2 ring-purple-400/30'
      )}
      onClick={() => onSelect(tier)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">{tier.name}</CardTitle>
          {tier.badge && (
            <Badge
              variant={tier.badge === 'BEST VALUE' ? 'default' : 'secondary'}
              className={cn(
                tier.badge === 'BEST VALUE' &&
                  'bg-purple-500/20 text-purple-300 hover:bg-purple-500/20'
              )}
            >
              {tier.badge}
            </Badge>
          )}
        </div>
        <CardDescription>{tier.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <span className="text-3xl font-bold text-foreground">
            ${tier.priceUSDC}
          </span>
          <span className="ml-1 text-sm text-muted-foreground">USDC</span>
        </div>
        <div className="flex items-center gap-2">
          <Cpu className="h-4 w-4 text-purple-400" />
          <span className="text-sm font-medium text-foreground">
            {tier.credits.toLocaleString()} AI Credits
          </span>
        </div>
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Models:</p>
          <div className="flex flex-wrap gap-1">
            {tier.models.map((model) => (
              <Badge key={model} variant="outline" className="text-xs">
                {model}
              </Badge>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-end text-xs text-purple-400">
          {isSelected ? (
            <span className="flex items-center gap-1">
              <Check className="h-3 w-3" /> Selected
            </span>
          ) : (
            <span className="flex items-center gap-1">
              Select <ArrowRight className="h-3 w-3" />
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// ── Main Page Export ───────────────────────────────────────────────────────
export default function AICreditsPage() {
  const [selectedTier, setSelectedTier] = useState<AICreditTier | null>(null)
  const [checkoutOpen, setCheckoutOpen] = useState(false)

  const handleSelectTier = (tier: AICreditTier) => {
    setSelectedTier(tier)
  }

  const handleBuy = () => {
    if (!selectedTier) return
    setCheckoutOpen(true)
  }

  return (
    <ProtectedRoute requireWallet={true} requireAuth={true}>
      <main className="flex h-[calc(100vh-4rem)] flex-1 flex-col gap-6 p-6 overflow-y-auto">
        {/* Header */}
        <header className="flex animate-in fade-in slide-in-from-top-4 duration-500 items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              AI Credits
            </h1>
            <p className="mt-1 text-muted-foreground">
              Buy credits with USDC — access Claude, GPT-4, Gemini & more.
            </p>
          </div>
        </header>

        {/* Info Banner */}
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100 rounded-lg border border-purple-400/20 bg-purple-500/5 p-4">
          <div className="flex items-start gap-3">
            <Zap className="mt-0.5 h-5 w-5 shrink-0 text-purple-400" />
            <div>
              <p className="text-sm font-medium text-purple-300">
                Powered by Solana Pay
              </p>
              <p className="text-xs text-muted-foreground">
                Near-zero fees, instant settlement. Pay with USDC on any Solana
                wallet. Credits are redeemable immediately after payment
                confirmation.
              </p>
            </div>
          </div>
        </div>

        {/* Pricing Grid */}
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {AI_TIERS.map((tier) => (
            <AICreditCard
              key={tier.id}
              tier={tier}
              isSelected={selectedTier?.id === tier.id}
              onSelect={handleSelectTier}
            />
          ))}
        </div>

        {/* Buy Button */}
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300 flex items-center justify-center gap-4">
          <Button
            size="lg"
            disabled={!selectedTier}
            onClick={handleBuy}
            className="min-w-[200px] bg-gradient-to-r from-purple-500 to-purple-400 text-white hover:from-purple-600 hover:to-purple-500"
          >
            <Wallet className="mr-2 h-4 w-4" />
            {selectedTier
              ? `Buy ${selectedTier.credits.toLocaleString()} Credits — $${selectedTier.priceUSDC}`
              : 'Select a plan'}
          </Button>
        </div>

        {/* How It Works */}
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-500">
          <h2 className="mb-4 text-lg font-semibold text-foreground">
            How it works
          </h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              {
                step: '1',
                title: 'Select credits',
                desc: 'Choose an AI credit package that fits your needs.',
              },
              {
                step: '2',
                title: 'Pay with USDC',
                desc: 'Scan QR code with your Solana wallet. Near-zero fees.',
              },
              {
                step: '3',
                title: 'Access AI models',
                desc: 'Get redirected to the AI provider. Start using Claude, GPT & more.',
              },
            ].map((item) => (
              <div
                key={item.step}
                className="rounded-lg border border-border bg-card/50 p-4"
              >
                <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-purple-500/20 text-sm font-bold text-purple-400">
                  {item.step}
                </div>
                <h3 className="text-sm font-medium text-foreground">
                  {item.title}
                </h3>
                <p className="mt-1 text-xs text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Checkout Modal */}
        <CheckoutModal
          tier={selectedTier}
          open={checkoutOpen}
          onOpenChange={setCheckoutOpen}
        />
      </main>
    </ProtectedRoute>
  )
}
