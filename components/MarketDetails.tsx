import { ChevronDown, XIcon } from 'lucide-react'
import { Button } from './ui/button'
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from './ui/dialog'
import { useState } from 'react'
import Image from 'next/image'
import { DropdownMenu, DropdownMenuTrigger } from './ui/dropdown-menu'
import { DollarIcon, InfoIcon, PythIcon } from '@/public/svgs/icons'
import { formatPrice } from '@/utils/formatter'
import { Separator } from './ui/separator'

interface MarketDetailsProps {
  logo: string
  symbol: string
  tokenPrice: number
  high: number
  low: number
}

export default function MarketDetails({
  logo,
  symbol,
  tokenPrice,
  high,
  low,
}: MarketDetailsProps) {
  const [isOpen, setIsOpen] = useState(false)
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger className="mr-2 text-xs font-medium text-primary sm:mr-0">
        Market Details
      </DialogTrigger>
      <DialogContent className="flex h-full w-full flex-col space-y-3 bg-accent p-0 sm:h-auto sm:max-w-md md:max-w-2xl">
        <DialogTitle className="hidden">Market Details</DialogTitle>
        <div className="flex w-full justify-between px-3 py-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="flex items-center space-x-[10px]">
                <Image
                  src={logo}
                  alt={symbol!}
                  width={32}
                  height={32}
                  className="rounded-full"
                />
                <span className="text-sm font-medium text-foreground">
                  {symbol}/THB
                </span>
              </div>
            </DropdownMenuTrigger>
          </DropdownMenu>

          <Button
            className="rounded-sm bg-secondary p-[9px] shadow-none [&_svg]:size-[18px]"
            onClick={() => setIsOpen(false)}
          >
            <XIcon size={18} className="text-secondary-foreground" />
          </Button>
        </div>
        <div className="flex flex-col p-4">
          <div className="flex w-full justify-between">
            <span className="text-base font-normal text-secondary-foreground">
              Price
            </span>
            <div className="flex items-center space-x-[10px]">
              <DollarIcon />
              <span className="text-base font-medium">
                ${tokenPrice ? formatPrice(tokenPrice) : 'loading'}
              </span>
            </div>
          </div>
          <Separator className="my-4" />
          <div className="flex w-full justify-between">
            <div className="flex items-center space-x-2 text-secondary-foreground">
              <span className="text-base font-normal">Oracle Price</span>
              <InfoIcon />
            </div>
            <div className="flex items-center space-x-2">
              <PythIcon />
              <span className="text-base font-medium">$180.266</span>
            </div>
          </div>
          <Separator className="my-4" />
          <div className="flex w-full justify-between">
            <span className="text-base font-normal text-secondary-foreground">
              Open Interest
            </span>
            <span className="text-base font-medium">529K BTC</span>
          </div>
          <Separator className="my-4" />
          <div className="flex w-full justify-between">
            <span className="text-base font-normal text-secondary-foreground">
              24h high
            </span>
            <span className="text-base font-medium">
              ${high ? formatPrice(high) : 'loading'}
            </span>
          </div>
          <Separator className="my-4" />
          <div className="flex w-full justify-between">
            <span className="text-base font-normal text-secondary-foreground">
              24h low
            </span>
            <span className="text-base font-medium">
              ${low ? formatPrice(low) : 'loading'}
            </span>
          </div>
          <Separator className="my-4" />
          <div className="flex w-full justify-between">
            <span className="text-base font-normal text-secondary-foreground">
              24h volume
            </span>
            <span className="text-base font-medium">$</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
