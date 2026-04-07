'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { defaultApiClient } from '@/lib/api-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card'
import {
  CheckCircle2,
  Loader2,
  RefreshCw,
  Wallet,
  Copy,
  Check,
  Mail,
  AlertCircle,
  Clock,
  XCircle,
  ArrowRight,
} from 'lucide-react'
import toast from 'react-hot-toast'
import ErrorBoundary from '@/components/ui/ErrorBoundary'

type VerificationState = 'loading' | 'success' | 'error' | 'expired' | 'invalid'

function VerifyEmailContent() {
  const searchParams = useSearchParams()
  const router = useRouter()

  // State management
  const [state, setState] = useState<VerificationState>('loading')
  const [message, setMessage] = useState('')
  const [countdown, setCountdown] = useState(5)
  const [email, setEmail] = useState('')
  const [walletAddress, setWalletAddress] = useState('')
  const [copied, setCopied] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [canResend, setCanResend] = useState(true)
  const [resendCooldown, setResendCooldown] = useState(0)

  // Extract URL parameters
  const token = searchParams.get('token')
  const emailParam = searchParams.get('email')

  // Initialize email from URL parameter
  useEffect(() => {
    if (emailParam) setEmail(decodeURIComponent(emailParam))
  }, [emailParam])

  // Auto-verify on mount
  useEffect(() => {
    if (!token) {
      setState('invalid')
      setMessage(
        'No verification token provided. Please check your email link.'
      )
      return
    }
    verifyEmailToken(token)
  }, [token])

  // Auto-redirect countdown
  useEffect(() => {
    if (state !== 'success' || countdown === 0) {
      if (state === 'success' && countdown === 0) {
        toast.success('Welcome to GridTokenX! Redirecting to home...')
        window.location.href = '/'
      }
      return
    }
    const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
    return () => clearTimeout(timer)
  }, [state, countdown])

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown === 0) {
      if (!canResend) setCanResend(true)
      return
    }
    const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000)
    return () => clearTimeout(timer)
  }, [resendCooldown, canResend])

  // Helper: Extract error message
  const getErrorMessage = (error: unknown): string => {
    if (error instanceof Error) {
      return error.message
    }
    if (typeof error === 'object' && error !== null && 'message' in error) {
      return String((error as { message: unknown }).message)
    }
    return String(error)
  }

  // Helper: Handle verification errors
  const handleVerificationError = (response: { status?: number; error?: unknown; retry_after?: number }) => {
    const errorMsg = getErrorMessage(response.error)

    if (response.status === 400) {
      if (errorMsg.includes('already verified')) {
        setState('success')
        setMessage('Your email is already verified! You can login now.')
      } else if (errorMsg.includes('expired')) {
        setState('expired')
        setMessage(
          'Verification token has expired. Please request a new verification email.'
        )
      } else {
        setState('invalid')
        setMessage('Invalid verification token. Please check your email link.')
      }
    } else if (response.status === 410) {
      setState('expired')
      setMessage(
        'Verification token has expired. Please request a new verification email.'
      )
    } else if (response.status === 404) {
      setState('invalid')
      setMessage('Verification token not found. Please check your email link.')
    } else {
      setState('error')
      setMessage(errorMsg || 'Verification failed. Please try again.')
    }
  }

  // Verify email token
  const verifyEmailToken = async (verificationToken: string) => {
    try {
      setState('loading')
      const response = await defaultApiClient.verifyEmail(verificationToken)

      if (response.error || !response.data) {
        handleVerificationError(response)
        return
      }

      // Success - store data
      setState('success')
      setMessage(
        response.data.message ||
        'Email verified successfully! You can now sign in.'
      )

      if (response.data.wallet_address) {
        setWalletAddress(response.data.wallet_address)
      }

      if (response.data.auth) {
        localStorage.setItem('access_token', response.data.auth.access_token)
        localStorage.setItem(
          'token_expires_at',
          String(Date.now() + response.data.auth.expires_in * 1000)
        )
        localStorage.setItem('user', JSON.stringify(response.data.auth.user))
        toast.success('Automatically signed in!')
      }
    } catch (error: unknown) {
      setState('error')
      setMessage(`Verification failed: ${getErrorMessage(error)}`)
    }
  }

  // Helper: Handle resend errors
  const handleResendError = (response: { status?: number; error?: unknown; retry_after?: number }) => {
    if (response.status === 429) {
      const retryAfter = response.retry_after || 30
      toast.error(`Rate limit exceeded. Please wait ${retryAfter} seconds.`)
      setCanResend(false)
      setResendCooldown(retryAfter)
    } else if (response.status === 404) {
      toast.error('Email address not found. Please check and try again.')
    } else {
      toast.error(
        getErrorMessage(response.error) || 'Failed to resend verification email'
      )
    }
  }

  // Resend verification email
  const handleResendVerification = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email) {
      toast.error('Please enter your email address')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error('Please enter a valid email address')
      return
    }

    setIsResending(true)
    try {
      const response = await defaultApiClient.resendVerification(email)

      if (response.error || !response.data) {
        handleResendError(response)
        return
      }

      const { status, message } = response.data

      if (status === 'already_verified') {
        toast.success('Email is already verified! You can login now.')
      } else if (status === 'expired_resent') {
        toast.success(
          'A new verification email has been sent! Please check your inbox.'
        )
      } else {
        toast.success(
          message || 'Verification email sent! Please check your inbox.'
        )
        setCanResend(false)
        setResendCooldown(60)
      }
    } catch (error: unknown) {
      toast.error(`Failed to resend: ${getErrorMessage(error)}`)
    } finally {
      setIsResending(false)
    }
  }

  const handleCopyWallet = async () => {
    if (!walletAddress) return
    try {
      await navigator.clipboard.writeText(walletAddress)
      setCopied(true)
      toast.success('Wallet address copied!')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Failed to copy wallet address')
    }
  }

  const formatCooldown = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="flex min-h-[calc(100vh-64px)] items-center justify-center p-4">
      <Card className="w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-500 shadow-lg border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <StatusIcon state={state} />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">
            <StatusTitle state={state} />
          </CardTitle>
          <CardDescription className="text-muted-foreground mt-2">
            {message || <StatusMessage state={state} />}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {state === 'success' && (
            <SuccessView
              walletAddress={walletAddress}
              copied={copied}
              countdown={countdown}
              onCopyWallet={handleCopyWallet}
              onGoHome={() => (router.push('/'))}
            />
          )}

          {(state === 'error' || state === 'expired' || state === 'invalid') && (
            <ResendForm
              email={email}
              isResending={isResending}
              canResend={canResend}
              resendCooldown={resendCooldown}
              onEmailChange={setEmail}
              onSubmit={handleResendVerification}
              formatCooldown={formatCooldown}
              state={state}
            />
          )}

          {state === 'loading' && (
            <div className="space-y-4 py-4">
              <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                <div className="h-full w-2/3 animate-pulse rounded-full bg-primary" />
              </div>
              <p className="text-center text-xs text-muted-foreground">
                Initializing secure verification...
              </p>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex flex-col gap-4 border-t pt-6">
          {state !== 'success' && (
            <Button variant="ghost" className="w-full" onClick={() => router.push('/')}>
              Back to Marketplace
            </Button>
          )}
          <p className="text-xs text-center text-muted-foreground">
            Having trouble? <a href="/contact" className="text-primary hover:underline font-medium">Contact support</a>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}

function StatusIcon({ state }: { state: VerificationState }) {
  const iconClass = "h-12 w-12"
  switch (state) {
    case 'loading':
      return <Loader2 className={`${iconClass} animate-spin text-primary`} />
    case 'success':
      return <CheckCircle2 className={`${iconClass} text-green-500`} />
    case 'expired':
      return <Clock className={`${iconClass} text-amber-500`} />
    case 'invalid':
    case 'error':
      return <AlertCircle className={`${iconClass} text-red-500`} />
  }
}

function StatusTitle({ state }: { state: VerificationState }) {
  const titles = {
    loading: 'Verifying Email',
    success: 'Verification Successful',
    expired: 'Link Expired',
    invalid: 'Invalid Link',
    error: 'Verification Error'
  }
  return titles[state]
}

function StatusMessage({ state }: { state: VerificationState }) {
  const messages = {
    loading: 'Securing your connection to the energy grid...',
    success: 'Your account is now fully activated and ready for trading.',
    expired: 'This secure link is no longer valid. Please request a new one.',
    invalid: 'The verification parameters provided do not match our records.',
    error: 'An unexpected error occurred. Please try again later.'
  }
  return messages[state]
}

function SuccessView({
  walletAddress,
  copied,
  countdown,
  onCopyWallet,
  onGoHome,
}: {
  walletAddress: string
  copied: boolean
  countdown: number
  onCopyWallet: () => void
  onGoHome: () => void
}) {
  return (
    <div className="space-y-6">
      {walletAddress && (
        <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
          <div className="flex items-center gap-2 text-primary font-semibold">
            <Wallet className="h-5 w-5" />
            <span>Solana Wallet Generated</span>
          </div>
          <div className="font-mono text-[10px] break-all p-2 bg-background rounded border cursor-pointer hover:bg-muted/50 transition-colors" onClick={onCopyWallet}>
            {walletAddress}
          </div>
          <Button variant="secondary" size="sm" className="w-full h-8 text-xs" onClick={onCopyWallet}>
            {copied ? <Check className="h-3 w-3 mr-2" /> : <Copy className="h-3 w-3 mr-2" />}
            {copied ? 'Copied' : 'Copy Address'}
          </Button>
        </div>
      )}

      <div className="space-y-2">
        <Button onClick={onGoHome} className="w-full h-11">
          Launch Dashboard
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
        <p className="text-[10px] text-center text-muted-foreground">
          Auto-launching in {countdown}s...
        </p>
      </div>
    </div>
  )
}

function ResendForm({
  email,
  isResending,
  canResend,
  resendCooldown,
  onEmailChange,
  onSubmit,
  formatCooldown,
  state,
}: {
  email: string
  isResending: boolean
  canResend: boolean
  resendCooldown: number
  onEmailChange: (email: string) => void
  onSubmit: (e: React.FormEvent) => void
  formatCooldown: (seconds: number) => string
  state: VerificationState
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Email Address
        </Label>
        <div className="relative">
          <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => onEmailChange(e.target.value)}
            placeholder="name@example.com"
            className="pl-9 h-11"
            required
            disabled={isResending || !canResend}
          />
        </div>
      </div>

      <Button
        type="submit"
        disabled={isResending || !canResend}
        className="w-full h-11"
      >
        {isResending ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <RefreshCw className="mr-2 h-4 w-4" />
        )}
        {canResend ? 'Resend Verification' : `Retry in ${formatCooldown(resendCooldown)}`}
      </Button>
    </form>
  )
}

export default function VerifyEmailPage() {
  return (
    <ErrorBoundary name="Email Verification">
      <Suspense
        fallback={
          <div className="flex min-h-[calc(100vh-64px)] items-center justify-center p-4">
            <Card className="w-full max-w-md border-border/50 bg-card/50 backdrop-blur-sm animate-pulse">
              <CardHeader className="text-center">
                <div className="flex justify-center mb-4">
                  <div className="h-12 w-12 rounded-full bg-muted" />
                </div>
                <CardTitle className="h-8 w-3/4 mx-auto bg-muted rounded" />
                <CardDescription className="h-4 w-1/2 mx-auto mt-2 bg-muted rounded" />
              </CardHeader>
              <CardContent className="space-y-4 py-4">
                <div className="h-2 w-full rounded-full bg-muted" />
                <div className="h-4 w-2/3 mx-auto bg-muted rounded" />
              </CardContent>
              <CardFooter className="border-t pt-6">
                <div className="h-10 w-full bg-muted rounded" />
              </CardFooter>
            </Card>
          </div>
        }
      >
        <VerifyEmailContent />
      </Suspense>
    </ErrorBoundary>
  )
}
