'use client'
import {
  ConnectionProvider,
  WalletProvider,
} from '@solana/wallet-adapter-react'
import { WalletAdapterNetwork, Adapter } from '@solana/wallet-adapter-base'
import { useMemo, useState, useEffect } from 'react'
import { ContractProvider } from './contractProvider'

export default ({ children }: { children: React.ReactNode }) => {
  const network = process.env.NEXT_PUBLIC_SOLANA_NETWORK === 'devnet'
    ? WalletAdapterNetwork.Devnet
    : process.env.NEXT_PUBLIC_SOLANA_NETWORK === 'localnet'
    ? WalletAdapterNetwork.Devnet // no localnet option, use devnet
    : WalletAdapterNetwork.Mainnet

  // Start with empty wallets to avoid including heavy libraries in initial bundle
  const [wallets, setWallets] = useState<Adapter[]>([])

  useEffect(() => {
    const loadWallets = async () => {
      try {
        const [
          { PhantomWalletAdapter },
          { SolflareWalletAdapter },
          { TrustWalletAdapter },
          { SafePalWalletAdapter }
        ] = await Promise.all([
          import('@solana/wallet-adapter-phantom'),
          import('@solana/wallet-adapter-solflare'),
          import('@solana/wallet-adapter-trust'),
          import('@solana/wallet-adapter-safepal')
        ])

        const loadedWallets = [
          new PhantomWalletAdapter(),
          new SolflareWalletAdapter(),
          new TrustWalletAdapter(),
          new SafePalWalletAdapter(),
          // new TorusWalletAdapter(),
        ].filter((adapter) =>
          !adapter.name.toLowerCase().includes('metamask')
        )

        setWallets(loadedWallets)
      } catch (error) {
        console.error('Failed to load wallet adapters:', error)
      }
    }

    loadWallets()
  }, [])

  const endpoint = useMemo(
    () => process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'http://localhost:8899',
    []
  )

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect={false}>
        <ContractProvider>{children}</ContractProvider>
      </WalletProvider>
    </ConnectionProvider>
  )
}
