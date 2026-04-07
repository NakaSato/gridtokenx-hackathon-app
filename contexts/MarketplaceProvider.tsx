'use client'

import { createContext, useContext, useState, ReactNode, useEffect } from 'react'
import { usePrivacy } from './PrivacyProvider'
import { toast } from 'react-hot-toast'
import { PublicKey } from '@solana/web3.js'

interface MarketOffer {
    id: string
    seller: string
    amount: number
    price: number // USDC per GRX
    origin: 'Solar' | 'Wind'
    timestamp: number
    status: 'OPEN' | 'SOLD' | 'CANCELLED'
}

interface MarketplaceContextType {
    offers: MarketOffer[]
    buyPrivate: (offerId: string) => Promise<string>
    listPrivate: (amount: number, price: number, origin: 'Solar' | 'Wind') => Promise<string>
    splitBulkOrder: (offerId: string, amountToBuy: number) => Promise<void>
}

const MarketplaceContext = createContext<MarketplaceContextType | undefined>(undefined)

export const useMarketplace = () => {
    const context = useContext(MarketplaceContext)
    if (!context) throw new Error('useMarketplace must be used within MarketplaceProvider')
    return context
}

export const MarketplaceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { fulfillTradeOffer, createTradeOffer, privateBalance } = usePrivacy()
    const [offers, setOffers] = useState<MarketOffer[]>([
        {
            id: 'OFFER-882',
            seller: '4k3Dy...p91z',
            amount: 1250,
            price: 0.45,
            origin: 'Solar',
            timestamp: Date.now() - 3600000,
            status: 'OPEN'
        },
        {
            id: 'OFFER-901',
            seller: '8js2L...v22x',
            amount: 4500,
            price: 0.38,
            origin: 'Wind',
            timestamp: Date.now() - 7200000,
            status: 'OPEN'
        }
    ])

    const listPrivate = async (amount: number, price: number, origin: 'Solar' | 'Wind') => {
        const toastId = toast.loading('Listing Private Energy Offer...')
        try {
            // Use existing createTradeOffer logic (which handles escrow)
            const invite = await createTradeOffer(amount, price)

            const newOffer: MarketOffer = {
                id: `OFFER-${Math.floor(Math.random() * 1000)}`,
                seller: 'You',
                amount,
                price,
                origin,
                timestamp: Date.now(),
                status: 'OPEN'
            }

            setOffers(prev => [newOffer, ...prev])
            toast.success('Private listing live on Marketplace!', { id: toastId })
            return invite
        } catch (e: any) {
            toast.error(`Listing failed: ${e.message}`, { id: toastId })
            throw e
        }
    }

    const buyPrivate = async (offerId: string) => {
        const toastId = toast.loading('Executing Atomic P2P Settlement...')
        try {
            // In a real system:
            // 1. Buyer pays USDC via a public transfer.
            // 2. Settlement triggers a ZK Release of the escrowed GRX.
            await new Promise(r => setTimeout(r, 2000))

            setOffers(prev => prev.map(o => o.id === offerId ? { ...o, status: 'SOLD' } : o))

            // Simulation of shielding the bought tokens
            const offer = offers.find(o => o.id === offerId)
            if (offer) {
                // Trigger the underlying ZK fulfillment
                // For this prototype, we'll simulate the successful intake
                toast.success(`Successfully purchased ${offer.amount} ${offer.origin} GRX!`, { id: toastId })
            }

            return 'SIG_P2P_SETTLEMENT_SUCCESS'
        } catch (e: any) {
            toast.error(`Purchase failed: ${e.message}`, { id: toastId })
            throw e
        }
    }

    const splitBulkOrder = async (offerId: string, amountToBuy: number) => {
        const toastId = toast.loading(`Processing Partial Fulfillment of ${amountToBuy} GRX...`)
        try {
            await new Promise(r => setTimeout(r, 1500))

            setOffers(prev => prev.map(o => {
                if (o.id === offerId) {
                    if (o.amount < amountToBuy) throw new Error('Insufficient order volume')
                    return { ...o, amount: o.amount - amountToBuy }
                }
                return o
            }))

            toast.success('Partial Fulfillment Succeeded', { id: toastId })
        } catch (e: any) {
            toast.error(`Fulfillment failed: ${e.message}`, { id: toastId })
        }
    }

    return (
        <MarketplaceContext.Provider value={{ offers, listPrivate, buyPrivate, splitBulkOrder }}>
            {children}
        </MarketplaceContext.Provider>
    )
}
