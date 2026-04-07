'use client'

import { useCallback, useEffect, useState } from 'react'
import { initWasm, sha256, hmacSign, hmacVerify, isWasmLoaded } from '@/lib/wasm-bridge'

interface OrderPayload {
    side: 'buy' | 'sell'
    amount: string
    price_per_kwh: string
}

interface SignedOrder extends OrderPayload {
    timestamp: number
    signature: string
}

/**
 * Hook for cryptographic operations using WASM
 */
export function useCrypto() {
    const [isLoaded, setIsLoaded] = useState(false)

    useEffect(() => {
        initWasm()
            .then(() => setIsLoaded(true))
            .catch((err) => console.error('[Crypto] Failed to load WASM:', err))
    }, [])

    /**
     * Sign an order with HMAC-SHA256
     * @param order - Order payload to sign
     * @param secretKey - User's secret key (e.g., wallet address or session token)
     */
    const signOrder = useCallback((order: OrderPayload, secretKey: string): SignedOrder => {
        const timestamp = Date.now()
        const message = `${order.side}:${order.amount}:${order.price_per_kwh}:${timestamp}`

        let signature = ''
        if (isWasmLoaded()) {
            const sigBytes = hmacSign(secretKey, message)
            // Convert to hex string
            signature = Array.from(sigBytes)
                .map(b => b.toString(16).padStart(2, '0'))
                .join('')
        } else {
            // Fallback: simple hash (not cryptographically secure, just for demo)
            signature = `fallback_${btoa(message).slice(0, 32)}`
        }


        return {
            ...order,
            timestamp,
            signature,
        }
    }, [])

    /**
     * Verify an order signature
     */
    const verifyOrderSignature = useCallback((
        signedOrder: SignedOrder,
        secretKey: string
    ): boolean => {
        const message = `${signedOrder.side}:${signedOrder.amount}:${signedOrder.price_per_kwh}:${signedOrder.timestamp}`

        if (!isWasmLoaded()) {
            console.warn('[Crypto] WASM not loaded, verification skipped')
            return true
        }

        // Convert hex signature back to Uint8Array
        const sigBytes = new Uint8Array(
            signedOrder.signature.match(/.{1,2}/g)?.map(byte => parseInt(byte, 16)) || []
        )

        return hmacVerify(secretKey, message, sigBytes)
    }, [])

    /**
     * Hash a message with SHA-256
     */
    const hashMessage = useCallback((message: string): string => {
        if (!isWasmLoaded()) {
            console.warn('[Crypto] WASM not loaded')
            return ''
        }
        return sha256(message)
    }, [])

    return {
        isLoaded,
        signOrder,
        verifyOrderSignature,
        hashMessage,
    }
}
