import { useMemo } from 'react'
import Supercluster from 'supercluster'
import type { EnergyNode } from './types'

export interface ClusterProperties {
    cluster: true
    cluster_id: number
    point_count: number
    point_count_abbreviated: string
}

export interface PointProperties {
    cluster: false
    nodeId: string
    node: EnergyNode
}

export type ClusterFeature = GeoJSON.Feature<GeoJSON.Point, ClusterProperties>
export type PointFeature = GeoJSON.Feature<GeoJSON.Point, PointProperties>
export type ClusterOrPoint = ClusterFeature | PointFeature

export interface UseMeterClustersOptions {
    nodes: EnergyNode[]
    zoom: number
    bounds?: [number, number, number, number]
    minZoom?: number
    maxZoom?: number
    radius?: number
}

export interface UseMeterClustersResult {
    clusters: ClusterOrPoint[]
    supercluster: Supercluster<PointProperties, ClusterProperties> | null
    getClusterExpansionZoom: (clusterId: number) => number
    getClusterLeaves: (clusterId: number, limit?: number) => PointFeature[]
}

/**
 * Hook to cluster energy nodes using Supercluster
 */
export function useMeterClusters(options: UseMeterClustersOptions): UseMeterClustersResult {
    const {
        nodes,
        zoom,
        bounds,
        minZoom = 0,
        maxZoom = 16,
        radius = 60,
    } = options

    const supercluster = useMemo(() => {
        const points: GeoJSON.Feature<GeoJSON.Point, PointProperties>[] = nodes.map((node) => ({
            type: 'Feature' as const,
            geometry: {
                type: 'Point' as const,
                coordinates: [node.longitude, node.latitude] as [number, number],
            },
            properties: {
                cluster: false as const,
                nodeId: node.id,
                node,
            },
        }))

        if (points.length === 0) return null

        const sc = new Supercluster<PointProperties, ClusterProperties>({
            radius,
            maxZoom,
            minZoom,
        })
        sc.load(points)
        return sc
    }, [nodes, radius, maxZoom, minZoom])

    const clusters = useMemo((): ClusterOrPoint[] => {
        if (!bounds || !supercluster) return []

        try {
            return supercluster.getClusters(bounds, Math.floor(zoom)) as ClusterOrPoint[]
        } catch (error) {
            console.error('Error getting clusters:', error)
            return []
        }
    }, [supercluster, bounds, zoom])

    const getClusterExpansionZoom = (clusterId: number): number => {
        if (supercluster) {
            try {
                return supercluster.getClusterExpansionZoom(clusterId)
            } catch {
                return zoom + 2
            }
        }
        return Math.min(maxZoom, zoom + 2)
    }

    const getClusterLeaves = (clusterId: number, limit = 10): PointFeature[] => {
        if (supercluster) {
            try {
                return supercluster.getLeaves(clusterId, limit) as PointFeature[]
            } catch {
                return []
            }
        }
        return []
    }

    return {
        clusters,
        supercluster,
        getClusterExpansionZoom,
        getClusterLeaves,
    }
}
