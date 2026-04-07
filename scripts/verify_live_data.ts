import { Connection, PublicKey } from "@solana/web3.js";
import { Program, AnchorProvider, Idl, setProvider } from "@coral-xyz/anchor";
import oracleIdl from "../lib/idl/oracle.json";

// Configuration
const ORACLE_PROGRAM_ID = new PublicKey("EkcPD2YEXhpo1J73UX9EJNnjV2uuFS8KXMVLx9ybqnhU");
const RPC_URL = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "http://127.0.0.1:8899";

async function main() {
    console.log("Verifying Live Data Flow...");
    console.log(`Connecting to ${RPC_URL}`);

    const connection = new Connection(RPC_URL, "confirmed");
    const provider = new AnchorProvider(connection, {} as any, {});
    setProvider(provider);

    const program = new Program(oracleIdl as Idl, provider);

    // Derive Oracle Data PDA
    const [oracleDataPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("oracle_data")],
        ORACLE_PROGRAM_ID
    );
    console.log(`Oracle Data PDA: ${oracleDataPda.toBase58()}`);

    // Fetch Initial State
    try {
        // Cast to any because the IDL type definition might not perfectly match the on-chain account structure in the TS environment
        const initialAccount = await (program.account as any).oracleData.fetch(oracleDataPda);
        const initialTotal = (initialAccount as any).totalReadings.toNumber();
        console.log(`Initial State: Total Readings=${initialTotal}`);
    } catch (e) {
        console.error("Failed to fetch initial state. Is the Oracle initialized?", e);
        process.exit(1);
    }

    console.log("Waiting for update... (Timeout 60s)");

    // Wait for update via Signatures
    // We only need the very latest signature to compare against
    const initialSignatures = await connection.getSignaturesForAddress(oracleDataPda, { limit: 1 });
    const initialSignature = initialSignatures.length > 0 ? initialSignatures[0].signature : null;

    console.log(`Initial Signature: ${initialSignature || "None"}`);

    let attempts = 0;
    while (attempts < 30) {
        await new Promise(r => setTimeout(r, 2000));
        attempts++;

        try {
            const currentSignatures = await connection.getSignaturesForAddress(oracleDataPda, { limit: 1 });

            if (currentSignatures.length > 0) {
                const latestSignature = currentSignatures[0].signature;

                if (latestSignature !== initialSignature) {
                    console.log(`[Attempt ${attempts}] ✅ New transaction detected: ${latestSignature}`);

                    // Fetch latest state to confirm data
                    const currentAccount = await (program.account as any).oracleData.fetch(oracleDataPda);
                    console.log(`   Total Readings processed: ${(currentAccount as any).totalReadings.toString()}`);

                    console.log("Verification Successful: Live data is flowing to the blockchain.");
                    process.exit(0);
                }
            }

            console.log(`[Attempt ${attempts}] No new transactions yet...`);

        } catch (e) {
            console.error(`[Attempt ${attempts}] Error checking signatures:`, e);
        }
    }

    console.error("❌ Timeout: No new transactions received in 60 seconds.");
    process.exit(1);
}

main().catch(console.error);
