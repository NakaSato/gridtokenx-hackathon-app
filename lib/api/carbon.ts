import { apiRequest, ApiResponse } from './core'
import type {
    CarbonBalanceResponse,
    CarbonCredit,
    CarbonTransaction
} from '../../types/features'

export class CarbonApi {
    constructor(private getToken: () => string | undefined) { }

    async getCarbonBalance(): Promise<ApiResponse<CarbonBalanceResponse>> {
        return apiRequest<CarbonBalanceResponse>('/api/v1/carbon/balance', {
            method: 'GET',
            token: this.getToken(),
        })
    }

    async getCarbonHistory(): Promise<ApiResponse<CarbonCredit[]>> {
        return apiRequest<CarbonCredit[]>('/api/v1/carbon/history', {
            method: 'GET',
            token: this.getToken(),
        })
    }

    async getCarbonTransactions(): Promise<ApiResponse<CarbonTransaction[]>> {
        return apiRequest<CarbonTransaction[]>('/api/v1/carbon/transactions', {
            method: 'GET',
            token: this.getToken(),
        })
    }

    async transferCarbonCredits(data: {
        receiver_username: string
        amount: string
        notes?: string
    }): Promise<ApiResponse<{ transaction_id: string }>> {
        return apiRequest<{ transaction_id: string }>('/api/v1/carbon/transfer', {
            method: 'POST',
            body: data,
            token: this.getToken(),
        })
    }
}
