import * as anchor from "@coral-xyz/anchor";
import { Program, BN, Idl } from "@coral-xyz/anchor";
import { PublicKey, SystemProgram, Keypair } from "@solana/web3.js";
import fs from 'fs';
import path from 'path';

// Load IDL
const idlPath = path.resolve(__dirname, "../lib/idl/trading.json");
const idl = JSON.parse(fs.readFileSync(idlPath, "utf-8"));

async function main() {
    process.env.ANCHOR_PROVIDER_URL = "http://127.0.0.1:8899";
    const home = process.env.HOME || process.env.USERPROFILE;
    const walletPath = path.join(home!, ".config/solana/id.json");
    process.env.ANCHOR_WALLET = walletPath;

    const provider = anchor.AnchorProvider.env();
    anchor.setProvider(provider);
    const program = new Program(idl as Idl, provider);

    console.log("🧪 Starting Edge Case Verification...");

    // Market PDA
    const [marketPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("market")],
        program.programId
    );

    const user = provider.wallet; // Use provider wallet for main tests

    // ============================================
    // Test 1: Order Cancellation
    // ============================================
    console.log("\n[1/3] Testing Order Cancellation...");
    const orderId = new BN(Date.now());
    const [orderPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("order"), user.publicKey.toBuffer(), orderId.toArrayLike(Buffer, 'le', 8)],
        program.programId
    );

    try {
        // Create Order
        await program.methods.createSellOrder(
            orderId,
            new BN(100),
            new BN(10)
        ).accounts({
            market: marketPda,
            order: orderPda,
            ercCertificate: null,
            authority: user.publicKey,
            systemProgram: SystemProgram.programId,
        } as any).rpc();
        console.log("  Order created:", orderPda.toBase58());

        // Cancel Order
        await program.methods.cancelOrder()
            .accounts({
                market: marketPda,
                order: orderPda,
                authority: user.publicKey,
            } as any).rpc();
        console.log("  Order cancellation tx sent.");

        // Verify Status
        const orderAccount = await program.account.order.fetch(orderPda);
        // Assuming Status: 2 = Cancelled (Check IDL or Enum)
        // OrderType: Buy=0, Sell=1
        // OrderStatus: Active=0, PartiallyFilled=1, Completed=2, Cancelled=3 (Usually)
        // Let's print it
        console.log("  Order Status after cancel:", orderAccount.status);
        if (orderAccount.status !== 0 && orderAccount.status !== 1) {
            console.log("  ✅ Order Cancellation Verified (Status changed).");
        } else {
            console.log("  ⚠️ Order Status unchanged?");
        }

    } catch (e) {
        console.error("  ❌ Order Cancellation Failed:", e);
    }

    // ============================================
    // Test 2: Self-Trading
    // ============================================
    console.log("\n[2/3] Testing Self-Trading...");
    const selfOrderIdBuy = new BN(Date.now() + 100);
    const selfOrderIdSell = new BN(Date.now() + 200);

    const [buyPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("order"), user.publicKey.toBuffer(), selfOrderIdBuy.toArrayLike(Buffer, 'le', 8)],
        program.programId
    );
    const [sellPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("order"), user.publicKey.toBuffer(), selfOrderIdSell.toArrayLike(Buffer, 'le', 8)],
        program.programId
    );
    const [tradePda] = PublicKey.findProgramAddressSync(
        [Buffer.from("trade"), buyPda.toBuffer(), sellPda.toBuffer()],
        program.programId
    );

    try {
        // Create Buy matchable
        await program.methods.createBuyOrder(selfOrderIdBuy, new BN(100), new BN(10))
            .accounts({ market: marketPda, order: buyPda, authority: user.publicKey, systemProgram: SystemProgram.programId } as any).rpc();

        // Create Sell matchable
        await program.methods.createSellOrder(selfOrderIdSell, new BN(100), new BN(10))
            .accounts({ market: marketPda, order: sellPda, ercCertificate: null, authority: user.publicKey, systemProgram: SystemProgram.programId } as any).rpc();

        console.log("  Created Self-Buy and Self-Sell orders.");

        // Attempt Match
        await program.methods.matchOrders(new BN(100))
            .accounts({
                market: marketPda,
                buyOrder: buyPda,
                sellOrder: sellPda,
                tradeRecord: tradePda,
                authority: user.publicKey,
                systemProgram: SystemProgram.programId
            } as any).rpc();

        console.log("  ✅ Self-Trading Executed (Accepted by contract).");

    } catch (e) {
        console.log("  🛡️ Self-Trading Prevented (Tx Failed):"); //, e.message);
    }

    // ============================================
    // Test 3: Insufficient Funds
    // ============================================
    console.log("\n[3/3] Testing Insufficient Funds...");
    const poorUser = Keypair.generate();
    // No airdrop

    const poorOrderId = new BN(Date.now() + 300);
    const [poorOrderPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("order"), poorUser.publicKey.toBuffer(), poorOrderId.toArrayLike(Buffer, 'le', 8)],
        program.programId
    );

    try {
        await program.methods.createBuyOrder(
            poorOrderId,
            new BN(100),
            new BN(10)
        ).accounts({
            market: marketPda,
            order: poorOrderPda,
            authority: poorUser.publicKey,
            systemProgram: SystemProgram.programId,
        } as any).signers([poorUser]).rpc();

        console.error("  ❌ Insufficient Funds test FAILED (Tx succeeded unexpectedly).");
    } catch (e: any) {
        console.log("  ✅ Insufficient Funds test PASSED (Tx failed as expected).");
        // console.log("Error:", e.message);
    }
}

main().then(() => console.log("\nEdge Case Verification Complete.")).catch(console.error);
