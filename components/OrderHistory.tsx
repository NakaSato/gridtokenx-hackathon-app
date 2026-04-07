'use client'

import { Transaction } from '@/lib/data/WalletActivity'
import {
  CallIconDark,
  CopyIcon,
  PutIconDark,
  SendIcon,
} from '@/public/svgs/icons'
import Image from 'next/image'
import { Separator } from './ui/separator'
import { Button } from './ui/button'
import { Download, FileDown, Loader2 } from 'lucide-react'
import { useState, memo, Fragment } from 'react'
import { useAuth } from '@/contexts/AuthProvider'
import { createApiClient } from '@/lib/api-client'
import toast from 'react-hot-toast'

export default memo(function OrderHistory({
  doneOptioninfos,
}: {
  doneOptioninfos: Transaction[]
}) {
  const { token } = useAuth()
  const [exporting, setExporting] = useState<'csv' | 'json' | null>(null)

  const handleExport = async (format: 'csv' | 'json') => {
    if (!token) return
    setExporting(format)
    try {
      const apiClient = createApiClient(token)
      const response = await apiClient.exportTradingHistory(format)

      if (response.data) {
        // Create a download link for the blob
        const url = window.URL.createObjectURL(response.data as Blob)
        const link = document.createElement('a')
        link.href = url
        link.setAttribute('download', `trade-history-${new Date().toISOString().split('T')[0]}.${format}`)
        document.body.appendChild(link)
        link.click()
        link.parentNode?.removeChild(link)
        toast.success(`History exported as ${format.toUpperCase()}`)
      } else if (response.error) {
        toast.error(`Export failed: ${response.error}`)
      }
    } catch (error) {
      toast.error('Failed to export history')
      console.error(error)
    } finally {
      setExporting(null)
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header with Export Actions */}
      <div className="flex items-center justify-between mb-6 px-4">
        <div className="flex flex-col">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            Trade History
          </h3>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Recent Activity</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-[11px] gap-2 px-3 bg-secondary/30 hover:bg-secondary/60 border border-border/50 transition-all active:scale-95"
            onClick={() => handleExport('csv')}
            disabled={!!exporting}
          >
            {exporting === 'csv' ? <Loader2 size={13} className="animate-spin text-primary" /> : <Download size={13} className="text-muted-foreground" />}
            <span>CSV</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-[11px] gap-2 px-3 bg-secondary/30 hover:bg-secondary/60 border border-border/50 transition-all active:scale-95"
            onClick={() => handleExport('json')}
            disabled={!!exporting}
          >
            {exporting === 'json' ? <Loader2 size={13} className="animate-spin text-primary" /> : <FileDown size={13} className="text-muted-foreground" />}
            <span>JSON</span>
          </Button>
        </div>
      </div>

      {/* Desktop Table-like Grid */}
      <div className="hidden w-full flex-col md:flex">
        {/* Table Header */}
        <div className="grid grid-cols-[1.5fr_1fr_1fr_1.5fr_1fr] px-4 py-2 border-y border-border/40 bg-secondary/10 mb-2">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Asset & ID</span>
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest text-center">Side</span>
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest text-center">Volume (kWh)</span>
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest text-center">Settlement Status</span>
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest text-right">Time</span>
        </div>

        <div className="space-y-1 overflow-y-auto max-h-[500px] pr-1 custom-scrollbar">
          {doneOptioninfos && doneOptioninfos.length > 0 ? (
            doneOptioninfos.map((tx) => (
              <div
                className="grid grid-cols-[1.5fr_1fr_1fr_1.5fr_1fr] items-center px-4 py-3 hover:bg-secondary/30 rounded-lg transition-colors border-b border-border/10 last:border-0 group"
                key={tx.transactionID}
              >
                {/* Asset & ID */}
                <div className="flex items-center space-x-3">
                  <div className="relative flex-shrink-0">
                    <Image
                      src={tx.token.logo}
                      alt={tx.token.name}
                      width={28}
                      height={28}
                      className="rounded-full ring-1 ring-border group-hover:ring-primary/50 transition-all"
                    />
                    <div className="absolute -bottom-1 -right-1 rounded-full bg-background border border-border p-[2px]">
                      {tx.transactionType === 'Buy' ? (
                        <div className="text-green-500"><CallIconDark width="10" height="10" /></div>
                      ) : (
                        <div className="text-red-500"><PutIconDark width="10" height="10" /></div>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-semibold text-foreground truncate">
                      {tx.token.name}
                    </span>
                    <span className="text-[10px] font-mono text-muted-foreground truncate opacity-70">
                      {tx.transactionID.slice(0, 16)}...
                    </span>
                  </div>
                </div>

                {/* Side */}
                <div className="flex justify-center">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-tight ${tx.transactionType === 'Buy'
                    ? 'bg-green-500/10 text-green-500 border border-green-500/20'
                    : 'bg-red-500/10 text-red-500 border border-red-500/20'
                    }`}>
                    {tx.transactionType}
                  </span>
                </div>

                {/* Volume */}
                <div className="flex flex-col items-center">
                  <span className="text-xs font-bold text-foreground">
                    {tx.quantity?.toFixed(2) ?? '0.00'}
                  </span>
                  <span className="text-[9px] text-muted-foreground font-medium">kWh</span>
                </div>

                {/* Settlement Details */}
                <div className="flex items-center justify-center gap-4">
                  <div className="flex flex-col items-center">
                    <span className="text-[9px] text-muted-foreground uppercase font-bold opacity-60">Delivered</span>
                    <span className="text-xs text-green-500 font-bold tabular-nums">
                      {tx.effectiveEnergy !== undefined && tx.effectiveEnergy !== null
                        ? tx.effectiveEnergy.toFixed(2)
                        : (tx.quantity?.toFixed(2) ?? '0.00')}
                    </span>
                  </div>
                  {tx.wheelingCharge !== undefined && tx.wheelingCharge !== null && (
                    <div className="flex flex-col items-center">
                      <span className="text-[9px] text-muted-foreground uppercase font-bold opacity-60">Fees</span>
                      <span className="text-xs text-yellow-500/90 font-bold tabular-nums">฿{tx.wheelingCharge.toFixed(2)}</span>
                    </div>
                  )}
                </div>

                {/* Time & Actions */}
                <div className="flex flex-col items-end">
                  <div className="flex items-center gap-1.5 mb-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="text-muted-foreground hover:text-foreground transition-colors"><CopyIcon /></button>
                    <button className="text-muted-foreground hover:text-foreground transition-colors"><SendIcon /></button>
                  </div>
                  <span className="text-[10px] font-medium text-muted-foreground tabular-nums">
                    {tx.expiry}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-3 opacity-50">
              <div className="w-12 h-12 rounded-full bg-secondary/20 flex items-center justify-center">
                <FileDown size={24} className="text-muted-foreground" />
              </div>
              <p className="text-sm font-medium">No swap history found</p>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Card Layout */}
      <div className="flex w-full flex-col md:hidden space-y-3 px-4">
        {doneOptioninfos && doneOptioninfos.length > 0 ? (
          doneOptioninfos.map((tx, index) => (
            <Fragment key={tx.transactionID}>
              <div className="bg-secondary/10 rounded-xl p-4 border border-border/40 hover:bg-secondary/20 transition-all active:scale-[0.98]">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 rounded-full ring-2 ring-background ring-offset-1 ring-offset-border relative">
                      <Image
                        src={tx.token.logo}
                        alt={tx.token.name}
                        fill
                        className="rounded-full object-cover"
                      />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold leading-none mb-1">{tx.token.name}</h4>
                      <p className="text-[10px] text-muted-foreground font-mono truncate max-w-[120px]">{tx.transactionID}</p>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest ${tx.transactionType === 'Buy'
                    ? 'bg-green-500/20 text-green-400'
                    : 'bg-red-500/20 text-red-400'
                    }`}>
                    {tx.transactionType}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-4 py-3 border-y border-border/10 mb-3">
                  <div className="flex flex-col">
                    <span className="text-[9px] text-muted-foreground uppercase font-bold mb-0.5">Matched</span>
                    <span className="text-xs font-bold">{tx.quantity?.toFixed(1) ?? '0.0'} kWh</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="text-[9px] text-muted-foreground uppercase font-bold mb-0.5 text-center">Delivered</span>
                    <span className="text-xs font-bold text-green-500">
                      {tx.effectiveEnergy !== undefined && tx.effectiveEnergy !== null
                        ? tx.effectiveEnergy.toFixed(1)
                        : (tx.quantity?.toFixed(1) ?? '0.0')} kWh
                    </span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-[9px] text-muted-foreground uppercase font-bold mb-0.5 text-right">Wheeling</span>
                    <span className="text-xs font-bold text-yellow-500">฿{tx.wheelingCharge?.toFixed(1) ?? '0.0'}</span>
                  </div>
                </div>

                <div className="flex justify-between items-center mt-2">
                  <span className="text-[10px] font-bold text-muted-foreground/60 tabular-nums">
                    {tx.expiry}
                  </span>
                  <div className="flex space-x-4">
                    <button className="text-muted-foreground scale-90"><CopyIcon /></button>
                    <button className="text-muted-foreground scale-90"><SendIcon /></button>
                  </div>
                </div>
              </div>
            </Fragment>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center space-y-2 opacity-40">
            <p className="text-xs font-medium">No recent trades</p>
          </div>
        )}
      </div>
    </div>
  )
})
