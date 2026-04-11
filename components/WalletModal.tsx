'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from './ui/button'
import { XIcon, Eye, EyeOff } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from './ui/dialog'
import WalletList from './WalletList'
import { useWallet } from '@solana/wallet-adapter-react'
import { PublicKey } from '@solana/web3.js'
import toast from 'react-hot-toast'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Separator } from './ui/separator'
import { Checkbox } from './ui/checkbox'
import type { Wallet } from '../types/wallet'
import { defaultApiClient } from '../lib/api-client'
import type { LoginResponse, RegisterResponse } from '../types/auth'
import { useAuth } from '@/contexts/AuthProvider'
import bs58 from 'bs58'

interface WalletModalProps {
  isOpen: boolean
  onClose: () => void
}

// Memoized wallet configuration to prevent recreation on every render
export const allWallets: Wallet[] = [
  { name: 'Phantom', iconPath: '/images/phantom.png', id: 'phantom' },
  { name: 'Solflare', iconPath: '/images/solflare.png', id: 'solflare' },
  { name: 'Trust', iconPath: '/images/trust.png', id: 'trust' },
  { name: 'SafePal', iconPath: '/images/safepal.png', id: 'safepal' },
] as const

export default function WalletModal({ isOpen, onClose }: WalletModalProps) {
  const router = useRouter()
  const { select, wallets, publicKey } = useWallet()
  const {
    login,
    loginWithWallet,
    register,
    isLoading: authLoading,
    user,
    isAuthenticated,
    updateWallet,
  } = useAuth()
  const [isConnecting, setIsConnecting] = useState(false)
  const [authMode, setAuthMode] = useState<'wallet' | 'signin' | 'signup'>(
    'wallet'
  )

  // Email/Password form states
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [role, setRole] = useState('user')
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [agreeToTerms, setAgreeToTerms] = useState(false)

  // Close modal when user becomes authenticated
  useEffect(() => {
    if (isAuthenticated && isOpen) {
      onClose()
    }
  }, [isAuthenticated, isOpen, onClose])

  const handleWalletConnect = useCallback(
    async (walletName: string, iconPath: string) => {
      if (isConnecting) return

      // Block MetaMask — it's an EVM wallet and doesn't support Solana natively
      if (walletName.toLowerCase().includes('metamask')) {
        toast.error(
          'MetaMask is not a Solana wallet. Please use Phantom, Solflare, or another Solana-compatible wallet.'
        )
        return
      }

      setIsConnecting(true)

      try {
        // Filter out MetaMask from available wallets (EVM, not Solana)
        const solanaWallets = wallets.filter(
          (w) => !w.adapter.name.toLowerCase().includes('metamask')
        )

        const wallet = solanaWallets.find(
          (value) => value.adapter.name === walletName
        )

        if (!wallet) {
          toast.error(`Wallet "${walletName}" not found`)
          return
        }

        // Check if wallet is ready
        if (
          !wallet.adapter.readyState ||
          wallet.adapter.readyState === 'Unsupported'
        ) {
          toast.error(
            `${walletName} wallet is not installed. Please install it first.`
          )
          if (walletName === 'Phantom') {
            window.open('https://phantom.app/', '_blank')
          } else if (walletName === 'Solflare') {
            window.open('https://solflare.com/', '_blank')
          } else if (walletName === 'Trust') {
            window.open('https://trustwallet.com/', '_blank')
          } else if (walletName === 'SafePal') {
            window.open('https://www.safepal.io/download', '_blank')
          }
          return
        }

        if (wallet.adapter.readyState === 'NotDetected') {
          toast.error(
            `${walletName} wallet not detected. Please install the extension.`
          )
          return
        }

        console.log('Connecting to wallet:', walletName)

        // Use select() — the WalletProvider handles the actual connection
        select(wallet.adapter.name)

        // Wait for publicKey from useWallet() hook (the WalletProvider's instance)
        const pollForConnection = async (): Promise<PublicKey | null> => {
          for (let i = 0; i < 40; i++) {
            if (publicKey) return publicKey
            await new Promise((r) => setTimeout(r, 250))
          }
          return null
        }

        const pk = await pollForConnection()
        if (!pk) {
          toast.error('Wallet connection timed out. Please try again.')
          return
        }

        toast.success(`${walletName} Wallet Connected`)

        // If user is logged in, update their wallet address in the backend
        if (user) {
          try {
            await updateWallet(pk.toString())
            toast.success('Wallet linked to your account')
          } catch (error) {
            console.error('Failed to link wallet:', error)
            const errorMsg =
              error instanceof Error ? error.message : 'Unknown error'
            toast.error(`Failed to link wallet to account: ${errorMsg}`)
          }
        } else if (!isAuthenticated) {
          // If not logged in, try to sign in with wallet
          try {
            const adapter = wallet.adapter as {
              signMessage?: (message: Uint8Array) => Promise<Uint8Array>
            }

            if (!adapter.signMessage) {
              toast.error(
                'Wallet does not support message signing. Cannot sign in.'
              )
              return
            }

            const timestamp = Date.now()
            const messageStr = `Sign in to GridTokenX. Timestamp: ${timestamp}`
            const message = new TextEncoder().encode(messageStr)

            toast.loading('Please sign the message to log in...', {
              id: 'signing-message',
            })

            const signature = await adapter.signMessage(message)
            toast.dismiss('signing-message')

            const signatureStr = bs58.encode(signature)

            await loginWithWallet({
              wallet_address: pk.toString(),
              signature: signatureStr,
              message: messageStr,
              timestamp,
            })

            toast.success('Signed in successfully')
            await new Promise((resolve) => setTimeout(resolve, 500))
            router.refresh()
          } catch (error: unknown) {
            toast.dismiss('signing-message')
            console.error('Wallet login failed:', error)

            const errorMessage =
              error instanceof Error ? error.message : 'Unknown error'
            if (errorMessage.includes('User rejected')) {
              toast.error('Login cancelled: Signature rejected')
            } else {
              toast.error(`Wallet login failed: ${errorMessage}`)
            }
          }
        }

        onClose()
      } catch (error: unknown) {
        console.error('Wallet connection error:', error)

        let errorMessage = 'Failed to connect'
        const err = error as { name?: string; message?: string }

        if (err?.name === 'WalletNotReadyError') {
          errorMessage = `${walletName} wallet is not ready. Please make sure it's installed and unlocked.`
        } else if (err?.name === 'WalletConnectionError') {
          errorMessage = `Connection failed: ${err.message || 'Please try again.'}`
        } else if (err?.name === 'WalletDisconnectedError') {
          errorMessage = 'Wallet was disconnected. Please try again.'
        } else if (err?.message) {
          errorMessage = err.message
        }

        toast.error(errorMessage)
      } finally {
        setIsConnecting(false)
      }
    },
    [isConnecting, wallets, select, onClose, user, updateWallet]
  )

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    if (!username || !password) {
      toast.error('Please fill in all fields')
      return
    }

    if (username.length < 3 || username.length > 50) {
      toast.error('Username must be between 3 and 50 characters')
      return
    }

    if (password.length < 8 || password.length > 128) {
      toast.error('Password must be between 8 and 128 characters')
      return
    }

    try {
      const loginData = await login(username, password, rememberMe)
      toast.success(`Welcome back, ${loginData.user.username}!`)

      // Small delay to ensure auth state is updated before closing and redirecting
      setTimeout(() => {
        onClose()
        // Redirect to home page after successful login
        router.push('/')
      }, 100)
    } catch (error: unknown) {
      console.error('Sign in error:', error)
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error'
      toast.error(`Sign in failed: ${errorMessage}`)
    }
  }

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    if (
      !username ||
      !email ||
      !password ||
      !confirmPassword ||
      !firstName ||
      !lastName
    ) {
      toast.error('Please fill in all required fields')
      return
    }

    if (!agreeToTerms) {
      toast.error('Please agree to the terms and conditions')
      return
    }

    // Username validation
    if (username.length < 3 || username.length > 50) {
      toast.error('Username must be between 3 and 50 characters')
      return
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      toast.error('Please enter a valid email address')
      return
    }

    // Password validation
    if (password.length < 8 || password.length > 128) {
      toast.error('Password must be between 8 and 128 characters')
      return
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    // Password strength validation
    const hasLowercase = /[a-z]/.test(password)
    const hasUppercase = /[A-Z]/.test(password)
    const hasDigit = /\d/.test(password)
    const hasSpecial = /[!@#$%^&*()_+\-=[\]{}|;:,.<>?]/.test(password)

    if (!hasLowercase || !hasUppercase || !hasDigit || !hasSpecial) {
      toast.error(
        'Password must contain at least one lowercase letter, one uppercase letter, one digit, and one special character'
      )
      return
    }

    const weakPatterns = [
      'password',
      '123456',
      'qwerty',
      'admin',
      'letmein',
      'welcome',
      'monkey',
      'dragon',
    ]
    const passwordLower = password.toLowerCase()
    if (weakPatterns.some((pattern) => passwordLower.includes(pattern))) {
      toast.error(
        "Password contains common weak patterns (e.g. 'password', 'admin', '123456')"
      )
      return
    }

    // Name validation
    if (
      firstName.length < 1 ||
      firstName.length > 100 ||
      lastName.length < 1 ||
      lastName.length > 100
    ) {
      toast.error('Names must be between 1 and 100 characters')
      return
    }

    setIsLoading(true)
    try {
      const response = await defaultApiClient.register({
        username,
        email,
        password,
        first_name: firstName,
        last_name: lastName,
      })

      if (response.error || !response.data) {
        // Handle specific error codes
        let errorMessage = 'Registration failed'

        if (response.status === 400) {
          if (response.error) {
            // Handle error object or string
            if (typeof response.error === 'object' && response.error !== null) {
              errorMessage =
                (response.error as { message?: string }).message ||
                'Validation error or user already exists'
            } else {
              errorMessage = String(response.error)
            }
          } else {
            errorMessage = 'Validation error or user already exists'
          }
        } else if (response.status === 500) {
          errorMessage = 'Server error. Please try again later.'
        } else if (response.error) {
          // Handle error object or string
          if (typeof response.error === 'object' && response.error !== null) {
            errorMessage =
              (response.error as { message?: string }).message ||
              JSON.stringify(response.error)
          } else {
            errorMessage = String(response.error)
          }
        }

        toast.error(errorMessage)
        return
      }

      const registerData: RegisterResponse = response.data

      toast.success(
        registerData.message ||
          'Registration successful! Please check your email to verify your account.'
      )
      onClose()
      // Redirect to home page after successful registration
      setTimeout(() => {
        router.push('/')
      }, 100)
    } catch (error: unknown) {
      console.error('Sign up error:', error)
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error'
      toast.error(`Sign up failed: ${errorMessage}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="flex h-auto max-h-[95vh] w-[95vw] max-w-full flex-col overflow-y-auto bg-accent p-4 sm:w-[90vw] sm:max-w-md md:max-w-lg md:p-10">
        <DialogHeader className="flex h-fit flex-row items-start justify-between space-y-0 pb-4 md:h-auto md:pb-2">
          <div className="space-y-2 pr-2">
            <DialogTitle className="text-xl font-medium text-foreground sm:text-2xl">
              {authMode === 'wallet'
                ? 'Connect Wallet'
                : authMode === 'signin'
                  ? 'Sign In'
                  : 'Sign Up'}
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              {authMode === 'wallet'
                ? 'Connect your Solana wallet to start trading'
                : authMode === 'signin'
                  ? 'Sign in to your account with email and password'
                  : 'Create a new account to get started'}
            </DialogDescription>
          </div>
          <Button
            className="shrink-0 rounded-[12px] border-border bg-secondary p-[9px] shadow-none [&_svg]:size-[18px]"
            onClick={() => onClose()}
          >
            <XIcon size={18} className="text-secondary-foreground" />
          </Button>
        </DialogHeader>

        {authMode === 'wallet' ? (
          <div className="flex w-full flex-col justify-between space-y-5">
            <WalletList
              wallets={allWallets}
              onWalletConnect={handleWalletConnect}
            />
            <div className="text-center">
              <button
                onClick={() => setAuthMode('signin')}
                className="text-sm font-medium text-secondary-foreground transition-colors hover:text-primary"
              >
                Or sign in with email →
              </button>
            </div>
          </div>
        ) : authMode === 'signin' ? (
          <div className="w-full">
            <>
              <form
                onSubmit={handleEmailSignIn}
                noValidate
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label htmlFor="username">Username or Email</Label>
                  <Input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your username or email"
                    className="h-9 rounded-sm border border-border px-3 py-2"
                    minLength={3}
                    maxLength={50}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="h-9 rounded-sm border border-border px-3 py-2 pr-10"
                      minLength={8}
                      maxLength={128}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                      aria-label={
                        showPassword ? 'Hide password' : 'Show password'
                      }
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="remember-me"
                      checked={rememberMe}
                      onCheckedChange={(checked) =>
                        setRememberMe(checked === true)
                      }
                    />
                    <Label
                      htmlFor="remember-me"
                      className="cursor-pointer text-sm text-secondary-foreground"
                    >
                      Remember me
                    </Label>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onClose()
                      router.push('/forgot-password')
                    }}
                    className="text-sm text-primary transition-colors hover:text-primary/80"
                  >
                    Forgot password?
                  </button>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading || authLoading}
                  className="w-full rounded-sm"
                >
                  {isLoading || authLoading ? 'Signing In...' : 'Sign In'}
                </Button>
              </form>

              <div className="mt-6">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <Separator />
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="bg-accent px-2 text-muted-foreground">
                      Or continue with
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <WalletList
                  wallets={allWallets}
                  onWalletConnect={handleWalletConnect}
                  className="grid grid-cols-3 gap-3"
                />
              </div>

              <div className="mt-6 border-t border-border pt-6">
                <p className="text-center text-sm text-secondary-foreground">
                  Don't have an account?{' '}
                  <button
                    onClick={() => setAuthMode('signup')}
                    className="font-semibold text-primary transition-colors hover:text-primary/80"
                  >
                    Sign up
                  </button>
                </p>
              </div>
            </>
          </div>
        ) : (
          <div className="w-full">
            <>
              <form
                onSubmit={handleEmailSignUp}
                noValidate
                className="space-y-3"
              >
                <div className="space-y-2">
                  <Label htmlFor="signup-username">Username</Label>
                  <Input
                    id="signup-username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Choose a username"
                    className="h-9 rounded-sm border border-border px-3 py-2"
                    minLength={3}
                    maxLength={50}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="signup-first-name">First Name</Label>
                    <Input
                      id="signup-first-name"
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="John"
                      className="h-9 rounded-sm border border-border px-3 py-2"
                      minLength={1}
                      maxLength={100}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-last-name">Last Name</Label>
                    <Input
                      id="signup-last-name"
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Doe"
                      className="h-9 rounded-sm border border-border px-3 py-2"
                      minLength={1}
                      maxLength={100}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email Address</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="h-9 rounded-sm border border-border px-3 py-2"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <div className="relative">
                    <Input
                      id="signup-password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Create a password (min 8 characters)"
                      className="h-9 rounded-sm border border-border px-3 py-2 pr-10"
                      required
                      minLength={8}
                      maxLength={128}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                      aria-label={
                        showPassword ? 'Hide password' : 'Show password'
                      }
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-confirm-password">
                    Confirm Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="signup-confirm-password"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm your password"
                      className="h-9 rounded-sm border border-border px-3 py-2 pr-10"
                      required
                      minLength={8}
                      maxLength={128}
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                      aria-label={
                        showConfirmPassword ? 'Hide password' : 'Show password'
                      }
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="agree-terms"
                    checked={agreeToTerms}
                    onCheckedChange={(checked) =>
                      setAgreeToTerms(checked === true)
                    }
                    className="mt-0.5"
                  />
                  <Label
                    htmlFor="agree-terms"
                    className="cursor-pointer text-xs leading-4 text-muted-foreground"
                  >
                    I agree to the{' '}
                    <a href="#" className="text-primary hover:text-primary/80">
                      Terms of Service
                    </a>{' '}
                    and{' '}
                    <a href="#" className="text-primary hover:text-primary/80">
                      Privacy Policy
                    </a>
                  </Label>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading || authLoading}
                  className="w-full rounded-sm"
                >
                  {isLoading || authLoading ? 'Creating Account...' : 'Sign Up'}
                </Button>
              </form>

              <div className="mt-6 border-t border-border pt-6">
                <p className="text-center text-sm text-secondary-foreground">
                  Already have an account?{' '}
                  <button
                    onClick={() => setAuthMode('signin')}
                    className="font-semibold text-primary transition-colors hover:text-primary/80"
                  >
                    Sign in
                  </button>
                </p>
              </div>
            </>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
