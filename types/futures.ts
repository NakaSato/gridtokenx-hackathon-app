export interface FuturesProduct {
    id: string;
    symbol: string;
    base_asset: string;
    quote_asset: string;
    contract_size: string; // Decimal as string
    expiration_date: string;
    current_price: string;
    is_active: boolean;
}

export interface FuturesPosition {
    id: string;
    user_id: string;
    product_id: string;
    side: 'long' | 'short';
    quantity: string;
    entry_price: string;
    current_price: string;
    leverage: number;
    margin_used: string;
    unrealized_pnl: string;
    liquidation_price: string;
    product_symbol: string;
}

export interface CreateFuturesOrderRequest {
    product_id: string;
    side: 'long' | 'short';
    order_type: 'market' | 'limit';
    quantity: number; // or string if precision matters
    price: number;
    leverage: number;
}

export interface Candle {
    time: string;
    open: string;
    high: string;
    low: string;
    close: string;
    volume: string;
}

export interface FuturesOrder {
    id: string;
    user_id: string;
    product_id: string;
    side: 'long' | 'short';
    order_type: 'market' | 'limit';
    quantity: string;
    price: string;
    leverage: number;
    status: string;
    filled_quantity: string;
    average_fill_price: string;
    created_at: string;
    product_symbol?: string;
}

export interface OrderBookEntry {
    price: string;
    quantity: string;
    total: string;
}

export interface OrderBook {
    bids: OrderBookEntry[];
    asks: OrderBookEntry[];
}
