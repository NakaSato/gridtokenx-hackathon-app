/**
 * Phase 3 Features Types for GridTokenX
 */

// --- Carbon Credits ---
export type CarbonStatus = 'active' | 'retired' | 'transferred' | 'expired';

export interface CarbonCredit {
    id: string;
    user_id: string;
    amount: string;
    source: string;
    source_reference_id?: string;
    status: CarbonStatus;
    description?: string;
    created_at: string;
}

export interface CarbonBalanceResponse {
    total_credits: string;
    active_credits: string;
    retired_credits: string;
    transferred_credits: string;
    kg_co2_equivalent: number;
}

export interface CarbonTransaction {
    id: string;
    sender_id: string;
    receiver_id: string;
    amount: string;
    status: 'pending' | 'completed' | 'failed' | 'cancelled';
    notes?: string;
    created_at: string;
}

// --- Multi-wallet ---
export interface UserWallet {
    id: string;
    user_id: string;
    wallet_address: string;
    label?: string;
    is_primary: boolean;
    verified: boolean;
    created_at: string;
}

export interface LinkWalletRequest {
    wallet_address: string;
    label?: string;
    is_primary?: boolean;
}

// --- Notifications ---
export type NotificationType = 'system' | 'trade' | 'alert' | 'wallet' | 'reward';

export interface Notification {
    id: string;
    user_id: string;
    notification_type: NotificationType;
    title: string;
    message: string;
    data?: any;
    is_read: boolean;
    created_at: string;
}

export interface NotificationPreferences {
    email_enabled: boolean;
    push_enabled: boolean;
    trade_notifications: boolean;
    alert_notifications: boolean;
    system_notifications: boolean;
    // Granular toggles
    order_filled?: boolean;
    order_matched?: boolean;
    conditional_triggered?: boolean;
    recurring_executed?: boolean;
    price_alerts?: boolean;
    escrow_events?: boolean;
    system_announcements?: boolean;
}

// --- Price Alerts ---
export interface PriceAlert {
    id: string;
    user_id: string;
    symbol: string;
    target_price: string;
    condition: 'above' | 'below';
    is_active: boolean;
    created_at: string;
}

// --- Recurring Orders (DCA) ---
export type IntervalType = 'hourly' | 'daily' | 'weekly' | 'monthly';
export type RecurringStatus = 'active' | 'paused' | 'completed' | 'cancelled';

export interface RecurringOrder {
    id: string;
    user_id: string;
    side: 'buy' | 'sell';
    energy_amount: string;
    max_price_per_kwh?: string;
    min_price_per_kwh?: string;
    interval_type: IntervalType;
    interval_value: number;
    next_execution_at: string;
    last_executed_at?: string;
    status: RecurringStatus;
    total_executions: number;
    max_executions?: number;
    name?: string;
    description?: string;
    created_at: string;
    updated_at: string;
}

export interface CreateRecurringOrderRequest {
    side: 'buy' | 'sell';
    energy_amount: string;
    max_price_per_kwh?: string;
    min_price_per_kwh?: string;
    interval_type: IntervalType;
    interval_value?: number;
    max_executions?: number;
    name?: string;
    description?: string;
    session_token?: string;
}
