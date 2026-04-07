import * as anchor from "@coral-xyz/anchor";
import { Program, BN, Idl } from "@coral-xyz/anchor";
import { PublicKey, SystemProgram, Keypair, Transaction } from "@solana/web3.js";
import fs from 'fs';
import path from 'path';

// Load IDL
const idlPath = path.resolve(__dirname, "../lib/idl/trading.json");
const idl = JSON.parse(fs.readFileSync(idlPath, "utf-8"));

async function main() {
    // Configure client to use the local cluster.
    process.env.ANCHOR_PROVIDER_URL = "http://127.0.0.1:8899";
    // Check if wallet exists, otherwise generate one or warn
    const home = process.env.HOME || process.env.USERPROFILE;
    const walletPath = path.join(home!, ".config/solana/id.json");
    if (!fs.existsSync(walletPath)) {
        console.error("Wallet not found at", walletPath);
        return;
    }
    process.env.ANCHOR_WALLET = walletPath;

    const provider = anchor.AnchorProvider.env();
    anchor.setProvider(provider);

    const programId = new PublicKey("e7rS5sykWMXtciUEgUZ6xByqo6VqwNRNeAmQQn3Sbj2");
    const program = new Program(idl as Idl, provider) as any;
    // Wait, Program constructor: (idl, provider) OR (idl, programId, provider).
    // In newer Anchor, it takes (idl, provider) and reads address from IDL or provider?
    // Let's try (idl, provider) constructor is safer if IDL has metadata.address.
    // My IDL likely has generic address.
    // I'll stick to `new Program(idl, provider)` and override addressId if needed.
    // Actually, explicit is better: `new Program(idl, programId, provider)` is deprecated in some versions but works in others.
    // Let's use `new Program(idl, provider)`.

    console.log("Program initialized.");

    // Market PDA
    const [marketPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("market")],
        program.programId
    );
    console.log("Market PDA:", marketPda.toBase58());

    // 1. Setup Maker (Seller) - Use Provider Wallet
    const maker = provider.wallet;

    // 2. Setup Taker (Buyer) - New Keypair
    const taker = Keypair.generate();
    console.log("Requesting airdrop for Taker:", taker.publicKey.toBase58());
    const sig = await provider.connection.requestAirdrop(taker.publicKey, 10 * 1000000000);
    await provider.connection.confirmTransaction(sig);

    // 3. Create Sell Order (Maker)
    const sellOrderId = new BN(Date.now()); // Random ID
    const [sellOrderAddress] = PublicKey.findProgramAddressSync(
        [Buffer.from("order"), maker.publicKey.toBuffer(), sellOrderId.toArrayLike(Buffer, 'le', 8)],
        program.programId
    );

    console.log("Creating Sell Order (Maker)...");
    await program.methods.createSellOrder(
        sellOrderId,
        new BN(100_000000), // 100 kWh
        new BN(5_000000)    // 5 USDC/kWh
    ).accounts({
        market: marketPda,
        order: sellOrderAddress,
        ercCertificate: null as any,
        authority: maker.publicKey,
        systemProgram: SystemProgram.programId,
    }).rpc();
    console.log("Sell Order Created:", sellOrderAddress.toBase58());

    // 4. Create Buy Order (Taker) + Match (Atomic)
    const buyOrderId = new BN(Date.now() + 1);
    const [buyOrderAddress] = PublicKey.findProgramAddressSync(
        [Buffer.from("order"), taker.publicKey.toBuffer(), buyOrderId.toArrayLike(Buffer, 'le', 8)],
        program.programId
    );

    console.log("Creating Buy Order (Taker) & Matching...");

    // Build Instruction 1: Create Buy Order
    const createBuyIx = await program.methods.createBuyOrder(
        buyOrderId,
        new BN(100_000000),
        new BN(5_000000)
    ).accounts({
        market: marketPda,
        order: buyOrderAddress, // Taker is Buyer
        authority: taker.publicKey,
        systemProgram: SystemProgram.programId,
    }).instruction();

    // Build Instruction 2: Match Orders
    // P2P Match: I am Buyer (Taker) matching against Seller (Maker)
    const [tradeRecordAddress] = PublicKey.findProgramAddressSync(
        [Buffer.from("trade"), buyOrderAddress.toBuffer(), sellOrderAddress.toBuffer()],
        program.programId
    );

    const matchIx = await program.methods.matchOrders(
        new BN(100_000000) // Match Amount
    ).accounts({
        market: marketPda,
        buyOrder: buyOrderAddress,  // My Order
        sellOrder: sellOrderAddress, // Target Order
        tradeRecord: tradeRecordAddress,
        authority: taker.publicKey, // I am executing the match
        systemProgram: SystemProgram.programId,
    }).instruction();

    // Send Transaction
    const tx = new Transaction().add(createBuyIx).add(matchIx);

    // We need to sign with Taker keypair
    // Note: Provider wallet is implicitly a signer if used, but here Taker is the authority.
    // Provider wallet is NOT involved in Taker's tx (except maybe paying fee if we structured it that way, but here Taker pays).

    // anchor Provider.sendAndConfirm requires the *Provider's* wallet to sign as Payer by default.
    // If Taker is a different keypair, we must list it in signers.
    // But verify if Provider wallet is needed. 
    // Here `systemProgram.createAccount` etc needs Payer. 
    // The `authority` pays for the account creation in `createBuyOrder`. 
    // So Taker pays.

    await provider.sendAndConfirm(tx, [taker]);
    console.log("Buy Order Created & Matched!");

    // 5. Verify Status
    const sellOrder = await program.account.order.fetch(sellOrderAddress);
    const buyOrder = await program.account.order.fetch(buyOrderAddress);
    console.log("Program Account Keys:", Object.keys(program.account));
    const tradeRecord = await program.account.tradeRecord.fetch(tradeRecordAddress);
    console.log("Trade Record Object:", tradeRecord);

    console.log("Sell Order Status:", sellOrder.status);
    console.log("Buy Order Status:", buyOrder.status);
    console.log("Trade Record Amount:", tradeRecord.amount.toString());

    // Assume Status Enum: 0 = Open, 1 = Matched/Filled (Need to check IDL or values)
    if (JSON.stringify(sellOrder.status) === JSON.stringify(buyOrder.status)) {
        console.log("Status Sync Verified.");
    }
}

main().then(() => console.log("Done")).catch(e => {
    console.error(e);
    process.exit(1);
});
