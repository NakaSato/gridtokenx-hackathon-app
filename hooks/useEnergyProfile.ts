'use client'

import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/contexts/AuthProvider'
import { createApiClient } from '@/lib/api-client'

// Profile archetype definitions
export const PROFILE_ARCHETYPES = [
    { id: 'solar_enthusiast', name: 'Solar Enthusiast', color: '#f59e0b', description: 'High daytime export, low grid dependency' },
    { id: 'night_owl', name: 'Night Owl', color: '#6366f1', description: 'Peak consumption during evening/night hours' },
    { id: 'energy_saver', name: 'Energy Saver', color: '#22c55e', description: 'Consistent low consumption, minimal peaks' },
    { id: 'home_worker', name: 'Home Worker', color: '#3b82f6', description: 'Steady daytime consumption pattern' },
    { id: 'industrial', name: 'Industrial User', color: '#ef4444', description: 'High reactive power, consistent baseload' },
] as const

export type ProfileArchetypeId = typeof PROFILE_ARCHETYPES[number]['id']

export interface HourlyDataPoint {
    hour: string
    consumption: number
    isDaytime: boolean
}

export interface ProfileCharacteristics {
    peakToAvgRatio: number
    baseload: number
    daytimeRatio: number
    peakHour: string
    avgDailyKwh: number
    totalKwh: number
    nighttimeRatio: number
}

export interface DataQuality {
    intervalResolution: string
    dataCompleteness: number
    lastUpdate: string | null
    readingCount: number
    meterCount: number
}

export interface ClusteringData {
    userPosition: { x: number; y: number }
    clusterCenters: Array<{
        id: ProfileArchetypeId
        x: number
        y: number
        color: string
        name: string
    }>
    nearestCluster: ProfileArchetypeId
    distanceToCluster: number
}

export interface EnergyProfileData {
    meters: any[]
    readings: any[]
    analytics: any
    totalKwh: number
    hourlyDistribution: HourlyDataPoint[]
    characteristics: ProfileCharacteristics
    archetype: typeof PROFILE_ARCHETYPES[number]
    dataQuality: DataQuality
    clustering: ClusteringData
    weeklyPattern: Array<{ day: string; consumption: number; peak: number }>
    recommendations: string[]
}

/**
 * Performs k-means style clustering to determine user's profile archetype
 * Based on peak-to-avg ratio (x-axis) and daytime ratio (y-axis)
 */
function performClustering(characteristics: ProfileCharacteristics): ClusteringData {
    // Try WASM version first
    try {
        const { isWasmLoaded, performClustering: wasmClustering } = require('@/lib/wasm-bridge')
        if (isWasmLoaded()) {
            const result = wasmClustering({
                peak_to_avg_ratio: characteristics.peakToAvgRatio,
                daytime_ratio: characteristics.daytimeRatio
            })
            if (result) {
                return {
                    userPosition: result.user_position,
                    clusterCenters: result.cluster_centers,
                    nearestCluster: result.nearest_cluster as ProfileArchetypeId,
                    distanceToCluster: result.distance_to_cluster,
                }
            }
        }
    } catch (e) {
        console.warn('[Clustering] WASM clustering failed, falling back to JS:', e)
    }

    // Normalize characteristics for clustering
    const userX = Math.min(characteristics.peakToAvgRatio / 5, 1) // Normalize to 0-1
    const userY = characteristics.daytimeRatio

    // Define cluster centers for each archetype
    // x = peak-to-avg ratio (0-1 normalized), y = daytime ratio (0-1)
    const clusterCenters = [
        { id: 'solar_enthusiast' as ProfileArchetypeId, x: 0.6, y: 0.8, color: '#f59e0b', name: 'Solar Enthusiast' },
        { id: 'night_owl' as ProfileArchetypeId, x: 0.5, y: 0.25, color: '#6366f1', name: 'Night Owl' },
        { id: 'energy_saver' as ProfileArchetypeId, x: 0.2, y: 0.55, color: '#22c55e', name: 'Energy Saver' },
        { id: 'home_worker' as ProfileArchetypeId, x: 0.35, y: 0.7, color: '#3b82f6', name: 'Home Worker' },
        { id: 'industrial' as ProfileArchetypeId, x: 0.8, y: 0.6, color: '#ef4444', name: 'Industrial User' },
    ]

    // Calculate Euclidean distance to each cluster
    let nearestCluster = clusterCenters[0]
    let minDistance = Infinity

    clusterCenters.forEach(center => {
        const distance = Math.sqrt(
            Math.pow(userX - center.x, 2) + Math.pow(userY - center.y, 2)
        )
        if (distance < minDistance) {
            minDistance = distance
            nearestCluster = center
        }
    })

    return {
        userPosition: { x: userX, y: userY },
        clusterCenters,
        nearestCluster: nearestCluster.id,
        distanceToCluster: minDistance,
    }
}

/**
 * Generate recommendations based on profile characteristics
 */
function generateRecommendations(
    characteristics: ProfileCharacteristics,
    archetypeId: ProfileArchetypeId
): string[] {
    const recommendations: string[] = []

    // Based on peak-to-avg ratio
    if (characteristics.peakToAvgRatio > 2.5) {
        recommendations.push('Consider spreading energy usage throughout the day to reduce peak demand charges.')
    }

    // Based on baseload
    if (characteristics.baseload > 1.5) {
        recommendations.push('Your standby power consumption is high. Check for devices that can be turned off when not in use.')
    }

    // Based on daytime ratio
    if (characteristics.daytimeRatio < 0.3) {
        recommendations.push('Most of your consumption is at night. Consider shifting some usage to daytime for potential ToU savings.')
    }

    // Archetype-specific recommendations
    switch (archetypeId) {
        case 'solar_enthusiast':
            recommendations.push('Your profile is ideal for maximizing solar self-consumption. Consider adding battery storage.')
            break
        case 'night_owl':
            recommendations.push('Look into night-time electricity tariffs which may offer lower rates.')
            break
        case 'energy_saver':
            recommendations.push('Great job! Your efficient usage pattern minimizes energy costs.')
            break
        case 'home_worker':
            recommendations.push('Consider using smart plugs to monitor and optimize home office equipment.')
            break
        case 'industrial':
            recommendations.push('Monitor your reactive power to optimize power factor and avoid utility penalties.')
            break
    }

    if (recommendations.length === 0) {
        recommendations.push('Your energy profile looks balanced. Keep monitoring for optimization opportunities.')
    }

    return recommendations
}

/**
 * Hook for fetching and analyzing energy profile data
 */
export function useEnergyProfile() {
    const { token, isAuthenticated } = useAuth()
    const apiClient = createApiClient(token || '')

    return useQuery<EnergyProfileData>({
        queryKey: ['energy-profile', token],
        queryFn: async () => {
            if (!token) throw new Error('Not authenticated')

            // Fetch meters
            const metersResponse = await apiClient.getMyMeters()
            const meters = metersResponse.data || []

            // Fetch readings
            const readingsResponse = await apiClient.getMyReadings(200, 0)
            const readings = readingsResponse.data || []

            // Fetch user analytics
            const analyticsResponse = await apiClient.getUserAnalytics({ timeframe: '30d' })
            const analytics = analyticsResponse.data

            // Generate hourly distribution from readings
            let hourlyDistribution: HourlyDataPoint[] = []
            let totalKwh = 0
            let daytimeConsumption = 0
            let nighttimeConsumption = 0

            // Try WASM version first
            try {
                const { isWasmLoaded, aggregateReadings: wasmAggregate } = require('@/lib/wasm-bridge')
                if (isWasmLoaded()) {
                    const result = wasmAggregate(readings)
                    if (result) {
                        hourlyDistribution = result.hourly_distribution.map((h: any) => ({
                            hour: h.hour,
                            consumption: h.consumption,
                            isDaytime: h.is_daytime
                        }))
                        totalKwh = result.total_kwh
                        daytimeConsumption = result.daytime_consumption
                        nighttimeConsumption = result.nighttime_consumption
                    }
                }
            } catch (e) {
                console.warn('[Aggregation] WASM aggregation failed, falling back to JS:', e)
            }

            // Fallback JS logic if WASM failed or not loaded
            if (hourlyDistribution.length === 0) {
                totalKwh = readings.reduce((sum: number, r: any) =>
                    sum + parseFloat(r.kwh || r.kwh_amount || '0'), 0)

                const hourlyBuckets: { [key: number]: number[] } = {}
                for (let i = 0; i < 24; i++) hourlyBuckets[i] = []

                readings.forEach((r: any) => {
                    const date = new Date(r.timestamp || r.reading_timestamp || r.created_at || new Date())
                    const hour = date.getHours()
                    hourlyBuckets[hour].push(parseFloat(r.kwh || r.kwh_amount || '0'))
                })

                hourlyDistribution = Array.from({ length: 24 }, (_, hour) => {
                    const bucket = hourlyBuckets[hour]
                    const avgKwh = bucket.length > 0
                        ? bucket.reduce((a, b) => a + b, 0) / bucket.length
                        : Math.random() * 2 + 0.5
                    return {
                        hour: `${hour.toString().padStart(2, '0')}:00`,
                        consumption: avgKwh,
                        isDaytime: hour >= 6 && hour < 18,
                    }
                })

                daytimeConsumption = hourlyDistribution
                    .filter(h => h.isDaytime)
                    .reduce((sum, h) => sum + h.consumption, 0)
                nighttimeConsumption = hourlyDistribution
                    .filter(h => !h.isDaytime)
                    .reduce((sum, h) => sum + h.consumption, 0)
            }

            const totalConsumption = daytimeConsumption + nighttimeConsumption
            const peakHour = hourlyDistribution.reduce((max, h) =>
                h.consumption > max.consumption ? h : max, hourlyDistribution[0])
            const avgHourlyConsumption = totalConsumption / 24
            const baseload = Math.min(...hourlyDistribution.map(h => h.consumption))
            const peakToAvgRatio = avgHourlyConsumption > 0 ? peakHour.consumption / avgHourlyConsumption : 1

            const characteristics: ProfileCharacteristics = {
                peakToAvgRatio,
                baseload,
                daytimeRatio: totalConsumption > 0 ? daytimeConsumption / totalConsumption : 0.5,
                nighttimeRatio: totalConsumption > 0 ? nighttimeConsumption / totalConsumption : 0.5,
                peakHour: peakHour.hour,
                avgDailyKwh: totalKwh / Math.max(1, readings.length / 24),
                totalKwh,
            }

            // Perform clustering
            const clustering = performClustering(characteristics)

            // Find archetype from clustering result
            const archetype = PROFILE_ARCHETYPES.find(a => a.id === clustering.nearestCluster) || PROFILE_ARCHETYPES[2]

            // Generate weekly pattern
            const weeklyPattern = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => {
                // Derive from readings or generate sample
                const dayReadings = readings.filter((r: any) => {
                    const d = new Date(r.timestamp || r.reading_timestamp || r.created_at || new Date())
                    return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()] === day
                })
                return {
                    day,
                    consumption: dayReadings.length > 0
                        ? dayReadings.reduce((sum: number, r: any) => sum + parseFloat(r.kwh || r.kwh_amount || '0'), 0)
                        : 30 + Math.random() * 30,
                    peak: dayReadings.length > 0
                        ? Math.max(...dayReadings.map((r: any) => parseFloat(r.kwh || r.kwh_amount || '0')))
                        : 5 + Math.random() * 15,
                }
            })

            // Generate recommendations
            const recommendations = generateRecommendations(characteristics, clustering.nearestCluster)

            return {
                meters,
                readings,
                analytics,
                totalKwh,
                hourlyDistribution,
                characteristics,
                archetype,
                dataQuality: {
                    intervalResolution: '15 min',
                    dataCompleteness: Math.min(100, (readings.length / 365) * 100),
                    lastUpdate: readings[0]?.timestamp || null,
                    readingCount: readings.length,
                    meterCount: meters.length,
                },
                clustering,
                weeklyPattern,
                recommendations,
            }
        },
        enabled: !!token && isAuthenticated,
        staleTime: 60000,
        refetchInterval: 120000,
    })
}
