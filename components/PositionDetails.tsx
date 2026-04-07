import {
  PositionTypeIcon,
  PriceIcon,
  PurchaseDateIcon,
  PurchasePriceIcon,
} from '@/public/svgs/icons'
import Tpsl from './Tpsl'
import { memo } from 'react'

interface PositionDetailsProps {
  type: string
}

export default memo(function PositionDetails({ type }: PositionDetailsProps) {
  return (
    <div className="flex w-full flex-col space-y-1">
      <div className="flex w-full justify-between text-sm font-normal text-secondary-foreground">
        <div className="flex items-center space-x-2">
          <PositionTypeIcon />
          <span>Option Type:</span>
        </div>
        <span>{type}</span>
      </div>

      <div className="flex w-full justify-between text-sm font-normal text-secondary-foreground">
        <div className="flex items-center space-x-2">
          <PurchaseDateIcon />
          <span>Purchase Date</span>
        </div>
        <span>10/30/2024</span>
      </div>

      <div className="flex w-full justify-between text-sm font-normal text-secondary-foreground">
        <div className="flex items-center space-x-2">
          <PriceIcon />
          <span>Paid</span>
        </div>
        <span>---</span>
      </div>

      <div className="flex w-full justify-between text-sm font-normal text-secondary-foreground">
        <div className="flex items-center space-x-2">
          <PurchaseDateIcon />
          <span>TPSL</span>
        </div>
        <div className="flex items-center space-x-2">
          <span>---</span>
          <Tpsl />
        </div>
      </div>
    </div>
  )
})
