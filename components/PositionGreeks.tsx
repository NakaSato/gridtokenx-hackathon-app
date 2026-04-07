import {
  DeltaIcon,
  GammaIcon,
  RhoIcon,
  ThetaIcon,
  VegaIcon,
} from '@/public/svgs/icons'
import { Button } from './ui/button'
import PositionAdvancedGreeks from './PositionAdvancedGreeks'
import { memo } from 'react'

interface PositionGreeksProps {
  delta: number
  gamma: number
  theta: number
  vega: number
}

export default memo(function PositionGreeks({
  delta,
  gamma,
  theta,
  vega,
}: PositionGreeksProps) {
  return (
    <div className="flex w-full flex-col space-y-4">
      <div className="flex w-full flex-col space-y-1">
        <div className="flex w-full justify-between text-sm font-normal text-secondary-foreground">
          <div className="flex items-center space-x-2">
            <DeltaIcon />
            <span>Delta: </span>
          </div>
          <span>{delta}</span>
        </div>
        <div className="flex w-full justify-between text-sm font-normal text-secondary-foreground">
          <div className="flex items-center space-x-2">
            <GammaIcon />
            <span>Gamma: </span>
          </div>
          <span>{gamma}</span>
        </div>
        <div className="flex w-full justify-between text-sm font-normal text-secondary-foreground">
          <div className="flex items-center space-x-2">
            <ThetaIcon />
            <span>Theta: </span>
          </div>
          <span>{theta}</span>
        </div>
        <div className="flex w-full justify-between text-sm font-normal text-secondary-foreground">
          <div className="flex items-center space-x-2">
            <VegaIcon />
            <span>Vega: </span>
          </div>
          <span>{vega}</span>
        </div>
        <div className="flex w-full justify-between text-sm font-normal text-secondary-foreground">
          <div className="flex items-center space-x-2">
            <RhoIcon />
            <span>Rho: </span>
          </div>
          <span>0.9812</span>
        </div>
      </div>
      <PositionAdvancedGreeks />
    </div>
  )
})
