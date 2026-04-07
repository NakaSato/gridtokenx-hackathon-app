import { apiRequest, ApiResponse } from './core'
import type { UserProfile } from '../../types/auth'
import type {
    UserWallet,
    LinkWalletRequest,
    Notification,
    NotificationPreferences
} from '../../types/features'

export class UserApi {
    constructor(private getToken: () => string | undefined) { }

    async getProfile(): Promise<ApiResponse<any>> {
        return apiRequest('/api/v1/users/me', {
            method: 'GET',
            token: this.getToken(),
        })
    }

    async updateProfile(profileData: {
        email?: string
        first_name?: string
        last_name?: string
        wallet_address?: string
    }): Promise<ApiResponse<any>> {
        return apiRequest('/api/v1/users/me', {
            method: 'PATCH',
            body: profileData,
            token: this.getToken(),
        })
    }

    async getBalance(walletAddress?: string): Promise<ApiResponse<any>> {
        if (!walletAddress) {
            return {
                data: {
                    wallet_address: '',
                    token_balance: '0.00',
                    token_balance_raw: 0,
                    balance_sol: 0,
                    decimals: 9,
                    token_mint: '',
                    token_account: '',
                },
                status: 200,
            } as ApiResponse<any>
        }

        return apiRequest(`/api/v1/wallets/${walletAddress}/balance`, {
            method: 'GET',
            token: this.getToken(),
        })
    }

    async getUserAnalytics(params: { timeframe: string }): Promise<ApiResponse<any>> {
        return apiRequest<any>(`/api/v1/analytics/my-stats?timeframe=${params.timeframe}`, {
            method: 'GET',
            token: this.getToken(),
        })
    }

    async getUserHistory(params: { timeframe: string }): Promise<ApiResponse<any>> {
        return apiRequest<any>(`/api/v1/analytics/my-history?timeframe=${params.timeframe}`, {
            method: 'GET',
            token: this.getToken(),
        })
    }

    async getUserTransactions(filters?: {
        transaction_type?: string
        status?: string
        date_from?: string
        date_to?: string
        limit?: number
        offset?: number
        min_attempts?: number
        has_signature?: boolean
    }) {
        const params = new URLSearchParams()
        if (filters) {
            Object.entries(filters).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    params.append(key, String(value))
                }
            })
        }
        const queryString = params.toString()
        const endpoint = queryString
            ? `/api/v1/analytics/transactions?${queryString}`
            : '/api/v1/analytics/transactions'

        return apiRequest<import('../../types/transactions').UserTransactionsResponse>(
            endpoint,
            { method: 'GET', token: this.getToken() }
        )
    }

    async listWallets(): Promise<ApiResponse<UserWallet[]>> {
        return apiRequest<UserWallet[]>('/api/v1/user-wallets', {
            method: 'GET',
            token: this.getToken(),
        })
    }

    async linkWallet(data: LinkWalletRequest): Promise<ApiResponse<UserWallet>> {
        return apiRequest<UserWallet>('/api/v1/user-wallets', {
            method: 'POST',
            body: data,
            token: this.getToken(),
        })
    }

    async removeWallet(walletId: string): Promise<ApiResponse<{ success: boolean }>> {
        return apiRequest<{ success: boolean }>(`/api/v1/user-wallets/${walletId}`, {
            method: 'DELETE',
            token: this.getToken(),
        })
    }

    async setPrimaryWallet(walletId: string): Promise<ApiResponse<{ success: boolean }>> {
        return apiRequest<{ success: boolean }>(`/api/v1/user-wallets/${walletId}/primary`, {
            method: 'PUT',
            token: this.getToken(),
        })
    }

    async listNotifications(filters?: { limit?: number; offset?: number }): Promise<ApiResponse<{
        notifications: Notification[]
        unread_count: number
        total: number
    }>> {
        const params = new URLSearchParams(filters as any)
        return apiRequest(`/api/v1/notifications?${params.toString()}`, {
            method: 'GET',
            token: this.getToken(),
        })
    }

    async markNotificationAsRead(id: string): Promise<ApiResponse<{ success: boolean }>> {
        return apiRequest<{ success: boolean }>(`/api/v1/notifications/${id}`, {
            method: 'PATCH',
            body: { is_read: true },
            token: this.getToken(),
        })
    }

    async markAllNotificationsAsRead(): Promise<ApiResponse<{ success: boolean }>> {
        return apiRequest<{ success: boolean }>('/api/v1/notifications/mark-all-read', {
            method: 'POST',
            token: this.getToken(),
        })
    }

    async getNotificationPreferences(): Promise<ApiResponse<NotificationPreferences>> {
        return apiRequest<NotificationPreferences>('/api/v1/users/me/notification-preferences', {
            method: 'GET',
            token: this.getToken(),
        })
    }

    async updateNotificationPreferences(data: Partial<NotificationPreferences>): Promise<ApiResponse<NotificationPreferences>> {
        return apiRequest<NotificationPreferences>('/api/v1/users/me/notification-preferences', {
            method: 'PUT',
            body: data,
            token: this.getToken(),
        })
    }
}
