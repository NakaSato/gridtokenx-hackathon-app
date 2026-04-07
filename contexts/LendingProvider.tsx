'use client'

import { createContext, useContext, useState, ReactNode } from 'react'
import { usePrivacy } from './PrivacyProvider'
import { toast } from 'react-hot-toast'

interface LoanPosition {
    id: string
    collateralAmount: number
    borrowedAmount: number
    interestRate: number
    timestamp: number
    status: 'ACTIVE' | 'REPAID' | 'LIQUIDATED'
}

interface LendingContextType {
    loans: LoanPosition[]
    borrowPrivate: (collateralAmount: number, borrowAmount: number) => Promise<string>
    repayLoan: (loanId: string) => Promise<void>
}

const LendingContext = createContext<LendingContextType | undefined>(undefined)

export const useLending = () => {
    const context = useContext(LendingContext)
    if (!context) throw new Error('useLending must be used within LendingProvider')
    return context
}

export const LendingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { privateBalance, rootSeed } = usePrivacy()
    const [loans, setLoans] = useState<LoanPosition[]>([])

    const borrowPrivate = async (collateralAmount: number, borrowAmount: number) => {
        if (!privateBalance || !rootSeed) throw new Error('Privacy module locked')
        if ((privateBalance.amount || 0) < collateralAmount) throw new Error('Insufficient private collateral')

        const toastId = toast.loading('Generating ZK Collateral Proof...')

        try {
            // In a real system:
            // 1. User generates a range proof that their commitment hides >= collateralAmount.
            // 2. The commitment is "lien-marked" in the ZK system.
            // 3. Public USDC is sent to the user's wallet.
            await new Promise(r => setTimeout(r, 1500))

            const newLoan: LoanPosition = {
                id: `LOAN-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
                collateralAmount,
                borrowedAmount: borrowAmount,
                interestRate: 4.5,
                timestamp: Date.now(),
                status: 'ACTIVE'
            }

            setLoans(prev => [newLoan, ...prev])
            toast.success(`Borrowed ${borrowAmount} USDC against ZK Collateral!`, { id: toastId })
            return newLoan.id
        } catch (e: any) {
            toast.error(`Borrowing failed: ${e.message}`, { id: toastId })
            throw e
        }
    }

    const repayLoan = async (loanId: string) => {
        const toastId = toast.loading('Settling Loan...')
        try {
            await new Promise(r => setTimeout(r, 1000))
            setLoans(prev => prev.map(l => l.id === loanId ? { ...l, status: 'REPAID' } : l))
            toast.success('Loan Repaid Successfully', { id: toastId })
        } catch (e) {
            toast.error('Repayment failed', { id: toastId })
        }
    }

    return (
        <LendingContext.Provider value={{ loans, borrowPrivate, repayLoan }}>
            {children}
        </LendingContext.Provider>
    )
}
