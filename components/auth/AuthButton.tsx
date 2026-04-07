'use client'

import { useWallet } from '@solana/wallet-adapter-react'
import { useAuth } from '@/contexts/AuthProvider'
import SignIn from './SignIn'
import SignOut from './SignOut'
import AuthModalManager from './AuthModalManager'

interface AuthButtonProps {
  signInVariant?: 'default' | 'outline' | 'ghost'
  signOutVariant?: 'default' | 'outline' | 'ghost' | 'destructive'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  className?: string
  showIcon?: boolean
  signInText?: string
  signOutText?: string
  onSignOut?: () => void
}

export default function AuthButton({
  signInVariant = 'default',
  signOutVariant = 'outline',
  size = 'default',
  className = '',
  showIcon = true,
  signInText = 'Connect Wallet',
  signOutText = 'Disconnect',
  onSignOut,
}: AuthButtonProps) {
  const { connected } = useWallet()
  const { isAuthenticated, isLoading } = useAuth()

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="h-9 w-24 rounded bg-muted"></div>
      </div>
    )
  }

  // If both wallet is connected AND user is authenticated, show sign out
  if (connected && isAuthenticated) {
    return (
      <SignOut
        variant={signOutVariant}
        size={size}
        className={className}
        showIcon={showIcon}
        text={signOutText}
        onSignOut={onSignOut}
      />
    )
  }

  // If wallet is connected but not authenticated, show sign in prompt
  if (connected && !isAuthenticated) {
    return (
      <SignIn
        variant={signInVariant}
        size={size}
        className={className}
        showIcon={showIcon}
        text="Sign In"
      />
    )
  }

  // If wallet is not connected, show connect wallet
  return (
    <SignIn
      variant={signInVariant}
      size={size}
      className={className}
      showIcon={showIcon}
      text={signInText}
    />
  )
}
