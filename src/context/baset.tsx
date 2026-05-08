'use client';

import { createContext, useContext, useMemo, useState, useEffect, ReactNode } from 'react';
import { createCoinbaseWalletSDK } from '@coinbase/wallet-sdk';
import { ethers } from 'ethers';
// 1. Define what data is available globally
interface WalletContextType {
  address: string;
  setAddress: (addr: string) => void;
  cbProvider: any;
  connectEVMWallet: any;
  setIsDisconnectedState: any;
  isDisconnectedState: any;
  setLoading: any;
  loading: any;
  setError: any;
  error: any;
  networks: any;
  disconnectWallet: any;
}

const WalletContext = createContext<WalletContextType | null>(null);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState('');
  const [isDisconnectedState, setIsDisconnectedState] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  // Restore saved address on mount (silent session restore)
  useEffect(() => {
    const savedAddress = localStorage.getItem('walletAddress');
    const wasConnected = localStorage.getItem('walletConnected');
    if (savedAddress && wasConnected === 'true') {
      setAddress(savedAddress);
      setIsDisconnectedState(false);
    }
  }, []);

  // 2. Initialize SDK only once
  const sdk = useMemo(() => {
    if (typeof window === 'undefined') return null;
    return createCoinbaseWalletSDK({
      appName: 'Base App',
      appLogoUrl: 'https://avatars.githubusercontent.com/u/108554348',
      preference: { options: 'all' },
    });
  }, []);

  // 3. Get the Provider
  const cbProvider = useMemo(() => sdk?.getProvider() || null, [sdk]);

  const networks = {
    eth: { chainId: '0x1', chainName: 'Ethereum' },
    bsc: { chainId: '0x38', chainName: 'BNB Smart Chain' },
    base: { chainId: '0x2105', chainName: 'Base' }
  };

  useEffect(() => {
    if (!cbProvider) return;

    const handleDisconnect = (error: any) => {
      console.log('Provider disconnected', error);
      setLoading(false);
    };

    cbProvider.on('disconnect', handleDisconnect);

    return () => {
      if (typeof cbProvider.removeListener === 'function') {
        cbProvider.removeListener('disconnect', handleDisconnect);
      }
    };
  }, [cbProvider]);

  const connectEVMWallet = async ({ config, callback }) => {
    try {

      let { chainId, chainName } = config
      setLoading(true);
      setError('');

      if (!cbProvider) throw new Error("SDK not initialized");

      const accounts = await cbProvider.request({
        method: 'eth_requestAccounts'
      }) as string[];
      const userAddress = accounts[0];

      try {
        await cbProvider.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId }],
        });
      } catch (switchError: any) {
        if (switchError.code === 4902) {
          await cbProvider.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: chainId,
              chainName: chainName,
              rpcUrls: ['https://bsc-dataseed.binance.org/'],
              nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
              blockExplorerUrls: ['https://bscscan.com/']
            }],
          });
        }
      }

      setAddress(userAddress);
      setIsDisconnectedState(false);
      localStorage.setItem('walletConnected', 'true');
      localStorage.setItem('walletAddress', userAddress);



      if (callback) {
        await callback()
      }
      // await updateBalances(userAddress, provider);

    } catch (err: any) {
      setError(err.message || 'Connection failed');
    } finally {
      setLoading(false);
    }
  };
  const disconnectWallet = async ({ callback }) => {
    if (cbProvider && 'disconnect' in cbProvider) {
      await (cbProvider as any).disconnect();
    }
    localStorage.removeItem('walletConnected');
    localStorage.removeItem('walletAddress');
    setAddress('');
    // setBnbBalance('0');
    // setT22Balance(0);
    setIsDisconnectedState(true);

    if (callback) {
      callback()
    }
  };
  return (
    <WalletContext.Provider value={{
      setIsDisconnectedState, networks, disconnectWallet,
      isDisconnectedState,
      setLoading,
      loading,
      setError,
      error, address, setAddress, cbProvider, connectEVMWallet
    }}>
      {children}
    </WalletContext.Provider>
  );
}

// 4. Custom hook for easy access
export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) throw new Error("useWallet must be used within WalletProvider");
  return context;
};

