import { useRef, useCallback, useEffect } from 'react'
import {
    isWasmLoaded,
    blackScholes,
    calculateGreeks as calculateGreeksWasmHelper,
    calculateBezier as calculateBezierWasmHelper,
    calculatePortfolioRisk as calculatePortfolioRiskWasmHelper,
    Simulation
} from '@/lib/wasm-bridge'
import { useWasm } from '@/lib/wasm-provider'

export function useWasmMath() {
    const { isLoaded, isLoading, error } = useWasm()

    // Instance of WASM Simulation class
    const simulationRef = useRef<Simulation | null>(null)

    // Initialize instance once WASM is loaded (using useEffect to ensure WASM is ready)
    useEffect(() => {
        if (isLoaded && isWasmLoaded() && !simulationRef.current) {
            try {
                simulationRef.current = new Simulation()
                console.log('[useWasmMath] Simulation initialized')
            } catch (err) {
                console.error('[useWasmMath] Failed to initialize Simulation:', err)
            }
        }
    }, [isLoaded])

    const generateCurvedLineWasm = useCallback((
        from: [number, number],
        to: [number, number],
        curveIntensity: number = 0.2,
        segments: number = 20
    ): [number, number][] | null => {
        if (!isLoaded) return null
        return calculateBezierWasmHelper(from[0], from[1], to[0], to[1], curveIntensity, segments)
    }, [isLoaded])

    const initSimulationNodesWasm = useCallback((nodes: any[]) => {
        if (!isLoaded || !simulationRef.current) return
        simulationRef.current.set_nodes(nodes)
    }, [isLoaded])

    const initSimulationFlowsWasm = useCallback((flows: any[]) => {
        if (!isLoaded || !simulationRef.current) return
        simulationRef.current.set_flows(flows)
    }, [isLoaded])

    const updateSimulationWasm = useCallback((hour: number, minute: number, nodeCount: number, flowCount: number) => {
        if (!isLoaded || !simulationRef.current) return null

        simulationRef.current.update(hour, minute)

        const nodes = simulationRef.current.get_nodes()
        const flows = simulationRef.current.get_flows()

        // Match the legacy return format if possible, or update callers
        // The legacy format used Float64Array slices
        return {
            nodes: new Float64Array(nodes.flatMap((n: any) => [n.current || 0, n.status || 0])),
            flows: new Float64Array(flows.map((f: any) => f.current || 0))
        }
    }, [isLoaded])

    const getGridTotalsWasm = useCallback(() => {
        if (!isLoaded || !simulationRef.current) return null
        return simulationRef.current.get_grid_totals()
    }, [isLoaded])

    const calculatePortfolioRisk = useCallback((positions: any[]) => {
        return calculatePortfolioRiskWasmHelper(positions)
    }, [])

    const calculateOptionsPrice = useCallback((s: number, k: number, t: number, isCall: boolean) => {
        return blackScholes(s, k, t, isCall)
    }, [])

    const calculateGreeks = useCallback((s: number, k: number, t: number, isCall: boolean) => {
        return calculateGreeksWasmHelper(s, k, t, isCall)
    }, [])

    return {
        isLoaded,
        isLoading,
        error: error?.message || null,
        generateCurvedLineWasm,
        initSimulationNodesWasm,
        initSimulationFlowsWasm,
        updateSimulationWasm,
        getGridTotalsWasm,
        calculatePortfolioRisk,
        calculateOptionsPrice,
        calculateGreeks
    }
}
