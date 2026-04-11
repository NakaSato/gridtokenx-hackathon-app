import { getApiUrl } from '../config'

export interface ApiRequestOptions {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
    headers?: Record<string, string>
    body?: any
    token?: string
}

export interface ApiResponse<T = any> {
    data?: T
    error?: string
    status: number
}

let _backendReachable = true

/**
 * Make an API request using native fetch
 * Falls back to offline mode if backend is unreachable
 */
export async function apiRequest<T = any>(
    path: string,
    options: ApiRequestOptions = {}
): Promise<ApiResponse<T>> {
    const { method = 'GET', headers = {}, body, token } = options

    const url = getApiUrl(path)

    const requestHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
        ...headers,
    }

    if (token) {
        requestHeaders.Authorization = `Bearer ${token}`
    }

    try {
        const response = await fetch(url, {
            method,
            headers: requestHeaders,
            body: body ? JSON.stringify(body) : undefined,
            // Short timeout — if backend is down, fail fast
            signal: AbortSignal.timeout(2000),
        })

        _backendReachable = true

        const text = await response.text()
        let data: any = {}
        if (text) {
            try {
                data = JSON.parse(text)
            } catch {
                return { error: `Invalid JSON response: ${text}`, status: response.status }
            }
        }

        if (!response.ok) {
            let errorMessage = 'Request failed'
            if (data.message) errorMessage = data.message
            else if (data.error) {
                errorMessage = typeof data.error === 'string' ? data.error :
                    data.error.message || JSON.stringify(data.error)
            }
            return { error: errorMessage, status: response.status }
        }

        return { data, status: response.status }
    } catch (error) {
        // If backend is unreachable, return success with empty data
        // This allows the app to function in wallet-only mode
        if (error instanceof DOMException && error.name === 'TimeoutError' ||
            error instanceof TypeError) {
            _backendReachable = false
            console.debug('[API] Backend unreachable, operating in offline mode:', path)
            return { data: {} as T, status: 200 }
        }
        return { error: error instanceof Error ? error.message : 'Unknown error', status: 500 }
    }
}

export function isBackendReachable(): boolean {
    return _backendReachable
}
