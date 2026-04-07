"use client"

import { useState } from "react"
import { useConnection, useWallet } from "@solana/wallet-adapter-react"
import { BN, Program } from "@coral-xyz/anchor"
import { PublicKey } from "@solana/web3.js"
import { getAssociatedTokenAddressSync } from "@solana/spl-token" // Assuming spl-token is available
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { submitAuctionOrder, cancelAuctionOrder, submitEncryptedBid } from "@/lib/contract-actions"
import { toast } from "react-hot-toast"
import { Switch } from "@/components/ui/switch"
import { USDC_MINT, ENERGY_TOKEN_MINT } from "@/utils/const"

interface OrderFormProps {
    batchPda: PublicKey
    program: Program<any> | null
}

export function OrderForm({ batchPda, program }: OrderFormProps) {
    const { connection } = useConnection()
    const wallet = useWallet()

    const [price, setPrice] = useState("")
    const [amount, setAmount] = useState("")
    const [isConfidential, setIsConfidential] = useState(false)
    const [cancelIndex, setCancelIndex] = useState("")
    const [isLoading, setIsLoading] = useState(false)

    const handleSubmit = async (isBid: boolean) => {
        if (!wallet.publicKey || !program) {
            toast.error("Please connect wallet")
            return
        }
        if (!price || !amount) return

        setIsLoading(true)
        try {
            const tokenMint = isBid ? USDC_MINT : ENERGY_TOKEN_MINT
            const userTokenAccount = getAssociatedTokenAddressSync(
                tokenMint,
                wallet.publicKey
            )

            let success = false;

            if (isConfidential) {
                // Mock ElGamal Encrypted Ciphertext (64 bytes)
                // In Phase 6, replace with real client-side encryption logic
                const encryptedPrice = Array(64).fill(1)
                const encryptedAmount = Array(64).fill(2)

                success = await submitEncryptedBid(
                    program,
                    connection,
                    wallet.publicKey,
                    wallet.sendTransaction,
                    {
                        batch: batchPda,
                        encryptedPrice,
                        encryptedAmount,
                        isBid
                    }
                )
            } else {
                success = await submitAuctionOrder(
                    program,
                    connection,
                    wallet.publicKey,
                    wallet.sendTransaction,
                    {
                        batch: batchPda,
                        price: parseFloat(price),
                        amount: parseFloat(amount),
                        isBid,
                        tokenMint,
                        userTokenAccount
                    }
                )
            }
            if (success) {
                toast.success(`${isBid ? "Bid" : "Ask"} submitted ${isConfidential ? "confidentially " : ""}successfully!`)
                setPrice("")
                setAmount("")
            } else {
                toast.error("Transaction failed")
            }
        } catch (error: any) {
            console.error(error)
            toast.error(`Error submitting order: ${error.message || 'Unknown error'}`)
        } finally {
            setIsLoading(false)
        }
    }

    const handleCancel = async () => {
        if (!wallet.publicKey || !program) {
            toast.error("Please connect wallet")
            return
        }
        if (!cancelIndex) return

        setIsLoading(true)
        try {
            // For demo, we default to cancelling a BID (USDC)
            // Real UI would need to know what type of order it was to refund correct asset
            // Limitation: User needs to know which mint they used. 
            // Better: Fetch order details first. 
            // For MVP: Assume Payment Token (USDC) for refund test. If fails, try Energy.

            const tokenMint = USDC_MINT
            const userTokenAccount = getAssociatedTokenAddressSync(
                tokenMint,
                wallet.publicKey
            )

            const success = await cancelAuctionOrder(
                program,
                connection,
                wallet.publicKey,
                wallet.sendTransaction,
                {
                    batch: batchPda,
                    orderIndex: parseInt(cancelIndex),
                    tokenMint,
                    userTokenAccount
                }
            )

            if (success) {
                toast.success("Order cancelled and refunded")
                setCancelIndex("")
            } else {
                toast.error("Cancellation failed")
            }
        } catch (error) {
            console.error(error)
            toast.error("Error cancelling order")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Place Order</CardTitle>
                <CardDescription>Submit your offer to the current auction batch</CardDescription>
            </CardHeader>
            <CardContent>
                <Tabs defaultValue="buy" className="w-full">
                    <TabsList className="grid w-full grid-cols-3 mb-4">
                        <TabsTrigger value="buy">Buy (Bid)</TabsTrigger>
                        <TabsTrigger value="sell">Sell (Ask)</TabsTrigger>
                        <TabsTrigger value="cancel">Cancel</TabsTrigger>
                    </TabsList>

                    <div className="space-y-4">
                        <TabsContent value="buy">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="price-buy">Price (per unit)</Label>
                                    <Input
                                        id="price-buy"
                                        type="number"
                                        placeholder="0.00"
                                        value={price}
                                        onChange={(e) => setPrice(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="amount-buy">Amount (Energy Units)</Label>
                                    <Input
                                        id="amount-buy"
                                        type="number"
                                        placeholder="0"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                    />
                                </div>
                                <div className="flex items-center space-x-2 py-2">
                                    <Switch
                                        id="confidential-buy"
                                        checked={isConfidential}
                                        onCheckedChange={setIsConfidential}
                                    />
                                    <Label htmlFor="confidential-buy">Confidential Bid (Hide Price/Amount)</Label>
                                </div>
                                <Button
                                    className="w-full bg-green-600 hover:bg-green-700"
                                    onClick={() => handleSubmit(true)}
                                    disabled={isLoading}
                                >
                                    {isLoading ? "Submitting..." : "Submit Bid (Locks USDC)"}
                                </Button>
                            </div>
                        </TabsContent>
                        <TabsContent value="sell">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="price-sell">Price (per unit)</Label>
                                    <Input
                                        id="price-sell"
                                        type="number"
                                        placeholder="0.00"
                                        value={price}
                                        onChange={(e) => setPrice(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="amount-sell">Amount (Energy Units)</Label>
                                    <Input
                                        id="amount-sell"
                                        type="number"
                                        placeholder="0"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                    />
                                </div>
                                <div className="flex items-center space-x-2 py-2">
                                    <Switch
                                        id="confidential-sell"
                                        checked={isConfidential}
                                        onCheckedChange={setIsConfidential}
                                    />
                                    <Label htmlFor="confidential-sell">Confidential Ask (Hide Price/Amount)</Label>
                                </div>
                                <Button
                                    className="w-full bg-red-600 hover:bg-red-700"
                                    onClick={() => handleSubmit(false)}
                                    disabled={isLoading}
                                >
                                    {isLoading ? "Submitting..." : "Submit Ask (Locks Energy)"}
                                </Button>
                            </div>
                        </TabsContent>
                        <TabsContent value="cancel">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="order-idx">Order Index</Label>
                                    <Input
                                        id="order-idx"
                                        type="number"
                                        placeholder="Order Index (e.g. 0)"
                                        value={cancelIndex}
                                        onChange={(e) => setCancelIndex(e.target.value)}
                                    />
                                </div>
                                <Button
                                    className="w-full" variant="destructive"
                                    onClick={handleCancel}
                                    disabled={isLoading}
                                >
                                    {isLoading ? "Processing..." : "Cancel Order & Refund"}
                                </Button>
                            </div>
                        </TabsContent>
                    </div>
                </Tabs>
            </CardContent>
        </Card>
    )
}
