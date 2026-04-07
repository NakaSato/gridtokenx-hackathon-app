'use client'

import { useState, useEffect } from 'react'
import { Button } from '../ui/button'
import { WalletIcon } from '@/public/svgs/icons'
import WalletModal from '../WalletModal'
import { useWallet } from '@solana/wallet-adapter-react'

interface SignInProps {
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  className?: string
  showIcon?: boolean
  text?: string
}

export default function SignIn({
  variant = 'default',
  size = 'default',
  className = '',
  showIcon = true,
  text = 'Connect Wallet',
}: SignInProps) {
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false)
  const { connected } = useWallet()

  // Listen for custom events to open wallet modal
  useEffect(() => {
    const handleOpenWalletModal = () => {
      setIsWalletModalOpen(true)
    }

    window.addEventListener('openWalletModal', handleOpenWalletModal)

    return () => {
      window.removeEventListener('openWalletModal', handleOpenWalletModal)
    }
  }, [])


  return (
    <>
      <Button
        onClick={() => setIsWalletModalOpen(true)}
        variant={variant}
        size={size}
        className={className}
      >
        {showIcon && <WalletIcon />}
        <span className="font-medium">{text}</span>
      </Button>
      <WalletModal
        isOpen={isWalletModalOpen}
        onClose={() => setIsWalletModalOpen(false)}
      />
    </>
  )
}
