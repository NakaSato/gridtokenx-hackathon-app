import * as anchor from "@coral-xyz/anchor";
const { Program } = anchor;
import BN from 'bn.js';
import type { Idl } from "@coral-xyz/anchor";
import { PublicKey, SystemProgram, Keypair } from "@solana/web3.js";
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load IDL
const idlPath = path.resolve(__dirname, "../lib/idl/trading.json");
const idl = JSON.parse(fs.readFileSync(idlPath, "utf-8"));

const NUM_USERS = 5;
const NUM_ORDERS = 20;

async function main() {
    process.env.ANCHOR_PROVIDER_URL = "http://127.0.0.1:8899";
    const home = process.env.HOME || process.env.USERPROFILE;
    const walletPath = path.join(home!, ".config/solana/id.json");
    process.env.ANCHOR_WALLET = walletPath;

    const provider = anchor.AnchorProvider.env();
    anchor.setProvider(provider);

    const TRADING_PROGRAM_ID = "69dGpKu9a8EZiZ7orgfTH6CoGj9DeQHHkHBF2exSr8na";
    (idl as any).address = TRADING_PROGRAM_ID;
    const program = new Program(idl as Idl, provider as any);
    console.log("🔥 Starting Stress Test on OrderBook...");

    // Market PDAs
    const [marketPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("market")],
        program.programId
    );

    const GOVERNANCE_PROGRAM_ID = new PublicKey("DamT9e1VqbA5nSyFZHExKwQu6qs4L5FW6dirWCK8YLd4");
    const [governanceConfigPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("poa_config")],
        GOVERNANCE_PROGRAM_ID
    );

    const zoneId = 0;
    const zoneIdBuffer = Buffer.alloc(4);
    zoneIdBuffer.writeUInt32LE(zoneId, 0);
    const [zoneMarketPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("zone_market"), marketPda.toBuffer(), zoneIdBuffer],
        program.programId
    );

    console.log(`Market PDA: ${marketPda.toBase58()}`);
    console.log(`Zone Market PDA: ${zoneMarketPda.toBase58()}`);
    console.log(`Governance Config PDA: ${governanceConfigPda.toBase58()}`);

    // 1. Setup Users
    console.log(`Creating ${NUM_USERS} users...`);
    const users: Keypair[] = [];
    for (let i = 0; i < NUM_USERS; i++) {
        const user = Keypair.generate();
        users.push(user);
        // Airdrop
        try {
            const sig = await provider.connection.requestAirdrop(user.publicKey, 1 * 1000000000);
            await provider.connection.confirmTransaction(sig);
        } catch (e) {
            console.warn(`Airdrop failed for user ${i}, might have enough SOL or rate limited.`);
        }
    }
    console.log("Users ready.");

    let successCount = 0;
    let failCount = 0;
    let totalLatency = 0;
    const orderCount = 20;

    // 2. Loop Orders
    console.log(`🚀 Submitting ${orderCount} orders...`);

    for (let i = 0; i < orderCount; i++) {
        const user = users[Math.floor(Math.random() * users.length)];
        const isBuy = Math.random() > 0.5;
        const orderId = new BN(Date.now() + i);
        const startTime = Date.now();

        try {
            const [orderPda] = PublicKey.findProgramAddressSync(
                [Buffer.from("order"), user.publicKey.toBuffer(), orderId.toArrayLike(Buffer, 'le', 8)],
                program.programId
            );

            if (isBuy) {
                await program.methods.createBuyOrder(
                    orderId,
                    new BN(100_000000), // 100 kWh
                    new BN(5_000000)    // 5 USDC/kWh
                ).accounts({
                    market: marketPda,
                    zoneMarket: zoneMarketPda,
                    order: orderPda,
                    authority: user.publicKey,
                    systemProgram: SystemProgram.programId,
                    governanceConfig: governanceConfigPda,
                } as any).signers([user]).rpc();

            } else {
                await program.methods.createSellOrder(
                    orderId,
                    new BN(100_000000),
                    new BN(5_000000)
                ).accounts({
                    market: marketPda,
                    zoneMarket: zoneMarketPda,
                    order: orderPda,
                    ercCertificate: null, // Optional
                    authority: user.publicKey,
                    systemProgram: SystemProgram.programId,
                    governanceConfig: governanceConfigPda,
                } as any).signers([user]).rpc();
            }

            const latency = Date.now() - startTime;
            totalLatency += latency;
            successCount++;
            process.stdout.write("."); // Progress dot
        } catch (e) {
            failCount++;
            process.stdout.write("x");
            console.error(e);
        }

        // Small delay to avoid overly aggressive rate limiting on local validator
        await new Promise(r => setTimeout(r, 100));
    }

    console.log("\n\n📊 Stress Test Results:");
    console.log(`Total Orders: ${orderCount}`);
    console.log(`✅ Success: ${successCount}`);
    console.log(`❌ Failed: ${failCount}`);

    console.log(`⏱️ Avg Confirmation Time: ${successCount > 0 ? (totalLatency / successCount).toFixed(2) : 0} ms`);

    if (failCount > 0) process.exit(1);
}

main().catch(console.error);
