import { DialogTitle } from '@radix-ui/react-dialog'
import { Dialog, DialogContent, DialogTrigger } from './ui/dialog'
import { Separator } from './ui/separator'
import { Label } from './ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select'
import solscan from '@/public/images/solscan.png'
import { Button } from './ui/button'
import Image from 'next/image'
import { Input } from './ui/input'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { useTheme } from 'next-themes'
import { memo } from 'react'
import {
  ArrowDown,
  GreenCircleIcon,
  MoonIcon,
  PurpleCircleIcon,
  SettingsIcon,
  SunIcon,
} from '@/public/svgs/icons'

export default function Settings() {
  const [explorer, setExplorer] = useState<string>('Solscan')
  const [endpoint, setEndpoint] = useState<string>('Triton')
  const [fee, setFee] = useState<'medium' | 'high' | 'ultra' | 'custom'>('high')
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

  const handleFeeType = (value: 'medium' | 'high' | 'ultra' | 'custom') => {
    if (fee !== value) {
      setFee(value)
    }
  }

  return (
    <Dialog>
      <DialogTrigger className="hidden sm:flex">
        <div className="rounded-sm bg-secondary p-[9px] text-foreground hover:text-primary">
          <SettingsIcon />
        </div>
      </DialogTrigger>
      <DialogContent className="flex w-[420px] flex-col border-none bg-accent p-5 sm:rounded-sm">
        <DialogTitle className="text-base font-medium text-foreground">
          Settings
        </DialogTitle>
        <Separator className="bg-secondary" />
        <div className="flex w-full flex-col space-y-5">
          <div className="flex w-full flex-col space-y-[14px]">
            <Label className="text-xs font-medium text-foreground">
              Language
            </Label>
            <Select>
              <SelectTrigger className="flex w-[190px] justify-between border bg-secondary text-xs text-foreground hover:border-primary">
                <SelectValue placeholder="English" />
                <span className="text-secondary-foreground">
                  <ArrowDown />
                </span>
              </SelectTrigger>
              <SelectContent className="w-fit bg-secondary">
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
                  'flex h-fit items-center gap-1 rounded-sm border bg-secondary px-[10px] py-2 shadow-none hover:border-primary'
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
                  'flex h-fit items-center gap-1 rounded-sm border bg-secondary px-[10px] py-2 shadow-none hover:border-primary'
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
                  'flex h-fit items-center gap-1 rounded-sm border bg-secondary px-[10px] py-2 shadow-none hover:border-primary'
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
              Priority Fees
            </Label>
            <div className="flex space-x-3">
              <Button
                className={cn(
                  fee === 'medium' ? 'border-primary' : 'border-transparent',
                  'flex h-fit items-center gap-1 rounded-sm border bg-secondary px-[10px] py-2 shadow-none hover:border-primary'
                )}
                onClick={() => handleFeeType('medium')}
              >
                <span className="text-xs font-normal text-foreground">
                  Medium
                </span>
              </Button>
              <Button
                className={cn(
                  fee === 'high' ? 'border-primary' : 'border-transparent',
                  'flex h-fit items-center gap-1 rounded-sm border bg-secondary px-[10px] py-2 shadow-none hover:border-primary'
                )}
                onClick={() => handleFeeType('high')}
              >
                <span className="text-xs font-normal text-foreground">
                  High
                </span>
              </Button>
              <Button
                className={cn(
                  fee === 'ultra' ? 'border-primary' : 'border-transparent',
                  'flex h-fit items-center gap-1 rounded-sm border bg-secondary px-[10px] py-2 shadow-none hover:border-primary'
                )}
                onClick={() => handleFeeType('ultra')}
              >
                <span className="text-xs font-normal text-foreground">
                  Ultra
                </span>
              </Button>
              <Button
                className={cn(
                  fee === 'custom' ? 'border-primary' : 'border-transparent',
                  'flex h-fit items-center gap-1 rounded-sm border bg-secondary px-[10px] py-2 shadow-none hover:border-primary'
                )}
                onClick={() => handleFeeType('custom')}
              >
                <span className="text-xs font-normal text-foreground">
                  Custom
                </span>
              </Button>
            </div>
            <Input
              type="string"
              placeholder="0.0001"
              className="rounded-sm border bg-secondary px-3 py-2 text-xs placeholder:text-muted focus:border-primary"
              disabled={fee !== 'custom'}
            />
          </div>
          <div className="flex w-full flex-col space-y-3">
            <Label className="text-xs font-medium text-foreground">
              RPC Endpoint
            </Label>
            <div className="flex space-x-3">
              <Button
                className={cn(
                  endpoint === 'Triton'
                    ? 'border-primary'
                    : 'border-transparent',
                  'flex h-fit items-center gap-1 rounded-sm border bg-secondary px-[10px] py-2 shadow-none hover:border-primary'
                )}
                onClick={() => handleEndPoint('Triton')}
              >
                <span className="text-xs font-normal text-foreground">
                  Triton
                </span>
              </Button>
              <Button
                className={cn(
                  endpoint === 'Helius'
                    ? 'border-primary'
                    : 'border-transparent',
                  'flex h-fit items-center gap-1 rounded-sm border bg-secondary px-[10px] py-2 shadow-none hover:border-primary'
                )}
                onClick={() => handleEndPoint('Helius')}
              >
                <span className="text-xs font-normal text-foreground">
                  Helius
                </span>
              </Button>
              <Button
                className={cn(
                  endpoint === 'Custom'
                    ? 'border-primary'
                    : 'border-transparent',
                  'flex h-fit items-center gap-1 rounded-sm border bg-secondary px-[10px] py-2 shadow-none hover:border-primary'
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
              className="rounded-sm border bg-secondary px-3 py-2 text-xs placeholder:text-muted focus:border-primary"
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
                  'flex h-fit items-center gap-1 rounded-sm border bg-secondary px-[10px] py-2 shadow-none hover:border-primary'
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
                  'flex h-fit items-center gap-1 rounded-sm border bg-secondary px-[10px] py-2 shadow-none hover:border-primary'
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
                  'flex h-fit items-center gap-1 rounded-sm border bg-secondary px-[10px] py-2 shadow-none hover:border-primary'
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
                  'flex h-fit items-center gap-1 rounded-sm border bg-secondary px-[10px] py-2 shadow-none hover:border-primary'
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
        </div>
      </DialogContent>
    </Dialog>
  )
}
