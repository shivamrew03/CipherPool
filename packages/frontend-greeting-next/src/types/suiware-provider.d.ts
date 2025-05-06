declare module '@suiware/kit/SuiProvider' {
  import { ReactNode } from 'react';
  
  interface SuiProviderProps {
    children: ReactNode;
    customNetworkConfig?: any;
    defaultNetwork?: string;
    walletAutoConnect?: boolean;
    walletStashedName?: string;
    themeSettings?: any;
  }
  
  const SuiProvider: React.FC<SuiProviderProps>;
  export default SuiProvider;
} 