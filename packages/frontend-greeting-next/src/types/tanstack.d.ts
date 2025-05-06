declare module '@tanstack/react-query' {
  export interface QueryOptions {
    queryKey: unknown[];
    queryFn: () => Promise<any>;
    enabled?: boolean;
    retry?: number;
    retryDelay?: number;
    refetchOnWindowFocus?: boolean;
  }

  export interface QueryResult {
    data: any;
    isPending: boolean;
    error: Error | null;
    refetch: () => Promise<any>;
  }

  export function useQuery(options: QueryOptions): QueryResult;
} 