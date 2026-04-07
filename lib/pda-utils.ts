import { PublicKey } from '@solana/web3.js'
import { BN } from '@coral-xyz/anchor'

export const getPoolPDA = (poolName: string, programId: PublicKey) => {
    return PublicKey.findProgramAddressSync(
        [Buffer.from('pool'), Buffer.from(poolName)],
        programId
    )[0]
}

export const getCustodyPDA = (poolPDA: PublicKey, mint: PublicKey, programId: PublicKey) => {
    return PublicKey.findProgramAddressSync(
        [Buffer.from('custody'), poolPDA.toBuffer(), mint.toBuffer()],
        programId
    )[0]
}

export const getUserPDA = (owner: PublicKey, programId: PublicKey) => {
    return PublicKey.findProgramAddressSync(
        [Buffer.from('user'), owner.toBuffer()],
        programId
    )[0]
}

export const getOptionDetailPDA = (
    owner: PublicKey,
    index: number | BN,
    poolPDA: PublicKey,
    custodyPDA: PublicKey,
    programId: PublicKey
) => {
    const indexBN = typeof index === 'number' ? new BN(index) : index
    return PublicKey.findProgramAddressSync(
        [
            Buffer.from('option'),
            owner.toBuffer(),
            indexBN.toArrayLike(Buffer, 'le', 8),
            poolPDA.toBuffer(),
            custodyPDA.toBuffer(),
        ],
        programId
    )[0]
}

export const getCustodyTokenAccountPDA = (poolPDA: PublicKey, mint: PublicKey, programId: PublicKey) => {
    return PublicKey.findProgramAddressSync(
        [
            Buffer.from('custody_token_account'),
            poolPDA.toBuffer(),
            mint.toBuffer(),
        ],
        programId
    )[0]
}

export const getContractPDA = (programId: PublicKey) => {
    return PublicKey.findProgramAddressSync(
        [Buffer.from('contract')],
        programId
    )[0]
}

export const getTransferAuthorityPDA = (programId: PublicKey) => {
    return PublicKey.findProgramAddressSync(
        [Buffer.from('transfer_authority')],
        programId
    )[0]
}

export const getLpTokenMintPDA = (poolName: string, programId: PublicKey) => {
    return PublicKey.findProgramAddressSync(
        [Buffer.from('lp_token_mint'), Buffer.from(poolName)],
        programId
    )[0]
}

export const getPrivateBalancePDA = (owner: PublicKey, mint: PublicKey, programId: PublicKey) => {
    return PublicKey.findProgramAddressSync(
        [Buffer.from('private_balance'), owner.toBuffer(), mint.toBuffer()],
        programId
    )[0]
}

export const getNullifierSetPDA = (mint: PublicKey, programId: PublicKey) => {
    return PublicKey.findProgramAddressSync(
        [Buffer.from('nullifier_set'), mint.toBuffer()],
        programId
    )[0]
}

export const getMintAuthorityPDA = (mint: PublicKey, programId: PublicKey) => {
    return PublicKey.findProgramAddressSync(
        [Buffer.from('mint_authority'), mint.toBuffer()],
        programId
    )[0]
}
