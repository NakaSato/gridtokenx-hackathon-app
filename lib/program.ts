import { Program, AnchorProvider } from "@coral-xyz/anchor";
import { Connection, PublicKey } from "@solana/web3.js";
import idl from "./idl/trading.json";

/**
 * Helper to get the Anchor Program instance for the Trading program.
 */
export function getProgram(connection: Connection, wallet: any) {
    // Use a fallback public key if wallet is not provided or incomplete
    const mockWallet = wallet || {
        publicKey: PublicKey.default,
        signTransaction: async (tx: any) => tx,
        signAllTransactions: async (txs: any[]) => txs,
    };

    const provider = new AnchorProvider(connection, mockWallet as any, {
        commitment: "confirmed",
    });

    return new Program(idl as any, provider);
}
