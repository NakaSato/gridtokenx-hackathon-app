import type { NextConfig } from 'next'
import bundleAnalyzer from '@next/bundle-analyzer'

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
})

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  compress: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'raw.githubusercontent.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'tomato-rear-quokka-6.mypinata.cloud',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'arweave.net',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'shdw.drive.genesysgo.net',
        pathname: '/**',
      },
    ],
    unoptimized: false,
    formats: ['image/avif', 'image/webp'],
  },
  async rewrites() {
    return []
  },
  webpack(config, { isServer }) {
    // WASM support
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
      layers: true,
    }

    // Handle .wasm files
    config.module.rules.push({
      test: /\.wasm$/,
      type: 'webassembly/async',
    })

    // Fix for wasm import in browser
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
      }
    }

    return config
  },
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      'date-fns',
      '@solana/wallet-adapter-react',
      '@solana/wallet-adapter-base',
      '@solana/wallet-adapter-wallets',
    ],
  },
  turbopack: {},
  allowedDevOrigins: ['10.1.1.204:3000', 'localhost:3000'],
}

export default withBundleAnalyzer(nextConfig)
