import { Metadata } from 'next'

interface PageMetadataProps {
  title: string
  description?: string
  keywords?: string[]
  image?: string
  path?: string
  noIndex?: boolean
}

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://app.gridtokenx.com'
const siteName = 'GridTokenX Trading'
const defaultDescription =
  'Advanced P2P energy trading platform on Solana. Trade energy tokens, manage futures and options, earn yields, and participate in decentralized renewable energy markets.'

export function generatePageMetadata({
  title,
  description = defaultDescription,
  keywords = [],
  image = '/images/logo-color.png',
  path = '',
  noIndex = false,
}: PageMetadataProps): Metadata {
  const pageUrl = `${siteUrl}${path}`
  const fullTitle = `${title} | ${siteName}`

  const defaultKeywords = [
    'GridTokenX',
    'energy trading',
    'Solana',
    'DeFi',
    'blockchain',
    'renewable energy',
    'P2P trading',
  ]

  return {
    title,
    description,
    keywords: [...defaultKeywords, ...keywords],
    robots: noIndex
      ? { index: false, follow: false }
      : { index: true, follow: true },
    alternates: {
      canonical: pageUrl,
    },
    openGraph: {
      type: 'website',
      locale: 'en_US',
      url: pageUrl,
      siteName,
      title: fullTitle,
      description,
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      site: '@GridTokenX',
      creator: '@GridTokenX',
      title: fullTitle,
      description,
      images: [image],
    },
  }
}

// Page-specific metadata generators
export const portfolioMetadata = generatePageMetadata({
  title: 'Portfolio',
  description:
    'Manage your energy trading portfolio, track positions, and monitor performance across futures, options, and lending markets.',
  keywords: [
    'portfolio',
    'trading dashboard',
    'positions',
    'PnL',
    'performance tracking',
  ],
  path: '/portfolio',
})

export const futuresMetadata = generatePageMetadata({
  title: 'Futures Trading',
  description:
    'Trade energy futures contracts with leverage. Access real-time pricing, advanced charting, and risk management tools.',
  keywords: [
    'futures',
    'derivatives',
    'leverage trading',
    'energy futures',
    'contracts',
  ],
  path: '/futures',
})

export const optionsMetadata = generatePageMetadata({
  title: 'Options Chain',
  description:
    'Trade energy options with full options chain visibility. View greeks, manage strategies, and hedge your positions.',
  keywords: ['options', 'options chain', 'greeks', 'calls', 'puts', 'hedging'],
  path: '/options-chain',
})

export const earnMetadata = generatePageMetadata({
  title: 'Earn',
  description:
    'Earn yields by providing liquidity, staking energy tokens, and participating in DeFi protocols.',
  keywords: ['earn', 'yield', 'staking', 'liquidity', 'APY', 'rewards'],
  path: '/earn',
})

export const borrowMetadata = generatePageMetadata({
  title: 'Borrow',
  description:
    'Borrow against your energy tokens with competitive rates. Access instant liquidity without selling your assets.',
  keywords: ['borrow', 'lending', 'collateral', 'loans', 'credit'],
  path: '/borrow',
})

export const analyticsMetadata = generatePageMetadata({
  title: 'Analytics',
  description:
    'Comprehensive analytics and insights for energy markets. Track volume, liquidity, and market trends.',
  keywords: ['analytics', 'data', 'statistics', 'market analysis', 'charts'],
  path: '/analytics',
})

export const leaderboardMetadata = generatePageMetadata({
  title: 'Leaderboards',
  description:
    'Compete with top traders and track your ranking. See performance metrics, PnL, and trading statistics.',
  keywords: [
    'leaderboard',
    'ranking',
    'competition',
    'top traders',
    'performance',
  ],
  path: '/leaderboards',
})

export const moonrektMetadata = generatePageMetadata({
  title: 'MoonRekt',
  description:
    'High-risk, high-reward trading strategies. Test your skills with advanced market making and leverage.',
  keywords: ['moonrekt', 'high leverage', 'trading game', 'risk', 'volatility'],
  path: '/moonrekt',
})

export const createOptionsPoolMetadata = generatePageMetadata({
  title: 'Create Options Pool',
  description:
    'Create your own options pool and become a market maker. Set parameters and earn fees from option trades.',
  keywords: [
    'create pool',
    'market maker',
    'liquidity provider',
    'options pool',
    'AMM',
  ],
  path: '/create-options-pool',
})

// JSON-LD structured data
export function generateStructuredData() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: siteName,
    url: siteUrl,
    description: defaultDescription,
    applicationCategory: 'FinanceApplication',
    operatingSystem: 'Web Browser',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    author: {
      '@type': 'Organization',
      name: 'GridTokenX',
      url: 'https://gridtokenx.com',
    },
    provider: {
      '@type': 'Organization',
      name: 'GridTokenX',
      url: 'https://gridtokenx.com',
    },
  }
}

export function generateBreadcrumbStructuredData(
  items: Array<{ name: string; url: string }>
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `${siteUrl}${item.url}`,
    })),
  }
}
