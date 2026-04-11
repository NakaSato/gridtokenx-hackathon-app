'use client'
import Link from 'next/link'
import { useState, useMemo, type ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { useWallet } from '@solana/wallet-adapter-react'
import Image, { type StaticImageData } from 'next/image'
import {
  Activity,
  ArrowDownUp,
  BookOpenText,
  Cpu,
  ChartLine,
  ExternalLink,
  MessagesSquare,
  PanelBottom,
  PanelLeft,
  PanelRight,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { EXTERNAL_LINKS } from '@/lib/links'
import { useAuth } from '@/contexts/AuthProvider'
import { useSidebar } from '@/contexts/SidebarContext'
import { buttonVariants } from './ui/button'
import { Badge } from './ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu'
import { AuthButton } from './auth'
import { ArrowDown, MoreIcon, WalletIcon } from '@/public/svgs/icons'
import { Logo } from './Logo'
import dynamic from 'next/dynamic'
import NavBarMobile from './NavBarMobile'
import { NetworkStatus } from './NetworkStatus'

// Dynamic Imports for Header Performance
const WalletSideBar = dynamic(() => import('./WalletSidebar'), { ssr: false })
const Settings = dynamic(() => import('./Settings'), { ssr: false })
const Profile = dynamic(() => import('./Profile'), { ssr: false })
const Notifications = dynamic(() => import('./Notifications'), { ssr: false })
const PointsDropDown = dynamic(() => import('./PointsDropDown'), { ssr: false })

import x from '@/public/svgs/x.svg'
import discord from '@/public/svgs/discord.svg'
import yt from '@/public/svgs/youtube.svg'
import medium from '@/public/images/medium.png'
import telegram from '@/public/svgs/telegram.svg'

// ============================================================================
// Types & Interfaces
// ============================================================================

interface NavItem {
  name: string
  href: string
  icon: ReactNode
  badge?: {
    text: string
    variant: 'new' | 'beta' | 'apy'
    value?: string
  }
  hideOnMobile?: boolean
  requiresAuth?: boolean
}

interface DropdownItem {
  name: string
  icon: ReactNode
  link: string
  external?: boolean
}

interface SocialLink {
  name: string
  href: string
  icon: StaticImageData
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
    icon: <Activity size={16} />,
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
    hideOnMobile: true,
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
  { name: 'Medium', href: EXTERNAL_LINKS.medium, icon: medium, width: 18, height: 18 },
  { name: 'YouTube', href: EXTERNAL_LINKS.youtube, icon: yt },
  { name: 'Discord', href: EXTERNAL_LINKS.discord, icon: discord },
]

// ============================================================================
// Helper Components
// ============================================================================

interface NavLinkProps {
  item: NavItem
  isActive: boolean
  onClick: () => void
}

function NavLink({ item, isActive, onClick }: NavLinkProps) {
  const { name, href, icon, badge, hideOnMobile } = item

  return (
    <Link
      href={href}
      className={cn(
        buttonVariants({
          variant: isActive ? 'active' : 'inactive',
        }),
        'group flex h-auto w-auto justify-between gap-1 p-0 hover:text-primary',
        hideOnMobile && 'hidden lg:flex'
      )}
      onClick={onClick}
      aria-current={isActive ? 'page' : undefined}
    >
      {icon}
      <h1 className="text-sm font-medium group-hover:text-primary">{name}</h1>
      {badge && <NavBadge badge={badge} isActive={isActive} />}
    </Link>
  )
}

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

export default function NavBar() {
  const pathname = usePathname()
  const { connected } = useWallet()
  const { isAuthenticated, user } = useAuth()
  const { showLeftSidebar, showRightSidebar, showPositionsPanel, toggleLeftSidebar, toggleRightSidebar, togglePositionsPanel } = useSidebar()
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [activeItem, setActiveItem] = useState<string>('')

  // Derive active state from pathname
  const activeRoute = useMemo(() => {
    if (!pathname) return 'Trade'

    // Check exact matches first
    const exactMatch = NAV_ITEMS.find((item) => item.href === pathname)
    if (exactMatch) return exactMatch.name

    // Check dropdown items
    const dropdownMatch = [...DROPDOWN_EXTERNAL_ITEMS].find(
      (item) => item.link === pathname
    )
    if (dropdownMatch) return dropdownMatch.name

    // Default to Trade for home
    return 'Trade'
  }, [pathname])

  const isDropdownItemActive = useMemo(() => {
    return [...DROPDOWN_EXTERNAL_ITEMS].some(
      (item) => item.name === activeRoute
    )
  }, [activeRoute])

  return (
    <header className="flex max-w-full items-center justify-between">
      <div className="flex items-center justify-between gap-2 py-2 sm:gap-4 lg:gap-6">
        <div className="flex items-center justify-center gap-2 px-1">
          <Logo width={24} height={28} className="mb-1" />
        </div>

        <nav className="hidden items-center justify-evenly gap-3 md:flex md:gap-4 lg:gap-8" aria-label="Main navigation">
          {NAV_ITEMS.filter((item) => !item.requiresAuth || isAuthenticated).map((item) => (
            <NavLink
              key={item.name}
              item={item}
              isActive={activeRoute === item.name}
              onClick={() => setActiveItem(item.name)}
            />
          ))}


          <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
            <DropdownMenuTrigger
              className={cn(
                isDropdownOpen || isDropdownItemActive
                  ? 'text-primary'
                  : 'text-secondary-foreground',
                'hidden h-12 min-w-[48px] items-center justify-between gap-1 p-0 hover:text-primary focus:bg-transparent focus:outline-none md:flex'
              )}
              aria-label="More navigation options"
            >
              <MoreIcon />
              <h1 className="hidden text-sm font-medium lg:inline">More</h1>
              <span className="hidden lg:block"><ArrowDown /></span>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              align="start"
              className="w-44 rounded-sm text-secondary-foreground"
            >
              {DROPDOWN_EXTERNAL_ITEMS.map((item) => (
                <Link
                  href={item.link}
                  target={item.external ? '_blank' : undefined}
                  rel={item.external ? 'noopener noreferrer' : undefined}
                  key={item.name}
                  className="w-full"
                  onClick={() => setActiveItem(item.name)}
                >
                  <DropdownMenuItem className="cursor-pointer justify-between px-1 py-2 focus:text-primary [&>svg]:size-4">
                    {item.name}
                    {item.external ? <ExternalLink /> : item.icon}
                  </DropdownMenuItem>
                </Link>
              ))}

              <DropdownMenuSeparator />

              <div className="flex gap-3 px-1 py-2" role="list" aria-label="Social media links">
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
                      alt=""
                      width={social.width}
                      height={social.height}
                      aria-hidden="true"
                    />
                  </a>
                ))}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>
      </div>

      <div className="flex items-center justify-between gap-1 py-2 sm:gap-2 md:gap-3">
        <div className="hidden items-center gap-1 sm:flex">
          <button
            onClick={toggleLeftSidebar}
            className={cn(
              'group relative flex h-8 w-8 items-center justify-center rounded-md border border-border transition-all duration-200',
              showLeftSidebar
                ? 'bg-transparent text-secondary-foreground hover:bg-secondary hover:text-primary'
                : 'bg-secondary text-primary shadow-inner'
            )}
            title={showLeftSidebar ? 'Hide left sidebar' : 'Show left sidebar'}
            aria-label={showLeftSidebar ? 'Hide left sidebar' : 'Show left sidebar'}
          >
            <PanelLeft size={16} className="transition-transform duration-200 group-hover:scale-110" />
          </button>

          <button
            onClick={toggleRightSidebar}
            className={cn(
              'group relative flex h-8 w-8 items-center justify-center rounded-md border border-border transition-all duration-200',
              showRightSidebar
                ? 'bg-transparent text-secondary-foreground hover:bg-secondary hover:text-primary'
                : 'bg-secondary text-primary shadow-inner'
            )}
            title={showRightSidebar ? 'Hide right sidebar' : 'Show right sidebar'}
            aria-label={showRightSidebar ? 'Hide right sidebar' : 'Show right sidebar'}
          >
            <PanelRight size={16} className="transition-transform duration-200 group-hover:scale-110" />
          </button>

          <button
            onClick={togglePositionsPanel}
            className={cn(
              'group relative flex h-8 w-8 items-center justify-center rounded-md border border-border transition-all duration-200',
              showPositionsPanel
                ? 'bg-transparent text-secondary-foreground hover:bg-secondary hover:text-primary'
                : 'bg-secondary text-primary shadow-inner'
            )}
            title={showPositionsPanel ? 'Hide positions panel' : 'Show positions panel'}
            aria-label={showPositionsPanel ? 'Hide positions panel' : 'Show positions panel'}
          >
            <PanelBottom size={16} className="transition-transform duration-200 group-hover:scale-110" />
          </button>
        </div>

        <NetworkStatus />

        {isAuthenticated && (
          <div className="hidden xs:block">
            <PointsDropDown setActive={setActiveItem} />
          </div>
        )}
        <div className="hidden sm:block">
          <Settings />
        </div>
        {isAuthenticated && (
          <div className="hidden sm:block">
            <Profile />
          </div>
        )}
        {isAuthenticated && <Notifications />}

        {connected || isAuthenticated ? (
          <WalletSideBar />
        ) : (
          <AuthButton
            signInVariant="default"
            className="h-fit w-full whitespace-nowrap rounded-sm border border-transparent bg-primary px-1.5 py-1 text-xs text-background hover:bg-gradient-primary xs:px-2 xs:py-[7px] xs:text-sm sm:px-4"
            signInText="Connect"
          />
        )}
        <NavBarMobile />
      </div>
    </header>
  )
}
