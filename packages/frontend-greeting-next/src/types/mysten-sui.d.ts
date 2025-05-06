declare module '@mysten/sui/transactions' {
  export class Transaction {
    moveCall(options: {
      target: string;
      arguments?: any[];
      typeArguments?: string[];
    }): any;
    
    object(id: string): any;
    pure(value: any): any;
    gas: any;
    splitCoins(coin: any, amounts: any[]): any;
  }
}

declare module '@mysten/sui.js/transactions' {
  export interface TransactionObjectArgument {
    kind: string;
    value: any;
  }

  export class TransactionBlock {
    moveCall(options: {
      target: string;
      arguments?: any[];
      typeArguments?: string[];
    }): any;
    
    object(id: string): any;
    pure(value: any): any;
    gas: any;
    splitCoins(coin: any, amounts: any[]): any;
  }
} 