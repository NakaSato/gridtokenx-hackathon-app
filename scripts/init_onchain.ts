import * as anchor from "@coral-xyz/anchor";
const { Program, BN } = anchor;
import { PublicKey, Keypair } from "@solana/web3.js";
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
    process.env.ANCHOR_PROVIDER_URL = "http://127.0.0.1:8899";
    const home = process.env.HOME || process.env.USERPROFILE;
    const walletPath = path.join(home!, ".config/solana/id.json");
    process.env.ANCHOR_WALLET = walletPath;

    const connection = new anchor.web3.Connection("http://localhost:8899", "confirmed");
    const wallet = anchor.Wallet.local();
    const provider = new anchor.AnchorProvider(connection, wallet, { commitment: "confirmed" });
    anchor.setProvider(provider);

    const TRADING_PROGRAM_ID = "69dGpKu9a8EZiZ7orgfTH6CoGj9DeQHHkHBF2exSr8na";
    const GOVERNANCE_PROGRAM_ID = "DamT9e1VqbA5nSyFZHExKwQu6qs4L5FW6dirWCK8YLd4";

    // Load IDL
    const tradingIdlPath = "/Users/chanthawat/Developments/gridtokenx-platform-infa/gridtokenx-anchor/target/idl/trading.json";
    const tradingIdl = JSON.parse(fs.readFileSync(tradingIdlPath, "utf-8"));
    tradingIdl.address = TRADING_PROGRAM_ID;
    const tradingProgram = new Program(tradingIdl, provider as any);

    const govIdlPath = "/Users/chanthawat/Developments/gridtokenx-platform-infa/gridtokenx-anchor/target/idl/governance.json";
    const govIdl = JSON.parse(fs.readFileSync(govIdlPath, "utf-8"));
    govIdl.address = GOVERNANCE_PROGRAM_ID;
    const govProgram = new Program(govIdl, provider as any);

    console.log("Initializing Governance...");
    const [poaConfigPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("poa_config")],
        govProgram.programId
    );
    
    try {
        await govProgram.methods.initializePoa()
            .accounts({
                poaConfig: poaConfigPda,
                authority: provider.wallet.publicKey,
                systemProgram: anchor.web3.SystemProgram.programId,
            } as any)
            .rpc();
        console.log("✅ Governance initialized");
    } catch (e: any) {
        if (e.message.includes("already in use")) {
            console.log("ℹ️ Governance already initialized");
        } else {
            console.error("❌ Failed to initialize governance:", e);
        }
    }

    console.log("Initializing Trading Market...");
    const [marketPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("market")],
        tradingProgram.programId
    );

    try {
        await tradingProgram.methods.initializeMarket(1) // Pass num_shards = 1
            .accounts({
                market: marketPda,
                authority: provider.wallet.publicKey,
                systemProgram: anchor.web3.SystemProgram.programId,
            } as any)
            .rpc();
        console.log("✅ Trading Market initialized");
    } catch (e: any) {
        if (e.message.includes("already in use")) {
            console.log("ℹ️ Trading Market already initialized");
        } else {
            console.error("❌ Failed to initialize market:", e);
        }
    }

    console.log("Initializing Zone 0...");
    const zoneId = 0;
    const zoneIdBuffer = Buffer.alloc(4);
    zoneIdBuffer.writeUInt32LE(zoneId, 0);
    const [zoneMarketPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("zone_market"), marketPda.toBuffer(), zoneIdBuffer],
        tradingProgram.programId
    );

    try {
        await tradingProgram.methods.initializeZoneMarket(zoneId, 1) // Pass zone_id 0 and num_shards = 1
            .accounts({
                market: marketPda,
                zoneMarket: zoneMarketPda,
                authority: provider.wallet.publicKey,
                systemProgram: anchor.web3.SystemProgram.programId,
            } as any)
            .rpc();
        console.log("✅ Zone 0 initialized");
    } catch (e: any) {
        console.error("DEBUG ERR:", e);
        if (e.message.includes("already in use")) {
            console.log("ℹ️ Zone 0 already initialized");
        } else {
            console.error("❌ Failed to initialize zone 0:", e);
        }
    }
}

main().catch(console.error);
