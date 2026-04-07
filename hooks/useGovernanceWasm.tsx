/**
 * Governance WASM Provider
 *
 * React context wrapper for the gridtokenx-wasm governance module.
 * Replaces GovernanceProvider.tsx with high-performance WASM operations.
 *
 * Usage:
 * ```tsx
 * import { GovernanceWasmProvider, useGovernanceWasm } from '@/hooks/useGovernanceWasm';
 *
 * function App() {
 *   return (
 *     <GovernanceWasmProvider rpcUrl="http://127.0.0.1:8899" programId="DuLg6buhqs78SRj1qDp5vSyGrSfG9FF4nPKm8Tn8hSJL">
 *       <YourComponent />
 *     </GovernanceWasmProvider>
 *   );
 * }
 *
 * function YourComponent() {
 *   const { proposals, votePrivate, createProposal, isConnected } = useGovernanceWasm();
 *   // ...
 * }
 * ```
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import { init_panic_hook, GovernanceClient } from '@/lib/wasm/gridtokenx_wasm';

// Types matching the WASM module
export interface Proposal {
  id: string;
  title: string;
  description: string;
  support_weight: number;
  oppose_weight: number;
  deadline: number;
  status: 'Active' | 'Passed' | 'Failed';
  has_voted: boolean;
}

export interface PoAConfig {
  authority: string;
  authority_name: string;
  contact_info: string;
  erc_validation_enabled: boolean;
  allow_certificate_transfers: boolean;
  min_energy_amount: number;
  max_erc_amount: number;
  erc_validity_period: number;
}

export interface GovernanceContextType {
  proposals: Proposal[];
  poaConfig: PoAConfig | null;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  votePrivate: (proposalId: string, support: boolean, privateBalance: number, rootSeed: string) => Promise<string>;
  createProposal: (title: string, description: string) => Promise<string>;
  fetchPoaConfig: () => Promise<PoAConfig | null>;
  refreshProposals: () => void;
}

const GovernanceWasmContext = createContext<GovernanceContextType | undefined>(undefined);

export interface GovernanceWasmProviderProps {
  children: ReactNode;
  rpcUrl?: string;
  programId?: string;
}

/**
 * Governance WASM Provider
 *
 * Wraps the WASM GovernanceClient and provides React-friendly state management.
 */
export const GovernanceWasmProvider: React.FC<GovernanceWasmProviderProps> = ({
  children,
  rpcUrl = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'http://127.0.0.1:4000/api/v1/rpc',
  programId = 'DuLg6buhqs78SRj1qDp5vSyGrSfG9FF4nPKm8Tn8hSJL',
}) => {
  const [client, setClient] = useState<GovernanceClient | null>(null);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [poaConfig, setPoaConfig] = useState<PoAConfig | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize WASM and client
  useEffect(() => {
    const initWasm = async () => {
      try {
        // Initialize panic hook for debugging
        init_panic_hook();

        // Create governance client
        const govClient = new GovernanceClient(rpcUrl, programId);
        setClient(govClient);

        // Connect to blockchain
        const connected = govClient.connect();
        setIsConnected(connected);

        // Load initial proposals
        const initialProposals = govClient.proposals;
        if (initialProposals) {
          setProposals(initialProposals as unknown as Proposal[]);
        }

        setIsLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to initialize governance WASM');
        setIsLoading(false);
      }
    };

    initWasm();
  }, [rpcUrl, programId]);

  // Fetch PoA config
  const fetchPoaConfig = useCallback(async (): Promise<PoAConfig | null> => {
    if (!client) return null;

    try {
      const config = client.fetch_poa_config();
      if (config) {
        const typedConfig = config as unknown as PoAConfig;
        setPoaConfig(typedConfig);
        return typedConfig;
      }
      return null;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch PoA config');
      return null;
    }
  }, [client]);

  // Vote on a proposal
  const votePrivate = useCallback(
    async (proposalId: string, support: boolean, privateBalance: number, rootSeed: string): Promise<string> => {
      if (!client) {
        throw new Error('Governance client not initialized');
      }

      try {
        const signature = client.vote_private(proposalId, support, BigInt(privateBalance), rootSeed);

        // Refresh proposals after voting
        const updatedProposals = client.proposals;
        if (updatedProposals) {
          setProposals(updatedProposals as unknown as Proposal[]);
        }

        return signature;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Voting failed';
        setError(message);
        throw new Error(message);
      }
    },
    [client]
  );

  // Create a new proposal
  const createProposal = useCallback(
    async (title: string, description: string): Promise<string> => {
      if (!client) {
        throw new Error('Governance client not initialized');
      }

      try {
        const proposalId = client.create_proposal(title, description);

        // Refresh proposals after creation
        const updatedProposals = client.proposals;
        if (updatedProposals) {
          setProposals(updatedProposals as unknown as Proposal[]);
        }

        return proposalId;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to create proposal';
        setError(message);
        throw new Error(message);
      }
    },
    [client]
  );

  // Refresh proposals
  const refreshProposals = useCallback(() => {
    if (!client) return;

    const currentProposals = client.proposals;
    if (currentProposals) {
      setProposals(currentProposals as unknown as Proposal[]);
    }
  }, [client]);

  // Context value
  const contextValue = useMemo<GovernanceContextType>(
    () => ({
      proposals,
      poaConfig,
      isConnected,
      isLoading,
      error,
      votePrivate,
      createProposal,
      fetchPoaConfig,
      refreshProposals,
    }),
    [proposals, poaConfig, isConnected, isLoading, error, votePrivate, createProposal, fetchPoaConfig, refreshProposals]
  );

  return (
    <GovernanceWasmContext.Provider value={contextValue} >
      {children}
    </GovernanceWasmContext.Provider>
  );
};

/**
 * Hook to access the governance WASM context
 */
export const useGovernanceWasm = (): GovernanceContextType => {
  const context = useContext(GovernanceWasmContext);
  if (!context) {
    throw new Error('useGovernanceWasm must be used within a GovernanceWasmProvider');
  }
  return context;
};

export default useGovernanceWasm;
