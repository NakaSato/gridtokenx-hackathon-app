'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthProvider';

interface SocketContextType {
    socket: WebSocket | null;
    isConnected: boolean;
    sendMessage: (data: any) => void;
}

const SocketContext = createContext<SocketContextType>({
    socket: null,
    isConnected: false,
    sendMessage: () => { },
});

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }: { children: ReactNode }) => {
    const [socket, setSocket] = useState<WebSocket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const { token } = useAuth();
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
    const socketRef = useRef<WebSocket | null>(null);

    const connect = useCallback(() => {
        // Basic JWT validation: must be a string, at least 20 chars, and have 3 parts
        const isValidToken = token &&
            typeof token === 'string' &&
            token.length > 20 &&
            token.split('.').length === 3;

        if (!isValidToken) return;

        const wsBaseUrl = process.env.NEXT_PUBLIC_WS_BASE_URL || 'ws://127.0.0.1:4000';
        const wsUrl = `${wsBaseUrl}/ws`;
        const urlWithToken = `${wsUrl}?token=${token}`;

        const ws = new WebSocket(urlWithToken);
        socketRef.current = ws;

        ws.onopen = () => {
            setIsConnected(true);
            setSocket(ws);
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
        };

        ws.onclose = (event) => {
            setIsConnected(false);
            setSocket(null);
            socketRef.current = null;

            // Simple exponential backoff or 3s retry
            if (token) {
                reconnectTimeoutRef.current = setTimeout(connect, 3000);
            }
        };

        ws.onerror = (error) => {
            console.error('⚠️ WebSocket error:', error);
            ws.close();
        };

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                // Standard approach: Dispatch a CustomEvent for hooks to listen to
                const customEvent = new CustomEvent('ws-message', { detail: data });
                window.dispatchEvent(customEvent);
            } catch (e) {
                console.error('Failed to parse WS message', e);
            }
        };
    }, [token]);

    const sendMessage = useCallback((data: any) => {
        if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
            socketRef.current.send(JSON.stringify(data));
        } else {
            console.warn('Cannot send message: WebSocket is not open');
        }
    }, []);

    useEffect(() => {
        connect();

        return () => {
            if (socketRef.current) {
                socketRef.current.close();
            }
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
        };
    }, [connect]);

    return (
        <SocketContext.Provider value={{ socket, isConnected, sendMessage }}>
            {children}
        </SocketContext.Provider>
    );
};
