import { ArrowDown, ArrowUp } from '@/public/svgs/icons'
import Image from 'next/image'
import { Separator } from './ui/separator'
import { useState } from 'react'
import { usePortfolioPositions } from '@/hooks/usePortfolio'
import { usePortfolioRisk } from '@/hooks/usePortfolioRisk'

export default function WalletPortfolio() {
  const [holdingsOpen, setHoldingsOpen] = useState(false)
  const [optionsOpen, setOptionsOpen] = useState(false)
  const [futuresOpen, setFuturesOpen] = useState(false)

  const { data: positions, isLoading } = usePortfolioPositions()
  const risk = usePortfolioRisk(positions)

  const totalValue = (positions || []).reduce((sum, p) => sum + (p.size * p.strikePrice + p.pnl), 0)

  return (
    <div className="flex w-full flex-col space-y-2">
      {/* Holdings Section */}
      <div className="flex w-full flex-col rounded-sm border p-4 pt-3">
        <div
          className="flex w-full cursor-pointer justify-between"
          onClick={() => setHoldingsOpen(!holdingsOpen)}
        >
          <div className="flex items-center space-x-[6px]">
            <span className="flex h-4 items-center text-sm font-medium text-foreground">
              Holdings
            </span>
            <span className="flex h-4 items-center rounded-[4px] border border-primary px-[6px] py-[5px] text-[10px] text-primary">
              4 Tokens
            </span>
          </div>
          <div className="flex items-center space-x-4 text-secondary-foreground">
            <span className="flex h-4 items-center text-sm font-medium text-foreground">
              $229.38
            </span>
            {holdingsOpen ? <ArrowUp /> : <ArrowDown />}
          </div>
        </div>
        {holdingsOpen && (
          <div className="flex w-full flex-col space-y-4 pt-4">
            <Separator />
            <div className="flex w-full items-center justify-between">
              <div className="flex h-fit items-center space-x-[10px]">
                <Image
                  src="/images/solana.png"
                  alt="solana"
                  height={32}
                  width={32}
                  className="rounded-full"
                />
                <div className="flex flex-col space-y-0.5">
                  <span className="h-4 text-xs font-medium text-foreground">
                    Solana
                  </span>
                  <span className="h-4 text-xs font-medium text-secondary-foreground">
                    0.809 SOL
                  </span>
                </div>
              </div>
              <span className="flex h-6 items-center text-xs font-medium text-secondary-foreground">
                $152.26
              </span>
            </div>
            {/* GridToken */}
            <div className="flex w-full items-center justify-between">
              <div className="flex h-fit items-center space-x-[10px]">
                <Image
                  src="/images/grid.png"
                  alt="grid"
                  height={32}
                  width={32}
                  className="rounded-full"
                />
                <div className="flex flex-col space-y-0.5">
                  <span className="h-4 text-xs font-medium text-foreground">
                    GridToken (Public)
                  </span>
                  <span className="h-4 text-xs font-medium text-secondary-foreground">
                    1,200 GRX
                  </span>
                </div>
              </div>
              <span className="flex h-6 items-center text-xs font-medium text-secondary-foreground">
                $77.12
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Options Section */}
      <div className="flex w-full flex-col rounded-sm border p-4 pt-3">
        <div
          className="flex w-full cursor-pointer justify-between"
          onClick={() => setOptionsOpen(!optionsOpen)}
        >
          <div className="flex items-center space-x-[6px]">
            <span className="flex h-4 items-center text-sm font-medium text-foreground">
              Options
            </span>
            <span className="flex h-4 items-center rounded-[4px] border border-primary px-[6px] py-[5px] text-[10px] text-primary">
              4 Positions
            </span>
          </div>
          <div className="flex items-center space-x-4 text-secondary-foreground">
            <span className="flex h-4 items-center text-sm font-medium text-foreground">
              $529.38
            </span>
            {optionsOpen ? <ArrowUp /> : <ArrowDown />}
          </div>
        </div>
      </div>

      {/* Futures Section */}
      <div className="flex w-full flex-col rounded-sm border p-4 pt-3">
        <div
          className="flex w-full cursor-pointer justify-between"
          onClick={() => setFuturesOpen(!futuresOpen)}
        >
          <div className="flex items-center space-x-[6px]">
            <span className="flex h-4 items-center text-sm font-medium text-foreground">
              Futures
            </span>
            <span className="flex h-4 items-center rounded-[4px] border border-primary px-[6px] py-[5px] text-[10px] text-primary">
              4 Positions
            </span>
          </div>
          <div className="flex items-center space-x-4 text-secondary-foreground">
            <span className="flex h-4 items-center text-sm font-medium text-foreground">
              $129.38
            </span>
            {futuresOpen ? <ArrowUp /> : <ArrowDown />}
          </div>
        </div>
      </div>
    </div>
  )
}

