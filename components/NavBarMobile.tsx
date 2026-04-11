import {
  Activity,
  ArrowDownUp,
  BookOpenText,
  ChartLine,
  ChevronDown,
  ChevronUp,
  Cpu,
  ExternalLink,
  MenuIcon,
  MessagesSquare,
  TrendingUp,
  XIcon,
} from 'lucide-react'
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from './ui/dialog'
import Image from 'next/image'
import { Button, buttonVariants } from './ui/button'
import { AuthButton } from './auth'
import { useState, useMemo } from 'react'
import { MoreIcon, WalletIcon } from '@/public/svgs/icons'
import { Badge } from './ui/badge'
import { cn } from '@/lib/utils'
import { EXTERNAL_LINKS } from '@/lib/links'
import { useRouter } from 'next/navigation'
import { Separator } from './ui/separator'
import { useAuth } from '@/contexts/AuthProvider'
import { useWallet } from '@solana/wallet-adapter-react'
import x from '@/public/svgs/x.svg'
import discord from '@/public/svgs/discord.svg'
import telegram from '@/public/svgs/telegram.svg'
import medium from '@/public/images/medium.png'
import yt from '@/public/svgs/youtube.svg'
import { Logo } from './Logo'
import dynamic from 'next/dynamic'
import Link from 'next/link'

const SettingsMobile = dynamic(() => import('./SettingsMobile'), { ssr: false })
const WalletSideBar = dynamic(() => import('./WalletSidebar'), { ssr: false })

// ============================================================================
// Types & Interfaces
// ============================================================================

interface NavItem {
  name: string
  href: string
  icon: React.ReactNode
  badge?: {
    text: string
    variant: 'new' | 'beta' | 'apy'
  }
  requiresAuth?: boolean
}

interface DropdownItem {
  name: string
  icon: React.ReactNode
  link: string
  external?: boolean
}

interface SocialLink {
  name: string
  href: string
  icon: string
  width?: number
  height?: number
}

// ============================================================================
// Constants
// ============================================================================

const NAV_ITEMS: NavItem[] = [
  {
    name: 'Trade',
    href: '/',
    icon: <ChartLine size={16} />,
    badge: { text: 'NEW', variant: 'new' },
  },
  {
    name: 'Smart Meter',
    href: '/meter',
    icon: <Activity />,
    badge: { text: 'BETA', variant: 'beta' },
    requiresAuth: true,
  },
  {
    name: 'Futures',
    href: '/futures',
    icon: <TrendingUp size={16} />,
    badge: { text: 'BETA', variant: 'beta' },
    requiresAuth: true,
  },
  {
    name: 'AI Credits',
    href: '/credits',
    icon: <Cpu size={16} />,
    badge: { text: 'NEW', variant: 'new' },
    requiresAuth: true,
  },
  {
    name: 'Swap',
    href: '/swap',
    icon: <ArrowDownUp size={16} />,
    requiresAuth: true,
  },
  {
    name: 'Portfolio',
    href: '/portfolio',
    icon: <WalletIcon />,
    requiresAuth: true,
  },
]

const DROPDOWN_EXTERNAL_ITEMS: DropdownItem[] = [
  {
    name: 'Docs',
    icon: <BookOpenText />,
    link: EXTERNAL_LINKS.docs,
    external: true,
  },
  {
    name: 'Feedback',
    icon: <MessagesSquare />,
    link: '/feedback',
  },
]

const SOCIAL_LINKS: SocialLink[] = [
  { name: 'X (Twitter)', href: EXTERNAL_LINKS.twitter, icon: x },
  { name: 'Telegram', href: EXTERNAL_LINKS.telegram, icon: telegram },
  { name: 'Medium', href: EXTERNAL_LINKS.medium, icon: medium as unknown as string, width: 18, height: 18 },
  { name: 'YouTube', href: EXTERNAL_LINKS.youtube, icon: yt },
  { name: 'Discord', href: EXTERNAL_LINKS.discord, icon: discord },
]

// ============================================================================
// Helper Components
// ============================================================================

interface NavBadgeProps {
  badge: NonNullable<NavItem['badge']>
  isActive: boolean
}

function NavBadge({ badge, isActive }: NavBadgeProps) {
  const { text, variant } = badge

  if (variant === 'apy') {
    return (
      <Badge className="h-3 rounded-[2px] border-none bg-gradient-primary px-1 pt-[3px]">
        <span className="text-[8px] font-semibold text-background">{text}</span>
      </Badge>
    )
  }

  return (
    <Badge
      className={cn(
        isActive
          ? 'text-gradient-primary border-primary'
          : 'border-secondary-foreground text-secondary-foreground',
        'flex h-3 rounded-[2px] border bg-transparent px-1 pt-[3px] text-center group-hover:border-primary group-hover:text-primary'
      )}
    >
      <span className="text-[8px] font-semibold">{text}</span>
    </Badge>
  )
}

// ============================================================================
// Main Component
// ============================================================================

export default function NavBarMobile() {
  const [isOpen, setIsOpen] = useState(false)
  const [active, setActive] = useState<string>('Trade')
  const [isDropped, setIsDropped] = useState(false)
  const { connected } = useWallet()
  const { isAuthenticated } = useAuth()
  const router = useRouter()

  // Derive active state from pathname
  const activeRoute = useMemo(() => {
    if (typeof window === 'undefined') return 'Trade'
    const path = window.location.pathname
    const exactMatch = NAV_ITEMS.find((item) => item.href === path)
    if (exactMatch) return exactMatch.name
    const dropdownMatch = DROPDOWN_EXTERNAL_ITEMS.find((item) => item.link === path)
    if (dropdownMatch) return dropdownMatch.name
    return 'Trade'
  }, [isOpen])

  const handleNavClick = (item: NavItem) => {
    setActive(item.name)
    router.push(item.href)
    setIsOpen(false)
  }

  const handleDropdownClick = (link: string, external?: boolean) => {
    if (external) {
      window.open(link, '_blank', 'noopener noreferrer')
    } else {
      router.push(link)
    }
    setIsOpen(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger className="focus:outline-none md:hidden" aria-label="Open navigation menu">
        <div className="flex h-12 w-12 items-center justify-center rounded-sm bg-secondary text-foreground hover:text-primary">
          <MenuIcon size={18} />
        </div>
      </DialogTrigger>
      <DialogContent className="flex h-full w-full flex-col justify-between bg-background p-0">
        <DialogTitle className="hidden">Navigation Menu</DialogTitle>
        <div className="flex w-full flex-col space-y-4 p-0">
          {/* Header */}
          <div className="flex w-full items-center justify-between px-3 py-2">
            <div className="flex h-[28px] w-[78px] items-center px-[6px] py-1">
              <Logo width={65} height={21} />
            </div>
            <Button
              className="rounded-sm bg-secondary p-[9px] shadow-none [&_svg]:size-[18px]"
              onClick={() => setIsOpen(false)}
            >
              <XIcon size={18} className="text-secondary-foreground" />
            </Button>
          </div>

          {/* Navigation Items */}
          <div className="flex w-full flex-col space-y-3 px-3">
            {NAV_ITEMS.filter((item) => !item.requiresAuth || isAuthenticated).map((item) => (
              <Button
                key={item.name}
                className={cn(
                  buttonVariants({
                    variant: activeRoute === item.name ? 'active' : 'inactive',
                  }),
                  'justify-start rounded-sm bg-accent px-5 py-3'
                )}
                onClick={() => handleNavClick(item)}
              >
                {item.icon}
                <h1 className="text-sm font-medium text-nowrap">{item.name}</h1>
                {item.badge && (
                  <NavBadge
                    badge={item.badge}
                    isActive={activeRoute === item.name}
                  />
                )}
              </Button>
            ))}

            {/* More Dropdown */}
            <div className="w-full rounded-sm bg-accent p-0">
              <Button
                className="flex w-full justify-between rounded-sm bg-accent px-5 py-3 text-secondary-foreground shadow-none"
                onClick={() => setIsDropped(!isDropped)}
              >
                <div className="flex items-center space-x-2">
                  <MoreIcon />
                  <h1 className="text-sm font-medium">More</h1>
                </div>
                {isDropped ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              </Button>
              {isDropped && (
                <>
                  {DROPDOWN_EXTERNAL_ITEMS.map((item) => (
                    <div
                      className="flex w-full flex-col px-5 py-3 pt-0 text-sm text-secondary-foreground"
                      key={item.name}
                    >
                      <Separator className="mb-3" />
                      <Button
                        variant={'ghost'}
                        className="h-fit w-fit justify-start gap-2 p-0"
                        onClick={() => handleDropdownClick(item.link, item.external)}
                      >
                        {item.icon}
                        <span>{item.name}</span>
                        {item.external && <ExternalLink className="size-4" />}
                      </Button>
                    </div>
                  ))}

                  {/* Social Links */}
                  <div className="flex w-full flex-col px-5 py-3 pt-0 text-sm text-secondary-foreground">
                    <Separator className="mb-3" />
                    <div className="flex gap-3 py-2">
                      {SOCIAL_LINKS.map((social) => (
                        <a
                          key={social.name}
                          href={social.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={social.name}
                        >
                          <Image
                            src={social.icon}
                            alt={social.name}
                            width={social.width || 20}
                            height={social.height || 20}
                          />
                        </a>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            <SettingsMobile />
          </div>
        </div>

        {/* Wallet/Connect Section */}
        {!isAuthenticated && (
          <div className="w-full px-3 pb-10">
            {connected ? (
              <div onClick={() => setIsOpen(false)}>
                <WalletSideBar />
              </div>
            ) : (
              <div onClick={() => setIsOpen(false)}>
                <AuthButton
                  signInVariant="default"
                  className="h-fit w-full rounded-sm border border-transparent bg-primary px-4 py-[7px] text-background hover:bg-gradient-primary"
                  signInText="Connect Wallet"
                />
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
