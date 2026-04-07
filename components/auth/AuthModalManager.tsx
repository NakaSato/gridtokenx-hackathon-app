'use client'

import { useState, useEffect } from 'react'
import WalletModal from '../WalletModal'

/**
 * Global auth modal manager that listens for custom events
 * to open the wallet/auth modal from anywhere in the app
 */
export default function AuthModalManager() {
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    const handleOpenAuthModal = () => {
      setIsModalOpen(true)
    }

    const handleOpenWalletModal = () => {
      setIsModalOpen(true)
    }

    window.addEventListener('openAuthModal', handleOpenAuthModal)
    window.addEventListener('openWalletModal', handleOpenWalletModal)

    return () => {
      window.removeEventListener('openAuthModal', handleOpenAuthModal)
      window.removeEventListener('openWalletModal', handleOpenWalletModal)
    }
  }, [])

  return (
    <WalletModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
  )
}
