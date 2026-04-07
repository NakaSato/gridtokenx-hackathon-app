'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { X, Zap } from 'lucide-react'
import type { EnergyNode } from '@/components/energy-grid/types'

interface SelectedNodeCardProps {
  selectedNode: EnergyNode | null
  onClearNode?: () => void
}

export function SelectedNodeCard({
  selectedNode,
  onClearNode,
}: SelectedNodeCardProps) {
  if (!selectedNode) return null

  return (
    <div className="rounded-xl border border-primary/20 bg-gradient-to-r from-primary/5 to-transparent p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <Zap className="h-4 w-4 text-primary" />
          </div>
          <span className="text-sm font-semibold text-foreground">
            {selectedNode.name}
          </span>
        </div>
        {onClearNode && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClearNode}
            className="h-7 w-7 rounded-full p-0 text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary/50"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span className="rounded-md bg-muted px-2 py-1 font-medium">{selectedNode.type}</span>
        <span>•</span>
        <span>{selectedNode.capacity}</span>
        {selectedNode.zoneId && (
          <>
            <span>•</span>
            <span className="rounded-md bg-primary/10 px-2 py-1 font-medium text-primary">Zone {selectedNode.zoneId}</span>
          </>
        )}
      </div>
    </div>
  )
}
