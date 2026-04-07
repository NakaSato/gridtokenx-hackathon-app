'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCcw, Home, Bug } from 'lucide-react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('[GlobalError]', error)
  }, [error])

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Error - GridTokenX</title>
        <style dangerouslySetInnerHTML={{ __html: globalStyles }} />
      </head>
      <body>
        <div className="error-container">
          <div className="error-card">
            <div className="error-icon">
              <AlertTriangle size={48} strokeWidth={1.5} />
            </div>

            <h1 className="error-title">Application Error</h1>

            <p className="error-message">
              We apologize, but something went wrong while loading the
              application. This could be due to a network issue, an outdated
              browser, or a temporary service problem.
            </p>

            {process.env.NODE_ENV === 'development' && (
              <div className="error-details">
                <div className="error-details-header">
                  <Bug size={16} />
                  <span>Error Details</span>
                </div>
                <pre className="error-stack">
                  {error?.message || 'Unknown error'}
                </pre>
              </div>
            )}

            <div className="error-actions">
              <button onClick={reset} className="btn btn-primary">
                <RefreshCcw size={18} />
                <span>Try Again</span>
              </button>

              <button
                onClick={() => (window.location.href = '/')}
                className="btn btn-secondary"
              >
                <Home size={18} />
                <span>Go Home</span>
              </button>
            </div>

            <div className="error-help">
              <p>If this problem persists, please try:</p>
              <ul>
                <li>Clearing your browser cache and cookies</li>
                <li>Using a different browser</li>
                <li>Checking your internet connection</li>
                <li>Disabling browser extensions</li>
              </ul>
            </div>

            <div className="error-footer">
              <a href="https://gridtokenx.com" className="footer-link">
                GridTokenX
              </a>
              <span className="footer-separator">•</span>
              <a href="https://docs.gridtokenx.com" className="footer-link">
                Documentation
              </a>
              <span className="footer-separator">•</span>
              <a href="https://discord.gg/gridtokenx" className="footer-link">
                Support
              </a>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}

const globalStyles = `
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    background: linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%);
    min-height: 100vh;
    color: #e2e8f0;
  }

  .error-container {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
  }

  .error-card {
    background: rgba(30, 30, 50, 0.9);
    border: 1px solid rgba(139, 92, 246, 0.3);
    border-radius: 16px;
    padding: 40px;
    max-width: 560px;
    width: 100%;
    text-align: center;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  }

  .error-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 80px;
    height: 80px;
    border-radius: 50%;
    background: rgba(239, 68, 68, 0.1);
    color: #ef4444;
    margin-bottom: 24px;
  }

  .error-title {
    font-size: 28px;
    font-weight: 700;
    color: #fff;
    margin-bottom: 16px;
  }

  .error-message {
    font-size: 16px;
    color: #94a3b8;
    line-height: 1.6;
    margin-bottom: 24px;
  }

  .error-details {
    background: rgba(0, 0, 0, 0.3);
    border: 1px solid rgba(239, 68, 68, 0.2);
    border-radius: 8px;
    padding: 16px;
    margin-bottom: 24px;
    text-align: left;
  }

  .error-details-header {
    display: flex;
    align-items: center;
    gap: 8px;
    color: #ef4444;
    font-weight: 600;
    margin-bottom: 8px;
    font-size: 14px;
  }

  .error-stack {
    font-family: 'Monaco', 'Menlo', monospace;
    font-size: 12px;
    color: #f87171;
    overflow-x: auto;
    white-space: pre-wrap;
    word-break: break-word;
  }

  .error-actions {
    display: flex;
    gap: 12px;
    justify-content: center;
    margin-bottom: 24px;
    flex-wrap: wrap;
  }

  .btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 12px 24px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    border: none;
    text-decoration: none;
  }

  .btn-primary {
    background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%);
    color: white;
  }

  .btn-primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(139, 92, 246, 0.4);
  }

  .btn-secondary {
    background: rgba(255, 255, 255, 0.1);
    color: #e2e8f0;
    border: 1px solid rgba(255, 255, 255, 0.2);
  }

  .btn-secondary:hover {
    background: rgba(255, 255, 255, 0.15);
  }

  .error-help {
    text-align: left;
    background: rgba(59, 130, 246, 0.1);
    border: 1px solid rgba(59, 130, 246, 0.2);
    border-radius: 8px;
    padding: 16px;
    margin-bottom: 24px;
  }

  .error-help p {
    color: #60a5fa;
    font-weight: 600;
    margin-bottom: 8px;
    font-size: 14px;
  }

  .error-help ul {
    list-style: none;
    padding: 0;
  }

  .error-help li {
    color: #94a3b8;
    font-size: 13px;
    padding: 4px 0;
    padding-left: 16px;
    position: relative;
  }

  .error-help li::before {
    content: '•';
    position: absolute;
    left: 0;
    color: #60a5fa;
  }

  .error-footer {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding-top: 20px;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
  }

  .footer-link {
    color: #8b5cf6;
    text-decoration: none;
    font-size: 13px;
    transition: color 0.2s;
  }

  .footer-link:hover {
    color: #a78bfa;
  }

  .footer-separator {
    color: #475569;
  }

  @media (max-width: 480px) {
    .error-card {
      padding: 24px;
    }

    .error-title {
      font-size: 22px;
    }

    .error-actions {
      flex-direction: column;
    }

    .btn {
      width: 100%;
      justify-content: center;
    }
  }
`
