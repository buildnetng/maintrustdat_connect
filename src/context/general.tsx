'use client';

import { createContext, useContext, useMemo, useState, useEffect, ReactNode } from 'react';
import { ethers } from 'ethers';

interface WalletContextType {
  address: string;
  setAddress: (addr: string) => void;
  provider: any; // Renamed from cbProvider for clarity
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

  // 1. Target Trust Wallet specifically or fallback to standard injection
  const provider = useMemo(() => {
    if (typeof window === 'undefined') return null;
    
    // Check for Trust Wallet's specific injection
    if ((window as any).trustwallet) {
      return (window as any).trustwallet;
    }
    
    // Fallback to window.ethereum if it claims to be Trust
    if ((window as any).ethereum?.isTrust) {
      return (window as any).ethereum;
    }

    return (window as any).ethereum || null;
  }, []);

  const networks = {
    eth: { chainId: '0x1', chainName: 'Ethereum' },
    bsc: { chainId: '0x38', chainName: 'BNB Smart Chain' },
    base: { chainId: '0x2105', chainName: 'Base' }
  };

  useEffect(() => {
    const savedAddress = localStorage.getItem('walletAddress');
    const wasConnected = localStorage.getItem('walletConnected');
    if (savedAddress && wasConnected === 'true') {
      setAddress(savedAddress);
      setIsDisconnectedState(false);
    }
  }, []);

  const connectEVMWallet = async ({ config, callback }: { config: any, callback?: Function }) => {
    try {
      let { chainId, chainName } = config;
      setLoading(true);
      setError('');

      if (!provider) {
        throw new Error("Trust Wallet not found. Please install the extension or app.");
      }

      // Request accounts
      const accounts = await provider.request({
        method: 'eth_requestAccounts'
      }) as string[];
      
      const userAddress = accounts[0];

      // Network Switching Logic
      try {
        await provider.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId }],
        });
      } catch (switchError: any) {
        // This error code indicates that the chain has not been added to the wallet.
        if (switchError.code === 4902) {
          await provider.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: chainId,
              chainName: chainName,
              rpcUrls: chainId === '0x38' ? ['https://bsc-dataseed.binance.org/'] : [], 
              nativeCurrency: chainId === '0x38' ? { name: 'BNB', symbol: 'BNB', decimals: 18 } : { name: 'ETH', symbol: 'ETH', decimals: 18 },
              blockExplorerUrls: chainId === '0x38' ? ['https://bscscan.com/'] : []
            }],
          });
        } else {
            throw switchError;
        }
      }

      setAddress(userAddress);
      setIsDisconnectedState(false);
      localStorage.setItem('walletConnected', 'true');
      localStorage.setItem('walletAddress', userAddress);

      if (callback) await callback();

    } catch (err: any) {
      setError(err.message || 'Connection failed');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const disconnectWallet = async ({ callback }: { callback?: Function }) => {
    // Injected wallets like Trust don't have a programmatic "disconnect" 
    // We simply clear local state
    localStorage.removeItem('walletConnected');
    localStorage.removeItem('walletAddress');
    setAddress('');
    setIsDisconnectedState(true);

    if (callback) callback();
  };

  return (
    <WalletContext.Provider value={{
      setIsDisconnectedState, networks, disconnectWallet,
      isDisconnectedState,
      setLoading,
      loading,
      setError,
      error, address, setAddress, provider, connectEVMWallet
    }}>
      {children}
    </WalletContext.Provider>
  );
}

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) throw new Error("useWallet must be used within WalletProvider");
  return context;
};