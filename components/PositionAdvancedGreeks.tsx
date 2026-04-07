import {
  CharmIcon,
  ColorIcon,
  DualDeltaIcon,
  DualGammaIcon,
  ParmicharmaIcon,
  SpeedIcon,
  UltimaIcon,
  VannaIcon,
  VeraIcon,
  VetaIcon,
  VommaIcon,
  WIcon,
  ZommaIcon,
} from '@/public/svgs/icons'
import { Button } from './ui/button'
import { Dialog, DialogTitle, DialogContent, DialogTrigger } from './ui/dialog'
import { useState } from 'react'
import { XIcon } from 'lucide-react'

export default function PositionAdvancedGreeks() {
  const [isOpen, setIsOpen] = useState(false)
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="h-fit w-fit bg-inherit p-0 shadow-none">
          <span className="text-sm font-medium text-primary">
            Show Advanced Greeks
          </span>
        </Button>
      </DialogTrigger>
      <DialogContent className="flex h-full w-full flex-col gap-0 space-y-3 bg-accent px-3 py-5 sm:rounded-sm md:h-auto md:w-[420px] md:space-y-[14px]">
        <DialogTitle className="flex h-fit w-full items-center justify-between p-2 md:justify-start md:py-0">
          <span className="text-base font-medium text-foreground">
            Advanced Greeks
          </span>
          <Button
            className="rounded-[12px] border bg-secondary p-[9px] shadow-none md:hidden [&_svg]:size-[18px]"
            onClick={() => setIsOpen(false)}
          >
            <XIcon size={18} className="text-secondary-foreground" />
          </Button>
        </DialogTitle>
        <div className="flex w-full flex-col space-y-3 md:space-y-2">
          <div className="w-full px-2">
            <div className="flex w-full flex-col space-y-[6px] rounded-sm border p-3">
              <h2 className="text-sm font-medium text-foreground">
                Second Order
              </h2>
              <div className="flex w-full flex-col">
                <div className="flex w-full items-center space-x-2">
                  <VannaIcon />
                  <div className="flex w-full justify-between">
                    <span className="text-sm font-normal text-secondary-foreground">
                      Vanna
                    </span>
                    <span className="text-sm font-medium text-secondary-foreground">
                      0.7914
                    </span>
                  </div>
                </div>
                <div className="flex w-full items-center space-x-2">
                  <CharmIcon />
                  <div className="flex w-full justify-between">
                    <span className="text-sm font-normal text-secondary-foreground">
                      Charm
                    </span>
                    <span className="text-sm font-medium text-secondary-foreground">
                      0.0723
                    </span>
                  </div>
                </div>
                <div className="flex w-full items-center space-x-2">
                  <VommaIcon />
                  <div className="flex w-full justify-between">
                    <span className="text-sm font-normal text-secondary-foreground">
                      Vomma
                    </span>
                    <span className="text-sm font-medium text-secondary-foreground">
                      -1.1042
                    </span>
                  </div>
                </div>
                <div className="flex w-full items-center space-x-2">
                  <VeraIcon />
                  <div className="flex w-full justify-between">
                    <span className="text-sm font-normal text-secondary-foreground">
                      Vera
                    </span>
                    <span className="text-sm font-medium text-secondary-foreground">
                      0.2471
                    </span>
                  </div>
                </div>
                <div className="flex w-full items-center space-x-2">
                  <VetaIcon />
                  <div className="flex w-full justify-between">
                    <span className="text-sm font-normal text-secondary-foreground">
                      Veta
                    </span>
                    <span className="text-sm font-medium text-secondary-foreground">
                      0.9812
                    </span>
                  </div>
                </div>
                <div className="flex w-full items-center space-x-2">
                  <DualDeltaIcon />
                  <div className="flex w-full justify-between">
                    <span className="text-sm font-normal text-secondary-foreground">
                      Dual Delta
                    </span>
                    <span className="text-sm font-medium text-secondary-foreground">
                      0.5489
                    </span>
                  </div>
                </div>
                <div className="flex w-full items-center space-x-2">
                  <DualGammaIcon />
                  <div className="flex w-full justify-between">
                    <span className="text-sm font-normal text-secondary-foreground">
                      Dual Gamma
                    </span>
                    <span className="text-sm font-medium text-secondary-foreground">
                      0.5489
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="w-full px-2">
            <div className="flex w-full flex-col space-y-[6px] rounded-sm border p-3">
              <h2 className="text-sm font-medium text-foreground">
                Third Order
              </h2>
              <div className="flex w-full flex-col">
                <div className="flex w-full items-center space-x-2">
                  <SpeedIcon />
                  <div className="flex w-full justify-between">
                    <span className="text-sm font-normal text-secondary-foreground">
                      Speed
                    </span>
                    <span className="text-sm font-medium text-secondary-foreground">
                      0.7914
                    </span>
                  </div>
                </div>
                <div className="flex w-full items-center space-x-2">
                  <ZommaIcon />
                  <div className="flex w-full justify-between">
                    <span className="text-sm font-normal text-secondary-foreground">
                      Zomma
                    </span>
                    <span className="text-sm font-medium text-secondary-foreground">
                      0.0723
                    </span>
                  </div>
                </div>
                <div className="flex w-full items-center space-x-2">
                  <ColorIcon />
                  <div className="flex w-full justify-between">
                    <span className="text-sm font-normal text-secondary-foreground">
                      Color
                    </span>
                    <span className="text-sm font-medium text-secondary-foreground">
                      -1.1042
                    </span>
                  </div>
                </div>
                <div className="flex w-full items-center space-x-2">
                  <UltimaIcon />
                  <div className="flex w-full justify-between">
                    <span className="text-sm font-normal text-secondary-foreground">
                      Ultima
                    </span>
                    <span className="text-sm font-medium text-secondary-foreground">
                      0.2471
                    </span>
                  </div>
                </div>
                <div className="flex w-full items-center space-x-2">
                  <ParmicharmaIcon />
                  <div className="flex w-full justify-between">
                    <span className="text-sm font-normal text-secondary-foreground">
                      Parmicharma
                    </span>
                    <span className="text-sm font-medium text-secondary-foreground">
                      0.9812
                    </span>
                  </div>
                </div>
                <div className="flex w-full items-center space-x-2">
                  <WIcon />
                  <div className="flex w-full justify-between">
                    <span className="text-sm font-normal text-secondary-foreground">
                      W
                    </span>
                    <span className="text-sm font-medium text-secondary-foreground">
                      0.9812
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="hidden w-full justify-end md:flex">
          <Button
            className="rounded-sm border bg-inherit px-4 py-2 text-sm text-foreground shadow-none"
            onClick={() => setIsOpen(false)}
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
