'use client'

import { useAuth } from '@/contexts/AuthProvider'
import { useWallet } from '@solana/wallet-adapter-react'
import { Card, CardContent } from '../ui/card'
import { Wallet, User, Zap, TrendingUp, Coins, RefreshCw } from 'lucide-react'
import { useState, useMemo } from 'react'
import { useProfile, useWalletBalance } from '@/hooks/usePortfolio'
import { Button } from '../ui/button'
import { Skeleton } from '../ui/skeleton'

export function PortfolioSummary() {
    const { isAuthenticated } = useAuth()
    const { publicKey } = useWallet()
    const { data: profileUser, isLoading: profileLoading, refetch: refetchProfile } = useProfile()

    const walletAddress = profileUser?.wallet_address || publicKey?.toString()
    const { data: tokenBalance, isLoading: balanceLoading, refetch: refetchBalance } = useWalletBalance(walletAddress)

    const handleRefresh = async () => {
        await refetchProfile()
        await refetchBalance()
    }

    const formatBalance = (value: string | number | undefined, decimals: number = 2): string => {
        if (value === undefined || value === null) return '0.00'
        const num = typeof value === 'string' ? parseFloat(value) : value
        if (isNaN(num)) return '0.00'
        return num.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
    }

    const truncateAddress = (address: string | undefined): string => {
        if (!address) return 'Not Connected'
        return `${address.slice(0, 4)}...${address.slice(-4)}`
    }

    const displayUser = profileUser
    const loading = profileLoading || balanceLoading

    const gecPrice = 1.8 // 1.8 THB/GRX
    const solPrice = 6200 // 6,200 THB/SOL (approx)
    const gecValue = (parseFloat(tokenBalance?.token_balance || '0')) * gecPrice
    const solValue = (tokenBalance?.balance_sol || 0) * solPrice
    const totalWealth = gecValue + solValue

    return (
        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="rounded-sm bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
                <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                                <User className="h-4 w-4" />
                                <span>Account</span>
                            </div>
                            {isAuthenticated && displayUser ? (
                                <>
                                    <h3 className="text-lg font-semibold text-foreground truncate max-w-[180px]">
                                        {displayUser.username || 'User'}
                                    </h3>
                                    <p className="text-sm text-muted-foreground truncate max-w-[180px]">
                                        {displayUser.email}
                                    </p>
                                    <div className="mt-2 flex items-center gap-1">
                                        <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary capitalize">
                                            {displayUser.role || 'User'}
                                        </span>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <h3 className="text-lg font-semibold text-foreground">Not Logged In</h3>
                                    <p className="text-sm text-muted-foreground">Sign in to view portfolio</p>
                                </>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card className="rounded-sm bg-gradient-to-br from-amber-500/10 to-amber-500/5 border-amber-500/20">
                <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                                <Wallet className="h-4 w-4" />
                                <span>Wallet</span>
                            </div>
                            {loading ? (
                                <div className="space-y-2">
                                    <Skeleton className="h-6 w-32" /><Skeleton className="h-4 w-24" />
                                </div>
                            ) : walletAddress ? (
                                <>
                                    <h3 className="text-lg font-semibold text-foreground">
                                        {formatBalance(tokenBalance?.balance_sol, 4)} SOL
                                    </h3>
                                    <p className="text-xs text-muted-foreground font-mono">
                                        {truncateAddress(walletAddress)}
                                    </p>
                                    <p className="text-sm text-green-500 mt-1 font-medium">
                                        ≈ ฿{formatBalance(solValue, 0)}
                                    </p>
                                </>
                            ) : (
                                <>
                                    <h3 className="text-lg font-semibold text-foreground">No Wallet</h3>
                                    <p className="text-sm text-muted-foreground">Connect wallet to view balance</p>
                                </>
                            )}
                        </div>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleRefresh} disabled={loading}>
                            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Card className="rounded-sm bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
                <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                        <div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                                <Zap className="h-4 w-4" />
                                <span>Energy Tokens</span>
                            </div>
                            {loading ? (
                                <div className="space-y-2">
                                    <Skeleton className="h-6 w-28" /><Skeleton className="h-4 w-20" />
                                </div>
                            ) : (
                                <>
                                    <h3 className="text-lg font-semibold text-foreground">
                                        <Coins className="inline h-5 w-5 mr-1 text-green-500" />
                                        {formatBalance(tokenBalance?.token_balance || '0', 2)} GRX
                                    </h3>
                                    <p className="text-sm text-green-500 mt-1 font-medium">
                                        ≈ ฿{formatBalance(gecValue, 2)}
                                    </p>
                                    {tokenBalance?.token_mint && (
                                        <p className="text-[10px] text-muted-foreground/60 mt-1 font-mono">
                                            Mint: {truncateAddress(tokenBalance.token_mint)}
                                        </p>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card className="rounded-sm bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-purple-500/20">
                <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                        <div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                                <TrendingUp className="h-4 w-4" />
                                <span>Total Wealth</span>
                            </div>
                            {loading ? (
                                <div className="space-y-2">
                                    <Skeleton className="h-8 w-32" /><Skeleton className="h-4 w-24" />
                                </div>
                            ) : (
                                <>
                                    <h3 className="text-2xl font-bold text-foreground">
                                        ฿{formatBalance(totalWealth, 2)}
                                    </h3>
                                    <div className="mt-1 text-[10px] text-muted-foreground space-y-0.5">
                                        <p>SOL: ฿{formatBalance(solValue, 0)}</p>
                                        <p>GRX: ฿{formatBalance(gecValue, 2)}</p>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
