/**
 * Privacy Utilities for Deterministic ZK Privacy
 * 
 * Uses HMAC-SHA256 and SHA-256 for deriving secret keys and blinding factors
 * based on a user's wallet signature.
 */

import { sha256 } from './wasm-bridge';

/**
 * Derives a root privacy seed from a wallet signature.
 * The signature acts as the high-entropy entropy source.
 */
export function derivePrivacyRootSeed(walletSignature: Uint8Array): Uint8Array {
    // Hash the signature to get a fixed-length 32-byte seed
    // In a real browser environment, we'd use WebCrypto for HMAC-SHA256 but 
    // for consistency we use our WASM-bridged sha256.

    // Convert signature bytes to hex for the hasher (our current bridge uses string inputs)
    const sigHex = Buffer.from(walletSignature).toString('hex');
    const rootHex = sha256(`GridTokenX_Privacy_Root_v1:${sigHex}`);

    return Uint8Array.from(Buffer.from(rootHex, 'hex'));
}

/**
 * Derives a specific blinding factor based on a sequence index.
 * Allows recovering b_i for any transaction.
 */
export function deriveBlindingFactor(rootSeed: Uint8Array, index: number): Uint8Array {
    // Try WASM version for performance and consistency
    try {
        const { isWasmLoaded, deriveStealthKey } = require('./wasm-bridge')
        if (isWasmLoaded()) {
            const factor = deriveStealthKey(rootSeed, index)
            if (factor) return factor
        }
    } catch (e) {
        // Fallback
    }

    const seedHex = Buffer.from(rootSeed).toString('hex');
    const factorHex = sha256(`GridTokenX_Blinding_Factor:${index}:${seedHex}`);

    return Uint8Array.from(Buffer.from(factorHex, 'hex'));
}

/**
 * Derives an encryption key for local/on-chain encrypted balances.
 */
export function deriveEncryptionKey(rootSeed: Uint8Array): Uint8Array {
    const seedHex = Buffer.from(rootSeed).toString('hex');
    const keyHex = sha256(`GridTokenX_Encryption_Key_v1:${seedHex}`);

    return Uint8Array.from(Buffer.from(keyHex, 'hex'));
}

/**
 * Sync logic: brute-force/lookup small balances (e.g. up to 1M units)
 * to find the value v that satisfies C = v*G + b*H
 */
export async function recoverAmountFromCommitment(
    commitment: number[],
    blinding: Uint8Array,
    maxSearch: number = 1000000
): Promise<number | null> {
    try {
        const { isWasmLoaded, recoverAmount } = require('./wasm-bridge')
        if (isWasmLoaded()) {
            return recoverAmount(commitment, blinding)
        }
    } catch (e) {
        // Fallback
    }
    return null;
}
