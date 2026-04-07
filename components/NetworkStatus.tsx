'use client'

import { Activity } from 'lucide-react'
import { useWebSocket } from '@/hooks/useWebSocket'

export function NetworkStatus() {
    // We can monitor the public 'orderbook' channel to gauge global backend health
    const { connected } = useWebSocket('orderbook', undefined, true, true)

    return (
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-sm bg-secondary/50 text-xs font-medium text-secondary-foreground border border-transparent hover:border-border transition-colors cursor-help group relative">
            <span className="relative flex h-2 w-2">
                {connected ? (
                    <>
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </>
                ) : (
                    <>
                        <span className="animate-pulse absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-500"></span>
                    </>
                )}
            </span>
            <span>{connected ? 'Mainnet' : 'Connecting...'}</span>
            <div className="absolute top-full right-0 mt-2 hidden group-hover:block bg-popover text-popover-foreground text-[10px] p-2 rounded-sm border shadow-md whitespace-nowrap z-50">
                <div className="flex items-center justify-between gap-4 mb-1">
                    <span>WebSocket</span>
                    <span className={`font-mono ${connected ? 'text-green-500' : 'text-yellow-500'}`}>
                        {connected ? 'Standard' : 'Handshake'}
                    </span>
                </div>
            </div>
        </div>
    )
}
