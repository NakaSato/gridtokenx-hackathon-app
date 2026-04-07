# GridTokenX UI Design System

**Document Version:** 1.0  
**Last Updated:** 17 March 2026  
**Status:** Draft  
**Audience:** Designers, Frontend Engineers, Mobile Engineers, Product Managers

---

## 1. Introduction

### 1.1 Purpose

This document defines the **GridTokenX UI Design System** — a comprehensive, platform-agnostic design language that ensures visual consistency, accessibility, and brand coherence across **Web (Next.js)**, **iOS (SwiftUI)**, and **Android (Jetpack Compose)** applications.

### 1.2 Design Principles

| Principle | Description | Example |
|-----------|-------------|---------|
| **Clarity First** | Prioritize readability and comprehension over decoration | High contrast text, clear hierarchy |
| **Consistency** | Same patterns, same behavior, same appearance across platforms | Unified button styles, spacing scale |
| **Accessibility** | WCAG 2.1 AA compliance as a baseline | 4.5:1 contrast ratio, screen reader support |
| **Performance** | Design decisions that enhance perceived performance | Skeleton loaders, optimistic UI |
| **Adaptability** | Responsive and adaptive to all screen sizes | Mobile-first, fluid layouts |
| **Trust** | Visual cues that build user confidence in financial transactions | Clear status indicators, confirmation dialogs |

### 1.3 Platform Implementation

| Platform | Technology | Package/Module |
|----------|------------|----------------|
| **Web** | Next.js 16 + Tailwind CSS 4 + shadcn/ui | `@gridtokenx/ui-web` |
| **iOS** | SwiftUI + Design Tokens | `GridTokenXDesignSystem` (Swift Package) |
| **Android** | Jetpack Compose + Material 3 | `com.gridtokenx:design-system` (Maven) |

---

## 2. Design Tokens

Design tokens are the atomic units of the design system — platform-agnostic values stored as JSON and transformed for each platform.

### 2.1 Color Palette

#### 2.1.1 Brand Colors

```json
{
  "color": {
    "brand": {
      "primary": {
        "50": "#E8F5E9",
        "100": "#C8E6C9",
        "200": "#A5D6A7",
        "300": "#81C784",
        "400": "#66BB6A",
        "500": "#4CAF50",
        "600": "#43A047",
        "700": "#388E3C",
        "800": "#2E7D32",
        "900": "#1B5E20"
      },
      "secondary": {
        "50": "#E3F2FD",
        "100": "#BBDEFB",
        "200": "#90CAF9",
        "300": "#64B5F6",
        "400": "#42A5F5",
        "500": "#2196F3",
        "600": "#1E88E5",
        "700": "#1976D2",
        "800": "#1565C0",
        "900": "#0D47A1"
      },
      "accent": {
        "50": "#FFF8E1",
        "100": "#FFECB3",
        "200": "#FFE082",
        "300": "#FFD54F",
        "400": "#FFCA28",
        "500": "#FFC107",
        "600": "#FFB300",
        "700": "#FFA000",
        "800": "#FF8F00",
        "900": "#FF6F00"
      }
    }
  }
}
```

#### 2.1.2 Semantic Colors

```json
{
  "color": {
    "semantic": {
      "success": {
        "light": "#E8F5E9",
        "default": "#4CAF50",
        "dark": "#1B5E20"
      },
      "warning": {
        "light": "#FFF8E1",
        "default": "#FFC107",
        "dark": "#FF6F00"
      },
      "error": {
        "light": "#FFEBEE",
        "default": "#F44336",
        "dark": "#B71C1C"
      },
      "info": {
        "light": "#E3F2FD",
        "default": "#2196F3",
        "dark": "#0D47A1"
      }
    }
  }
}
```

#### 2.1.3 Neutral Colors

```json
{
  "color": {
    "neutral": {
      "white": "#FFFFFF",
      "black": "#000000",
      "gray": {
        "50": "#FAFAFA",
        "100": "#F5F5F5",
        "200": "#EEEEEE",
        "300": "#E0E0E0",
        "400": "#BDBDBD",
        "500": "#9E9E9E",
        "600": "#757575",
        "700": "#616161",
        "800": "#424242",
        "900": "#212121"
      }
    }
  }
}
```

#### 2.1.4 Dark Mode Palette

```json
{
  "color": {
    "dark": {
      "background": {
        "primary": "#121212",
        "secondary": "#1E1E1E",
        "tertiary": "#2D2D2D"
      },
      "surface": {
        "default": "#1E1E1E",
        "raised": "#2D2D2D",
        "overlay": "#3D3D3D"
      },
      "text": {
        "primary": "#FFFFFF",
        "secondary": "#B0B0B0",
        "disabled": "#6B6B6B"
      }
    }
  }
}
```

### 2.2 Typography

#### 2.2.1 Font Families

```json
{
  "typography": {
    "fontFamily": {
      "primary": "Inter",
      "secondary": "JetBrains Mono",
      "system": {
        "ios": "SF Pro Text",
        "android": "Roboto",
        "web": "Inter, system-ui, sans-serif"
      }
    }
  }
}
```

#### 2.2.2 Type Scale

```json
{
  "typography": {
    "scale": {
      "display": {
        "fontSize": "56px",
        "lineHeight": "64px",
        "fontWeight": "700",
        "letterSpacing": "-0.5px"
      },
      "headline": {
        "fontSize": "32px",
        "lineHeight": "40px",
        "fontWeight": "600"
      },
      "title": {
        "fontSize": "24px",
        "lineHeight": "32px",
        "fontWeight": "600"
      },
      "body": {
        "fontSize": "16px",
        "lineHeight": "24px",
        "fontWeight": "400"
      },
      "caption": {
        "fontSize": "12px",
        "lineHeight": "16px",
        "fontWeight": "400"
      },
      "overline": {
        "fontSize": "10px",
        "lineHeight": "14px",
        "fontWeight": "600",
        "textTransform": "uppercase"
      }
    }
  }
}
```

### 2.3 Spacing Scale

```json
{
  "spacing": {
    "xs": "4px",
    "sm": "8px",
    "md": "16px",
    "lg": "24px",
    "xl": "32px",
    "2xl": "48px",
    "3xl": "64px",
    "4xl": "96px"
  }
}
```

### 2.4 Border Radius

```json
{
  "borderRadius": {
    "none": "0px",
    "sm": "4px",
    "md": "8px",
    "lg": "12px",
    "xl": "16px",
    "2xl": "24px",
    "full": "9999px"
  }
}
```

### 2.5 Shadows

```json
{
  "shadow": {
    "sm": "0 1px 2px rgba(0, 0, 0, 0.05)",
    "md": "0 4px 6px rgba(0, 0, 0, 0.1)",
    "lg": "0 10px 15px rgba(0, 0, 0, 0.1)",
    "xl": "0 20px 25px rgba(0, 0, 0, 0.15)",
    "2xl": "0 25px 50px rgba(0, 0, 0, 0.25)",
    "inner": "inset 0 2px 4px rgba(0, 0, 0, 0.06)"
  }
}
```

### 2.6 Breakpoints

```json
{
  "breakpoint": {
    "xs": "320px",
    "sm": "640px",
    "md": "768px",
    "lg": "1024px",
    "xl": "1280px",
    "2xl": "1536px"
  }
}
```

---

## 3. Core Components

### 3.1 Buttons

#### 3.1.1 Variants

```
┌─────────────────────────────────────────────────────────────┐
│  PRIMARY BUTTON                                            │
│  ┌─────────────────────────────────────┐                   │
│  │         Trade Energy                │  bg: brand.500     │
│  └─────────────────────────────────────┘  text: white       │
│                                           hover: brand.600  │
├─────────────────────────────────────────────────────────────┤
│  SECONDARY BUTTON                                          │
│  ┌─────────────────────────────────────┐                   │
│  │         View Details                │  bg: transparent   │
│  └─────────────────────────────────────┘  border: brand.500 │
│                                           text: brand.500   │
├─────────────────────────────────────────────────────────────┤
│  TERTIARY BUTTON                                           │
│  ┌─────────────────────────────────────┐                   │
│  │         Cancel                      │  bg: transparent   │
│  └─────────────────────────────────────┘  text: gray.600    │
├─────────────────────────────────────────────────────────────┤
│  DESTRUCTIVE BUTTON                                        │
│  ┌─────────────────────────────────────┐                   │
│  │         Cancel Order                │  bg: error.default │
│  └─────────────────────────────────────┘  text: white       │
└─────────────────────────────────────────────────────────────┘
```

#### 3.1.2 Sizes

| Size | Height | Padding-X | Font Size | Use Case |
|------|--------|-----------|-----------|----------|
| **Sm** | 32px | 12px | 12px | Inline actions, compact UI |
| **Md** | 40px | 16px | 14px | Default buttons |
| **Lg** | 48px | 24px | 16px | Primary CTAs, mobile |
| **Xl** | 56px | 32px | 18px | Hero sections, landing pages |

#### 3.1.3 States

```
┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   Default    │  │    Hover     │  │   Pressed    │  │   Disabled   │
│  ┌────────┐  │  │  ┌────────┐  │  │  ┌────────┐  │  │  ┌────────┐  │
│  │ Button │  │  │  │ Button │  │  │  │ Button │  │  │  │ Button │  │
│  └────────┘  │  │  └────────┘  │  │  └────────┘  │  │  └────────┘  │
│  opacity: 1  │  │  scale: 1.02 │  │  scale: 0.98 │  │  opacity: 0.5│
│              │  │  brightness+ │  │  brightness- │  │  cursor: not-│
└──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘
```

#### 3.1.4 Implementation

**Web (React + Tailwind):**
```tsx
<Button variant="primary" size="md" disabled={isLoading}>
  Trade Energy
</Button>
```

**iOS (SwiftUI):**
```swift
Button(action: onTrade) {
    Text("Trade Energy")
        .font(.system(size: 14, weight: .medium))
        .frame(height: 40)
        .background(Color.brandPrimary)
        .foregroundColor(.white)
        .cornerRadius(8)
}
.disabled(isLoading)
```

**Android (Jetpack Compose):**
```kotlin
Button(
    onClick = onTrade,
    modifier = Modifier.height(40.dp),
    enabled = !isLoading
) {
    Text(
        "Trade Energy",
        fontSize = 14.sp,
        fontWeight = FontWeight.Medium
    )
}
```

---

### 3.2 Input Fields

#### 3.2.1 Anatomy

```
┌─────────────────────────────────────────────────────────────┐
│  LABEL (optional)                                           │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Placeholder text                                    │   │
│  └─────────────────────────────────────────────────────┘   │
│  Helper text (optional)                                     │
└─────────────────────────────────────────────────────────────┘
```

#### 3.2.2 States

| State | Border Color | Background | Icon |
|-------|--------------|------------|------|
| **Default** | gray.300 | white | None |
| **Focus** | brand.500 | white | None |
| **Hover** | gray.400 | white | None |
| **Error** | error.default | error.light (10%) | Error icon |
| **Success** | success.default | success.light (10%) | Check icon |
| **Disabled** | gray.200 | gray.50 | None |

#### 3.2.3 Variants

```
┌─────────────────────────────────────────────────────────────┐
│  TEXT INPUT                                                 │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Enter amount                                        │   │
│  └─────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│  NUMBER INPUT (with steppers)                              │
│  ┌──────────────┐  ┌───┐  ┌───┐                           │
│  │      100     │  │ - │  │ + │                           │
│  └──────────────┘  └───┘  └───┘                           │
├─────────────────────────────────────────────────────────────┤
│  SEARCH INPUT                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 🔍 Search orders...                                 │   │
│  └─────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│  PASSWORD INPUT                                            │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ ••••••••                           [👁]             │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

### 3.3 Cards

#### 3.3.1 Types

```
┌─────────────────────────────────────────────────────────────┐
│  BASIC CARD                                                 │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                                                     │   │
│  │  Card content                                       │   │
│  │                                                     │   │
│  └─────────────────────────────────────────────────────┘   │
│  bg: white, shadow: md, radius: lg                         │
├─────────────────────────────────────────────────────────────┤
│  INTERACTIVE CARD (clickable)                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  ┌───┐                                              │   │
│  │  │ 📊│  Portfolio Summary                            │   │
│  │  └───┘                          →                   │   │
│  │  $12,450.00 (+5.2%)                                 │   │
│  └─────────────────────────────────────────────────────┘   │
│  hover: shadow-lg, cursor: pointer                         │
├─────────────────────────────────────────────────────────────┤
│  STAT CARD                                                  │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Total Balance                                      │   │
│  │  $12,450.00                                         │   │
│  │  ━━━━━━━━━━━━━━━━                                   │   │
│  │  +5.2% (24h)                                        │   │
│  └─────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│  TRADING CARD                                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  BTC/USD                                            │   │
│  │  $42,350.00                                         │   │
│  │  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━                  │   │
│  │  Buy              Sell                              │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

### 3.4 Data Display

#### 3.4.1 Tables

```
┌─────────────────────────────────────────────────────────────────────────┐
│  ORDERS TABLE                                                           │
├──────────────┬──────────────┬──────────────┬──────────────┬────────────┤
│  Type       │  Price       │  Amount      │  Status      │  Actions   │
├──────────────┼──────────────┼──────────────┼──────────────┼────────────┤
│  Buy        │  $0.12/kWh   │  500 kWh     │  Filled      │  [View]    │
│  Sell       │  $0.15/kWh   │  300 kWh     │  Pending     │  [Cancel]  │
│  Buy        │  $0.11/kWh   │  750 kWh     │  Partial     │  [View]    │
└──────────────┴──────────────┴──────────────┴──────────────┴────────────┘
```

**Responsive Behavior:**
- Desktop: Full table with all columns
- Tablet: Hide less important columns, horizontal scroll if needed
- Mobile: Card-based layout (each row becomes a card)

#### 3.4.2 Lists

```
┌─────────────────────────────────────────────────────────────┐
│  TRANSACTION LIST                                           │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  ┌───┐  Energy Purchase              -$125.00      │   │
│  │  │ 📄│  Today, 2:30 PM               Filled        │   │
│  │  └───┘                                              │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │  ┌───┐  Energy Sale                  +$85.50       │   │
│  │  │ 📄│  Yesterday, 10:15 AM          Filled        │   │
│  │  └───┘                                              │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

#### 3.4.3 Badges

| Variant | Background | Text | Use Case |
|---------|------------|------|----------|
| **Success** | success.light | success.dark | Filled orders, positive PnL |
| **Warning** | warning.light | warning.dark | Pending orders |
| **Error** | error.light | error.dark | Cancelled, rejected |
| **Info** | info.light | info.dark | Neutral status |
| **Neutral** | gray.100 | gray.700 | Default |

---

### 3.5 Navigation

#### 3.5.1 Top Navigation Bar (Web)

```
┌─────────────────────────────────────────────────────────────────────────┐
│  [Logo]  [Dashboard]  [Trading]  [Portfolio]  [Meter]     [User] [🔔]  │
└─────────────────────────────────────────────────────────────────────────┘
```

#### 3.5.2 Bottom Navigation (Mobile)

```
┌─────────────────────────────────────────────────────────────┐
│  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐         │
│  │ 🏠   │  │ 📊   │  │ ⚡   │  │ 💼   │  │ 👤   │         │
│  │ Home │  │ Trade│  │ Meter│  │ Port │  │ More │         │
│  └──────┘  └──────┘  └──────┘  └──────┘  └──────┘         │
└─────────────────────────────────────────────────────────────┘
```

#### 3.5.3 Side Navigation (Tablet/Desktop)

```
┌─────────────┬───────────────────────────────────────────────────────────┐
│  [Logo]     │  Main Content Area                                       │
│             │                                                           │
│  ┌───────┐  │                                                           │
│  │ 🏠 Home│  │                                                           │
│  ├───────┤  │                                                           │
│  │ 📊    │  │                                                           │
│  │ Trade │  │                                                           │
│  ├───────┤  │                                                           │
│  │ ⚡    │  │                                                           │
│  │ Meter │  │                                                           │
│  ├───────┤  │                                                           │
│  │ 💼    │  │                                                           │
│  │ Port  │  │                                                           │
│  └───────┘  │                                                           │
│             │                                                           │
│  ─────────  │                                                           │
│             │                                                           │
│  [Settings] │                                                           │
│  [Logout]   │                                                           │
└─────────────┴───────────────────────────────────────────────────────────┘
```

---

### 3.6 Feedback Components

#### 3.6.1 Loading States

**Skeleton Loader:**
```
┌─────────────────────────────────────────────────────────────┐
│  ┌─────────────────────────────────────────────────────┐   │
│  │  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓   │   │
│  │  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓   │   │
│  │  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓   │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

**Spinner:**
```
    ⟳ Loading...
```

**Progress Bar:**
```
┌─────────────────────────────────────────────────────────────┐
│  ████████████████████████░░░░░░░░░░░░░░░░░░  65%           │
└─────────────────────────────────────────────────────────────┘
```

#### 3.6.2 Alerts & Banners

```
┌─────────────────────────────────────────────────────────────┐
│  SUCCESS ALERT                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  ✓  Order filled successfully!                      │   │
│  └─────────────────────────────────────────────────────┘   │
│  bg: success.light, border: success.default               │
├─────────────────────────────────────────────────────────────┤
│  WARNING ALERT                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  ⚠  Low balance warning. Please top up.             │   │
│  └─────────────────────────────────────────────────────┘   │
│  bg: warning.light, border: warning.default               │
├─────────────────────────────────────────────────────────────┤
│  ERROR ALERT                                                │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  ✕  Transaction failed. Please try again.           │   │
│  └─────────────────────────────────────────────────────┘   │
│  bg: error.light, border: error.default                   │
├─────────────────────────────────────────────────────────────┤
│  INFO ALERT                                                 │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  ℹ  Maintenance scheduled for 2 AM UTC.             │   │
│  └─────────────────────────────────────────────────────┘   │
│  bg: info.light, border: info.default                     │
└─────────────────────────────────────────────────────────────┘
```

#### 3.6.3 Toast Notifications

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  ✓  Order submitted                                 │   │
│  │     Order #12345 has been placed successfully       │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  ⚠  Price alert                                      │   │
│  │     BTC/USD reached $42,000                          │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Position:** Bottom-right (Web), Top (Mobile)  
**Duration:** 5 seconds (auto-dismiss)  
**Max visible:** 3 toasts stacked

#### 3.6.4 Modals & Dialogs

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│     ┌───────────────────────────────────────────────────┐  │
│     │  Confirm Order                                     │  │
│     │                                                    │  │
│     │  You are about to buy 500 kWh at $0.12/kWh       │  │
│     │  Total: $60.00                                    │  │
│     │                                                    │  │
│     │  ┌─────────────┐  ┌─────────────┐                │  │
│     │  │   Cancel    │  │   Confirm   │                │  │
│     │  └─────────────┘  └─────────────┘                │  │
│     └───────────────────────────────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Overlay:** `rgba(0, 0, 0, 0.5)`  
**Animation:** Fade in + scale up (200ms)  
**Dismiss:** Click outside, ESC key, Cancel button

---

### 3.7 Trading-Specific Components

#### 3.7.1 Order Book

```
┌─────────────────────────────────────────────────────────────┐
│  ORDER BOOK                                    Depth: 10   │
├──────────────┬──────────────┬──────────────┬───────────────┤
│  Price       │  Amount      │  Total       │  Depth Bar    │
├──────────────┼──────────────┼──────────────┼───────────────┤
│  $0.15       │  500 kWh     │  500 kWh     │  ████         │
│  $0.14       │  750 kWh     │  1,250 kWh   │  ██████       │
│  $0.13       │  1,000 kWh   │  2,250 kWh   │  ████████     │
├──────────────┴──────────────┴──────────────┴───────────────┤
│  Spread: $0.01                                              │
├──────────────┬──────────────┬──────────────┬───────────────┤
│  $0.12       │  800 kWh     │  800 kWh     │  █████        │
│  $0.11       │  600 kWh     │  1,400 kWh   │  ████         │
│  $0.10       │  400 kWh     │  1,800 kWh   │  ███          │
└──────────────┴──────────────┴──────────────┴───────────────┘
```

**Color Coding:**
- Asks (Sell): Red tint (`rgba(244, 67, 54, 0.1)`)
- Bids (Buy): Green tint (`rgba(76, 175, 80, 0.1)`)
- Depth bars: Gradient based on volume

#### 3.7.2 Price Chart

```
┌─────────────────────────────────────────────────────────────┐
│  BTC/USD                           [1H] [4H] [1D] [1W] [1M]│
│  $42,350.00 (+5.2%)                                         │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│         ╱╲                                                  │
│        ╱  ╲    ╱╲                                           │
│       ╱    ╲  ╱  ╲    ╱╲                                    │
│      ╱      ╲╱    ╲  ╱  ╲                                   │
│     ╱             ╲╱    ╲╱                                  │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                             │
│  Vol: ████████  Market Cap: $820B                           │
└─────────────────────────────────────────────────────────────┘
```

**Library:** TradingView Lightweight Charts (Web), Swift Charts (iOS), MPAndroidChart (Android)

#### 3.7.3 Trade Form

```
┌─────────────────────────────────────────────────────────────┐
│  PLACE ORDER                                                │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Type:  [Limit ▼]                                   │   │
│  │                                                     │   │
│  │  Side:  ○ Buy    ○ Sell                            │   │
│  │                                                     │   │
│  │  Price:  $ [0.12] /kWh                             │   │
│  │                                                     │   │
│  │  Amount: [500] kWh                                  │   │
│  │                                                     │   │
│  │  Total:  $60.00                                     │   │
│  │                                                     │   │
│  │  ┌─────────────────────────────────────────────┐   │   │
│  │  │              Buy Energy                      │   │   │
│  │  └─────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. Layout System

### 4.1 Grid System

**Web:** 12-column CSS Grid  
**Mobile:** 4-column CSS Grid  
**Gutter:** 16px (mobile), 24px (tablet), 32px (desktop)

```
Desktop (12 columns, 1280px+)
┌──┬──┬──┬──┬──┬──┬──┬──┬──┬──┬──┬──┐
│  │  │  │  │  │  │  │  │  │  │  │  │
│  │  │  │  │  │  │  │  │  │  │  │  │
└──┴──┴──┴──┴──┴──┴──┴──┴──┴──┴──┴──┘
   ↑           ↑           ↑
   4 cols      4 cols      4 cols

Tablet (8 columns, 768px-1024px)
┌──┬──┬──┬──┬──┬──┬──┬──┐
│  │  │  │  │  │  │  │  │
│  │  │  │  │  │  │  │  │
└──┴──┴──┴──┴──┴──┴──┴──┘
   ↑           ↑
   4 cols      4 cols

Mobile (4 columns, <768px)
┌──┬──┬──┬──┐
│  │  │  │  │
│  │  │  │  │
└──┴──┴──┴──┘
   ↑
   Full width
```

### 4.2 Container Widths

| Breakpoint | Max Width | Padding |
|------------|-----------|---------|
| **xs** | 100% | 16px |
| **sm** | 640px | 24px |
| **md** | 768px | 32px |
| **lg** | 1024px | 40px |
| **xl** | 1280px | 48px |
| **2xl** | 1536px | 64px |

### 4.3 Page Layouts

#### 4.3.1 Dashboard Layout

```
┌─────────────────────────────────────────────────────────────┐
│  Header (Navigation)                                        │
├───────────────┬─────────────────────────────────────────────┤
│               │                                             │
│  Sidebar      │  Main Content                               │
│  (optional)   │  ┌─────────────────────────────────────┐   │
│               │  │  Widget 1  │  Widget 2              │   │
│               │  ├─────────────────────────────────────┤   │
│               │  │  Widget 3                           │   │
│               │  └─────────────────────────────────────┘   │
│               │                                             │
└───────────────┴─────────────────────────────────────────────┘
```

#### 4.3.2 Trading Layout

```
┌─────────────────────────────────────────────────────────────┐
│  Market Selector  │  Price Chart          │  Order Form    │
│  (Dropdown)       │  (60% width)          │  (25% width)   │
├───────────────────┤                       │                │
│  Order Book       │                       │                │
│  (15% width)      │                       │                │
├───────────────────┤                       │                │
│  Trade History    │                       │                │
│  (15% width)      │                       │                │
└───────────────────┴───────────────────────┴────────────────┘
```

---

## 5. Responsive Design

### 5.1 Breakpoint Strategy

```scss
// Mobile-first approach
.component {
  // Base styles (mobile)
  
  @media (min-width: 640px) {
    // Tablet styles
  }
  
  @media (min-width: 768px) {
    // Small desktop styles
  }
  
  @media (min-width: 1024px) {
    // Desktop styles
  }
  
  @media (min-width: 1280px) {
    // Large desktop styles
  }
}
```

### 5.2 Component Adaptation

| Component | Mobile | Tablet | Desktop |
|-----------|--------|--------|---------|
| **Navigation** | Bottom bar | Side drawer | Top bar + sidebar |
| **Tables** | Card list | Scrollable | Full table |
| **Forms** | Single column | 2 columns | Multi-column |
| **Modals** | Full screen | Centered (90%) | Centered (max-width) |
| **Charts** | Simplified | Standard | Full-featured |

### 5.3 Touch Targets

| Element | Minimum Size | Recommended |
|---------|--------------|-------------|
| **Buttons** | 44x44pt | 48x48pt |
| **Links** | 44x44pt | 48x48pt |
| **Input Fields** | Height: 44pt | Height: 48pt |
| **Icon Buttons** | 44x44pt | 48x48pt |

---

## 6. Dark Mode

### 6.1 Color Mapping

| Light Mode | Dark Mode |
|------------|-----------|
| Background: white | Background: #121212 |
| Surface: white | Surface: #1E1E1E |
| Text primary: #212121 | Text primary: #FFFFFF |
| Text secondary: #757575 | Text secondary: #B0B0B0 |
| Border: #E0E0E0 | Border: #3D3D3D |

### 6.2 Implementation

**Web (Tailwind CSS):**
```tsx
<div className="bg-white dark:bg-gray-900">
  <p className="text-gray-900 dark:text-white">Content</p>
</div>
```

**iOS (SwiftUI):**
```swift
Text("Content")
    .foregroundColor(.primary)
    .background(Color(.systemBackground))
```

**Android (Jetpack Compose):**
```kotlin
Text(
    "Content",
    color = MaterialTheme.colorScheme.onBackground,
    modifier = Modifier.background(MaterialTheme.colorScheme.background)
)
```

### 6.3 Dark Mode Guidelines

1. **Avoid pure black** (#000000) — use #121212 for backgrounds
2. **Elevate surfaces** with lighter shades, not shadows
3. **Desaturate brand colors** in dark mode for better contrast
4. **Test accessibility** — ensure 4.5:1 contrast ratio
5. **Images** — reduce brightness by 10-15% in dark mode

---

## 7. Accessibility

### 7.1 WCAG 2.1 AA Requirements

| Requirement | Target | How to Achieve |
|-------------|--------|----------------|
| **Color Contrast** | 4.5:1 (text), 3:1 (UI) | Use contrast checker tool |
| **Focus Indicators** | Visible focus ring | 2px outline, 2px offset |
| **Touch Targets** | 44x44pt minimum | Padding, hitSlop |
| **Screen Reader** | Full support | Accessibility labels, hints |
| **Dynamic Type** | Support system font sizes | Relative units, no fixed sizes |

### 7.2 Focus Management

```
┌─────────────────────────────────────────────────────────────┐
│  FOCUS ORDER (Tab Order)                                    │
│                                                             │
│  [1] Logo → [2] Nav → [3] Search → [4] User → [5] Content  │
│                                                             │
│  Focus indicator:                                           │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓   │   │
│  └─────────────────────────────────────────────────────┘   │
│  Color: brand.500, Width: 2px, Offset: 2px                 │
└─────────────────────────────────────────────────────────────┘
```

### 7.3 Screen Reader Support

**Web (ARIA):**
```html
<button 
  aria-label="Submit order"
  aria-describedby="order-help"
  aria-disabled="false"
>
  Submit
</button>
<span id="order-help" class="sr-only">
  This will place a buy order for 500 kWh
</span>
```

**iOS (VoiceOver):**
```swift
Button(action: onSubmit) {
    Text("Submit")
}
.accessibilityLabel("Submit order")
.accessibilityHint("This will place a buy order for 500 kWh")
```

**Android (TalkBack):**
```kotlin
Button(
    onClick = onSubmit,
    modifier = Modifier.semantics {
        contentDescription = "Submit order"
        stateDescription = "This will place a buy order for 500 kWh"
    }
)
```

---

## 8. Animation & Motion

### 8.1 Timing Functions

```json
{
  "animation": {
    "duration": {
      "fast": "150ms",
      "normal": "250ms",
      "slow": "400ms"
    },
    "easing": {
      "easeInOut": "cubic-bezier(0.4, 0, 0.2, 1)",
      "easeOut": "cubic-bezier(0.0, 0, 0.2, 1)",
      "easeIn": "cubic-bezier(0.4, 0, 1, 1)",
      "spring": "spring(0.5, 300)"
    }
  }
}
```

### 8.2 Common Animations

| Animation | Duration | Easing | Use Case |
|-----------|----------|--------|----------|
| **Fade In** | 200ms | easeOut | Modal, toast, dropdown |
| **Slide Up** | 250ms | easeOut | Bottom sheet, keyboard |
| **Scale** | 150ms | spring | Button press, card hover |
| **Skeleton Pulse** | 1500ms | easeInOut | Loading state |
| **Success Check** | 400ms | spring | Form submission |

### 8.3 Micro-interactions

```
Button Press:
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Default    │ ──▶ │  Hover      │ ──▶ │  Pressed    │
│  scale: 1   │     │  scale: 1.02│     │  scale: 0.98│
│             │     │  brightness+│     │  brightness-│
└─────────────┘     └─────────────┘     └─────────────┘
```

---

## 9. Iconography

### 9.1 Icon Set

**Primary:** Lucide Icons (Web), SF Symbols (iOS), Material Icons (Android)

### 9.2 Icon Sizes

| Size | Dimensions | Use Case |
|------|------------|----------|
| **xs** | 12x12 | Inline text, badges |
| **sm** | 16x16 | Small actions, labels |
| **md** | 20x20 | Buttons, navigation |
| **lg** | 24x24 | Large buttons, cards |
| **xl** | 32x32 | Hero sections, empty states |
| **2xl** | 48x48 | Illustrations, onboarding |

### 9.3 Icon Library

```
┌─────────────────────────────────────────────────────────────┐
│  COMMON ICONS                                               │
│                                                             │
│  🏠 Home        📊 Trading     ⚡ Meter       💼 Portfolio  │
│  🔔 Notifications  ⚙️ Settings  👤 User       🚪 Logout    │
│  🔍 Search      ➕ Add         ✏️ Edit       🗑️ Delete    │
│  ✓ Check       ✕ Close       ⚠ Warning    ℹ Info         │
│  ↑ Upload     ↓ Download     → Next        ← Back         │
│  🔒 Lock      🔓 Unlock      👁 View       📋 Copy        │
│  📅 Calendar  📈 Chart       💰 Payment    📧 Email       │
└─────────────────────────────────────────────────────────────┘
```

---

## 10. Content Guidelines

### 10.1 Voice & Tone

| Context | Tone | Example |
|---------|------|---------|
| **Success** | Positive, concise | "Order filled successfully!" |
| **Error** | Empathetic, actionable | "Transaction failed. Please check your balance and try again." |
| **Warning** | Clear, urgent | "Low balance warning. Top up to continue trading." |
| **Info** | Neutral, helpful | "Maintenance scheduled for 2 AM UTC." |

### 10.2 Writing Guidelines

1. **Be concise** — Use short sentences, active voice
2. **Be clear** — Avoid jargon, explain technical terms
3. **Be consistent** — Same term for same concept
4. **Be actionable** — Tell users what to do next
5. **Be inclusive** — Avoid gendered language, cultural references

### 10.3 Number Formatting

| Type | Format | Example |
|------|--------|---------|
| **Currency** | $X,XXX.XX | $1,234.56 |
| **Percentage** | X.XX% | 5.23% |
| **Large Numbers** | 1.2K, 1.2M, 1.2B | 1.5M kWh |
| **Decimals** | 2-8 decimal places | 0.12345678 |
| **Date** | Locale-specific | Mar 17, 2026 (US) |
| **Time** | 12/24 hour based on locale | 2:30 PM / 14:30 |

---

## 11. Component Implementation Status

| Component | Web (Next.js) | iOS (SwiftUI) | Android (Compose) | Status |
|-----------|---------------|---------------|-------------------|--------|
| **Buttons** | ✅ | ✅ | ✅ | Complete |
| **Inputs** | ✅ | ✅ | ✅ | Complete |
| **Cards** | ✅ | ✅ | ✅ | Complete |
| **Tables** | ✅ | ⏳ | ⏳ | In Progress |
| **Modals** | ✅ | ✅ | ✅ | Complete |
| **Toast** | ✅ | ✅ | ✅ | Complete |
| **Navigation** | ✅ | ✅ | ✅ | Complete |
| **Order Book** | ✅ | ⏳ | ⏳ | In Progress |
| **Price Chart** | ✅ | ⏳ | ⏳ | In Progress |
| **Trade Form** | ✅ | ⏳ | ⏳ | In Progress |

**Legend:** ✅ Complete | ⏳ In Progress | 📋 Planned | ❌ Not Started

---

## 12. Design Token Pipeline

### 12.1 Token Workflow

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Figma       │────▶│  Style       │────▶│  Token       │
│  Design      │     │  Dictionary  │     │  Pipeline    │
│  (Source)    │     │  (JSON)      │     │  (Node.js)   │
└──────────────┘     └──────────────┘     └──────────────┘
                                                 │
                    ┌────────────────────────────┼────────────────────────────┐
                    │                            │                            │
                    ▼                            ▼                            ▼
           ┌──────────────┐            ┌──────────────┐            ┌──────────────┐
           │  Web         │            │  iOS         │            │  Android     │
           │  (CSS/Tailwind)│          │  (Swift)     │            │  (Kotlin)    │
           │  Tokens      │            │  Tokens      │            │  Tokens      │
           └──────────────┘            └──────────────┘            └──────────────┘
```

### 12.2 Token Transformation

**Source (Style Dictionary JSON):**
```json
{
  "color": {
    "brand": {
      "primary": {
        "value": "#4CAF50"
      }
    }
  }
}
```

**Web Output (CSS Custom Properties):**
```css
:root {
  --color-brand-primary: #4CAF50;
}
```

**iOS Output (Swift):**
```swift
extension Color {
    static let brandPrimary = Color(hex: "#4CAF50")
}
```

**Android Output (Kotlin):**
```kotlin
object Colors {
    val brandPrimary = Color(0xFF4CAF50)
}
```

---

## 13. Testing & Quality

### 13.1 Visual Regression Testing

**Tool:** Chromatic (Web), Snapshot Tests (Mobile)

**Process:**
1. Designer updates Figma
2. Tokens auto-generated
3. Components re-rendered
4. Visual diffs compared
5. Approval required for changes

### 13.2 Accessibility Testing

**Tools:**
- **Web:** axe-core, Lighthouse
- **iOS:** Xcode Accessibility Inspector
- **Android:** Accessibility Scanner

**Checklist:**
- [ ] Color contrast ≥ 4.5:1
- [ ] Focus indicators visible
- [ ] Screen reader labels present
- [ ] Touch targets ≥ 44x44pt
- [ ] Dynamic type supported

### 13.3 Performance Testing

**Metrics:**
- First Contentful Paint (FCP) < 1.5s
- Time to Interactive (TTI) < 3.5s
- Cumulative Layout Shift (CLS) < 0.1
- Animation frame rate ≥ 60fps

---

## 14. Versioning & Governance

### 14.1 Versioning

**Semantic Versioning:** `MAJOR.MINOR.PATCH`

| Type | When to Increment | Example |
|------|-------------------|---------|
| **MAJOR** | Breaking changes | 1.0.0 → 2.0.0 |
| **MINOR** | New features (backward compatible) | 1.2.0 → 1.3.0 |
| **PATCH** | Bug fixes, minor updates | 1.2.3 → 1.2.4 |

### 14.2 Change Management

1. **Proposal** — Designer/engineer submits RFC
2. **Review** — Design system team reviews
3. **Approval** — Team lead approves
4. **Implementation** — Update tokens, components, docs
5. **Release** — Publish to package registries
6. **Migration** — Provide migration guide for breaking changes

### 14.3 Contribution Guidelines

**Who can contribute:**
- Design team (Figma components)
- Frontend engineers (code components)
- Mobile engineers (native components)

**How to contribute:**
1. Fork design system repo
2. Create feature branch
3. Implement changes
4. Submit PR with screenshots
5. Address feedback
6. Merge after approval

---

## 15. Resources

### 15.1 Design Files

- **Figma:** [GridTokenX Design System](https://figma.com/file/gridtokenx-design-system)
- **Component Library:** [GridTokenX UI Components](https://figma.com/file/gridtokenx-components)

### 15.2 Code Repositories

- **Web:** `github.com/gridtokenx/ui-web`
- **iOS:** `github.com/gridtokenx/design-system-ios`
- **Android:** `github.com/gridtokenx/design-system-android`

### 15.3 Documentation

- **Storybook (Web):** https://ui.gridtokenx.com
- **Component Docs:** See individual README files

---

## 16. Appendix

### 16.1 Color Contrast Checker

Use this formula to calculate contrast ratio:

```
Contrast Ratio = (L1 + 0.05) / (L2 + 0.05)
```

Where L1 and L2 are relative luminances (0-1).

**Tools:**
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [Contrast Ratio](https://contrast-ratio.com/)

### 16.2 Design Token Schema

Full schema available at: `packages/tokens/schema.json`

### 16.3 Component Props Reference

See individual component documentation for complete props/API reference.

---

**END OF DOCUMENT**
