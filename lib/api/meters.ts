import { apiRequest, ApiResponse } from './core'
import type {
    GridStatus,
    GridTopologyResponse,
    GridHistoryStatus
} from '../../types/grid'
import type {
    PublicMeterResponse,
    MeterReading,
    MeterResponse,
    RegisterMeterResponse,
    SubmitReadingRequest,
    MeterStats
} from '../../types/meter'

export class MetersApi {
    constructor(private getToken: () => string | undefined) { }

    async submitMeterData(data: SubmitReadingRequest): Promise<ApiResponse<MeterReading>> {
        const serial = data.meter_serial || 'unknown'
        return apiRequest<MeterReading>(`/api/v1/meters/${serial}/readings?auto_mint=true`, {
            method: 'POST',
            body: {
                kwh: data.kwh_amount,
                wallet_address: data.wallet_address,
                timestamp: data.reading_timestamp
            },
            token: this.getToken(),
        })
    }

    async getMeterStats(): Promise<ApiResponse<MeterStats>> {
        return apiRequest<MeterStats>('/api/v1/meters/stats', {
            method: 'GET',
            token: this.getToken(),
        })
    }

    async getMyReadings(limit = 10, offset = 0): Promise<ApiResponse<MeterReading[]>> {
        const params = new URLSearchParams({ limit: limit.toString(), offset: offset.toString() })
        return apiRequest<MeterReading[]>(`/api/v1/meters/readings?${params.toString()}`, {
            method: 'GET',
            token: this.getToken(),
        })
    }

    async getMyMeters(): Promise<ApiResponse<MeterResponse[]>> {
        return apiRequest<MeterResponse[]>('/api/v1/users/me/meters', {
            method: 'GET',
            token: this.getToken(),
        })
    }

    async registerMeter(data: { serial_number: string; meter_type?: string; location?: string; latitude?: number; longitude?: number }): Promise<ApiResponse<RegisterMeterResponse>> {
        return apiRequest<RegisterMeterResponse>('/api/v1/meters', {
            method: 'POST',
            body: data,
            token: this.getToken(),
        })
    }

    async mintReading(readingId: string): Promise<ApiResponse<{
        message: string
        transaction_signature: string
        kwh_amount: string
        wallet_address: string
    }>> {
        return apiRequest(`/api/v1/meters/readings/${readingId}/mint`, {
            method: 'POST',
            token: this.getToken(),
        })
    }

    async getGridStatus(): Promise<ApiResponse<GridStatus>> {
        return apiRequest<GridStatus>('/api/v1/public/grid-status', { method: 'GET' })
    }

    async getGridTopology(): Promise<ApiResponse<GridTopologyResponse>> {
        return apiRequest<GridTopologyResponse>('/api/zones', { method: 'GET' })
    }

    async getPublicMeters(): Promise<ApiResponse<PublicMeterResponse[]>> {
        return apiRequest<PublicMeterResponse[]>('/api/v1/public/meters', { method: 'GET' })
    }

    async getGridHistory(limit = 30): Promise<ApiResponse<GridHistoryStatus[]>> {
        return apiRequest<GridHistoryStatus[]>(`/api/v1/public/grid-status/history?limit=${limit}`, { method: 'GET' })
    }
}
