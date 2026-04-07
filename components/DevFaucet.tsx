"use client";

import { useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthProvider";
import { useWallet } from "@solana/wallet-adapter-react";
import { ChevronDown, ChevronUp, X, Bell } from "lucide-react";

export default function DevFaucet() {
    const { user } = useAuth();
    const { publicKey, connected } = useWallet();
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState(false);
    const [isMinimized, setIsMinimized] = useState(true);
    const [isDismissed, setIsDismissed] = useState(false);

    const [notifLoading, setNotifLoading] = useState(false);

    // Use connected wallet's publicKey first, fallback to user's stored wallet_address
    const walletAddress = connected && publicKey ? publicKey.toBase58() : user?.wallet_address;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

    const requestFunds = useCallback(async (amountSol: number, amountTokens: number) => {
        if (!walletAddress) {
            setMessage("Log in to use faucet");
            setError(true);
            return;
        }

        setLoading(true);
        setMessage("");
        setError(false);

        try {
            const response = await fetch(`${apiUrl}/api/v1/dev/faucet`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    wallet_address: walletAddress,
                    amount_sol: amountSol,
                    mint_tokens_kwh: amountTokens,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Faucet request failed");
            }

            setMessage(data.message || "Funds received!");
        } catch (err: any) {
            setError(true);
            setMessage(err.message);
        } finally {
            setLoading(false);
        }
    }, [apiUrl, walletAddress]);

    const sendTestNotification = useCallback(async (type: string = "system") => {
        if (!walletAddress) {
            setMessage("Log in to use test notification");
            setError(true);
            return;
        }

        setNotifLoading(true);
        setMessage("");
        setError(false);

        try {
            const response = await fetch(`${apiUrl}/api/v1/dev/test-notification`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    wallet_address: walletAddress,
                    notification_type: type,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Test notification failed");
            }

            setMessage(`Notification sent! ID: ${data.notification_id?.slice(0, 8)}...`);
        } catch (err: any) {
            setError(true);
            setMessage(err.message);
        } finally {
            setNotifLoading(false);
        }
    }, [apiUrl, walletAddress]);

    if (!process.env.NEXT_PUBLIC_SHOW_DEV_TOOLS || process.env.NEXT_PUBLIC_SHOW_DEV_TOOLS === "false") {
        return null;
    }

    if (isDismissed) {
        return null;
    }

    return (
        <div className="fixed bottom-20 right-4 z-[100] sm:bottom-4 sm:right-4">
            {isMinimized ? (
                <button
                    onClick={() => setIsMinimized(false)}
                    className="flex items-center gap-2 rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-xs text-gray-200 shadow-xl transition hover:bg-gray-800"
                >
                    <span>🧪 Dev Faucet</span>
                    <ChevronUp size={14} />
                </button>
            ) : (
                <div className="max-w-[280px] rounded-lg border border-gray-700 bg-gray-900 p-4 shadow-xl sm:max-w-sm">
                    <div className="mb-2 flex items-center justify-between">
                        <h3 className="text-sm font-bold text-gray-200">Developer Faucet</h3>
                        <div className="flex gap-1">
                            <button
                                onClick={() => setIsMinimized(true)}
                                className="rounded p-1 text-gray-400 transition hover:bg-gray-700 hover:text-gray-200"
                                aria-label="Minimize"
                            >
                                <ChevronDown size={14} />
                            </button>
                            <button
                                onClick={() => setIsDismissed(true)}
                                className="rounded p-1 text-gray-400 transition hover:bg-gray-700 hover:text-red-400"
                                aria-label="Dismiss"
                            >
                                <X size={14} />
                            </button>
                        </div>
                    </div>

                    {walletAddress ? (
                        <div className="space-y-2">
                            <p className="mb-2 truncate text-xs text-gray-400">
                                Wallet: {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                            </p>

                            <div className="flex flex-wrap gap-2">
                                <button
                                    onClick={() => requestFunds(100, 0)}
                                    disabled={loading}
                                    className="rounded bg-blue-600 px-3 py-1 text-xs text-white transition hover:bg-blue-500 disabled:opacity-50"
                                >
                                    Get 100 SOL
                                </button>
                                <button
                                    onClick={() => requestFunds(0, 1000)}
                                    disabled={loading}
                                    className="rounded bg-green-600 px-3 py-1 text-xs text-white transition hover:bg-green-500 disabled:opacity-50"
                                >
                                    Get 1k kWh
                                </button>
                            </div>

                            <div className="border-t border-gray-700 pt-2 mt-2">
                                <p className="text-xs text-gray-500 mb-2">Test Notifications</p>
                                <div className="flex flex-wrap gap-2">
                                    <button
                                        onClick={() => sendTestNotification("order_filled")}
                                        disabled={notifLoading}
                                        className="flex items-center gap-1 rounded bg-purple-600 px-2 py-1 text-xs text-white transition hover:bg-purple-500 disabled:opacity-50"
                                    >
                                        <Bell size={12} />
                                        Order Filled
                                    </button>
                                    <button
                                        onClick={() => sendTestNotification("order_matched")}
                                        disabled={notifLoading}
                                        className="flex items-center gap-1 rounded bg-orange-600 px-2 py-1 text-xs text-white transition hover:bg-orange-500 disabled:opacity-50"
                                    >
                                        <Bell size={12} />
                                        Order Matched
                                    </button>
                                    <button
                                        onClick={() => sendTestNotification("system")}
                                        disabled={notifLoading}
                                        className="flex items-center gap-1 rounded bg-gray-600 px-2 py-1 text-xs text-white transition hover:bg-gray-500 disabled:opacity-50"
                                    >
                                        <Bell size={12} />
                                        System
                                    </button>
                                </div>
                            </div>

                            {message && (
                                <p className={`mt-2 text-xs ${error ? "text-red-400" : "text-green-400"}`}>
                                    {message}
                                </p>
                            )}
                        </div>
                    ) : (
                        <p className="text-xs text-yellow-400">Please log in to use faucet</p>
                    )}
                </div>
            )}
        </div>
    );
}
