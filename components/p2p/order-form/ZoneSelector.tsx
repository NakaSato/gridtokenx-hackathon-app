'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { MapPin, Info, ArrowRightLeft, Zap } from 'lucide-react'
import toast from 'react-hot-toast'
import type { EnergyNode } from '@/components/energy-grid/types'
import { P2P_CONFIG } from '@/lib/constants'

interface ZoneSelectorProps {
  orderType: 'buy' | 'sell'
  buyerZone: number
  sellerZone: number
  setBuyerZone: (zone: number) => void
  setSellerZone: (zone: number) => void
  selectedNode: EnergyNode | null
}

export function ZoneSelector({
  orderType,
  buyerZone,
  sellerZone,
  setBuyerZone,
  setSellerZone,
  selectedNode,
}: ZoneSelectorProps) {
  const { zones } = P2P_CONFIG

  const handleAutoSelect = () => {
    if (selectedNode?.zoneId) {
      if (orderType === 'buy') {
        setBuyerZone(selectedNode.zoneId)
        setSellerZone(selectedNode.zoneId)
      } else {
        setSellerZone(selectedNode.zoneId)
        setBuyerZone(selectedNode.zoneId)
      }
      toast.success(`Zones set to ${zones.find(z => z.id === selectedNode.zoneId)?.name || 'Zone ' + selectedNode.zoneId}`)
    } else {
      if (orderType === 'buy') {
        setBuyerZone(1)
        setSellerZone(1)
      } else {
        setSellerZone(1)
        setBuyerZone(1)
      }
      toast.success('Zones set to ' + (zones.find(z => z.id === 1)?.name || 'Zone 1'))
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary/10">
            <MapPin className="h-3.5 w-3.5 text-primary" />
          </div>
          Zone Routing
        </Label>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleAutoSelect}
            className="h-7 px-2.5 rounded-lg text-xs font-medium text-primary hover:text-primary hover:bg-primary/10 focus-visible:ring-2 focus-visible:ring-primary/50"
          >
            <Zap className="h-3.5 w-3.5 mr-1.5" />
            Auto-Select
          </Button>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" className="h-7 w-7 rounded-full p-0 hover:bg-muted focus-visible:ring-2 focus-visible:ring-primary/50">
                  <Info className="h-4 w-4 text-muted-foreground" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-[240px] text-sm">
                <p>Select your zone and the counterparty zone. Different zones may incur transfer fees. Use Auto-Select to use your meter&apos;s zone.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {/* Your Zone Card - Small */}
        <div className="flex-1">
          <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            {orderType === 'buy' ? 'Your Zone' : 'Buyer Zone'}
          </span>
          <Select
            value={String(orderType === 'buy' ? buyerZone : sellerZone)}
            onValueChange={(value) => {
              const zoneId = parseInt(value)
              if (orderType === 'buy') {
                setBuyerZone(zoneId)
              } else {
                setSellerZone(zoneId)
              }
            }}
          >
            <SelectTrigger className="h-9 rounded-lg border-border bg-muted/50 text-xs font-medium transition-all hover:bg-muted focus:ring-1 focus:ring-primary/50">
              <SelectValue placeholder="Select zone" />
            </SelectTrigger>
            <SelectContent position="popper" avoidCollisions={false} className="rounded-lg z-50 min-w-[200px]">
              {zones.map((zone) => (
                <SelectItem key={zone.id} value={String(zone.id)} className="text-xs rounded-md">
                  <div className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-md bg-primary/10 text-[10px] font-bold text-primary">
                      {zone.id}
                    </span>
                    <span className="font-medium">{zone.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Arrow Connector - Small */}
        <div className="flex flex-col items-center pt-4">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted shadow-sm">
            <ArrowRightLeft className="h-3 w-3 text-muted-foreground" />
          </div>
        </div>

        {/* Counterparty Zone Card - Small */}
        <div className="flex-1">
          <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            {orderType === 'buy' ? 'Seller Zone' : 'Your Zone'}
          </span>
          <Select
            value={String(orderType === 'buy' ? sellerZone : buyerZone)}
            onValueChange={(value) => {
              const zoneId = parseInt(value)
              if (orderType === 'buy') {
                setSellerZone(zoneId)
              } else {
                setBuyerZone(zoneId)
              }
            }}
          >
            <SelectTrigger className="h-9 rounded-lg border-border bg-muted/50 text-xs font-medium transition-all hover:bg-muted focus:ring-1 focus:ring-primary/50">
              <SelectValue placeholder="Select zone" />
            </SelectTrigger>
            <SelectContent position="popper" avoidCollisions={false} className="rounded-lg z-50 min-w-[200px]">
              {zones.map((zone) => (
                <SelectItem key={zone.id} value={String(zone.id)} className="text-xs rounded-md">
                  <div className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-md bg-primary/10 text-[10px] font-bold text-primary">
                      {zone.id}
                    </span>
                    <span className="font-medium">{zone.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )
}
