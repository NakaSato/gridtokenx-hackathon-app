import { XIcon } from 'lucide-react'
import { Button } from './ui/button'
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from './ui/dialog'
import { useState } from 'react'
import solscan from '@/public/images/solscan.png'
import { Label } from './ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select'
import {
  ArrowDown,
  GreenCircleIcon,
  MoonIcon,
  PurpleCircleIcon,
  SunIcon,
} from '@/public/svgs/icons'
import { cn } from '@/lib/utils'
import Image from 'next/image'
import { Input } from './ui/input'
import { useTheme } from 'next-themes'

export default function SettingsMobile() {
  const [explorer, setExplorer] = useState<string>('Solscan')
  const [endpoint, setEndpoint] = useState<string>('Triton')
  const [isOpen, setIsOpen] = useState(false)
  const { theme, setTheme } = useTheme()

  const handleExplorer = (value: string) => {
    if (explorer !== value) {
      setExplorer(value)
    }
  }

  const handleEndPoint = (value: string) => {
    if (endpoint !== value) {
      setEndpoint(value)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild className="hidden lg:flex">
        <Button className="justify-start rounded-[12px] bg-accent text-secondary-foreground">
          Settings
        </Button>
      </DialogTrigger>
      <DialogContent className="flex h-full w-full flex-col gap-0 space-y-5 bg-accent p-0 px-3">
        <div className="flex w-full flex-col space-y-3">
          <div className="flex w-full items-center justify-between border-b py-2">
            <DialogTitle className="text-base font-medium">
              Settings
            </DialogTitle>
            <Button
              className="rounded-[12px] border bg-secondary p-[9px] shadow-none [&_svg]:size-[18px]"
              onClick={() => setIsOpen(false)}
            >
              <XIcon size={18} className="text-secondary-foreground" />
            </Button>
          </div>
          <Label className="text-xs font-medium">Language</Label>
          <Select>
            <SelectTrigger className="flex w-full justify-between bg-secondary px-3 py-2 text-xs text-foreground">
              <SelectValue placeholder="English" />
              <span className="text-secondary-foreground">
                <ArrowDown />
              </span>
            </SelectTrigger>
            <SelectContent align="center" className="w-fit bg-secondary">
              <SelectItem className="text-xs text-foreground" value="eng">
                English
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex w-full flex-col space-y-3">
          <Label className="text-xs font-medium text-foreground">
            Preferred Explorer
          </Label>
          <div className="flex space-x-3">
            <Button
              className={cn(
                explorer === 'Solscan'
                  ? 'border-primary'
                  : 'border-transparent',
                'flex h-fit w-full items-center gap-1 rounded-[8px] border bg-secondary px-[10px] py-2 shadow-none hover:border-primary'
              )}
              onClick={() => handleExplorer('Solscan')}
            >
              <Image
                src={solscan}
                alt="solscan"
                width={13}
                height={13}
                className="rounded-full"
              />
              <span className="text-xs font-normal text-foreground">
                Solscan
              </span>
            </Button>
            <Button
              className={cn(
                explorer === 'Explorer'
                  ? 'border-primary'
                  : 'border-transparent',
                'flex h-fit w-full items-center gap-1 rounded-[8px] border bg-secondary px-[10px] py-2 shadow-none hover:border-primary'
              )}
              onClick={() => handleExplorer('Explorer')}
            >
              <Image
                src={solscan}
                alt="solscan"
                width={13}
                height={13}
                className="rounded-full"
              />
              <span className="text-xs font-normal text-foreground">
                Explorer
              </span>
            </Button>
            <Button
              className={cn(
                explorer === 'FM' ? 'border-primary' : 'border-transparent',
                'flex h-fit w-full items-center gap-1 rounded-[8px] border bg-secondary px-[10px] py-2 shadow-none hover:border-primary'
              )}
              onClick={() => handleExplorer('FM')}
            >
              <Image
                src={solscan}
                alt="solscan"
                width={13}
                height={13}
                className="rounded-full"
              />
              <span className="text-xs font-normal text-foreground">
                Solana FM
              </span>
            </Button>
          </div>
        </div>
        <div className="flex w-full flex-col space-y-3">
          <Label className="text-xs font-medium text-foreground">
            RPC Endpoint
          </Label>
          <div className="flex space-x-3">
            <Button
              className={cn(
                endpoint === 'Triton' ? 'border-primary' : 'border-transparent',
                'flex h-fit w-full items-center gap-1 rounded-[8px] border bg-secondary px-[10px] py-2 shadow-none hover:border-primary'
              )}
              onClick={() => handleEndPoint('Triton')}
            >
              <span className="text-xs font-normal text-foreground">
                Triton
              </span>
            </Button>
            <Button
              className={cn(
                endpoint === 'Helius' ? 'border-primary' : 'border-transparent',
                'flex h-fit w-full items-center gap-1 rounded-[8px] border bg-secondary px-[10px] py-2 shadow-none hover:border-primary'
              )}
              onClick={() => handleEndPoint('Helius')}
            >
              <span className="text-xs font-normal text-foreground">
                Helius
              </span>
            </Button>
            <Button
              className={cn(
                endpoint === 'Custom' ? 'border-primary' : 'border-transparent',
                'flex h-fit w-full items-center gap-1 rounded-[8px] border bg-secondary px-[10px] py-2 shadow-none hover:border-primary'
              )}
              onClick={() => handleEndPoint('Custom')}
            >
              <span className="text-xs font-normal text-foreground">
                Custom
              </span>
            </Button>
          </div>
          <Input
            type="string"
            placeholder="https://raydium-raydium-5ad5.mainnet.rpcpool.com/"
            className="border-none bg-secondary px-3 py-2 text-xs placeholder:text-muted"
            disabled={endpoint !== 'Custom'}
          />
        </div>
        <div className="flex w-full flex-col space-y-3">
          <Label className="text-xs font-medium text-foreground">
            Color Theme
          </Label>
          <div className="flex space-x-3">
            <Button
              className={cn(
                theme === 'light-green'
                  ? 'border-primary'
                  : 'border-transparent',
                'flex h-fit w-full items-center gap-1 rounded-[8px] border bg-secondary px-[10px] py-2 shadow-none hover:border-primary'
              )}
              onClick={() => setTheme('light-green')}
            >
              <SunIcon />
              <GreenCircleIcon />
              <span className="text-xs font-normal text-foreground">
                Light Green
              </span>
            </Button>
            <Button
              className={cn(
                theme === 'dark-green'
                  ? 'border-primary'
                  : 'border-transparent',
                'flex h-fit w-full items-center gap-1 rounded-[8px] border bg-secondary px-[10px] py-2 shadow-none hover:border-primary'
              )}
              onClick={() => setTheme('dark-green')}
            >
              <MoonIcon />
              <GreenCircleIcon />
              <span className="text-xs font-normal text-foreground">
                Dark Green
              </span>
            </Button>
          </div>
          <div className="flex space-x-3">
            <Button
              className={cn(
                theme === 'light-purple'
                  ? 'border-primary'
                  : 'border-transparent',
                'flex h-fit w-full items-center gap-1 rounded-[8px] border bg-secondary px-[10px] py-2 shadow-none hover:border-primary'
              )}
              onClick={() => setTheme('light-purple')}
            >
              <SunIcon />
              <PurpleCircleIcon />
              <span className="text-xs font-normal text-foreground">
                Light Purple
              </span>
            </Button>
            <Button
              className={cn(
                theme === 'dark-purple'
                  ? 'border-primary'
                  : 'border-transparent',
                'flex h-fit w-full items-center gap-1 rounded-[8px] border bg-secondary px-[10px] py-2 shadow-none hover:border-primary'
              )}
              onClick={() => setTheme('dark-purple')}
            >
              <MoonIcon />
              <PurpleCircleIcon />
              <span className="text-xs font-normal text-foreground">
                Dark Purple
              </span>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
