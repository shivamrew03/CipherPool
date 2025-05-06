declare module '@mysten/sui/client' {
  export interface SuiObjectResponse {
    data?: {
      objectId?: string;
      content?: {
        dataType: string;
        fields?: Record<string, any>;
      };
      display?: {
        data?: Record<string, any>;
      };
    };
  }
}

declare module '@mysten/sui/utils' {
  export function isValidSuiObjectId(id: string): boolean;
} 