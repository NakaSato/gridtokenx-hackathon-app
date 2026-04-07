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

/**
 * Make an API request using native fetch
 * @param path - API endpoint path (e.g., '/api/orders')
 * @param options - Request options
 */
export async function apiRequest<T = any>(
    path: string,
    options: ApiRequestOptions = {}
): Promise<ApiResponse<T>> {
    const { method = 'GET', headers = {}, body, token } = options

    const url = getApiUrl(path)

    // Build headers
    const requestHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
        ...headers,
    }

    // Add authorization token if provided
    if (token) {
        requestHeaders.Authorization = `Bearer ${token}`
    }

    try {
        const response = await fetch(url, {
            method,
            headers: requestHeaders,
            body: body ? JSON.stringify(body) : undefined,
        })

        // Get the response text first
        const text = await response.text()

        // Try to parse JSON, but handle empty responses
        let data: any = {}
        if (text) {
            try {
                data = JSON.parse(text)
            } catch (parseError) {
                // If JSON parsing fails, return the text as error
                return {
                    error: `Invalid JSON response: ${text}`,
                    status: response.status,
                }
            }
        }

        if (!response.ok) {
            let errorMessage = 'Request failed'
            if (data.message) {
                errorMessage = data.message
            } else if (data.error) {
                if (typeof data.error === 'string') {
                    errorMessage = data.error
                } else if (typeof data.error === 'object' && data.error.message) {
                    errorMessage = data.error.message
                } else {
                    errorMessage = JSON.stringify(data.error)
                }
            }

            return {
                error: errorMessage,
                status: response.status,
            }
        }

        return {
            data,
            status: response.status,
        }
    } catch (error) {
        return {
            error: error instanceof Error ? error.message : 'Unknown error',
            status: 500,
        }
    }
}
