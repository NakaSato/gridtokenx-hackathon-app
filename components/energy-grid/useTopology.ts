import { useState, useCallback, useRef } from 'react'
import type { EnergyNode, EnergyTransfer } from './types'

export interface PathResult {
    nodeIds: string[]
    distance: number
}

export interface TopologyInfo {
    nodeCount: number
    lineCount: number
    totalLoss: number
}

interface UseTopologyResult {
    isLoaded: boolean
    loadNetwork: (nodes: EnergyNode[], transfers: EnergyTransfer[]) => void
    findPath: (fromId: string, toId: string) => PathResult | null
    getInfo: () => TopologyInfo
}

// Simple Dijkstra pathfinding in JavaScript
class SimpleTopology {
    private nodes: Map<string, EnergyNode> = new Map()
    private edges: Map<string, Map<string, number>> = new Map()

    setGraph(nodes: EnergyNode[], transfers: EnergyTransfer[]) {
        this.nodes.clear()
        this.edges.clear()

        nodes.forEach(node => {
            this.nodes.set(node.id, node)
            this.edges.set(node.id, new Map())
        })

        transfers.forEach(transfer => {
            if (this.edges.has(transfer.from) && this.nodes.has(transfer.to)) {
                const distance = this.calculateDistance(transfer.from, transfer.to)
                this.edges.get(transfer.from)!.set(transfer.to, distance)
            }
        })
    }

    private calculateDistance(fromId: string, toId: string): number {
        const from = this.nodes.get(fromId)
        const to = this.nodes.get(toId)
        if (!from || !to) return Infinity

        const R = 6371
        const dLat = this.toRad(to.latitude - from.latitude)
        const dLon = this.toRad(to.longitude - from.longitude)
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.toRad(from.latitude)) *
            Math.cos(this.toRad(to.latitude)) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2)
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
        return R * c
    }

    private toRad(deg: number): number {
        return (deg * Math.PI) / 180
    }

    findPath(fromId: string, toId: string): PathResult | null {
        if (!this.nodes.has(fromId) || !this.nodes.has(toId)) {
            return null
        }

        const distances = new Map<string, number>()
        const previous = new Map<string, string | null>()
        const unvisited = new Set<string>()

        this.nodes.forEach((_, id) => {
            distances.set(id, Infinity)
            previous.set(id, null)
            unvisited.add(id)
        })
        distances.set(fromId, 0)

        while (unvisited.size > 0) {
            let current: string | null = null
            let minDist = Infinity
            unvisited.forEach(id => {
                const dist = distances.get(id)!
                if (dist < minDist) {
                    minDist = dist
                    current = id
                }
            })

            if (current === null || minDist === Infinity) break
            if (current === toId) break

            unvisited.delete(current)

            const neighbors = this.edges.get(current)
            if (neighbors) {
                neighbors.forEach((weight, neighborId) => {
                    if (unvisited.has(neighborId)) {
                        const alt = distances.get(current!)! + weight
                        if (alt < distances.get(neighborId)!) {
                            distances.set(neighborId, alt)
                            previous.set(neighborId, current)
                        }
                    }
                })
            }
        }

        const path: string[] = []
        let current: string | null = toId
        if (distances.get(toId) === Infinity) {
            return null
        }

        while (current !== null) {
            path.unshift(current)
            current = previous.get(current)!
        }

        return {
            nodeIds: path,
            distance: distances.get(toId)!
        }
    }
}

export function useTopology(): UseTopologyResult {
    const [isLoaded] = useState(true)
    const topologyRef = useRef(new SimpleTopology())
    const [stats, setStats] = useState<TopologyInfo>({ nodeCount: 0, lineCount: 0, totalLoss: 0 })

    const loadNetwork = useCallback((nodes: EnergyNode[], transfers: EnergyTransfer[]) => {
        const nodeIdSet = new Set(nodes.map(n => n.id))
        const validTransfers = transfers.filter(t => nodeIdSet.has(t.from) && nodeIdSet.has(t.to))

        try {
            topologyRef.current.setGraph(nodes, validTransfers)
            setStats({
                nodeCount: nodes.length,
                lineCount: validTransfers.length,
                totalLoss: 0
            })
        } catch (error) {
            console.error('Failed to set topology graph:', error)
        }
    }, []) // No dependencies - stable function reference

    const findPath = useCallback((fromId: string, toId: string): PathResult | null => {
        try {
            return topologyRef.current.findPath(fromId, toId)
        } catch (error) {
            console.error('Failed to find path:', error)
            return null
        }
    }, []) // No dependencies - stable function reference

    const getInfo = useCallback((): TopologyInfo => {
        return stats
    }, [stats])

    return {
        isLoaded,
        loadNetwork,
        findPath,
        getInfo,
    }
}
