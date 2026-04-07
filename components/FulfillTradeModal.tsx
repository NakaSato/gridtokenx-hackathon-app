'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { usePrivacy } from '@/contexts/PrivacyProvider'
import { toast } from 'react-hot-toast'
import { ShoppingCart, ShieldCheck, DollarSign, ArrowRight } from 'lucide-react'

export default function FulfillTradeModal() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const { isUnlocked, fulfillTradeOffer, refresh } = usePrivacy()
    const [invite, setInvite] = useState<string | null>(null)
    const [tradeData, setTradeData] = useState<any>(null)
    const [isFulfilling, setIsFulfilling] = useState(false)
    const [done, setDone] = useState(false)

    useEffect(() => {
        const t = searchParams.get('t')
        if (t) {
            setInvite(t)
            try {
                const data = JSON.parse(atob(t))
                setTradeData(data)
            } catch (e) {
                console.error("Failed to parse trade invite", e)
            }
        }
    }, [searchParams])

    const handleFulfill = async () => {
        if (!invite || !isUnlocked) return

        setIsFulfilling(true)
        const toastId = toast.loading('Settling P2P Trade and Claiming Tokens...')

        try {
            await fulfillTradeOffer(invite)
            toast.success('Trade fulfilled! Tokens are now in your private balance.', { id: toastId })
            setDone(true)
            await refresh()
        } catch (error: any) {
            console.error('[FulfillTrade] failed:', error)
            toast.error(`Trade failed: ${error.message}`, { id: toastId })
        } finally {
            setIsFulfilling(false)
        }
    }

    const closeAndRedirect = () => {
        setInvite(null)
        router.replace(window.location.pathname)
    }

    if (!invite || !tradeData) return null

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-md">
            <div className="w-full max-w-md rounded-xl border-2 border-primary/30 bg-background p-8 shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex flex-col items-center">
                    <div className="mb-6 rounded-lg bg-primary/10 p-4 border border-primary/20">
                        <ShoppingCart className="text-primary" size={40} />
                    </div>

                    <h2 className="mb-2 text-xl font-bold text-foreground">Private Trade Invite</h2>
                    <p className="mb-6 text-center text-xs text-secondary-foreground">
                        You've been invited to fulfill a confidential P2P trade. Settlement happens via ZK Escrow.
                    </p>

                    <div className="w-full rounded-xl bg-muted p-5 mb-8 border border-muted-foreground/10">
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-[10px] font-bold text-secondary-foreground uppercase">You Receive</span>
                            <span className="text-lg font-black text-primary">{tradeData.amount} GRX</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-[10px] font-bold text-secondary-foreground uppercase">You Pay</span>
                            <div className="flex items-center text-lg font-black text-foreground">
                                <DollarSign size={18} className="text-green-500" />
                                <span>{tradeData.price}</span>
                            </div>
                        </div>
                    </div>

                    {!isUnlocked ? (
                        <div className="w-full rounded-lg bg-red-500/10 p-4 border border-red-500/20 mb-6 text-center">
                            <p className="text-xs text-red-500 font-bold">Privacy Locked</p>
                            <p className="text-[10px] text-red-400 mt-1">Unlock your privacy module to fulfill this trade.</p>
                        </div>
                    ) : (
                        !done && (
                            <button
                                onClick={handleFulfill}
                                disabled={isFulfilling}
                                className="w-full rounded-lg bg-primary py-4 text-sm font-black text-primary-foreground shadow-lg transition-transform active:scale-95 disabled:opacity-50 flex items-center justify-center"
                            >
                                {isFulfilling ? 'SETTLING TRADE...' : 'ACCEPT & SETTLE TRADE'}
                                {!isFulfilling && <ArrowRight className="ml-2" size={18} />}
                            </button>
                        )
                    )}

                    {done && (
                        <div className="w-full">
                            <div className="flex flex-col items-center py-4 bg-green-500/10 rounded-lg border border-green-500/20 mb-6">
                                <ShieldCheck className="text-green-500 mb-2" size={32} />
                                <span className="text-xs font-bold text-green-500 uppercase">Trade Successful</span>
                            </div>
                            <button
                                onClick={closeAndRedirect}
                                className="w-full rounded-lg border py-3 text-sm font-bold text-foreground hover:bg-muted"
                            >
                                DONE
                            </button>
                        </div>
                    )}

                    {!done && (
                        <button
                            onClick={closeAndRedirect}
                            className="mt-4 text-[10px] font-bold text-secondary-foreground hover:text-foreground uppercase tracking-widest"
                        >
                            Cancel & Ignore
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}
