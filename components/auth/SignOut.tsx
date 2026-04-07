'use client'

import { useWallet } from '@solana/wallet-adapter-react'
import { Button } from '../ui/button'
import toast from 'react-hot-toast'
import { LogOutIcon } from '@/public/svgs/icons'

interface SignOutProps {
  variant?: 'default' | 'outline' | 'ghost' | 'destructive'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  className?: string
  showIcon?: boolean
  text?: string
  onSignOut?: () => void
}

export default function SignOut({
  variant = 'outline',
  size = 'default',
  className = '',
  showIcon = true,
  text = 'Sign Out',
  onSignOut,
}: SignOutProps) {
  const { disconnect, connected, publicKey } = useWallet()

  // If not connected, don't show the sign-out button
  if (!connected) {
    return null
  }

  const handleSignOut = () => {
    disconnect()
    toast.success('Wallet Disconnected')

    // Call custom callback if provided
    if (onSignOut) {
      onSignOut()
    }
  }

  return (
    <Button
      onClick={handleSignOut}
      variant={variant}
      size={size}
      className={className}
    >
      {showIcon && <LogOutIcon />}
      <span className="font-medium">{text}</span>
    </Button>
  )
}
