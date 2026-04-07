'use client'

import { memo } from 'react'
import WalletButton from './WalletButton'
import type { Wallet } from '../types/wallet'

interface WalletListProps {
  wallets: Wallet[]
  onWalletConnect: (walletName: string, iconPath: string) => void
  className?: string
}

// Memoized wallet list component to prevent unnecessary re-renders
const WalletList = memo(function WalletList({
  wallets,
  onWalletConnect,
  className = 'grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-5',
}: WalletListProps) {
  return (
    <div className={className}>
      {wallets.map((wallet) => (
        <WalletButton
          key={wallet.id}
          name={wallet.name}
          iconPath={wallet.iconPath}
          id={wallet.id}
          onClick={() => onWalletConnect(wallet.name, wallet.iconPath)}
        />
      ))}
    </div>
  )
})

export default WalletList
