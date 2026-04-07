# GridTokenX Trading Platform - Project Context

## Project Overview

**GridTokenX Trading** is a comprehensive P2P energy trading platform built on Next.js 16 (App Router) and Solana blockchain. It enables decentralized energy trading with features including spot/futures/options trading, batch auctions, carbon credits (REC marketplace), smart meter integration, cross-chain bridge, and ZK privacy features.

### Tech Stack

| Category | Technology |
|----------|------------|
| **Framework** | Next.js 16 (App Router, Turbopack) |
| **Language** | TypeScript 5.9 |
| **Runtime** | React 19 |
| **Package Manager** | Bun (recommended) / npm |
| **Styling** | Tailwind CSS 4 + shadcn/ui (Radix UI) |
| **State** | React Context + TanStack Query |
| **Blockchain** | Solana Web3.js + Anchor |
| **Charts** | TradingView + Chart.js + Recharts |
| **Maps** | Mapbox GL JS |
| **WASM** | Rust-based module for crypto/pricing/ZK |
| **Testing** | Jest (unit) + Playwright (E2E) |
| **Deployment** | Docker (standalone Next.js + Bun) |

### Key Features

- **P2P Energy Trading**: Order book, trade offers, fulfillment, settlement
- **Futures Trading**: Leveraged positions with TP/SL
- **Batch Auctions**: Periodic auction-based energy clearing
- **Carbon Credits**: REC marketplace for carbon credit trading
- **Cross-Chain Bridge**: Portal for cross-chain asset transfers
- **Smart Meter Management**: Meter registration, reading submission, energy minting
- **Energy Grid Map**: Real-time Mapbox-based grid visualization
- **ZK Privacy**: Shield/unshield, stealth payments, rollups
- **Portfolio Dashboard**: Positions, PnL charts, transaction history
- **Governance**: DAO governance with proposals and voting
- **Wallet Integration**: Phantom, Solflare, Trust, SafePal

---

## Project Structure

```
gridtokenx-trading/
├── app/                          # Next.js App Router pages
│   ├── layout.tsx                # Root layout with providers
│   ├── page.tsx                  # Main trading dashboard
│   ├── auction/                  # Batch auction page
│   ├── bridge/                   # Cross-chain bridge
│   ├── carbon/                   # Carbon credit marketplace
│   ├── energy-profiles/          # Energy analytics
│   ├── futures/                  # Futures trading
│   ├── leaderboards/             # Trading leaderboards
│   ├── meter/                    # Smart meter management
│   ├── portfolio/                # Portfolio dashboard
│   └── api/                      # API routes (proxy)
├── components/                   # React components
│   ├── ui/                       # shadcn/ui components (30+)
│   ├── auth/                     # Authentication UI
│   ├── trading/                  # Trading widgets
│   ├── charts/                   # Chart components
│   ├── energy-grid/              # Energy grid map system
│   ├── meter/                    # Meter management
│   ├── p2p/                      # P2P trading UI
│   ├── portfolio/                # Portfolio dashboard
│   └── auction/                  # Batch auction UI
├── contexts/                     # React Context providers
│   ├── AuthProvider.tsx          # User auth state
│   ├── connectionprovider.tsx    # Solana wallet connection
│   ├── TradingProvider.tsx       # P2P energy trading
│   ├── EnergyProvider.tsx        # Energy token minting
│   ├── PrivacyProvider.tsx       # ZK privacy layer
│   ├── GovernanceProvider.tsx    # DAO governance
│   ├── LendingProvider.tsx       # ZK-collateralized lending
│   ├── MarketplaceProvider.tsx   # Confidential marketplace
│   └── SocketContext.tsx         # WebSocket management
├── lib/                          # Services and utilities
│   ├── api-client.ts             # REST API client (900+ lines)
│   ├── wasm-bridge.ts            # WASM bridge for crypto/pricing
│   ├── websocket-client.ts       # Real-time WebSocket client
│   ├── datafeed.ts               # TradingView-compatible datafeed
│   ├── contract-actions.ts       # Anchor program actions
│   ├── pda-utils.ts              # Solana PDA derivation
│   ├── zk-utils.ts               # Zero-knowledge proof utilities
│   ├── config.ts                 # Centralized configuration
│   └── idl/                      # Anchor IDL files
├── hooks/                        # Custom React hooks
├── types/                        # TypeScript type definitions
├── utils/                        # Utility functions
├── public/                       # Static assets
└── tests/                        # Test suites
    └── e2e/                      # Playwright E2E tests
```

---

## Building and Running

### Prerequisites

- **Node.js** 20+ or **Bun** (recommended)
- **wasm-pack** (for building WASM module)

### Setup

```bash
# Install dependencies
bun install

# Set up environment variables
cp .env.example .env.local

# Build WASM module (required for crypto/pricing features)
bun run build:wasm

# Start development server
bun run dev
```

### Available Scripts

| Script | Command | Description |
|--------|---------|-------------|
| `dev` | `next dev --turbopack` | Start dev server with Turbopack |
| `build` | `next build` | Production build |
| `start` | `next start` | Start production server |
| `lint` | `next lint` | Run ESLint |
| `test` | `jest` | Run unit tests |
| `test:watch` | `jest --watch` | Watch mode tests |
| `test:coverage` | `jest --coverage` | Coverage report |
| `test:e2e` | `playwright test` | End-to-end tests |
| `build:wasm` | — | Build WASM from `gridtokenx-wasm` |
| `format` | `prettier --write .` | Format code |
| `analyze` | `ANALYZE=true next build --webpack` | Bundle analysis |
| `clean` | `rm -rf .next` | Clean build cache |

### Justfile Commands

The project includes a `justfile` for convenient command shortcuts:

```bash
just dev          # Start development server
just build        # Production build
just build-wasm   # Build WASM module
just test         # Run unit tests
just test-e2e     # Run E2E tests
just lint         # Run ESLint
just format       # Format code
just analyze      # Bundle analysis
just clean        # Clean build artifacts
```

### Docker Deployment

```bash
# Build image
docker build -t gridtokenx-trading .

# Run container
docker run -p 3000:3000 gridtokenx-trading
```

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_TIMEZONE` | `UTC` | Application timezone |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | — | Mapbox GL access token |
| `NEXT_PUBLIC_SOLANA_NETWORK` | `localnet` | Solana network (localnet/devnet/mainnet) |
| `NEXT_PUBLIC_SOLANA_RPC_URL` | `http://127.0.0.1:4000/api/v1/rpc` | Solana RPC endpoint |
| `NEXT_PUBLIC_SOLANA_WS_URL` | `ws://localhost:8900` | Solana WebSocket |
| `NEXT_PUBLIC_REGISTRY_PROGRAM_ID` | — | Registry program address |
| `NEXT_PUBLIC_ENERGY_TOKEN_PROGRAM_ID` | — | Energy token program address |
| `NEXT_PUBLIC_TRADING_PROGRAM_ID` | — | Trading program address |
| `NEXT_PUBLIC_ORACLE_PROGRAM_ID` | — | Oracle program address |
| `NEXT_PUBLIC_GOVERNANCE_PROGRAM_ID` | — | Governance program address |
| `NEXT_PUBLIC_ENERGY_TOKEN_MINT` | — | Energy token mint address |
| `NEXT_PUBLIC_API_BASE_URL` | `http://localhost:4000` | API Gateway base URL |
| `NEXT_PUBLIC_WS_BASE_URL` | `ws://localhost:4000` | WebSocket base URL |
| `NEXT_PUBLIC_PYTH_PRICE_SERVICE_URL` | `https://hermes.pyth.network` | Pyth price oracle |
| `NEXT_PUBLIC_ENABLE_ANALYTICS` | `false` | Enable analytics |
| `NEXT_PUBLIC_ENABLE_DEBUG` | `true` | Enable debug mode |
| `NEXT_PUBLIC_SHOW_DEV_TOOLS` | `true` | Show developer tools |

---

## Development Conventions

### Code Style

- **Semi-colons**: Not used (`semi: false`)
- **Quotes**: Single quotes (`singleQuote: true`)
- **Trailing commas**: ES5 style (`trailingComma: "es5"`)
- **Formatter**: Prettier with Tailwind CSS plugin

### ESLint Configuration

Extends `next/core-web-vitals` and `next/typescript` with relaxed rules:
- `@typescript-eslint/no-unused-vars`: off
- `@typescript-eslint/no-explicit-any`: off
- `prefer-const`: off

### TypeScript Configuration

- **Strict mode**: Enabled
- **Module resolution**: `bundler`
- **JSX**: `react-jsx`
- **Path alias**: `@/*` maps to project root

### Testing Practices

- **Unit tests**: Jest with `@testing-library/react` for component testing
- **E2E tests**: Playwright with Chromium
- **Test files**: `*.test.ts` or `*.spec.ts` pattern
- **Coverage**: Collected from `components/` and `lib/` directories

### Architecture Patterns

1. **Context Providers**: Heavily uses React Context for state management (auth, wallet, trading, privacy, governance, etc.)
2. **Custom Hooks**: Encapsulates business logic in reusable hooks (`useApiClient`, `usePythPrice`, `useSmartMeter`, etc.)
3. **Component Organization**: Feature-based folders under `components/` (e.g., `p2p/`, `futures/`, `meter/`)
4. **API Client**: Centralized REST API client in `lib/api-client.ts` with TypeScript types
5. **WASM Integration**: Rust-based WASM module for crypto operations, pricing calculations, and ZK proofs

---

## Key Integrations

| Service | Purpose |
|---------|---------|
| **GridTokenX API Gateway** | REST + WebSocket backend for auth, trading, meters, grid |
| **Solana Blockchain** | On-chain programs via Anchor (registry, energy token, trading, oracle, governance) |
| **Pyth Network** | Real-time price feeds for portfolio valuation |
| **Mapbox GL** | Energy grid visualization |
| **WASM Module** | Black-Scholes, Greeks, ZK proofs, clustering algorithms |
| **Helius** | Solana data enrichment |

---

## Page Routes

| Route | Description |
|-------|-------------|
| `/` | Main trading dashboard (Grid Map + P2P + History) |
| `/auction` | Batch auction energy trading |
| `/bridge` | Cross-chain bridge portal |
| `/carbon` | Carbon credit marketplace (REC trading) |
| `/energy-profiles` | Energy usage profile analytics & clustering |
| `/futures` | Futures trading with leveraged positions |
| `/leaderboards` | Trading leaderboards |
| `/meter` | Smart meter management & readings |
| `/portfolio` | Portfolio summary, positions, history |

---

## Context Providers & Hooks

### Context Providers

| Provider | Hook | Purpose |
|----------|------|---------|
| `AuthProvider` | `useAuth()` | User authentication, JWT tokens, login/logout/register |
| `ConnectionProvider` | — | Solana ConnectionProvider + WalletProvider |
| `TradingProvider` | `useTrading()` | P2P energy trading, stablecoin orders, settlement |
| `EnergyProvider` | `useContext(EnergyContext)` | Energy token minting from meter readings |
| `PrivacyProvider` | `usePrivacy()` | ZK privacy (shield/unshield, stealth links, rollups) |
| `GovernanceProvider` | `useGovernance()` | DAO governance (proposals, voting, PoA config) |
| `LendingProvider` | `useLending()` | ZK-collateralized lending (borrow/repay) |
| `MarketplaceProvider` | `useMarketplace()` | Confidential marketplace (list/buy private offers) |
| `SocketContext` | `useSocket()` | WebSocket connection management |

### Custom Hooks

| Hook | Purpose |
|------|---------|
| `useApiClient` / `useApiRequest` | API client wrapper with loading/error states |
| `useCrypto` | WASM-based HMAC-SHA256 order signing |
| `useEnergyProfile` | Energy consumption profile analysis & clustering |
| `useGreeks` | Options Greeks calculation via WASM |
| `useGridHistory` | Grid status history (30s polling) |
| `useOptions` | On-chain option positions |
| `useOptionsPricing` | Black-Scholes via WASM |
| `useOracle` | On-chain Oracle program readings |
| `useOrderBook` | Order book data |
| `usePortfolio` | Portfolio data (profile, balance, positions) |
| `usePortfolioValuation` | Live portfolio valuation using Pyth |
| `usePythMarketData` | 24h market data from Pyth |
| `usePythPrice` | Real-time Pyth price feeds |
| `useSmartMeter` | Smart meter CRUD + minting |
| `useTransactionUpdates` | Real-time WebSocket trade updates |
| `useUserAnalytics` | User energy stats & trade history |
| `useWalletBalance` | Wallet balance resolution |
| `useWebSocket` | WebSocket connection management |
