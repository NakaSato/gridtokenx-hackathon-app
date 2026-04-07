import { apiRequest, ApiResponse } from './core'
import type {
    FuturesProduct,
    CreateFuturesOrderRequest,
    FuturesPosition,
    Candle,
    OrderBook,
    FuturesOrder
} from '../../types/futures'

export class FuturesApi {
    constructor(private getToken: () => string | undefined) { }

    // ==========================================
    // FUTURES
    // ==========================================

    async getFuturesProducts(): Promise<ApiResponse<FuturesProduct[]>> {
        return apiRequest<FuturesProduct[]>('/api/v1/futures/products', {
            method: 'GET',
            token: this.getToken(),
        })
    }

    async createFuturesOrder(data: CreateFuturesOrderRequest): Promise<ApiResponse<{ order_id: string }>> {
        return apiRequest<{ order_id: string }>('/api/v1/futures/orders', {
            method: 'POST',
            body: data,
            token: this.getToken(),
        })
    }

    async getPositions(): Promise<ApiResponse<any>> {
        return apiRequest('/api/v1/futures/positions', {
            method: 'GET',
            token: this.getToken(),
        })
    }

    async getFuturesPositions(): Promise<ApiResponse<FuturesPosition[]>> {
        return apiRequest<FuturesPosition[]>('/api/v1/futures/positions', {
            method: 'GET',
            token: this.getToken(),
        })
    }

    async getFuturesCandles(productId: string, interval: string = '1m'): Promise<ApiResponse<Candle[]>> {
        const params = newSearchParams({ product_id: productId, interval })
        return apiRequest<Candle[]>(`/api/v1/futures/candles?${params.toString()}`, {
            method: 'GET',
            token: this.getToken(),
        })
    }

    async getFuturesOrderBook(productId: string): Promise<ApiResponse<OrderBook>> {
        const params = new URLSearchParams({ product_id: productId })
        return apiRequest<OrderBook>(`/api/v1/futures/orderbook?${params.toString()}`, {
            method: 'GET',
            token: this.getToken(),
        })
    }

    async getFuturesOrders(): Promise<ApiResponse<FuturesOrder[]>> {
        return apiRequest<FuturesOrder[]>('/api/v1/futures/orders/my', {
            method: 'GET',
            token: this.getToken(),
        })
    }

    async closeFuturesPosition(positionId: string): Promise<ApiResponse<{ order_id: string }>> {
        return apiRequest<{ order_id: string }>(`/api/v1/futures/positions/${positionId}/close`, {
            method: 'POST',
            token: this.getToken(),
        })
    }
}

// Fixed missing URLSearchParams import reference in this file (used locally)
function newSearchParams(params: Record<string, string>) {
    return new URLSearchParams(params)
}
