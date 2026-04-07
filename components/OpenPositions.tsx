import Image from 'next/image'
import { Badge } from './ui/badge'
import { useState, memo } from 'react'
import { Tabs, TabsList, TabsTrigger } from './ui/tabs'
import { Button } from './ui/button'
import PositionOverview from './PositionOverview'
import PositionGreeks from './PositionGreeks'
import { ArrowDown, ArrowUp, SendIcon } from '@/public/svgs/icons'
import PositionDetails from './PositionDetails'
import { Separator } from './ui/separator'

interface OpenPositionProps {
  index: number
  token: string
  logo: string
  symbol: string
  strikePrice: number
  type: string
  expiry: string
  size: number
  pnl: number
  greeks: {
    delta: number
    gamma: number
    theta: number
    vega: number
  }
  onExercise: () => void
}

export default memo(function OpenPositions({
  token,
  logo,
  symbol,
  type,
  expiry,
  size,
  pnl,
  greeks,
  strikePrice,
  index,
  onExercise,
}: OpenPositionProps) {
  const [isOpen, setIsOpen] = useState<boolean>(false)
  const [activeTab, setActiveTab] = useState<string>('Overview')
  return (
    <div className="flex w-full flex-col rounded-sm bg-accent">
      <div
        className="flex w-full cursor-pointer items-center justify-between px-4 py-3"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center space-x-[6px]">
          <Image
            src={logo}
            alt={token}
            width={16}
            height={16}
            className="h-4 w-4 rounded-full"
          />
          <span className="text-sm font-medium text-foreground">{symbol}</span>
          <Badge className="flex h-3 w-7 items-center justify-center rounded-[3px] border-none bg-gradient-primary px-1 py-[3px] text-[8px] font-semibold text-black">
            {type}
          </Badge>
        </div>
        {isOpen ? (
          <span className="text-secondary-foreground">
            <ArrowUp />
          </span>
        ) : (
          <span className="text-secondary-foreground">
            <ArrowDown />
          </span>
        )}
      </div>
      {isOpen && (
        <div className="w-full space-y-4 px-4 pb-4">
          <div className="flex w-full justify-center md:justify-between">
            <Tabs defaultValue={activeTab}>
              <TabsList className="flex bg-inherit p-0 text-sm font-medium text-secondary-foreground md:space-x-3">
                <TabsTrigger
                  value="Overview"
                  className="w-full rounded-sm px-5 py-2 data-[state=active]:bg-background data-[state=active]:text-foreground"
                  onClick={() => setActiveTab('Overview')}
                >
                  Overview
                </TabsTrigger>
                <TabsTrigger
                  value="Greeks"
                  className="w-full rounded-sm px-5 py-2 data-[state=active]:bg-background data-[state=active]:text-foreground"
                  onClick={() => setActiveTab('Greeks')}
                >
                  Greeks
                </TabsTrigger>
                <TabsTrigger
                  value="Details"
                  className="w-full rounded-sm px-5 py-2 data-[state=active]:bg-background data-[state=active]:text-foreground"
                  onClick={() => setActiveTab('Details')}
                >
                  Details
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="hidden space-x-3 md:flex">
              <Button className="h-fit w-fit rounded-sm bg-secondary p-2">
                <SendIcon />
              </Button>
              <Button
                className="h-fit w-fit rounded-sm bg-secondary px-[10px] py-[6px] text-sm font-normal text-secondary-foreground"
                onClick={onExercise}
              >
                Exercise
              </Button>
            </div>
          </div>
          {activeTab === 'Overview' && (
            <PositionOverview
              type={type}
              expiry={expiry}
              size={size}
              pnl={pnl}
              strikePrice={strikePrice}
            />
          )}
          {activeTab === 'Greeks' && (
            <PositionGreeks
              delta={greeks.delta}
              gamma={greeks.gamma}
              theta={greeks.theta}
              vega={greeks.vega}
            />
          )}
          {activeTab === 'Details' && <PositionDetails type={type} />}
          <Separator className="my-4 md:hidden" />
          <div className="flex space-x-3 md:hidden">
            <Button className="h-fit w-fit rounded-sm bg-secondary p-2">
              <SendIcon />
            </Button>
            <Button className="h-fit w-fit rounded-sm bg-secondary px-[10px] py-[6px] text-sm font-normal text-secondary-foreground">
              Exercise
            </Button>
          </div>
        </div>
      )}
    </div>
  )
})
