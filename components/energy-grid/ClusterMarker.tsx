'use client'

import { Marker } from 'react-map-gl/mapbox'
import type { ClusterFeature } from './useMeterClusters'

interface ClusterMarkerProps {
    cluster: ClusterFeature
    onClick: (clusterId: number, longitude: number, latitude: number) => void
}

/**
 * Renders a cluster marker showing the count of grouped nodes
 */
export function ClusterMarker({ cluster, onClick }: ClusterMarkerProps) {
    const { cluster_id, point_count, point_count_abbreviated } = cluster.properties
    const [longitude, latitude] = cluster.geometry.coordinates

    // Size based on point count
    const size = Math.min(60, 30 + (point_count / 10) * 5)

    return (
        <Marker
            longitude={longitude}
            latitude={latitude}
            anchor="center"
        >
            <div
                role="button"
                tabIndex={0}
                aria-label={`Cluster of ${point_count} meters. Click to zoom in and view individual meters.`}
                className="flex items-center justify-center rounded-full cursor-pointer transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-500"
                style={{
                    width: size,
                    height: size,
                    background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.9) 0%, rgba(99, 102, 241, 0.9) 100%)',
                    border: '3px solid rgba(255, 255, 255, 0.8)',
                    boxShadow: '0 4px 15px rgba(59, 130, 246, 0.5), 0 0 20px rgba(59, 130, 246, 0.3)',
                }}
                onClick={(e) => {
                    e.stopPropagation()
                    onClick(cluster_id, longitude, latitude)
                }}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        onClick(cluster_id, longitude, latitude)
                    }
                }}
                title={`${point_count} meters - Click to zoom`}
            >
                <span className="text-white font-bold text-sm drop-shadow-lg" aria-hidden="true">
                    {point_count_abbreviated}
                </span>
            </div>
        </Marker>
    )
}
