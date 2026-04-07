import { apiRequest, ApiResponse } from './core'
import type {
    PriceAlert,
    RecurringOrder,
    CreateRecurringOrderRequest
} from '../../types/features'

export class TradingApi {
    constructor(private getToken: () => string | undefined) { }

    async createOrder(orderData: any) {
        const payload = { ...orderData }
        if (payload.amount && !payload.energy_amount) {
            payload.energy_amount = payload.amount
            delete payload.amount
        }
        return apiRequest('/api/v1/orders', {
            method: 'POST',
            body: payload,
            token: this.getToken(),
        })
    }

    async getMarketStats(): Promise<ApiResponse<import('../../types/trading').MarketStatsResponse>> {
        return apiRequest<import('../../types/trading').MarketStatsResponse>('/api/v1/analytics/market/stats', {
            method: 'GET',
            token: this.getToken(),
        })
    }

    async getOrders(filters?: { status?: string; limit?: number; offset?: number }) {
        const params = new URLSearchParams(filters as any)
        return apiRequest(`/api/v1/orders?${params.toString()}`, {
            method: 'GET',
            token: this.getToken(),
        })
    }

    async getOrderBook(filters?: { status?: string }) {
        const params = new URLSearchParams(filters as any)
        return apiRequest(`/api/v1/orderbook?${params.toString()}`, {
            method: 'GET',
            token: this.getToken(),
        })
    }

    async getMarketData() {
        return apiRequest('/api/v1/analytics/market', {
            method: 'GET',
            token: this.getToken(),
        })
    }

    async getTrades(filters?: { limit?: number; offset?: number }) {
        const params = new URLSearchParams(filters as any)
        return apiRequest<import('../../types/trading').TradeHistory>(
            `/api/v1/trades?${params.toString()}`,
            { method: 'GET', token: this.getToken() }
        )
    }

    async cancelOrder(orderId: string) {
        return apiRequest(`/api/v1/orders/${orderId}`, {
            method: 'DELETE',
            token: this.getToken(),
        })
    }

    async createP2POrder(orderData: {
        side: 'buy' | 'sell'
        amount: string
        price_per_kwh: string
        zone_id?: number
        signature?: string
        timestamp?: number
    }) {
        return apiRequest<{ id: string }>('/api/v1/orders', {
            method: 'POST',
            body: {
                side: orderData.side,
                energy_amount: orderData.amount,
                price_per_kwh: orderData.price_per_kwh,
                order_type: 'limit',
                zone_id: orderData.zone_id,
                signature: orderData.signature,
                timestamp: orderData.timestamp
            },
            token: this.getToken(),
        })
    }

    async getP2POrderBook() {
        return apiRequest<{ asks: any[]; bids: any[] }>('/api/v1/orderbook', {
            method: 'GET',
            token: this.getToken(),
        })
    }

    async getMyP2POrders() {
        return apiRequest<any[]>('/api/v1/orders', {
            method: 'GET',
            token: this.getToken(),
        })
    }

    async getMatchingStatus() {
        return apiRequest<{
            pending_buy_orders: number
            pending_sell_orders: number
            pending_matches: number
            buy_price_range: { min: number; max: number }
            sell_price_range: { min: number; max: number }
            can_match: boolean
            match_reason: string
        }>('/api/v1/matching-status', {
            method: 'GET',
            token: this.getToken(),
        })
    }

    async getSettlementStats() {
        return apiRequest<{
            pending_count: number
            processing_count: number
            confirmed_count: number
            failed_count: number
            total_settled_value: number
        }>('/api/v1/settlement-stats', {
            method: 'GET',
            token: this.getToken(),
        })
    }

    async calculateP2PCost(request: {
        buyer_zone_id: number
        seller_zone_id: number
        energy_amount: number
        agreed_price?: number
    }) {
        return apiRequest<{
            energy_cost: number
            wheeling_charge: number
            loss_cost: number
            total_cost: number
            effective_energy: number
            loss_factor: number
            loss_allocation: string
            zone_distance_km: number
            buyer_zone: number
            seller_zone: number
            is_grid_compliant: boolean
            grid_violation_reason?: string
        }>('/api/v1/p2p/calculate-cost', {
            method: 'POST',
            body: request,
            token: this.getToken(),
        })
    }

    async getP2PMarketPrices() {
        return apiRequest<{
            base_price_thb_kwh: number
            grid_import_price_thb_kwh: number
            grid_export_price_thb_kwh: number
            loss_allocation_model: string
            wheeling_charges: Record<string, number>
            loss_factors: Record<string, number>
        }>('/api/v1/p2p/market-prices', {
            method: 'GET',
            token: this.getToken(),
        })
    }

    async getMarketConfig() {
        return apiRequest<{
            base_price_thb_kwh: number
            grid_import_price_thb_kwh: number
            grid_export_price_thb_kwh: number
            transaction_fee_bps: number
            min_price_per_kwh: number
            max_price_per_kwh: number
        }>('/api/v1/market/config', {
            method: 'GET',
            token: this.getToken(),
        })
    }

    async getTradeHistory(filters?: { limit?: number; offset?: number }) {
        const params = new URLSearchParams()
        if (filters?.limit) params.set('limit', String(filters.limit))
        if (filters?.offset) params.set('offset', String(filters.offset))
        return apiRequest<{
            trades: Array<{
                id: string
                buyer_id: string
                seller_id: string
                energy_amount: number
                price_per_kwh: number
                total_value: number
                fee_amount: number
                wheeling_charge: number
                effective_energy: number
                status: string
                transaction_hash?: string
                created_at: string
            }>
            total: number
        }>(`/api/v1/trades?${params.toString()}`, {
            method: 'GET',
            token: this.getToken(),
        })
    }

    async createPriceAlert(data: {
        symbol: string
        target_price: string
        condition: 'above' | 'below'
    }): Promise<ApiResponse<PriceAlert>> {
        return apiRequest<PriceAlert>('/api/v1/price-alerts', {
            method: 'POST',
            body: data,
            token: this.getToken(),
        })
    }

    async listPriceAlerts(): Promise<ApiResponse<PriceAlert[]>> {
        return apiRequest<PriceAlert[]>('/api/v1/price-alerts', {
            method: 'GET',
            token: this.getToken(),
        })
    }

    async deletePriceAlert(id: string): Promise<ApiResponse<{ success: boolean }>> {
        return apiRequest<{ success: boolean }>(`/api/v1/price-alerts/${id}`, {
            method: 'DELETE',
            token: this.getToken(),
        })
    }

    async createRecurringOrder(data: any): Promise<ApiResponse<any>> {
        const payload = { ...data }
        // Map legacy field names to API model
        if (payload.amount && !payload.energy_amount) {
            payload.energy_amount = payload.amount
            delete payload.amount
        }
        if (payload.frequency && !payload.interval_type) {
            payload.interval_type = payload.frequency
            delete payload.frequency
        }
        // Remove fields not in API model
        delete payload.symbol
        delete payload.start_at
        delete payload.end_at
        return apiRequest<any>('/api/v1/orders/recurring', {
            method: 'POST',
            body: payload,
            token: this.getToken(),
        })
    }

    async listRecurringOrders(): Promise<ApiResponse<RecurringOrder[]>> {
        return apiRequest<RecurringOrder[]>('/api/v1/orders/recurring', {
            method: 'GET',
            token: this.getToken(),
        })
    }

    async getRecurringOrder(id: string): Promise<ApiResponse<RecurringOrder>> {
        return apiRequest<RecurringOrder>(`/api/v1/orders/recurring/${id}`, {
            method: 'GET',
            token: this.getToken(),
        })
    }

    async cancelRecurringOrder(id: string): Promise<ApiResponse<{ success: boolean }>> {
        return apiRequest<{ success: boolean }>(`/api/v1/orders/recurring/${id}`, {
            method: 'DELETE',
            token: this.getToken(),
        })
    }

    async pauseRecurringOrder(id: string): Promise<ApiResponse<{ success: boolean }>> {
        return apiRequest<{ success: boolean }>(`/api/v1/orders/recurring/${id}/pause`, {
            method: 'POST',
            token: this.getToken(),
        })
    }

    async resumeRecurringOrder(id: string): Promise<ApiResponse<{ success: boolean }>> {
        return apiRequest<{ success: boolean }>(`/api/v1/orders/recurring/${id}/resume`, {
            method: 'POST',
            token: this.getToken(),
        })
    }

    async exportTradingHistory(format: 'csv' | 'pdf' | 'json' = 'csv') {
        return apiRequest<Blob>(`/api/v1/trades/export?format=${format}`, {
            method: 'GET',
            token: this.getToken(),
            responseType: 'blob'
        } as any)
    }
}
