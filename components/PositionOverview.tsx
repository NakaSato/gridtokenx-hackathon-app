import {
  ExpiryIcon,
  PositionTypeIcon,
  PurchasePriceIcon,
  RedArrowPnl,
  SizeIcon,
  StrikePriceIcon,
  ValueIcon,
} from '@/public/svgs/icons'
import { Calendar, SquarePen } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover'
import { Label } from './ui/label'
import { Calendar as CalendarComponent } from './ui/calendar'
import { useState, memo } from 'react'
import { Button } from './ui/button'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { Input } from './ui/input'

interface PositionOverviewProps {
  type: string
  expiry: string
  size: number
  pnl: number
  strikePrice: number
}

export default memo(function PositionOverview({
  type,
  expiry,
  size,
  pnl,
  strikePrice,
}: PositionOverviewProps) {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)
  const [isExpiry, setIsExpiry] = useState(false)
  const [isSize, setIsSize] = useState(false)
  const [isStrike, setIsStrike] = useState(false)
  const [customDate, setCustomDate] = useState<Date>()

  return (
    <div className="flex w-full flex-col space-y-1">
      <div className="flex w-full justify-between text-sm font-normal text-secondary-foreground">
        <div className="flex items-center space-x-2">
          <SizeIcon />
          <span>Size:</span>
        </div>
        <div className="flex items-center space-x-2">
          <span>{size}</span>
          <Popover open={isSize} onOpenChange={setIsSize}>
            <PopoverTrigger asChild>
              <SquarePen
                size={13}
                className="cursor-pointer text-foreground hover:text-primary"
              />
            </PopoverTrigger>
            <PopoverContent align="end" className="space-y-4 p-3">
              <div className="flex flex-col space-y-2">
                <Label>New Size</Label>
                <Input className="rounded-sm border-border p-2 text-xs" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Pay In</Label>
                <Input className="rounded-sm border-border p-2 text-xs" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" onClick={() => setIsSize(false)}>
                  Cancel
                </Button>
                <Button>Confirm</Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="flex w-full justify-between text-sm font-normal text-secondary-foreground">
        <div className="flex items-center space-x-2">
          <StrikePriceIcon />
          <span>Strike Price:</span>
        </div>
        <div className="flex items-center space-x-2">
          <span>{strikePrice}</span>
          <Popover open={isStrike} onOpenChange={setIsStrike}>
            <PopoverTrigger asChild>
              <SquarePen
                size={13}
                className="cursor-pointer text-foreground hover:text-primary"
              />
            </PopoverTrigger>
            <PopoverContent align="end" className="space-y-4 p-3">
              <div className="flex flex-col space-y-2">
                <Label className="text-xs">New Strike Price</Label>
                <Input className="rounded-sm border-border p-2 text-xs" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Pay In</Label>
                <Input className="rounded-sm border-border p-2 text-xs" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" onClick={() => setIsStrike(false)}>
                  Cancel
                </Button>
                <Button>Confirm</Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="flex w-full justify-between text-sm font-normal text-secondary-foreground">
        <div className="flex items-center space-x-2">
          <ExpiryIcon />
          <span>Expiry:</span>
        </div>
        <div className="flex items-center space-x-2">
          <span>{expiry}</span>
          <Popover open={isExpiry} onOpenChange={setIsExpiry}>
            <PopoverTrigger asChild>
              <SquarePen
                size={13}
                className="cursor-pointer text-foreground hover:text-primary"
              />
            </PopoverTrigger>
            <PopoverContent align="end" className="space-y-4 p-3">
              <div className="space-y-2">
                <Label className="text-xs">New Expiration</Label>
                <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant={'outline'}
                      className={cn(
                        'w-full justify-start border-border p-2 text-left text-xs font-normal hover:bg-inherit hover:text-secondary-foreground [&_svg]:size-3',
                        !customDate && 'text-muted-foreground'
                      )}
                    >
                      <Calendar className="h-3 w-3" />
                      {customDate ? format(customDate, 'PPP') : 'Pick a date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={customDate}
                      onSelect={(date) => {
                        setCustomDate(date)
                        setIsCalendarOpen(false)
                      }}
                      initialFocus
                      disabled={(date) => date < new Date()}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Pay In</Label>
                <Input className="rounded-sm border-border p-2 text-xs" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" onClick={() => setIsExpiry(false)}>
                  Cancel
                </Button>
                <Button>Confirm</Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="flex w-full justify-between text-sm font-normal text-secondary-foreground">
        <div className="flex items-center space-x-2">
          <PurchasePriceIcon />
          <span>Purchase Price:</span>
        </div>
        <span>value</span>
      </div>

      <div className="flex w-full justify-between text-sm font-normal text-secondary-foreground">
        <div className="flex items-center space-x-2">
          <ValueIcon />
          <span>Current Price:</span>
        </div>
        <span>value</span>
      </div>

      <div className="flex w-full justify-between text-sm font-normal text-[#FF6889]">
        <div className="flex items-center space-x-2">
          <RedArrowPnl />
          <span>P&L:</span>
        </div>
        <span>{pnl}</span>
      </div>
    </div>
  )
})
