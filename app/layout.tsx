import type { Metadata } from 'next'
import { Poppins } from 'next/font/google'
import './globals.css'
import NavBar from '@/components/NavBar'
import { ThemeProvider } from '@/components/ThemeProvider'
import Script from 'next/script'
import Connectionprovider from '@/contexts/connectionprovider'
import { AuthProvider } from '@/contexts/AuthProvider'
import { Toaster } from 'react-hot-toast'
import { SocketProvider } from '@/contexts/SocketContext'
import { generateStructuredData } from '@/lib/metadata'
import AuthModalManager from '@/components/auth/AuthModalManager'
import DevFaucet from '@/components/DevFaucet'
import { EmailVerificationBanner } from '@/components/EmailVerificationBanner'
import { WasmProvider } from '@/lib/wasm-provider'
import QueryProvider from '@/components/QueryProvider'
import Footer from '@/components/Footer'
import { EnergyProvider } from '@/contexts/EnergyProvider'
import { PrivacyProvider } from '@/contexts/PrivacyProvider'
import { SidebarProvider } from '@/contexts/SidebarContext'
import ClaimStealthModal from '@/components/ClaimStealthModal'
import FulfillTradeModal from '@/components/FulfillTradeModal'
import { LendingProvider } from '@/contexts/LendingProvider'
import { MarketplaceProvider } from '@/contexts/MarketplaceProvider'
import { TradingProvider } from '@/contexts/TradingProvider'
import { NotificationToastProvider } from '../hooks/useNotificationToast'
import { reportWebVitals } from '@/lib/web-vitals'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://app.gridtokenx.com'
const siteName = 'GridTokenX Trading'
const siteDescription = 'P2P energy trading platform'

const poppins = Poppins({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-poppins',
  weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900'],
})

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: siteName,
    template: `%s | ${siteName}`,
  },
  description: siteDescription,
  applicationName: siteName,
  authors: [{ name: 'GridTokenX', url: 'https://gridtokenx.com' }],
  generator: 'Next.js',
  keywords: [
    'GridTokenX',
    'energy trading',
    'P2P energy',
    'Solana trading',
    'DeFi',
    'decentralized energy',
    'renewable energy',
    'blockchain trading',
    'crypto trading',
    'energy tokens',
    'futures trading',
    'options trading',
    'yield farming',
    'energy marketplace',
    'web3',
    'Solana DeFi',
    'energy derivatives',
    'green energy',
    'sustainable trading',
  ],
  referrer: 'origin-when-cross-origin',
  creator: 'GridTokenX',
  publisher: 'GridTokenX',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: siteUrl,
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: siteUrl,
    siteName,
    title: siteName,
    description: siteDescription,
    images: [
      {
        url: '/images/logo-color.png',
        width: 1200,
        height: 630,
        alt: 'GridTokenX Trading Platform',
        type: 'image/png',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@GridTokenX',
    creator: '@GridTokenX',
    title: siteName,
    description: siteDescription,
    images: ['/images/logo-color.png'],
  },
  icons: {
    icon: [
      { url: '/images/logo-color.png', sizes: '32x32', type: 'image/png' },
      { url: '/images/logo-color.png', sizes: '16x16', type: 'image/png' },
    ],
    shortcut: '/images/logo-color.png',
    apple: [
      { url: '/images/logo-color.png', sizes: '180x180', type: 'image/png' },
    ],
    other: [
      {
        rel: 'mask-icon',
        url: '/images/logo-color.png',
      },
    ],
  },
  manifest: '/manifest.json',
  category: 'finance',
  classification: 'DeFi Trading Platform',
  other: {
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'black-translucent',
    'format-detection': 'telephone=no',
    'mobile-web-app-capable': 'yes',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const structuredData = generateStructuredData()

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        <link rel="preconnect" href="https://api.mapbox.com" />
        <link rel="preconnect" href="https://events.mapbox.com" />
        <link
          rel="preconnect"
          href="https://font.gstatic.com"
          crossOrigin="anonymous"
        />
      </head>
      <body
        className={`${poppins.variable} min-h-screen overflow-hidden bg-background font-sans antialiased`}
        suppressHydrationWarning
      >
        <ThemeProvider attribute="data-theme" defaultTheme="dark-purple">
          <QueryProvider>
            <Connectionprovider>
              <AuthProvider>
                <SocketProvider>
                  <EnergyProvider>
                    <PrivacyProvider>
                      <SidebarProvider>
                        <WasmProvider>
                          <LendingProvider>
                            <MarketplaceProvider>
                              <TradingProvider>
                                <NotificationToastProvider>
                                  <AuthModalManager />
                                  <DevFaucet />
                                  <EmailVerificationBanner />
                                  <ClaimStealthModal />
                                  <FulfillTradeModal />
                                  <div className="mx-auto flex h-screen w-full max-w-[1920px] flex-col px-2 sm:px-4 md:px-6">
                                    <NavBar />
                                    <main className="flex flex-1 flex-col overflow-hidden">
                                      {children}
                                    </main>
                                    <Footer />
                                  </div>
                                </NotificationToastProvider>
                              </TradingProvider>
                            </MarketplaceProvider>
                          </LendingProvider>
                        </WasmProvider>
                      </SidebarProvider>
                    </PrivacyProvider>
                  </EnergyProvider>
                </SocketProvider>
              </AuthProvider>
            </Connectionprovider>
          </QueryProvider>
        </ThemeProvider>
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: '#1a1a1a',
              color: '#fff',
              border: '1px solid #333',
            },
          }}
        />
        <Script
          src="/charting_library/charting_library.standalone.js"
          strategy="lazyOnload"
        />
        <Script src="/datafeeds/udf/dist/bundle.js" strategy="lazyOnload" />
      </body>
    </html>
  )
}

// Export onPerfEntry for Next.js to use
export { reportWebVitals as onPerfEntry }
