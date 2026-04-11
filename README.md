# GridTokenX Trading Platform

> GridTokenX turns Thai solar prosumers' surplus electricity into frontier AI computing power — rewarding clean energy contribution with access to Claude and GPT.

> **Version**: 0.1.2
> **Last Updated**: April 2026
> **Framework**: Next.js 16 (App Router, Turbopack)
> **Runtime**: React 19, TypeScript 5.9
> **License**: MIT

---

## Overview

The **GridTokenX Trading Platform** is the web frontend for the GridTokenX P2P Energy Trading ecosystem — a dual-token economy where solar prosumers earn **GRID** tokens from selling surplus energy, convert to **GRX** utility tokens (1 kWh = 1 GRX), and redeem GRX for AI computing credits (Claude, GPT).

Built with **Next.js** and the **App Router**, it provides a comprehensive interface for energy trading, portfolio management, smart meter integration, and blockchain interaction on Solana.

### The Value Chain

```
Rooftop solar → P2P energy trade → GRID token → GRX token → AI credit (burned) → frontier AI access
```

### Token Architecture: GRID vs GRX

| Attribute | GRID Token | GRX Token |
|-----------|-----------|-----------|
| **Role** | Energy settlement (1 GRID = 1 kWh P2P solar) | AI credit access (tradable, DEX-priced) |
| **Issuance** | Dynamic — minted per kWh verified P2P trade | Fixed — 100,000,000 total, never increased |
| **Backing** | 1:1 energy backing | Market price — Solana DEX order book / AMM |
| **Price** | Platform-internal | **Floating** — set by DEX market |
| **Supply** | **Inflationary** — grows with energy volume | **Deflationary** — burned on every AI redemption |
| **Regulatory** | Platform-internal accounting unit | Thai SEC Group 1 utility token (consumptive) |
| **Convert** | GRID → GRX (one-way swap) | GRX → Stablecoin (DEX) → AI Credits (burn; **no reverse**) |

**Atomic clearing → auto-swap (default):** Entire conversion chain runs in one Solana transaction. Prosumers receive USDC instantly — no GRX price exposure.

**Optional: hold GRX** — opt-in to receive GRX instead (speculate on appreciation). Active choice required.

### Key Features

| Feature | Description |
|---------|-------------|
| **P2P Energy Trading** | Order book, trade offers, fulfillment, and settlement |
| **Futures Trading** | Leveraged energy futures with positions and order management |
| **Batch Auctions** | Periodic auction-based energy clearing |
| **Carbon Credits** | REC marketplace for carbon credit trading |
| **Cross-Chain Bridge** | Portal for cross-chain asset transfers |
| **Smart Meter Management** | Meter registration, reading submission, and energy minting |
| **Energy Grid Map** | Real-time Mapbox-based grid visualization |
| **ZK Privacy** | Confidential trading with shield/unshield, stealth payments |
| **Portfolio Dashboard** | Positions, PnL charts, transaction history, analytics |
| **Governance** | DAO governance with proposals and voting |
| **Wallet Integration** | Phantom, Solflare, Trust, SafePal wallet support |

---

## Getting Started

### Prerequisites

- **Node.js** 20+ or **Bun**
- **bun run** (recommended) or npm

### Setup

```bash
# Install dependencies
bun run install

# Set up environment variables
cp .env.example .env.local

# Build WASM module (required for crypto/pricing features)
bun run build:wasm

# Start development server
bun run dev
```

### Scripts

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

## Page Routes

| Route | Description | Auth Required |
|-------|-------------|:---:|
| `/` | Main trading dashboard (Grid Map + P2P + History) | No* |
| `/auction` | Batch auction energy trading | Wallet |
| `/bridge` | Cross-chain bridge portal | No |
| `/carbon` | Carbon credit marketplace (REC trading) | No |
| `/energy-profiles` | Energy usage profile analytics & clustering | Yes |
| `/futures` | Futures trading with leveraged positions | No |
| `/leaderboards` | Trading leaderboards | No |
| `/meter` | Smart meter management & readings | Yes |
| `/portfolio` | Portfolio summary, positions, history | Yes |
| `/forgot-password` | Password recovery | No |
| `/reset-password` | Password reset | No |
| `/verify-email` | Email verification | No |
| `/privacy-policy` | Privacy policy | No |
| `/terms-and-conditions` | Terms and conditions | No |

### API Routes

| Route | Purpose |
|-------|---------|
| `/api/auth/login/` | Auth login proxy |
| `/api/auth/register/` | Auth register proxy |
| `/api/get_option_transactions/` | Option transaction history |
| `/api/pyth-price/` | Pyth price feed proxy |
| `/api/pyth-price-history/` | Pyth historical price data |

---

## Architecture

### Project Structure

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
│   │   └── components/           # Futures-specific components
│   ├── leaderboards/             # Trading leaderboards
│   ├── meter/                    # Smart meter management
│   ├── portfolio/                # Portfolio dashboard
│   └── api/                      # API routes (proxy)
├── components/                   # Shared components
│   ├── ui/                       # shadcn/ui components (30+)
│   ├── auth/                     # Authentication UI
│   ├── trading/                  # Trading widgets
│   ├── charts/                   # Chart components
│   ├── dashboard/                # Dashboard widgets
│   ├── energy-grid/              # Energy grid map system (22 files)
│   ├── energy-profile/           # Energy profile analytics
│   ├── meter/                    # Meter management
│   ├── p2p/                      # P2P trading UI
│   ├── portfolio/                # Portfolio dashboard
│   ├── auction/                  # Batch auction UI
│   └── toasts/                   # Toast notifications
├── contexts/                     # React Context providers
│   ├── AuthProvider.tsx          # User auth state
│   ├── connectionprovider.tsx    # Solana wallet connection
│   ├── contractProvider.tsx      # Options contract program
│   ├── TradingProvider.tsx       # P2P energy trading
│   ├── EnergyProvider.tsx        # Energy token minting
│   ├── PrivacyProvider.tsx       # ZK privacy layer
│   ├── GovernanceProvider.tsx    # DAO governance
│   ├── LendingProvider.tsx       # ZK-collateralized lending
│   ├── MarketplaceProvider.tsx   # Confidential marketplace
│   └── SocketContext.tsx         # WebSocket management
├── hooks/                        # Custom React hooks
├── lib/                          # Services and integrations
│   ├── api-client.ts             # REST API client (900+ lines)
│   ├── wasm-bridge.ts            # WASM bridge for crypto/pricing
│   ├── websocket-client.ts       # Real-time WebSocket client
│   ├── datafeed.ts               # TradingView-compatible datafeed
│   ├── contract-actions.ts       # Anchor program actions
│   ├── pda-utils.ts              # Solana PDA derivation
│   ├── zk-utils.ts               # Zero-knowledge proof utilities
│   ├── privacy-utils.ts          # Privacy utilities
│   ├── stealth-utils.ts          # Stealth payment links
│   ├── config.ts                 # Centralized configuration
│   └── idl/                      # Anchor IDL files
├── types/                        # TypeScript type definitions
├── utils/                        # Utility functions
├── public/                       # Static assets
└── tests/                        # Test suites
    └── e2e/                      # Playwright E2E tests
```

### Context Providers

| Provider | Hook | Purpose |
|----------|------|---------|
| `AuthProvider` | `useAuth()` | User authentication, JWT tokens, login/logout/register |
| `ConnectionProvider` | — | Solana ConnectionProvider + WalletProvider |
| `ContractProvider` | `useContext(ContractContext)` | Options contract program (open/close/claim/exercise) |
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
| `useOptions` | On-chain options positions |
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

---

## External Integrations

| Service | Protocol | Purpose |
|---------|----------|---------|
| **GridTokenX API Gateway** | REST + WebSocket | Backend for auth, trading, meters, grid |
| **Solana Blockchain** | RPC + WebSocket | On-chain programs via Anchor |
| **Pyth Network** | REST + SSE | Real-time price feeds |
| **Mapbox GL** | Map tiles | Energy grid visualization |
| **WASM Module** | In-browser | Black-Scholes, Greeks, ZK proofs, clustering |
| **Helius** | REST API | Solana data enrichment |

---

## Testing

```bash
# Unit tests
bun run test

# E2E tests (requires running dev server)
bun run test:e2e
```

### Test Suites

| Framework | Location | Tests |
|-----------|----------|-------|
| Jest | `lib/__tests__/` | API client tests |
| Playwright | `tests/e2e/` | Auth, trading flow, minting, P2P, smart meter |

---

## Deployment

The project uses a standalone Next.js build with a **Bun** runtime in Docker:

```bash
# Build
bun run build

# Docker
docker build -t gridtokenx-trading .
docker run -p 3000:3000 gridtokenx-trading
```

### Live Deployment

| URL | Purpose |
|-----|---------|
| **[hackathon.gridtokenx.xyz](https://hackathon.gridtokenx.xyz)** | Hackathon demo (canonical → app.gridtokenx.com) |
| **app.gridtokenx.com** | Production canonical domain |

**Deployed Routes:**

| Route | Priority |
|-------|----------|
| `/` | 1.0 (main trading dashboard) |
| `/portfolio` | 0.8 |
| `/futures` | 0.8 |
| `/meter` | 0.8 |
| `/privacy-policy` | 0.8 |
| `/terms-and-conditions` | 0.8 |

**Site Theme:** Dark-purple · Poppins font · @GridTokenX

---

## Technology Stack

| Category | Technology |
|----------|------------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5.9 |
| Runtime | React 19 |
| Styling | Tailwind CSS 4 |
| UI Components | shadcn/ui (Radix UI primitives) |
| State Management | React Context + TanStack Query |
| Blockchain | Solana Web3.js + Anchor |
| Charts | TradingView (lightweight-charts) + Chart.js |
| Maps | Mapbox GL JS |
| WASM | gridtokenx-wasm (Rust) |
| Testing | Jest + Playwright |
| Bundler | Turbopack (dev), Webpack (prod) |
