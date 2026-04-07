import { useCallback, useMemo, useEffect } from 'react'
import { createApiClient } from '@/lib/api-client'
import { useAuth } from '@/contexts/AuthProvider'
import toast from 'react-hot-toast'
import { useContext } from 'react'
import { EnergyContext } from '@/contexts/EnergyProvider'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export function useSmartMeter() {
    const { token } = useAuth()
    const queryClient = useQueryClient()

    // Fetch all meter data
    const {
        data: meterData = { meters: [], readings: [], fetchedStats: null },
        isLoading: loading,
        isRefetching: refreshing,
        refetch: fetchData
    } = useQuery({
        queryKey: ['smartMeter', token],
        queryFn: async () => {
            if (!token) return { meters: [], readings: [], fetchedStats: null }

            const client = createApiClient(token)
            const [metersRes, readingsRes, statsRes] = await Promise.all([
                client.getMyMeters(),
                client.getMyReadings(50, 0),
                client.getMeterStats()
            ])

            if (metersRes.error) toast.error(`Meters: ${metersRes.error}`)
            if (readingsRes.error) toast.error(`Readings: ${readingsRes.error}`)

            return {
                meters: metersRes.data || [],
                readings: readingsRes.data || [],
                fetchedStats: statsRes.data || null
            }
        },
        enabled: !!token,
        refetchInterval: 30000, // Poll every 30 seconds
        staleTime: 10000,
    })

    const { meters, readings, fetchedStats } = meterData

    const { onMintFromMeter } = useContext(EnergyContext)

    // Mint tokens mutation
    const mintMutation = useMutation({
        mutationFn: async ({ readingId, kwh, meterId }: { readingId: string; kwh: number; meterId: string }) => {
            if (!token) throw new Error('No token')

            // Try On-Chain Minting first
            const success = await onMintFromMeter(readingId, kwh, meterId)
            if (success) {
                return { kwh_amount: kwh }
            }

            // Fallback to API if on-chain fails (or logic dictates)
            const client = createApiClient(token)
            const result = await client.mintReading(readingId)
            if (result.error) throw new Error(result.error)
            return result.data
        },
        onSuccess: (data) => {
            toast.success(`Successfully minted ${data?.kwh_amount} GRX tokens!`)
            queryClient.invalidateQueries({ queryKey: ['smartMeter'] })
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Failed to mint tokens')
        }
    })

    const handleMintTokens = (readingId: string, kwh: number, meterId: string) => {
        mintMutation.mutate({ readingId, kwh, meterId })
    }

    const copyToClipboard = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text)
            toast.success('Tx signature copied to clipboard!')
        } catch (err) {
            toast.error('Failed to copy')
        }
    }

    const lastRefreshed = useMemo(() => new Date(), [meterData])

    // WebSocket real-time updates
    useEffect(() => {
        const handleWsMessage = (event: Event) => {
            const customEvent = event as CustomEvent
            const message = customEvent.detail
            const meterEvents = [
                'MeterReadingReceived',
                'TokensMinted',
                'GridStatusUpdated'
            ]

            if (meterEvents.includes(message.type)) {
                queryClient.invalidateQueries({ queryKey: ['smartMeter'] })
            }
        }

        window.addEventListener('ws-message', handleWsMessage)
        return () => window.removeEventListener('ws-message', handleWsMessage)
    }, [queryClient])

    // Calculate Stats
    const stats = useMemo(() => {
        const totalProduced = readings.reduce((acc, r) => r.kwh > 0 ? acc + r.kwh : acc, 0)
        const totalConsumed = readings.reduce((acc, r) => r.kwh < 0 ? acc + Math.abs(r.kwh) : acc, 0)
        const netEnergy = totalProduced - totalConsumed

        const mintedReadings = readings.filter(r => r.minted)
        const pendingReadings = readings.filter(r => !r.minted && r.kwh > 0)
        const totalMinted = mintedReadings.reduce((acc, r) => acc + r.kwh, 0)
        const pendingToMint = pendingReadings.reduce((acc, r) => acc + r.kwh, 0)

        const lastUpdate = readings.length > 0 ? new Date(readings[0].timestamp) : null

        return {
            totalGenerated: fetchedStats?.total_produced ?? totalProduced,
            totalConsumed: fetchedStats?.total_consumed ?? totalConsumed,
            netEnergy: fetchedStats ? (fetchedStats.total_produced - fetchedStats.total_consumed) : netEnergy,
            totalMinted: fetchedStats?.total_minted ?? totalMinted,
            pendingToMint: fetchedStats?.pending_mint ?? pendingToMint,
            mintedCount: fetchedStats?.total_minted_count ?? mintedReadings.length,
            pendingCount: fetchedStats?.pending_mint_count ?? pendingReadings.length,
            lastUpdate
        }
    }, [readings, fetchedStats])

    // On-Chain Data Fetching
    // We can fetch the MeterAccount from Registry to compare with DB
    /*
    useEffect(() => {
        if (registryProgram && meters.length > 0) {
            // Fetch meter account
            // const meterId = meters[0].id
            // Derive PDA...
            // registryProgram.account.meterAccount.fetch(pda).then(...)
        }
    }, [registryProgram, meters])
    */

    return {
        meters,
        readings,
        loading,
        refreshing: refreshing && !loading, // Show refreshing only if not initial loading
        mintingReadingId: mintMutation.isPending ? (mintMutation.variables as unknown as { readingId: string }).readingId : null,
        fetchData: () => fetchData(),
        handleMintTokens,
        copyToClipboard,
        lastRefreshed,
        stats
    }
}
