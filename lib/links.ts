/**
 * External Links Configuration
 * Centralized configuration for all external URLs used across the application
 */

/** External link keys for type-safe access */
export const EXTERNAL_LINKS = {
    // Documentation
    docs: process.env.NEXT_PUBLIC_DOCS_URL || 'https://docs.gridtokenx.com',

    // Social Media
    twitter: process.env.NEXT_PUBLIC_TWITTER_URL || 'https://x.com/gridtokenx',
    telegram: process.env.NEXT_PUBLIC_TELEGRAM_URL || 'https://t.me/gridtokenx',
    discord: process.env.NEXT_PUBLIC_DISCORD_URL || 'https://discord.gg/gridtokenx',
    medium: process.env.NEXT_PUBLIC_MEDIUM_URL || 'https://medium.com/@gridtokenx',
    youtube: process.env.NEXT_PUBLIC_YOUTUBE_URL || 'https://youtube.com/@gridtokenx',

    // Company
    website: process.env.NEXT_PUBLIC_WEBSITE_URL || 'https://gridtokenx.com',

    // Blockchain Explorer
    solanaExplorer: process.env.NEXT_PUBLIC_SOLANA_EXPLORER_URL || 'https://explorer.gridtokenx.com',
} as const

/** Type for external link keys */
export type ExternalLinkKey = keyof typeof EXTERNAL_LINKS

/** Get an external link URL by key with type safety */
export function getExternalLink(key: ExternalLinkKey): string {
    return EXTERNAL_LINKS[key]
}

/** Check if a URL is external (not a relative path) */
export function isExternalUrl(url: string): boolean {
    return url.startsWith('http://') || url.startsWith('https://')
}
