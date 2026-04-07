import { Separator } from './ui/separator'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from './ui/dropdown-menu'
import { cn } from '@/lib/utils'
import {
  BoostIcon,
  GrayPointsIcon,
  PointsIcon,
  RankingIcon,
} from '@/public/svgs/icons'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Button } from './ui/button'
import { Dialog, DialogContent, DialogTitle } from './ui/dialog'
import { DialogTrigger } from '@radix-ui/react-dialog'
import { XIcon } from 'lucide-react'

interface PointsDropDownProps {
  setActive: (state: string) => void
}

export default function PointsDropDown({ setActive }: PointsDropDownProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState<boolean>(false)
  const [isMobileOpen, setIsMobileOpen] = useState<boolean>(false)
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
  }

  const handleClickPoints = () => {
    router.push('/leaderboards')
    setIsOpen(false)
    setIsMobileOpen(false)
    setActive('leaderboards')
  }
  return (
    <div>
      <DropdownMenu open={isOpen} onOpenChange={handleOpenChange}>
        <DropdownMenuTrigger asChild className="hidden sm:flex">
          <div
            className={cn(
              isOpen
                ? 'border-[#FEEDCB] bg-[rgb(254,237,203,0.2)]'
                : 'border bg-inherit',
              'flex cursor-pointer items-center justify-center rounded-sm border p-2 hover:border-[#FEEDCB]/55'
            )}
          >
            <PointsIcon />
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="hidden w-[280px] flex-col space-y-4 rounded-sm bg-accent p-5 sm:flex"
        >
          <div className="flex w-full flex-col rounded-sm border p-3">
            <div className="flex w-full flex-col items-center justify-center space-y-[6px]">
              <span className="text-xs font-medium text-secondary-foreground">
                Season 1 Points
              </span>
              <span className="text-2xl font-medium text-primary">
                1,953,676
              </span>
              <div className="flex w-full items-center justify-center gap-1">
                <BoostIcon />
                <span className="text-xs font-medium text-foreground">
                  6.9x Boost
                </span>
              </div>
            </div>
            <div className="w-full py-3">
              <Separator />
            </div>
            <div className="flex w-full flex-col space-y-3">
              <div className="flex w-full items-center justify-between">
                <div className="flex items-center gap-1">
                  <RankingIcon />
                  <span className="text-xs font-medium text-secondary-foreground">
                    Ranking
                  </span>
                </div>
                <span className="text-xs font-medium text-foreground">
                  #16189
                </span>
              </div>
              <div className="flex w-full items-center justify-between">
                <div className="flex items-center gap-1">
                  <GrayPointsIcon />
                  <span className="text-xs font-medium text-secondary-foreground">
                    Points Per Day
                  </span>
                </div>
                <span className="text-xs font-medium text-foreground">0</span>
              </div>
            </div>
          </div>

        </DropdownMenuContent>
      </DropdownMenu>
      <Dialog open={isMobileOpen} onOpenChange={setIsMobileOpen}>
        <DialogTrigger asChild className="sm:hidden">
          <div
            className={cn(
              isMobileOpen
                ? 'border-[#FEEDCB] bg-[rgb(254,237,203,0.2)]'
                : 'border bg-inherit',
              'flex cursor-pointer items-center justify-center rounded-[12px] border p-2 hover:border-[#FEEDCB] hover:bg-[rgb(254,237,203,0.2)]'
            )}
          >
            <PointsIcon />
          </div>
        </DialogTrigger>
        <DialogContent className="flex h-full w-full flex-col justify-between gap-0 space-y-3 border-none bg-accent px-3 py-0 outline outline-accent">
          <div className="flex w-full items-center justify-between px-0 py-2">
            <DialogTitle className="text-base font-medium text-foreground">
              Points
            </DialogTitle>
            <Button
              className="w-9 rounded-[12px] border bg-secondary p-[9px] shadow-none [&_svg]:size-[18px]"
              onClick={() => setIsMobileOpen(false)}
            >
              <XIcon size={18} className="text-secondary-foreground" />
            </Button>
          </div>
          <div className="flex h-full w-full flex-col space-y-3">
            <div className="w-full rounded-[12px] bg-background p-4">
              <div className="flex w-full flex-col items-center justify-center space-y-[6px]">
                <span className="text-xs font-medium text-secondary-foreground">
                  Season 1 Points
                </span>
                <span className="text-2xl font-medium text-primary">
                  1,953,676
                </span>
                <div className="flex w-full items-center justify-center gap-1">
                  <BoostIcon />
                  <span className="text-xs font-medium text-foreground">
                    6.9x Boost
                  </span>
                </div>
              </div>
              <div className="w-full py-4">
                <Separator />
              </div>
              <div className="flex w-full flex-col space-y-4">
                <div className="flex w-full items-center justify-between">
                  <div className="flex items-center gap-1">
                    <RankingIcon />
                    <span className="text-xs font-medium text-secondary-foreground">
                      Ranking
                    </span>
                  </div>
                  <span className="text-xs font-medium text-foreground">
                    #16189
                  </span>
                </div>
                <div className="flex w-full items-center justify-between">
                  <div className="flex items-center gap-1">
                    <GrayPointsIcon />
                    <span className="text-xs font-medium text-secondary-foreground">
                      Points Per Day
                    </span>
                  </div>
                  <span className="text-xs font-medium text-foreground">0</span>
                </div>
              </div>
            </div>
          </div>
          <div className="w-full pb-10">

          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
