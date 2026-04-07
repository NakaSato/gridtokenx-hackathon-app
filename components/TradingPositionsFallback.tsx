import { Ban, EllipsisVertical, RotateCw } from 'lucide-react'
import { Button } from './ui/button'
import { Tabs, TabsList, TabsTrigger } from './ui/tabs'
import { useState } from 'react'
import WalletModal from './WalletModal'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu'
import { WalletIcon } from '@/public/svgs/icons'
import { useWallet } from '@solana/wallet-adapter-react'
import { useAuth } from '@/contexts/AuthProvider'

export default function TradingPositionsFallback() {
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false)
  const { connected } = useWallet()
  const { isAuthenticated, isLoading, user } = useAuth()

  return (
    <div className="flex h-full min-h-[250px] w-full flex-col rounded-lg border">
      <div className="border-b bg-muted/20 px-3 py-2 md:px-4">
        <div className="flex w-full items-center justify-between">
          <Tabs
            defaultValue="Positions"
            className="h-6"
          >
            <TabsList className="h-full bg-secondary/50 p-0.5 gap-0.5 rounded-md">
              <TabsTrigger
                value="Positions"
                className="h-full rounded-sm px-2 text-[10px] data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
              >
                <div className="flex items-center gap-1">
                  {/* Activity icon would be here but saving space/imports for fallback if needed, or just text */}
                  <span>Positions</span>
                </div>
              </TabsTrigger>
              <TabsTrigger
                value="OpenOrders"
                className="h-full rounded-sm px-2 text-[10px] data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
              >
                <div className="flex items-center gap-1">
                  <span>Orders</span>
                </div>
              </TabsTrigger>
              <TabsTrigger
                value="History"
                className="h-full rounded-sm px-2 text-[10px] data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
              >
                <div className="flex items-center gap-1">
                  <span>History</span>
                </div>
              </TabsTrigger>
              <TabsTrigger
                value="Expired"
                className="h-full rounded-sm px-2 text-[10px] data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
              >
                <div className="flex items-center gap-1">
                  <span>Expired</span>
                </div>
              </TabsTrigger>
              <TabsTrigger
                value="OrderBook"
                className="h-full rounded-sm px-2 text-[10px] data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
              >
                <div className="flex items-center gap-1">
                  <span>Book</span>
                </div>
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="h-auto w-fit rounded-[10px] bg-inherit p-[6px] shadow-none md:hidden">
                <EllipsisVertical className="text-secondary-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="min-w-fit rounded-[12px] p-1"
            >
              <DropdownMenuItem className="w-fit gap-0 space-x-[6px]">
                <RotateCw className="w-fit text-secondary-foreground" />
                <span>Reload</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="w-fit gap-0 space-x-[6px]">
                <Ban className="text-secondary-foreground" />
                <span>Cancel All</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <div className="m-auto flex w-full justify-center p-6">
        <div className="flex flex-col items-center gap-3">
          <span>
            {isLoading
              ? 'Loading...'
              : isAuthenticated && !connected
                ? 'Please connect wallet to view your orders'
                : connected && !isAuthenticated
                  ? 'Please sign in to view your orders'
                  : connected && isAuthenticated
                    ? 'No orders found'
                    : 'Connect wallet to view your orders'}
          </span>

          {isLoading ? (
            <div className="animate-pulse">
              <div className="h-9 w-32 rounded bg-muted"></div>
            </div>
          ) : isAuthenticated && !connected ? (
            <Button
              onClick={() => setIsWalletModalOpen(true)}
              className="rounded-sm bg-primary text-background hover:bg-gradient-primary gap-2"
            >
              <WalletIcon />
              <span className="text-sm font-semibold">Connect Wallet</span>
            </Button>
          ) : connected && !isAuthenticated ? (
            <Button
              onClick={() => setIsWalletModalOpen(true)}
              className="rounded-sm bg-primary text-background hover:bg-gradient-primary gap-2"
            >
              <WalletIcon />
              <span className="text-sm font-semibold">Sign In</span>
            </Button>
          ) : (
            <Button
              onClick={() => setIsWalletModalOpen(true)}
              className="rounded-sm bg-primary text-background hover:bg-gradient-primary gap-2"
            >
              <WalletIcon />
              <span className="text-sm font-semibold">Connect Wallet</span>
            </Button>
          )}

          <WalletModal
            isOpen={isWalletModalOpen}
            onClose={() => setIsWalletModalOpen(false)}
          />
        </div>
      </div>
    </div>
  )
}
