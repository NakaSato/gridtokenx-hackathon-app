'use client'

import Image from 'next/image'
import { ArrowDown, ArrowUp, TableColumnsSplit, TrendingUp, Clock, Users } from 'lucide-react'
import { PythIcon } from '@/public/svgs/icons'
import { formatPrice } from '@/utils/formatter'
import { memo } from 'react'
import MarketDetails from './MarketDetails'
import { Button } from './ui/button'
import { useRouter } from 'next/navigation'
import { Badge } from './ui/badge'
import { cn } from '@/lib/utils'

interface TradingViewTopNavProps {
  symbol: string | null
  pythSymbol: string
  logo: string
  priceData: any
  marketData: any
  priceLoading: boolean
  marketLoading: boolean
  type: string
}

export default memo(function TradingViewTopNav({
  symbol,
  pythSymbol,
  logo,
  priceData,
  marketData,
  priceLoading,
  marketLoading,
  type,
}: TradingViewTopNavProps) {
  const router = useRouter()

  return (
    <div className="flex w-full flex-col border rounded-lg bg-background/50 backdrop-blur-sm lg:flex-row lg:items-center lg:justify-between lg:px-4 py-2 gap-4">
      {/* Left Section: Token Info & Actions */}
      <div className="flex items-center gap-4">
        {/* Token Identity */}
        <div className="flex items-center gap-3 pr-4 border-r border-border/50">
          <div className="relative h-10 w-10 overflow-hidden rounded-full ring-2 ring-background shadow-sm">
            <Image
              src={logo}
              alt={symbol!}
              fill
              className="object-cover"
            />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold tracking-tight text-foreground">
                {symbol}/USDC
              </span>
              <Badge variant="outline" className="ml-1 h-5 px-1.5 py-0 text-[10px] font-medium text-muted-foreground border-border/50 bg-secondary/30">
                PERP
              </Badge>
            </div>
            <a
              href={`https://pyth.network/price-feeds/${pythSymbol}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 opacity-70 hover:opacity-100 transition-opacity w-fit"
            >
              <div className="h-3.5 w-3.5"><PythIcon /></div>
              <span className="text-xs font-medium text-muted-foreground">Oracle Price</span>
            </a>
          </div>
        </div>

        {/* Price Display */}
        <div className="flex flex-col">
          <span className="text-2xl font-bold font-mono tracking-tight text-foreground">
            {priceData.price ? formatPrice(priceData.price) : priceLoading ? "..." : "N/A"}
          </span>
          <span className={cn("flex items-center text-xs font-medium", "text-green-500")}>
            <ArrowUp className="w-3 h-3 mr-0.5" /> +2.45%
          </span>
        </div>
      </div>

      {/* Middle Section: Market Stats */}
      <div className="hidden lg:flex items-center gap-6 xl:gap-8 overflow-x-auto no-scrollbar">
        <StatItem
          label="24h High"
          value={marketData.high24h ? `$${formatPrice(marketData.high24h)}` : "N/A"}
          loading={marketLoading}
        />
        <StatItem
          label="24h Low"
          value={marketData.low24h ? `$${formatPrice(marketData.low24h)}` : "N/A"}
          loading={marketLoading}
        />
        <StatItem
          label="24h Volume"
          value={marketData.volume24h ? `$${formatPrice(marketData.volume24h)}` : "N/A"}
          loading={marketLoading}
        />

        {/* Futures Specific Metrics */}
        {type === 'futures' && (
          <>
            <div className="h-8 w-px bg-border/50 hidden xl:block" />
            <StatItem
              label="Funding / 8h"
              value="0.0042%"
              loading={false}
              subValue="03:22:10"
            />
            <StatItem
              label="Open Interest"
              value="$12.5M"
              loading={false}
            />
          </>
        )}

        {/* Sentiment / Ratio */}
        <div className="h-8 w-px bg-border/50 hidden xl:block" />

        <div className="flex flex-col gap-1.5 min-w-[100px]">
          <div className="flex justify-between text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
            <span className="text-green-500">L 60%</span>
            <span className="text-red-500">40% S</span>
          </div>
          <div className="h-1.5 w-full flex rounded-full overflow-hidden bg-secondary">
            <div className="h-full bg-green-500 w-[60%]" />
            <div className="h-full bg-red-500 w-[40%]" />
          </div>
        </div>
      </div>

      {/* Right Section: Actions */}
      <div className="hidden lg:flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "h-9 gap-2 text-xs font-medium text-muted-foreground hover:text-foreground",
            type === 'futures' && "bg-secondary text-foreground"
          )}
          onClick={() => router.push(type === 'futures' ? '/' : '/futures')}
        >
          <TrendingUp className="h-4 w-4" />
          {type === 'futures' ? 'Spot Trading' : 'Futures Trading'}
        </Button>
      </div>

      {/* Mobile Layout Fallback */}
      <div className="flex w-full justify-between px-4 lg:hidden">
        <MarketDetails
          logo={logo}
          symbol={symbol!}
          tokenPrice={priceData.price}
          high={marketData.high24h}
          low={marketData.low24h}
        />
      </div>
    </div>
  )
})

function StatItem({ label, value, loading, subValue }: { label: string, value: string, loading: boolean, subValue?: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-0.5 whitespace-nowrap">
        {label}
      </span>
      <div className="flex items-baseline gap-1.5">
        <span className="text-sm font-medium font-mono text-foreground whitespace-nowrap">
          {loading ? "..." : value}
        </span>
        {subValue && (
          <span className="text-[10px] font-mono text-muted-foreground">
            {subValue}
          </span>
        )}
      </div>
    </div>
  )
}
