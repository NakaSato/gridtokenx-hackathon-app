# GridTokenX Mobile Platform - System Design Document

**Document Version:** 1.0  
**Last Updated:** 17 March 2026  
**Status:** Draft  
**Audience:** Engineering Team, Product Managers, Architects

---

## Executive Summary

This document outlines the system design for extending the GridTokenX P2P energy trading platform to support **iOS and Android mobile applications** using a **unified cross-platform architecture**. The design ensures feature parity with the web platform while optimizing for mobile-specific capabilities (native wallet integration, biometric authentication, push notifications, offline-first design).

---

## 1. Product Overview

### 1.1 Vision

Enable prosumers and consumers to trade energy on-the-go through native mobile applications for iOS and Android, maintaining consistency with the web platform while leveraging mobile-native features.

### 1.2 Target Users

| User Type | Platform | Primary Use Cases |
|-----------|----------|-------------------|
| **Prosumers** | iOS / Android | Monitor solar production, list energy offers, track earnings, manage smart meters |
| **Consumers** | iOS / Android | Browse energy offers, place orders, track consumption, manage payments |
| **Traders** | iOS / Android | Futures/options trading, portfolio management, real-time market data |
| **Governance Participants** | iOS / Android | Vote on proposals, submit DAO initiatives, track governance rewards |

### 1.3 Supported Platforms

| Platform | Minimum Version | Target Devices |
|----------|-----------------|----------------|
| **iOS** | 16.0+ | iPhone, iPad |
| **Android** | API 26 (Oreo) / Android 8.0+ | Phone, Tablet |
| **Web (Existing)** | Modern browsers | Desktop, Mobile Web |

---

## 2. Architecture Overview

### 2.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           Mobile Application Layer                          │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────┐           ┌─────────────────────┐                 │
│  │   iOS App (Swift)   │           │  Android App (Kotlin)│                │
│  │   ┌───────────────┐ │           │  ┌───────────────┐  │                 │
│  │   │ SwiftUI UI    │ │           │  │ Jetpack Compose│  │                 │
│  │   └───────────────┘ │           │  └───────────────┘  │                 │
│  │   ┌───────────────┐ │           │  ┌───────────────┐  │                 │
│  │   │ ViewModel     │ │           │  │ ViewModel     │  │                 │
│  │   │ (MVVM)        │ │           │  │ (MVVM)        │  │                 │
│  │   └───────────────┘ │           │  └───────────────┘  │                 │
│  └─────────────────────┘           └─────────────────────┘                 │
│           │                                   │                             │
│           └───────────────┬───────────────────┘                             │
│                           │                                                 │
│                  ┌────────▼────────┐                                        │
│                  │  Shared Core    │                                        │
│                  │  (Rust WASM)    │                                        │
│                  │  - Crypto       │                                        │
│                  │  - ZK Proofs    │                                        │
│                  │  - Pricing      │                                        │
│                  │  - Business Logic│                                       │
│                  └────────┬────────┘                                        │
└───────────────────────────┼─────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           API Gateway Layer                                 │
│                    (Rust/Axum - Existing Infrastructure)                    │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │   Auth API  │  │  Trading API│  │  Meter API  │  │ Portfolio API│        │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘        │
└─────────────────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           Backend Services (Existing)                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │  PostgreSQL │  │  InfluxDB   │  │    Kafka    │  │    Redis    │        │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘        │
│  ┌─────────────┐  ┌─────────────┐                                          │
│  │   Solana    │  │   Anchor    │                                          │
│  │  Validator  │  │  Programs   │                                          │
│  └─────────────┘  └─────────────┘                                          │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Technology Stack Decision

| Layer | Technology | Rationale |
|-------|------------|-----------|
| **Mobile Framework** | **Native (Swift + Kotlin)** | Best performance, full hardware access, superior UX |
| **Shared Logic** | **Rust + WASM** | Code reuse, type safety, cryptographic operations |
| **State Management** | **MVVM + Combine (iOS) / Jetpack + Flow (Android)** | Industry standard, testable |
| **Networking** | **URLSession (iOS) / OkHttp (Android)** | Native performance, caching |
| **Local Storage** | **CoreData (iOS) / Room (Android)** | Offline-first support |
| **Blockchain** | **Solana Mobile Stack (SMS)** | Official Solana mobile SDK |
| **Push Notifications** | **FCM + APNs** | Cross-platform notification service |

### 2.3 Architecture Pattern: MVVM + Clean Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Presentation Layer                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │   Views      │  │  ViewModels  │  │   Navigators │       │
│  │ (SwiftUI/    │◀─┤   (State     │─▶│   (Routing   │       │
│  │  Compose)    │  │    Logic)    │  │    Logic)    │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                        Domain Layer                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │  Use Cases   │  │  Entities    │  │ Repositories │       │
│  │ (Business    │  │  (Models)    │  │ (Interfaces) │       │
│  │   Logic)     │  │              │  │              │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                         Data Layer                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │   Network    │  │   Local DB   │  │   Shared     │       │
│  │  Repository  │  │  Repository  │  │   Core (WASM)│       │
│  │  (API Calls) │  │  (Cache)     │  │  (Crypto)    │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Core Modules Design

### 3.1 Authentication Module

#### 3.1.1 Features

- Email/password login
- Social login (Google, Apple)
- Biometric authentication (Face ID, Touch ID, Fingerprint)
- JWT token management with refresh
- Session persistence

#### 3.1.2 Flow Diagram

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  User    │────▶│  Login   │────▶│   API    │────▶│  Server  │
│  Input   │     │  Screen  │     │  Gateway │     │  (Auth)  │
└──────────┘     └──────────┘     └──────────┘     └──────────┘
                                           │
                                           ▼
                                    ┌──────────────┐
                                    │ JWT + Refresh │
                                    │   Token      │
                                    └──────────────┘
                                           │
                    ┌──────────────────────┼──────────────────────┐
                    ▼                      ▼                      ▼
             ┌─────────────┐       ┌─────────────┐       ┌─────────────┐
             │  Keychain   │       │  Encrypted  │       │  Biometric  │
             │   (iOS)     │       │  SharedPreferences│  │   Prompt    │
             │             │       │  (Android)    │       │             │
             └─────────────┘       └─────────────┘       └─────────────┘
```

#### 3.1.3 Data Models

```typescript
interface User {
  id: string;
  email: string;
  name: string;
  role: 'prosumer' | 'consumer' | 'trader';
  kycStatus: 'pending' | 'verified' | 'rejected';
  createdAt: string;
}

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

interface BiometricConfig {
  enabled: boolean;
  type: 'face' | 'fingerprint' | 'iris';
}
```

---

### 3.2 Wallet Integration Module

#### 3.2.1 Supported Wallets

| Wallet Type | iOS Support | Android Support |
|-------------|-------------|-----------------|
| **Phantom** | ✅ Deep Link + WalletConnect | ✅ Deep Link + WalletConnect |
| **Solflare** | ✅ Deep Link + WalletConnect | ✅ Deep Link + WalletConnect |
| **Solana Mobile Wallet Adapter** | ✅ Native | ✅ Native |
| **Trust Wallet** | ✅ WalletConnect | ✅ WalletConnect |
| **SafePal** | ✅ WalletConnect | ✅ WalletConnect |

#### 3.2.2 Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                  Wallet Adapter Layer                        │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐                   │
│  │  iOS Wallet     │  │  Android Wallet │                   │
│  │  Adapter        │  │  Adapter        │                   │
│  │  (Swift)        │  │  (Kotlin)       │                   │
│  └─────────────────┘  └─────────────────┘                   │
│           │                    │                             │
│           └─────────┬──────────┘                             │
│                     │                                        │
│            ┌────────▼────────┐                               │
│            │  Shared Wallet  │                               │
│            │  Interface      │                               │
│            │  (Rust WASM)    │                               │
│            └─────────────────┘                               │
└─────────────────────────────────────────────────────────────┘
```

#### 3.2.3 Key Operations

```rust
// Shared Rust interface (compiled to WASM)
pub trait WalletOperations {
    async fn connect(&self, wallet_type: WalletType) -> Result<ConnectionResult>;
    async fn sign_transaction(&self, tx: Transaction) -> Result<SignedTransaction>;
    async fn get_balance(&self, mint: &str) -> Result<TokenBalance>;
    async fn send_tokens(&self, to: &str, amount: u64) -> Result<TransactionSignature>;
}
```

---

### 3.3 Trading Module

#### 3.3.1 Supported Trading Types

| Trading Type | Description | Mobile-Specific Features |
|--------------|-------------|--------------------------|
| **P2P Energy** | Direct energy trading | Push notifications for order fills |
| **Spot Trading** | Immediate settlement | Real-time price widgets |
| **Futures** | Leveraged positions | Position alerts, margin call notifications |
| **Options** | Call/Put contracts | Greeks calculator, expiry reminders |
| **Batch Auction** | Periodic clearing | Auction countdown timers |
| **Carbon Credits** | REC marketplace | Carbon offset tracking |

#### 3.3.2 Order Flow

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  Create  │────▶│  Sign    │────▶│  Submit  │────▶│  On-Chain│
│  Order   │     │  (WASM)  │     │  to API  │     │ Settlement│
└──────────┘     └──────────┘     └──────────┘     └──────────┘
     │                                                        │
     ▼                                                        ▼
┌──────────┐                                         ┌──────────────┐
│  Local   │                                         │  WebSocket   │
│  Cache   │                                         │  Update      │
└──────────┘                                         └──────────────┘
```

#### 3.3.3 Real-Time Updates

```typescript
// WebSocket message types
type WsMessage =
  | { type: 'orderbook_update'; data: OrderBookData }
  | { type: 'trade_executed'; data: TradeExecution }
  | { type: 'price_update'; data: PriceUpdate }
  | { type: 'position_change'; data: PositionUpdate }
  | { type: 'auction_status'; data: AuctionStatus };
```

---

### 3.4 Smart Meter Module

#### 3.4.1 Features

- Meter registration
- Real-time production/consumption monitoring
- Reading submission with cryptographic signatures
- Energy token minting
- Historical data visualization

#### 3.4.2 Meter Reading Flow

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Smart Meter │────▶│  Mobile App  │────▶│  API Gateway │
│  (Bluetooth) │     │  (Native)    │     │  (Rust)      │
└──────────────┘     └──────────────┘     └──────────────┘
                            │                    │
                            ▼                    ▼
                     ┌─────────────┐      ┌─────────────┐
                     │  Sign with  │      │  Validate   │
                     │  Ed25519    │      │  Signature  │
                     │  (WASM)     │      │  (Rust)     │
                     └─────────────┘      └─────────────┘
                                                 │
                                                 ▼
                                          ┌─────────────┐
                                          │  Solana     │
                                          │  Transaction│
                                          └─────────────┘
```

#### 3.4.3 Bluetooth LE Integration

| Platform | Technology | Library |
|----------|------------|---------|
| **iOS** | CoreBluetooth | Native |
| **Android** | BluetoothLeScanner | Native |

---

### 3.5 Portfolio Module

#### 3.5.1 Dashboard Components

- Total portfolio value (real-time)
- Asset allocation pie chart
- PnL chart (1D, 1W, 1M, 1Y, All)
- Position list with unrealized PnL
- Transaction history
- Energy production/consumption stats

#### 3.5.2 Data Aggregation

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Solana     │────▶│  Portfolio  │────▶│   Mobile    │
│  Blockchain │     │  Service    │     │   App       │
└─────────────┘     └─────────────┘     └─────────────┘
                           │
                           ▼
                    ┌─────────────┐
                    │   Pyth      │
                    │   Prices    │
                    └─────────────┘
```

---

### 3.6 Notifications Module

#### 3.6.1 Notification Types

| Category | Examples | Priority |
|----------|----------|----------|
| **Trading** | Order filled, position liquidated, price alert | High |
| **Security** | Login attempt, withdrawal, 2FA | Critical |
| **System** | Maintenance, updates, announcements | Medium |
| **Governance** | New proposal, voting reminder | Medium |
| **Meter** | Reading submitted, minting complete | Low |

#### 3.6.2 Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   Notification Service                       │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   Firebase  │  │    APNs     │  │  In-App     │         │
│  │   (FCM)     │  │   (iOS)     │  │  Notifications│        │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
│         │                │                  │                │
│         └────────┬───────┘                  │                │
│                  │                          │                │
│         ┌────────▼────────┐                 │                │
│         │ Notification    │◀────────────────┘                │
│         │ Preferences     │                                  │
│         │ (User Settings) │                                  │
│         └─────────────────┘                                  │
└─────────────────────────────────────────────────────────────┘
```

---

### 3.7 Offline-First Module

#### 3.7.1 Caching Strategy

| Data Type | Cache Strategy | Expiry |
|-----------|----------------|--------|
| **User Profile** | Cache-first | 1 hour |
| **Portfolio** | Network-first | 5 minutes |
| **Order Book** | Network-only | N/A |
| **Transaction History** | Cache-first | 24 hours |
| **Market Prices** | Stale-while-revalidate | 1 minute |

#### 3.7.2 Local Database Schema

```sql
-- iOS (CoreData) / Android (Room)
CREATE TABLE users (
    id TEXT PRIMARY KEY,
    email TEXT,
    name TEXT,
    role TEXT,
    last_synced TIMESTAMP
);

CREATE TABLE positions (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    asset_type TEXT,
    amount REAL,
    entry_price REAL,
    current_price REAL,
    pnl REAL,
    updated_at TIMESTAMP
);

CREATE TABLE transactions (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    type TEXT,
    amount REAL,
    status TEXT,
    created_at TIMESTAMP
);
```

---

## 4. Shared Core (Rust WASM)

### 4.1 Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Shared Core (Rust)                        │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   Crypto    │  │   Pricing   │  │    ZK       │         │
│  │   Module    │  │   Module    │  │   Module    │         │
│  │             │  │             │  │             │         │
│  │ - HMAC      │  │ - Black-    │  │ - Shield    │         │
│  │ - Ed25519   │  │   Scholes   │  │ - Unshield  │         │
│  │ - Signing   │  │ - Greeks    │  │ - Proofs    │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   Trading   │  │   Oracle    │  │    Utils    │         │
│  │   Module    │  │   Module    │  │   Module    │         │
│  │             │  │             │  │             │         │
│  │ - Order     │  │ - Price     │  │ - Time      │         │
│  │ - Matching  │  │   Feeds     │  │ - Format    │         │
│  │ - PnL       │  │ - TWAP      │  │ - Validation│         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
                  ┌─────────────────┐
                  │  WASM Compiler  │
                  │  (wasm-pack)    │
                  └─────────────────┘
                            │
            ┌───────────────┴───────────────┐
            ▼                               ▼
┌───────────────────┐           ┌───────────────────┐
│   iOS Binding     │           │  Android Binding  │
│   (Swift)         │           │  (Kotlin)         │
└───────────────────┘           └───────────────────┘
```

### 4.2 WASM Interface

```rust
// lib.rs - Entry point for WASM exports
#[wasm_bindgen]
pub struct GridTokenXCore {
    // Internal state
}

#[wasm_bindgen]
impl GridTokenXCore {
    #[wasm_bindgen(constructor)]
    pub fn new() -> GridTokenXCore;
    
    // Crypto operations
    pub fn sign_order(&self, order: &str, private_key: &str) -> String;
    pub fn verify_signature(&self, data: &str, signature: &str, public_key: &str) -> bool;
    
    // Pricing calculations
    pub fn black_scholes(&self, spot: f64, strike: f64, time: f64, vol: f64, rate: f64) -> OptionResult;
    pub fn calculate_greeks(&self, spot: f64, strike: f64, time: f64, vol: f64, rate: f64) -> GreeksResult;
    
    // Trading logic
    pub fn calculate_pnl(&self, entry: f64, exit: f64, amount: f64, is_long: bool) -> f64;
    pub fn validate_order(&self, order: &Order) -> ValidationResult;
    
    // ZK operations
    pub fn create_shield_proof(&self, input: &ShieldInput) -> ZkProof;
    pub fn verify_shield_proof(&self, proof: &ZkProof) -> bool;
}
```

---

## 5. API Integration

### 5.1 API Gateway Endpoints

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/api/v1/auth/register` | POST | User registration | No |
| `/api/v1/auth/login` | POST | User login | No |
| `/api/v1/auth/refresh` | POST | Refresh token | Yes (refresh) |
| `/api/v1/auth/logout` | POST | User logout | Yes |
| `/api/v1/trading/orders` | GET/POST | List/Create orders | Yes |
| `/api/v1/trading/orders/:id` | GET/PUT/DELETE | Order details/cancel | Yes |
| `/api/v1/trading/orderbook` | GET | Order book depth | No |
| `/api/v1/trading/trades` | GET | Trade history | No |
| `/api/v1/portfolio/balance` | GET | Token balances | Yes |
| `/api/v1/portfolio/positions` | GET | Open positions | Yes |
| `/api/v1/portfolio/history` | GET | Transaction history | Yes |
| `/api/v1/meter/register` | POST | Register meter | Yes |
| `/api/v1/meter/readings` | POST | Submit reading | Yes |
| `/api/v1/meter/mint` | POST | Mint energy tokens | Yes |
| `/api/v1/governance/proposals` | GET/POST | List/Create proposals | Yes |
| `/api/v1/governance/vote` | POST | Vote on proposal | Yes |
| `/api/v1/notifications/preferences` | GET/PUT | Notification settings | Yes |

### 5.2 Rate Limiting

| Tier | Requests/Minute | Requests/Day |
|------|-----------------|--------------|
| **Anonymous** | 30 | 500 |
| **Authenticated** | 100 | 10,000 |
| **Premium** | 500 | 50,000 |

---

## 6. Security Design

### 6.1 Threat Model

| Threat | Mitigation |
|--------|------------|
| **Man-in-the-Middle** | TLS 1.3, Certificate Pinning |
| **Token Theft** | Encrypted storage, short-lived tokens |
| **Reverse Engineering** | Code obfuscation, jailbreak/root detection |
| **Key Extraction** | Hardware-backed keystore (Secure Enclave, TEE) |
| **Replay Attacks** | Nonce + timestamp in signed messages |

### 6.2 Key Management

```
┌─────────────────────────────────────────────────────────────┐
│                    Key Hierarchy                             │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────┐   │
│  │              Root Key (Hardware-backed)              │   │
│  │         (Secure Enclave / Android TEE)              │   │
│  └─────────────────────────────────────────────────────┘   │
│                          │                                   │
│                          ▼                                   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │           Master Encryption Key (Derived)            │   │
│  └─────────────────────────────────────────────────────┘   │
│                          │                                   │
│          ┌───────────────┼───────────────┐                  │
│          ▼               ▼               ▼                  │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐           │
│  │  JWT Keys   │ │  Wallet     │ │  Local DB   │           │
│  │  (Encrypted)│ │  Keys       │ │  Encryption │           │
│  │             │ │  (Encrypted)│ │  Key        │           │
│  └─────────────┘ └─────────────┘ └─────────────┘           │
└─────────────────────────────────────────────────────────────┘
```

### 6.3 Security Checklist

- [ ] TLS 1.3 with certificate pinning
- [ ] Biometric authentication for sensitive operations
- [ ] Encrypted local storage (SQLCipher / Encrypted Room)
- [ ] Jailbreak/root detection
- [ ] Code obfuscation (ProGuard / R8 for Android)
- [ ] Anti-tampering checks
- [ ] Secure key generation and storage
- [ ] Token refresh with rotation
- [ ] Session timeout (5 minutes inactivity)
- [ ] Rate limiting on API calls

---

## 7. Performance Requirements

### 7.1 Targets

| Metric | Target | Measurement |
|--------|--------|-------------|
| **App Launch (Cold)** | < 2 seconds | Time to interactive |
| **App Launch (Warm)** | < 1 second | Time to interactive |
| **Screen Transition** | < 300ms | 95th percentile |
| **API Response** | < 500ms | P95 latency |
| **WebSocket Latency** | < 100ms | Round-trip time |
| **Transaction Signing** | < 500ms | User approval to broadcast |
| **Battery Impact** | < 5%/hour | Active usage |
| **Memory Usage** | < 200MB | Background, < 500MB foreground |

### 7.2 Optimization Strategies

1. **Image Optimization**: WebP format, lazy loading, caching
2. **Network Batching**: Combine API calls where possible
3. **Pagination**: Infinite scroll for lists (orders, history)
4. **WebSocket Multiplexing**: Single connection for all real-time updates
5. **Background Sync**: Periodic data refresh in background
6. **Database Indexing**: Optimized queries for local storage

---

## 8. Testing Strategy

### 8.1 Test Pyramid

```
                    ┌───────────┐
                   │    E2E    │  10% (Playwright + Detox)
                  │   Tests     │
                 └─────────────┘
                ┌─────────────────┐
               │  Integration     │  20% (API + Blockchain)
              │     Tests         │
             └───────────────────┘
            ┌─────────────────────┐
           │      Unit Tests       │  70% (XCTest / JUnit)
          │   (ViewModels, Use     │
         │      Cases, Utils)      │
        └─────────────────────────┘
```

### 8.2 Test Coverage Requirements

| Component | Minimum Coverage |
|-----------|------------------|
| **ViewModels** | 90% |
| **Use Cases** | 95% |
| **Repositories** | 85% |
| **UI Components** | 70% |
| **Shared Core (WASM)** | 95% |

### 8.3 Testing Tools

| Platform | Unit Testing | UI Testing | E2E Testing |
|----------|--------------|------------|-------------|
| **iOS** | XCTest | XCUITest | Detox |
| **Android** | JUnit + Mockito | Espresso | Detox |
| **Shared (WASM)** | cargo test | N/A | N/A |

---

## 9. Deployment & CI/CD

### 9.1 Pipeline Architecture

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│   Git    │────▶│   CI     │────▶│   CD     │────▶│  Store   │
│  Commit  │     │  (GitHub │     │ (Fastlane│     │  Review  │
│          │     │  Actions)│     │  + OTA)  │     │          │
└──────────┘     └──────────┘     └──────────┘     └──────────┘
                      │                │
                      ▼                ▼
               ┌─────────────┐  ┌─────────────┐
               │  Build &    │  │  TestFlight │
               │  Test       │  │  / Internal │
               │             │  │  Testing    │
               └─────────────┘  └─────────────┘
```

### 9.2 Release Channels

| Channel | Platform | Frequency | Approval |
|---------|----------|-----------|----------|
| **Internal** | iOS (TestFlight) + Android (Internal) | Daily | Auto |
| **Beta** | iOS (TestFlight) + Android (Open Beta) | Weekly | Auto |
| **Production** | App Store + Play Store | Bi-weekly | Manual |

### 9.3 Over-the-Air Updates

For critical bug fixes without app store review:

- **iOS**: Limited to TestFlight (App Store review required for production)
- **Android**: Play Feature Delivery (dynamic feature modules)
- **React Native CodePush**: Not applicable (native apps)

---

## 10. Monitoring & Analytics

### 10.1 Observability Stack

| Tool | Purpose | Platform |
|------|---------|----------|
| **Firebase Crashlytics** | Crash reporting | iOS + Android |
| **Sentry** | Error tracking | iOS + Android |
| **Mixpanel** | User analytics | iOS + Android |
| **Prometheus + Grafana** | Backend metrics | Backend |
| **Solana Explorer** | On-chain transactions | Blockchain |

### 10.2 Key Metrics

#### 10.2.1 Business Metrics

- Daily Active Users (DAU)
- Monthly Active Users (MAU)
- Trading Volume (24h, 7d, 30d)
- User Retention (D1, D7, D30)
- Average Revenue Per User (ARPU)
- Conversion Rate (Registration → First Trade)

#### 10.2.2 Technical Metrics

- Crash-free sessions (%)
- App launch time (p50, p95, p99)
- API error rate (%)
- WebSocket connection success rate (%)
- Battery consumption (mAh/hour)
- Network data usage (MB/session)

---

## 11. Accessibility & Internationalization

### 11.1 Accessibility Standards

| Standard | Requirement |
|----------|-------------|
| **WCAG 2.1** | Level AA compliance |
| **VoiceOver (iOS)** | Full screen reader support |
| **TalkBack (Android)** | Full screen reader support |
| **Dynamic Type** | Support system font sizes |
| **Color Contrast** | Minimum 4.5:1 ratio |
| **Touch Targets** | Minimum 44x44 points |

### 11.2 Supported Languages (Phase 1)

| Language | Code | Market |
|----------|------|--------|
| English | en | Global |
| Chinese (Simplified) | zh-CN | China, Singapore |
| Spanish | es | Latin America, Spain |
| German | de | Germany, Austria |
| French | fr | France, Canada |
| Japanese | ja | Japan |

---

## 12. Project Timeline

### 12.1 Phase 1: Foundation (Months 1-3)

- [ ] Project setup (iOS + Android)
- [ ] Shared Core (Rust WASM) implementation
- [ ] Authentication module
- [ ] Wallet integration (basic)
- [ ] API client layer
- [ ] Basic UI components

### 12.2 Phase 2: Core Features (Months 4-6)

- [ ] Trading module (P2P, Spot)
- [ ] Portfolio dashboard
- [ ] Smart meter integration
- [ ] Real-time WebSocket updates
- [ ] Push notifications
- [ ] Offline-first caching

### 12.3 Phase 3: Advanced Features (Months 7-9)

- [ ] Futures & Options trading
- [ ] Batch auctions
- [ ] Carbon credit marketplace
- [ ] ZK privacy features
- [ ] Governance module
- [ ] Energy grid map

### 12.4 Phase 4: Polish & Launch (Months 10-12)

- [ ] Performance optimization
- [ ] Security audit
- [ ] Beta testing
- [ ] App Store submission
- [ ] Marketing launch

---

## 13. Risk Assessment

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| **Solana Network Outages** | High | Medium | Multi-RPC fallback, transaction retry logic |
| **App Store Rejection** | High | Medium | Early engagement with Apple/Google, compliance review |
| **Security Breach** | Critical | Low | Regular audits, bug bounty program, insurance |
| **Performance Issues** | Medium | Medium | Continuous profiling, performance budgets |
| **Regulatory Changes** | High | Medium | Legal review, flexible architecture |
| **Team Capacity** | Medium | Medium | Agile sprints, prioritization, outsourcing non-core |

---

## 14. Appendix

### 14.1 Glossary

| Term | Definition |
|------|------------|
| **Prosumer** | Energy producer + consumer (e.g., household with solar panels) |
| **REC** | Renewable Energy Certificate (carbon credit) |
| **ZK** | Zero-Knowledge (privacy-preserving cryptography) |
| **WASM** | WebAssembly (portable binary format) |
| **PDA** | Program Derived Address (Solana deterministic addresses) |
| **TWAP** | Time-Weighted Average Price |

### 14.2 References

1. [Solana Mobile Stack Documentation](https://docs.solanamobile.com/)
2. [Anchor Framework](https://www.anchor-lang.com/)
3. [Rust WASM Book](https://rustwasm.github.io/docs/book/)
4. [iOS Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)
5. [Material Design 3](https://m3.material.io/)

### 14.3 Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 17 Mar 2026 | Engineering Team | Initial draft |

---

## 15. Approval

| Role | Name | Signature | Date |
|------|------|-----------|------|
| **Product Manager** | | | |
| **Engineering Lead** | | | |
| **Architecture Lead** | | | |
| **Security Lead** | | | |

---

**END OF DOCUMENT**
