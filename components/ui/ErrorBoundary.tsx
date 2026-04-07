'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { AlertTriangle, RefreshCcw } from 'lucide-react'
import { Button } from './button'

interface Props {
    children?: ReactNode
    fallback?: ReactNode
    name?: string
}

interface State {
    hasError: boolean
}

export default class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false
    }

    public static getDerivedStateFromError(_: Error): State {
        return { hasError: true }
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error(`Uncaught error in ${this.props.name || 'Component'}:`, error, errorInfo)
    }

    public render() {
        if (this.state.hasError) {
            return this.props.fallback || (
                <div className="flex min-h-[200px] w-full flex-col items-center justify-center space-y-4 rounded-sm border border-dashed border-destructive/50 bg-destructive/5 p-6 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                        <AlertTriangle className="h-6 w-6" />
                    </div>
                    <div className="space-y-1">
                        <h3 className="text-lg font-semibold text-foreground">Something went wrong</h3>
                        <p className="text-sm text-secondary-foreground max-w-[300px]">
                            We encountered an error while loading {this.props.name || 'this component'}.
                        </p>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => this.setState({ hasError: false })}
                        className="flex items-center gap-2"
                    >
                        <RefreshCcw className="h-4 w-4" />
                        Try again
                    </Button>
                </div>
            )
        }

        return this.props.children
    }
}
