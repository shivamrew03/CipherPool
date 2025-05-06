declare module '@mysten/dapp-kit' {
  export function useCurrentAccount(): any;
  export function useWalletKit(): { walletKitError: Error | null };
  export function useSuiClient(): any;
}

declare module '@mysten/wallet-standard' {
  export interface WalletAccount {
    address: string;
    publicKey: Uint8Array;
    chains: string[];
    features: string[];
    label?: string;
    icon?: string;
  }

  export interface SuiSignAndExecuteTransactionOutput {
    digest: string;
    effects: any;
    events: any[];
    objectChanges: any[];
    balanceChanges: any[];
  }
} 