'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import Map, { NavigationControl, MapRef, MapMouseEvent } from 'react-map-gl/mapbox'
import 'mapbox-gl/dist/mapbox-gl.css'
import { Activity, Maximize2, Minimize2, AlertTriangle, Zap, Radio, Loader2, RefreshCw, Map as MapIcon, ArrowRightLeft, Database } from 'lucide-react'
import { Button } from '@/components/ui/button'
import throttle from 'lodash.throttle'

// Import from energy-grid sub-components
import {
  EnergyFlowLayers,
  ZonePolygonLayers,
  TradeFlowLayers,
  useActiveTrades,
  LightweightMarker,
  ClusterMarker,
  GridStatsPanel,
  MapLegend,
  useWasmSimulation,
  useMeterMapData,
  useMeterClusters,
  useGridStatus,
  useGridTopology,
} from './energy-grid'
import { useTopology } from './energy-grid/useTopology'
import type { EnergyNode, EnergyTransfer, ClusterOrPoint, ClusterFeature } from './energy-grid'

// Load config
import { CAMPUS_CONFIG } from '@/lib/constants'
import { getMockEnergyNodes, MOCK_TRANSFORMER, MOCK_TRANSFERS } from '@/lib/mock-meters'

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN

// Check if token is properly configured
const hasValidToken = MAPBOX_TOKEN && MAPBOX_TOKEN !== 'YOUR_MAPBOX_TOKEN' && MAPBOX_TOKEN.length > 20

interface EnergyGridMapProps {
  onTradeFromNode?: (node: EnergyNode) => void
  viewState?: {
    longitude: number
    latitude: number
    zoom: number
  }
  onViewStateChange?: (viewState: {
    longitude: number
    latitude: number
    zoom: number
  }) => void
}

export default function EnergyGridMap({ onTradeFromNode, viewState: propViewState, onViewStateChange }: EnergyGridMapProps) {
  // View state - local fallback if not controlled
  const initialViewState = useMemo(() => {
    return {
      longitude: CAMPUS_CONFIG.center.longitude,
      latitude: CAMPUS_CONFIG.center.latitude,
      zoom: CAMPUS_CONFIG.defaultZoom,
      ...propViewState,
    }
  }, [propViewState])

  const [localViewState, setLocalViewState] = useState(initialViewState)

  // Use controlled state if provided, otherwise local state
  const viewState = propViewState || localViewState

  // Throttled map move handler to prevent excessive re-renders during pan/zoom
  const handleMapMove = useMemo(
    () => throttle((evt: { viewState: { longitude: number; latitude: number; zoom: number } }) => {
      if (onViewStateChange) {
        onViewStateChange(evt.viewState)
      } else {
        setLocalViewState(evt.viewState)
      }
      // Don't update bounds here to avoid re-clustering on every frame
    }, 100, { leading: true, trailing: true }),
    [onViewStateChange]
  )

  const [selectedNode, setSelectedNode] = useState<EnergyNode | null>(null)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [mapError, setMapError] = useState<string | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showFlowLines, setShowFlowLines] = useState(true)
  const [showZones, setShowZones] = useState(true) // Toggle for zone polygons
  const [showTrades, setShowTrades] = useState(true) // Toggle for trade flows
  const [showRealMeters, setShowRealMeters] = useState(true) // Toggle for real meters
  const [useMockData, setUseMockData] = useState(false) // DEV: Toggle for mock meters
  const [hoveredFlow, setHoveredFlow] = useState<{
    power: number
    description: string
    x: number
    y: number
  } | null>(null)
  // Track map bounds for clustering
  const [mapBounds, setMapBounds] = useState<[number, number, number, number] | undefined>(undefined)
  // Highlighted path state (array of node IDs for topology)
  const [highlightedPath, setHighlightedPath] = useState<string[] | undefined>(undefined)

  const mapRef = useRef<MapRef>(null)
  const mapContainerRef = useRef<HTMLDivElement>(null)

  // Fetch real meter data only (no static mock nodes)
  const { realMeterNodes, isLoading: metersLoading, error: metersError, refresh: refreshMeters } = useMeterMapData({
    includeStaticNodes: false,
    refreshIntervalMs: 30000,
  })

  // Get mock meters for dev testing
  const mockMeterNodes = useMemo(() => getMockEnergyNodes(), [])

  // Use mock or real meters based on toggle
  const displayMeterNodes = useMockData ? mockMeterNodes : realMeterNodes
  const displayLoading = useMockData ? false : metersLoading
  const displayError = useMockData ? null : metersError

  // Fetch aggregate grid status from the API
  const { status: apiGridStatus, isLoading: gridStatusLoading, error: gridStatusError, refresh: refreshGridStatus } = useGridStatus(10000)

  // Combined API error state
  const apiError = metersError || gridStatusError
  const handleRetry = () => {
    if (metersError) refreshMeters()
    if (gridStatusError) refreshGridStatus()
  }

  // Fetch dynamic grid topology (transformers and lines)
  const { transformers, transfers: realTransfers } = useGridTopology()

  // Use mock transfers and transformer when in mock mode (must be after useGridTopology)
  const displayTransformers = useMemo(
    () => (useMockData ? [MOCK_TRANSFORMER] : transformers),
    [useMockData, transformers]
  )
  const displayTransfers = useMemo(
    () => (useMockData ? MOCK_TRANSFERS : realTransfers),
    [useMockData, realTransfers]
  )

  // Use WASM topology for path finding
  const { isLoaded: topologyLoaded, loadNetwork, findPath } = useTopology()

  // Combine meters with transformers if showing real data
  const energyNodes = useMemo(() => {
    return showRealMeters
      ? [...displayMeterNodes, ...displayTransformers]
      : []
  }, [showRealMeters, displayMeterNodes, displayTransformers])

  // Use dynamic transfers if showing real meters
  const energyTransfers = useMemo(() => {
    return showRealMeters ? displayTransfers : []
  }, [showRealMeters, displayTransfers])

  // Cluster markers for performance (266+ meters)
  const { clusters, getClusterExpansionZoom } = useMeterClusters({
    nodes: energyNodes,
    zoom: viewState.zoom,
    bounds: mapBounds,
    radius: 50,
    maxZoom: 16,
  })

  // Use the simulation hook with combined nodes
  const { liveNodeData, liveTransferData, gridTotals } = useWasmSimulation({
    energyNodes,
    energyTransfers,
    updateIntervalMs: 10000, // Optimized from 3000ms
  })

  // Load topology network when nodes/transfers change
  useEffect(() => {
    if (topologyLoaded && energyNodes.length > 0) {
      loadNetwork(energyNodes, energyTransfers)
    }
  }, [topologyLoaded, energyNodes, energyTransfers, loadNetwork])

  // Calculate path when node is selected
  useEffect(() => {
    if (!selectedNode || !topologyLoaded) {
      setHighlightedPath(undefined)
      return
    }

    // For consumers, find path to nearest generator
    // For generators, find path to first consumer
    const targetType = selectedNode.type === 'generator' ? 'consumer' : 'generator'
    const targetNode = energyNodes.find(n => n.type === targetType)

    if (!targetNode) return

    const result = findPath(selectedNode.id, targetNode.id)
    if (result && result.nodeIds.length > 1) {
      setHighlightedPath(result.nodeIds)
    } else {
      setHighlightedPath(undefined)
    }
  }, [selectedNode, topologyLoaded, energyNodes, findPath])

  // Handle flow line hover
  const handleFlowHover = useCallback((e: MapMouseEvent) => {
    if (e.features && e.features.length > 0) {
      const feature = e.features[0]
      setHoveredFlow({
        power: feature.properties?.power ?? 0,
        description: feature.properties?.description ?? '',
        x: e.point.x,
        y: e.point.y,
      })
    }
  }, [])

  const handleFlowLeave = useCallback(() => {
    setHoveredFlow(null)
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedNode) {
        setSelectedNode(null)
      }
      if (e.key === 'r' || e.key === 'R') {
        mapRef.current?.flyTo({
          center: [CAMPUS_CONFIG.center.longitude, CAMPUS_CONFIG.center.latitude],
          zoom: CAMPUS_CONFIG.defaultZoom,
          duration: 1000,
          essential: true
        })
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => {
      window.removeEventListener('keydown', handleKeyPress)
      handleMapMove.cancel() // Cancel pending throttled calls
    }
  }, [selectedNode, viewState, handleMapMove])

  // Fullscreen change listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  // Double click to zoom
  const handleMarkerDoubleClick = (node: EnergyNode) => {
    mapRef.current?.flyTo({
      center: [node.longitude, node.latitude],
      zoom: 18,
      duration: 1000,
      essential: true
    })
    setSelectedNode(node)
  }

  // Toggle fullscreen
  const toggleFullscreen = async () => {
    const element = mapContainerRef.current
    if (!element) return

    try {
      if (!isFullscreen) {
        await element.requestFullscreen?.()
      } else {
        await document.exitFullscreen?.()
      }
    } catch (error) {
      console.error('Fullscreen error:', error)
    }
  }

  // Handle dynamic map resizing (fix for ResizablePanel)
  useEffect(() => {
    if (!mapContainerRef.current) return

    const resizeObserver = new ResizeObserver(() => {
      // Use requestAnimationFrame to avoid "ResizeObserver loop limit exceeded"
      // and prevent flickering by aligning with the paint cycle
      if (mapRef.current) {
        requestAnimationFrame(() => {
          mapRef.current?.resize()
        })
      }
    })

    resizeObserver.observe(mapContainerRef.current)

    return () => resizeObserver.disconnect()
  }, [])

  // Show error if token is missing
  if (!hasValidToken) {
    return (
      <div className="flex h-full w-full items-center justify-center rounded-b-sm bg-secondary/20 p-4">
        <div className="flex flex-col items-center gap-2 text-center">
          <AlertTriangle className="h-8 w-8 text-yellow-500" />
          <h3 className="font-semibold text-foreground">Mapbox Token Required</h3>
          <p className="text-sm text-secondary-foreground">
            Set <code className="rounded bg-secondary px-1">NEXT_PUBLIC_MAPBOX_TOKEN</code> in your environment
          </p>
        </div>
      </div>
    )
  }

  return (
    <div ref={mapContainerRef} className="relative h-full w-full overflow-hidden rounded-b-sm">
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.1);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(var(--primary-rgb, 59, 130, 246), 0.5);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(var(--primary-rgb, 59, 130, 246), 0.7);
        }
      `}</style>

      {/* Loading state - enhanced skeleton */}
      {(!mapLoaded || displayLoading) && !mapError && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-background/95 backdrop-blur-sm">
          <Loader2 className="h-8 w-8 text-primary animate-spin mb-3" />
          <p className="text-foreground font-medium">
            {!mapLoaded ? 'Loading map...' : 'Loading meters...'}
          </p>
          {displayLoading && (
            <p className="text-sm text-muted-foreground mt-1">
              Fetching {displayMeterNodes.length > 0 ? displayMeterNodes.length : ''} energy nodes
            </p>
          )}
          {/* Skeleton placeholder markers */}
          <div className="mt-6 flex gap-3">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="h-4 w-4 rounded-full bg-primary/20 animate-pulse"
                style={{ animationDelay: `${i * 100}ms` }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Error state */}
      {mapError && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-background">
          <div className="flex flex-col items-center gap-2 text-center p-4">
            <AlertTriangle className="h-8 w-8 text-red-500" />
            <p className="text-sm text-secondary-foreground">{mapError}</p>
          </div>
        </div>
      )}

      {/* API Error Banner */}
      {displayError && !mapError && (
        <div className="absolute top-20 sm:top-16 left-1/2 -translate-x-1/2 z-40 w-[90%] sm:w-auto animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-3 px-3 sm:px-4 py-2 rounded-lg border border-red-500/30 bg-red-500/10 backdrop-blur-md shadow-lg">
            <AlertTriangle className="h-4 w-4 text-red-400 flex-shrink-0" />
            <p className="text-[11px] sm:text-sm text-red-200">{displayError}</p>
            <button
              onClick={handleRetry}
              className="flex items-center gap-1 px-2 py-1 text-[10px] sm:text-xs font-medium rounded bg-red-500/20 hover:bg-red-500/30 text-red-200 transition-colors"
            >
              <RefreshCw className="h-3 w-3" />
              Retry
            </button>
          </div>
        </div>
      )}

      <Map
        ref={mapRef}
        {...viewState}
        reuseMaps
        onMove={handleMapMove}
        onMoveEnd={(evt) => {
          // Update bounds for clustering only when movement ends
          const bounds = evt.target.getBounds()
          if (bounds) {
            setMapBounds([
              bounds.getWest(),
              bounds.getSouth(),
              bounds.getEast(),
              bounds.getNorth(),
            ])
          }
        }}
        mapStyle="mapbox://styles/mapbox/dark-v11"
        mapboxAccessToken={MAPBOX_TOKEN}
        style={{ width: '100%', height: '100%' }}
        onLoad={() => setMapLoaded(true)}
        onError={(e: { error?: { message?: string } }) => {
          console.error('Map error:', e?.error || e)
          setMapError(e?.error?.message || 'Failed to load map. Check your Mapbox token.')
        }}
        interactiveLayerIds={showFlowLines ? ['energy-flow-line', 'energy-flow-glow'] : []}
        onMouseMove={handleFlowHover}
        onMouseLeave={handleFlowLeave}
        cursor={hoveredFlow ? 'pointer' : 'grab'}
      >
        <NavigationControl position="top-right" />

        {/* Zone Polygon Background Layers */}
        <ZonePolygonLayersWrapper
          energyNodes={energyNodes}
          visible={showZones}
        />

        {/* Energy Flow Layers */}
        <EnergyFlowLayers
          energyNodes={energyNodes}
          energyTransfers={energyTransfers}
          liveTransferData={liveTransferData}
          visible={showFlowLines}
          highlightedPath={highlightedPath}
        />

        {/* Trade Flow Layers - Animated trades between zones */}
        <TradeFlowLayersWrapper
          transformers={transformers}
          visible={showTrades}
        />


        {/* Control Buttons Group */}
        <div className="absolute right-10 top-2 z-10 flex flex-col sm:flex-row gap-2 sm:right-16 sm:top-4">
          <Button
            variant="ghost"
            size="sm"
            className={`h-8 w-8 border bg-background/95 p-0 shadow-lg backdrop-blur-md hover:bg-background ${showZones ? 'border-purple-500/50 text-purple-500' : 'border-primary/30 text-primary'
              }`}
            onClick={() => setShowZones(!showZones)}
            title={showZones ? 'Hide zone areas' : 'Show zone areas'}
          >
            <MapIcon className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className={`h-8 w-8 border bg-background/95 p-0 shadow-lg backdrop-blur-md hover:bg-background ${showTrades ? 'border-cyan-500/50 text-cyan-500' : 'border-primary/30 text-primary'
              }`}
            onClick={() => setShowTrades(!showTrades)}
            title={showTrades ? 'Hide trade flows' : 'Show trade flows'}
          >
            <ArrowRightLeft className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className={`h-8 w-8 border bg-background/95 p-0 shadow-lg backdrop-blur-md hover:bg-background ${showRealMeters ? 'border-blue-500/50 text-blue-500' : 'border-primary/30 text-primary'
              }`}
            onClick={() => setShowRealMeters(!showRealMeters)}
            title={showRealMeters ? 'Hide my meters' : 'Show my meters'}
          >
            <Radio className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className={`h-8 w-8 border bg-background/95 p-0 shadow-lg backdrop-blur-md hover:bg-background ${showFlowLines ? 'border-green-500/50 text-green-500' : 'border-primary/30 text-primary'
              }`}
            onClick={() => setShowFlowLines(!showFlowLines)}
            title={showFlowLines ? 'Hide energy flow' : 'Show energy flow'}
          >
            <Activity className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 border border-primary/30 bg-background/95 p-0 shadow-lg backdrop-blur-md hover:bg-background"
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          >
            {isFullscreen ? (
              <Minimize2 className="h-4 w-4 text-primary" />
            ) : (
              <Maximize2 className="h-4 w-4 text-primary" />
            )}
          </Button>

          {/* DEV: Mock data toggle */}
          <Button
            variant="ghost"
            size="sm"
            className={`h-8 w-8 border bg-background/95 p-0 shadow-lg backdrop-blur-md hover:bg-background ${useMockData ? 'border-orange-500/50 text-orange-500' : 'border-primary/30 text-primary'
              }`}
            onClick={() => setUseMockData(!useMockData)}
            title={useMockData ? 'Using mock data (click for real)' : 'Using real data (click for mock)'}
          >
            <Database className="h-4 w-4" />
          </Button>
        </div>

        {/* Node Markers - Clustered and Virtualized for performance */}
        {clusters
          // Viewport virtualization: only render markers within visible bounds + buffer
          .filter((clusterOrPoint) => {
            if (!mapBounds) return true // Render all if bounds not yet available
            const coords = clusterOrPoint.geometry.coordinates
            const [lng, lat] = coords
            // Add 10% buffer around visible bounds to prevent pop-in
            const bufferLng = (mapBounds[2] - mapBounds[0]) * 0.1
            const bufferLat = (mapBounds[3] - mapBounds[1]) * 0.1
            return (
              lng >= mapBounds[0] - bufferLng &&
              lng <= mapBounds[2] + bufferLng &&
              lat >= mapBounds[1] - bufferLat &&
              lat <= mapBounds[3] + bufferLat
            )
          })
          .map((clusterOrPoint) => {
            // Check if it's a cluster
            if (clusterOrPoint.properties.cluster) {
              return (
                <ClusterMarker
                  key={`cluster-${clusterOrPoint.properties.cluster_id}`}
                  cluster={clusterOrPoint as ClusterFeature}
                  onClick={(clusterId, lng, lat) => {
                    const expansionZoom = getClusterExpansionZoom(clusterId)
                    mapRef.current?.flyTo({
                      center: [lng, lat],
                      zoom: expansionZoom,
                      duration: 500,
                      essential: true
                    })
                  }}
                />
              )
            }
            // It's an individual point
            const node = clusterOrPoint.properties.node
            return (
              <LightweightMarker
                key={node.id}
                node={node}
                liveData={liveNodeData[node.id]}
                isSelected={selectedNode?.id === node.id}
                onSelect={setSelectedNode}
                onDoubleClick={handleMarkerDoubleClick}
                onTradeClick={onTradeFromNode}
              />
            )
          })}
      </Map>

      {/* Legend */}
      <MapLegend showFlowLines={showFlowLines} showZones={showZones} showTrades={showTrades} />

      {/* Grid Stats Panel */}
      <GridStatsPanel
        totalGeneration={apiGridStatus?.total_generation ?? gridTotals.totalGeneration}
        totalConsumption={apiGridStatus?.total_consumption ?? gridTotals.totalConsumption}
        avgStorage={gridTotals.avgStorage}
        co2Saved={apiGridStatus?.co2_saved_kg ?? gridTotals.co2Saved}
        activeMeters={apiGridStatus?.active_meters ?? gridTotals.activeMeters}
        zones={apiGridStatus?.zones}
        frequency={apiGridStatus?.frequency}
        islandStatus={apiGridStatus?.island_status}
        healthScore={apiGridStatus?.health_score}
        isUnderAttack={apiGridStatus?.is_under_attack}
        tariff={apiGridStatus?.tariff}
        adrEvent={apiGridStatus?.adr_event}
        loadForecast={apiGridStatus?.load_forecast}
        evFleet={apiGridStatus?.ev_fleet}
      />

      {/* Flow Line Hover Tooltip */}
      {hoveredFlow && (
        <div
          className="pointer-events-none absolute z-50 rounded border border-primary/40 bg-background/95 px-3 py-2 shadow-xl backdrop-blur-md"
          style={{
            left: hoveredFlow.x + 15,
            top: hoveredFlow.y - 10,
            transform: 'translateY(-50%)',
          }}
        >
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-yellow-500" />
            <span className="text-sm font-bold text-foreground">
              {Math.round(hoveredFlow.power)} kW
            </span>
          </div>
          {hoveredFlow.description && hoveredFlow.description !== `${Math.round(hoveredFlow.power)} kW` && (
            <p className="mt-0.5 text-xs text-secondary-foreground">{hoveredFlow.description}</p>
          )}
        </div>
      )}
    </div>
  )
}

// Wrapper component for TradeFlowLayers that fetches trade data
function TradeFlowLayersWrapper({
  transformers,
  visible
}: {
  transformers: EnergyNode[]
  visible: boolean
}) {
  const { trades } = useActiveTrades()

  return (
    <TradeFlowLayers
      trades={trades}
      transformers={transformers}
      visible={visible}
    />
  )
}

// Wrapper component for ZonePolygonLayers that passes active trades
function ZonePolygonLayersWrapper({
  energyNodes,
  visible
}: {
  energyNodes: EnergyNode[]
  visible: boolean
}) {
  const { trades } = useActiveTrades()

  return (
    <ZonePolygonLayers
      energyNodes={energyNodes}
      visible={visible}
      activeTrades={trades}
    />
  )
}