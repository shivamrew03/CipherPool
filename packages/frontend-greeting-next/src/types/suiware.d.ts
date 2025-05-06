declare module '@suiware/kit/useTransact' {
  export interface TransactionOptions {
    onBeforeStart?: () => void;
    onSuccess?: (data: any) => void;
    onError?: (error: Error) => void;
  }

  export interface TransactionResult {
    transact: (transaction?: any) => Promise<any>;
  }

  export function useTransactionExecution(options?: TransactionOptions): TransactionResult;
  
  export default function useTransact(options?: TransactionOptions): TransactionResult;
} 