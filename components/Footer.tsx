'use client'

import { useAuth } from '@/contexts/AuthProvider'
import Link from 'next/link'

export default function Footer() {
    const { isAuthenticated } = useAuth()

    if (isAuthenticated) return null

    return (
        <footer className="hidden md:flex w-full border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 py-2 mt-auto">
            <div className="flex w-full items-center justify-between gap-4 h-8">
                <p className="text-left text-xs leading-loose text-muted-foreground">
                    © {new Date().getFullYear()} GridTokenX. All rights reserved.
                </p>
                <div className="flex items-center gap-x-4 text-xs text-muted-foreground">
                    <Link
                        href="/privacy-policy"
                        className="hover:text-foreground transition-colors"
                    >
                        Privacy Policy
                    </Link>
                    <Link
                        href="/terms-and-conditions"
                        className="hover:text-foreground transition-colors"
                    >
                        Terms & Conditions
                    </Link>
                    <Link
                        href="https://gridtokenx.com"
                        target="_blank"
                        rel="noreferrer"
                        className="hover:text-foreground transition-colors"
                    >
                        Website
                    </Link>
                </div>
            </div>
        </footer>
    )
}
