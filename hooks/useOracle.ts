import { useEffect, useState, useMemo } from 'react'
import { Program, AnchorProvider, Idl, setProvider } from '@coral-xyz/anchor'
import { Connection, PublicKey } from '@solana/web3.js'
import { useAuth } from '@/contexts/AuthProvider'
import oracleIdl from '@/lib/idl/oracle.json'

// Hardcoded for localnet dev
const ORACLE_PROGRAM_ID = new PublicKey("EkcPD2YEXhpo1J73UX9EJNnjV2uuFS8KXMVLx9ybqnhU")
const SOLANA_RPC_URL = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "http://127.0.0.1:8899"

export interface MeterReadingEvent {
    meterId: string
    energyProduced: number
    energyConsumed: number
    timestamp: number
    submitter: string
    signature: string
}

export interface OracleState {
    active: boolean
    totalValidReadings: number
    averageReadingInterval: number
    lastQualityScore: number
    apiGateway: string
}

export function useOracle() {
    const { token } = useAuth() // Used to trigger re-connect if auth changes, though public data doesn't technically need it
    const [program, setProgram] = useState<Program<Idl> | null>(null)
    const [oracleState, setOracleState] = useState<OracleState | null>(null)
    const [recentReadings, setRecentReadings] = useState<MeterReadingEvent[]>([])
    const [isConnected, setIsConnected] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Initialize Anchor Program
    useEffect(() => {
        try {
            const connection = new Connection(SOLANA_RPC_URL, "confirmed")

            // Create a read-only provider (no wallet needed for reading)
            const provider = new AnchorProvider(
                connection,
                {
                    publicKey: PublicKey.default,
                    signTransaction: async (tx: any) => tx,
                    signAllTransactions: async (txs: any[]) => txs
                },
                { commitment: "confirmed" }
            )
            setProvider(provider)

            const prog = new Program(oracleIdl as Idl, provider)
            setProgram(prog)
            setIsConnected(true)
        } catch (err: any) {
            console.error("Failed to init Oracle program:", err)
            setError(err.message)
            setIsConnected(false)
        }
    }, [])

    // Fetch Oracle State & Subscribe to Events
    useEffect(() => {
        if (!program || !isConnected) return

        let eventListenerId: number | null = null;

        const fetchState = async () => {
            try {
                const [oracleDataPda] = PublicKey.findProgramAddressSync(
                    [Buffer.from("oracle_data")],
                    ORACLE_PROGRAM_ID
                )

                // @ts-ignore - Dynamic IDL types
                const account = await program.account.oracleData.fetch(oracleDataPda)

                setOracleState({
                    active: account.active === 1,
                    totalValidReadings: account.totalValidReadings.toNumber(),
                    averageReadingInterval: account.averageReadingInterval,
                    lastQualityScore: account.lastQualityScore,
                    apiGateway: account.apiGateway.toBase58()
                })
            } catch (err) {
                console.error("Error fetching Oracle state:", err)
            }
        }

        const subscribeEvents = async () => {
            // @ts-ignore
            eventListenerId = program.addEventListener("MeterReadingSubmitted", (event: any, slot: number, signature: string) => {
                const newReading: MeterReadingEvent = {
                    meterId: event.meterId,
                    energyProduced: event.energyProduced.toNumber(),
                    energyConsumed: event.energyConsumed.toNumber(),
                    timestamp: event.timestamp.toNumber() * 1000,
                    submitter: event.submitter.toBase58(),
                    signature: signature
                }

                setRecentReadings(prev => {
                    // Keep last 50 readings
                    const updated = [newReading, ...prev].slice(0, 50)
                    return updated
                })

                // Refresh state stats occasionally 
                if (Math.random() > 0.8) fetchState()
            })
        }

        fetchState()
        subscribeEvents()

        // Subscribe to Oracle Data Account Changes
        const [oracleDataPda] = PublicKey.findProgramAddressSync(
            [Buffer.from("oracle_data")],
            ORACLE_PROGRAM_ID
        )

        // @ts-ignore
        const connection = program.provider.connection
        const accountListenerId = connection.onAccountChange(
            oracleDataPda,
            () => {
                fetchState()
            },
            "confirmed"
        )

        return () => {
            if (eventListenerId !== null) {
                program.removeEventListener(eventListenerId)
            }
            connection.removeAccountChangeListener(accountListenerId)
        }
    }, [program, isConnected])

    return {
        isConnected,
        oracleState,
        recentReadings,
        error
    }
}
