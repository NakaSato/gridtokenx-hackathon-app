'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Leaf, Award, Recycle, Send, History, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/AuthProvider'
import { createApiClient } from '@/lib/api-client'
import { CarbonBalanceResponse, CarbonCredit, CarbonTransaction } from '@/types/features'
import { format } from 'date-fns'

export function CarbonCredits() {
    const { token, isAuthenticated } = useAuth()
    const [balance, setBalance] = useState<CarbonBalanceResponse | null>(null)
    const [history, setHistory] = useState<CarbonCredit[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchCarbonData = async () => {
            if (!token || !isAuthenticated) return
            setLoading(true)
            try {
                const apiClient = createApiClient(token)
                const [balanceRes, historyRes] = await Promise.all([
                    apiClient.getCarbonBalance(),
                    apiClient.getCarbonHistory()
                ])

                if (balanceRes.data) setBalance(balanceRes.data)
                if (historyRes.data) setHistory(historyRes.data)
            } catch (err) {
                console.error('Failed to fetch carbon data:', err)
            } finally {
                setLoading(false)
            }
        }

        fetchCarbonData()
    }, [token, isAuthenticated])

    if (loading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-6">
            {/* Summary Stats */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Card className="rounded-sm border-primary/20 bg-primary/5">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Total Credits</CardTitle>
                        <Leaf className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{balance?.total_credits || '0.00'}</div>
                        <p className="text-xs text-muted-foreground">Lifetime earned</p>
                    </CardContent>
                </Card>
                <Card className="rounded-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Active Credits</CardTitle>
                        <Award className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-500">{balance?.active_credits || '0.00'}</div>
                        <p className="text-xs text-muted-foreground">Available for trade/offset</p>
                    </CardContent>
                </Card>
                <Card className="rounded-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Retired Credits</CardTitle>
                        <Recycle className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{balance?.retired_credits || '0.00'}</div>
                        <p className="text-xs text-muted-foreground">Environmentally offset</p>
                    </CardContent>
                </Card>
                <Card className="rounded-sm border-emerald-500/20 bg-emerald-500/5">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">CO2 Impact</CardTitle>
                        <div className="h-2 w-2 rounded-full bg-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-emerald-600">
                            {balance ? (balance.kg_co2_equivalent).toFixed(2) : '0.00'} kg
                        </div>
                        <p className="text-xs text-muted-foreground">CO2 equivalent reduced</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* History Table */}
                <Card className="col-span-2 rounded-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <History className="h-5 w-5" />
                            Earning History
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="relative w-full overflow-auto">
                            <table className="w-full caption-bottom text-sm">
                                <thead>
                                    <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Date</th>
                                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Source</th>
                                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Amount</th>
                                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="[&_tr:last-child]:border-0">
                                    {history.length > 0 ? (
                                        history.map((credit) => (
                                            <tr key={credit.id} className="border-b transition-colors hover:bg-muted/50">
                                                <td className="p-4 align-middle">{format(new Date(credit.created_at), 'MMM dd, yyyy')}</td>
                                                <td className="p-4 align-middle">
                                                    <div className="flex flex-col">
                                                        <span className="capitalize">{credit.source}</span>
                                                        {credit.source === 'REC' && credit.description && (
                                                            <span className="text-[10px] text-muted-foreground font-mono truncate max-w-[120px]">
                                                                {credit.description}
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="p-4 align-middle font-medium">{credit.amount} kWh</td>
                                                <td className="p-4 align-middle">
                                                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${credit.status === 'active' ? 'bg-green-100 text-green-800' :
                                                        credit.status === 'retired' ? 'bg-blue-100 text-blue-800' :
                                                            'bg-gray-100 text-gray-800'
                                                        }`}>
                                                        {credit.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={4} className="h-24 text-center align-middle text-muted-foreground">
                                                No earning history found
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>

                {/* Transfer & Actions */}
                <div className="flex flex-col gap-6">
                    <Card className="rounded-sm">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <Send className="h-5 w-5 text-primary" />
                                Quick Transfer
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-muted-foreground">Recipient Username</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. janesolar32"
                                        className="w-full rounded-sm border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-muted-foreground">Amount (Credits)</label>
                                    <input
                                        type="number"
                                        placeholder="0.00"
                                        step="0.01"
                                        className="w-full rounded-sm border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                                    />
                                </div>
                                <Button className="w-full rounded-sm" disabled={!balance || parseFloat(balance.active_credits) <= 0}>
                                    Transfer Credits
                                </Button>
                                <p className="text-center text-[10px] text-muted-foreground italic">
                                    * 1.00 Credit ≈ 0.0004 tons CO2 offset
                                </p>
                            </form>
                        </CardContent>
                    </Card>

                    <Card className="rounded-sm border-primary/10">
                        <CardContent className="pt-6">
                            <div className="flex flex-col items-center text-center">
                                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                                    <Award className="h-6 w-6" />
                                </div>
                                <h3 className="mb-1 font-semibold">Sustainability Badge</h3>
                                <p className="text-xs text-muted-foreground">
                                    You are in the top 15% of renewable energy producers this month!
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
