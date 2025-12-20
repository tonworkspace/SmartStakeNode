import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useTonAddress } from '@tonconnect/ui-react';

interface WalletContextType {
  connectedAddress: string | null;
  connectedAddressString: string | null;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};

interface WalletProviderProps {
  children: ReactNode;
}

export const WalletProvider: React.FC<WalletProviderProps> = ({ children }) => {
  const connectedAddressString = useTonAddress();
  const [connectedAddress, setConnectedAddress] = useState<string | null>(null);

  useEffect(() => {
    setConnectedAddress(connectedAddressString);
  }, [connectedAddressString]);

  return (
    <WalletContext.Provider value={{ connectedAddress, connectedAddressString }}>
      {children}
    </WalletContext.Provider>
  );
};