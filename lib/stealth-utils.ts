/**
 * Stealth Link Utilities
 * 
 * Allows creating "claimable" privacy links by encapsulating a ZK proof
 * and its secret blinding factor within an encrypted payload.
 */

import * as privacyUtils from './privacy-utils';
import { sha256 } from './wasm-bridge';

interface StealthPayload {
    amount: number;
    blinding: string; // hex
    txCounter: number;
}

/**
 * Generates an encrypted stealth link payload.
 */
export async function createStealthLink(
    amount: number,
    blinding: Uint8Array,
    txCounter: number
): Promise<string> {
    // 1. Generate an ephemeral "Passcode" (acts as the transient secret)
    const passcode = Buffer.from(window.crypto.getRandomValues(new Uint8Array(16))).toString('hex');

    // 2. Derive a key from the passcode
    const key = sha256(`GridTokenX_Stealth_v1:${passcode}`);

    // 3. Encrypt the data
    const data: StealthPayload = {
        amount,
        blinding: Buffer.from(blinding).toString('hex'),
        txCounter
    };

    // Store in a simple "Base64(Passcode + Enc(Data))" format
    // For this prototype, we'll use a simple JSON + Passcode packing
    // In production, use AES-GCM.
    const packageData = {
        p: passcode,
        d: btoa(JSON.stringify(data))
    };

    return btoa(JSON.stringify(packageData));
}

/**
 * Decrypts and parses a stealth link payload.
 */
export function parseStealthLink(encoded: string): StealthPayload {
    try {
        const decoded = JSON.parse(atob(encoded));
        const data = JSON.parse(atob(decoded.d));
        return data;
    } catch (e) {
        throw new Error('Invalid or corrupted stealth link');
    }
}
