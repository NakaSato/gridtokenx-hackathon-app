'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import type { ClusteringData, ProfileArchetypeId } from '@/hooks/useEnergyProfile'
import { PROFILE_ARCHETYPES } from '@/hooks/useEnergyProfile'

interface ClusteringVisualizationProps {
    data?: ClusteringData
    isLoading?: boolean
    className?: string
}

export function ClusteringVisualization({ data, isLoading, className }: ClusteringVisualizationProps) {
    // Scale factors for visualization (0-1 to pixel coordinates)
    const width = 400
    const height = 300
    const padding = 40

    const scaleX = (x: number) => padding + x * (width - 2 * padding)
    const scaleY = (y: number) => height - padding - y * (height - 2 * padding) // Invert Y

    const clusterPositions = useMemo(() => {
        if (!data) return []
        return data.clusterCenters.map(center => ({
            ...center,
            cx: scaleX(center.x),
            cy: scaleY(center.y),
        }))
    }, [data])

    const userPosition = useMemo(() => {
        if (!data) return null
        return {
            cx: scaleX(data.userPosition.x),
            cy: scaleY(data.userPosition.y),
        }
    }, [data])

    if (isLoading) {
        return (
            <Card className={className}>
                <CardHeader className="pb-2">
                    <Skeleton className="h-5 w-48" />
                    <Skeleton className="h-4 w-64" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-[300px] w-full" />
                </CardContent>
            </Card>
        )
    }

    if (!data) {
        return (
            <Card className={className}>
                <CardContent className="flex items-center justify-center h-[300px] text-muted-foreground">
                    No clustering data available
                </CardContent>
            </Card>
        )
    }

    const nearestArchetype = PROFILE_ARCHETYPES.find(a => a.id === data.nearestCluster)

    return (
        <Card className={className}>
            <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                    <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: nearestArchetype?.color }}
                    />
                    Profile Clustering Analysis
                </CardTitle>
                <CardDescription>
                    k-Means clustering based on usage patterns
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="relative">
                    <svg
                        viewBox={`0 0 ${width} ${height}`}
                        className="w-full h-auto"
                        style={{ maxHeight: '300px' }}
                    >
                        {/* Background grid */}
                        <defs>
                            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                                <path
                                    d="M 40 0 L 0 0 0 40"
                                    fill="none"
                                    stroke="hsl(var(--border))"
                                    strokeWidth="0.5"
                                    opacity="0.3"
                                />
                            </pattern>
                        </defs>
                        <rect width={width} height={height} fill="url(#grid)" rx="8" />

                        {/* Axis labels */}
                        <text
                            x={width / 2}
                            y={height - 8}
                            textAnchor="middle"
                            className="fill-muted-foreground text-[10px]"
                        >
                            Peak-to-Average Ratio →
                        </text>
                        <text
                            x={12}
                            y={height / 2}
                            textAnchor="middle"
                            className="fill-muted-foreground text-[10px]"
                            transform={`rotate(-90, 12, ${height / 2})`}
                        >
                            Daytime Ratio →
                        </text>

                        {/* Connection lines to nearest cluster */}
                        {userPosition && (
                            <line
                                x1={userPosition.cx}
                                y1={userPosition.cy}
                                x2={scaleX(data.clusterCenters.find(c => c.id === data.nearestCluster)?.x || 0)}
                                y2={scaleY(data.clusterCenters.find(c => c.id === data.nearestCluster)?.y || 0)}
                                stroke={nearestArchetype?.color}
                                strokeWidth="2"
                                strokeDasharray="5,5"
                                opacity="0.5"
                            />
                        )}

                        {/* Cluster centers */}
                        {clusterPositions.map((cluster) => (
                            <g key={cluster.id}>
                                {/* Cluster area (circle) */}
                                <circle
                                    cx={cluster.cx}
                                    cy={cluster.cy}
                                    r={35}
                                    fill={cluster.color}
                                    opacity={cluster.id === data.nearestCluster ? 0.2 : 0.1}
                                    className="transition-opacity duration-300"
                                />
                                {/* Cluster center point */}
                                <circle
                                    cx={cluster.cx}
                                    cy={cluster.cy}
                                    r={8}
                                    fill={cluster.color}
                                    stroke={cluster.id === data.nearestCluster ? 'white' : 'transparent'}
                                    strokeWidth="2"
                                    className="transition-all duration-300"
                                />
                                {/* Cluster label */}
                                <text
                                    x={cluster.cx}
                                    y={cluster.cy + 25}
                                    textAnchor="middle"
                                    className="fill-foreground text-[9px] font-medium"
                                >
                                    {cluster.name}
                                </text>
                            </g>
                        ))}

                        {/* User position */}
                        {userPosition && (
                            <g>
                                {/* User point glow */}
                                <circle
                                    cx={userPosition.cx}
                                    cy={userPosition.cy}
                                    r={16}
                                    fill="hsl(var(--primary))"
                                    opacity="0.3"
                                    className="animate-pulse"
                                />
                                {/* User point */}
                                <circle
                                    cx={userPosition.cx}
                                    cy={userPosition.cy}
                                    r={10}
                                    fill="hsl(var(--primary))"
                                    stroke="white"
                                    strokeWidth="3"
                                />
                                <text
                                    x={userPosition.cx}
                                    y={userPosition.cy + 4}
                                    textAnchor="middle"
                                    className="fill-white text-[8px] font-bold"
                                >
                                    YOU
                                </text>
                            </g>
                        )}
                    </svg>

                    {/* Legend */}
                    <div className="mt-4 flex flex-wrap gap-2 justify-center">
                        {PROFILE_ARCHETYPES.map((arch) => (
                            <Badge
                                key={arch.id}
                                variant="outline"
                                className={cn(
                                    "text-xs transition-all",
                                    data.nearestCluster === arch.id && "ring-2 ring-offset-2"
                                )}
                                style={{
                                    borderColor: arch.color,
                                    color: arch.color,
                                    ...(data.nearestCluster === arch.id && { ringColor: arch.color })
                                }}
                            >
                                <div
                                    className="w-2 h-2 rounded-full mr-1"
                                    style={{ backgroundColor: arch.color }}
                                />
                                {arch.name}
                            </Badge>
                        ))}
                    </div>

                    {/* Distance indicator */}
                    <div className="mt-3 text-center">
                        <p className="text-xs text-muted-foreground">
                            Profile Match Confidence:{' '}
                            <span className="font-medium text-foreground">
                                {Math.max(0, (1 - data.distanceToCluster) * 100).toFixed(0)}%
                            </span>
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
