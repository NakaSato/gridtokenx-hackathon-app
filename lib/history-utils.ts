/**
 * History Encryption Utilities
 * 
 * Allows users to store transaction metadata (amount, recipient, origin)
 * on-chain in an encrypted format that only their derived key can read.
 */

const ENCRYPTION_ALGO = 'AES-GCM';

/**
 * Encrypts a transaction metadata object.
 */
export async function encryptHistoryBlob(data: any, key: Uint8Array): Promise<string> {
    const cryptoKey = await window.crypto.subtle.importKey(
        'raw',
        new Uint8Array(key).buffer, // Copy to ensure non-shared buffer
        ENCRYPTION_ALGO,
        false,
        ['encrypt']
    );

    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encodedData = new TextEncoder().encode(JSON.stringify(data));

    const encryptedContent = await window.crypto.subtle.encrypt(
        { name: ENCRYPTION_ALGO, iv },
        cryptoKey,
        new Uint8Array(encodedData).buffer // Copy to ensure non-shared buffer
    );

    // Pack as IV + EncryptedData
    const result = new Uint8Array(iv.length + encryptedContent.byteLength);
    result.set(iv);
    result.set(new Uint8Array(encryptedContent), iv.length);

    return btoa(String.fromCharCode(...result));
}

/**
 * Decrypts a transaction metadata blob.
 */
export async function decryptHistoryBlob(base64Blob: string, key: Uint8Array): Promise<any> {
    const cryptoKey = await window.crypto.subtle.importKey(
        'raw',
        new Uint8Array(key).buffer, // Copy to ensure non-shared buffer
        ENCRYPTION_ALGO,
        false,
        ['decrypt']
    );

    const blob = Uint8Array.from(atob(base64Blob), c => c.charCodeAt(0));
    const iv = blob.slice(0, 12);
    const data = blob.slice(12);

    try {
        const decryptedContent = await window.crypto.subtle.decrypt(
            { name: ENCRYPTION_ALGO, iv },
            cryptoKey,
            new Uint8Array(data).buffer // Copy to ensure non-shared buffer
        );

        return JSON.parse(new TextDecoder().decode(decryptedContent));
    } catch (e) {
        throw new Error('Failed to decrypt history: Invalid key or corrupted data');
    }
}
