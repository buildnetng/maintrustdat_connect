'use client';

// import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
// import { EthereumProvider } from '@walletconnect/ethereum-provider';

// interface WalletContextType {
//   address: string;
//   setAddress: (addr: string) => void;
//   connectEVMWallet: (args: { config: any; callback?: () => void }) => Promise<void>;
//   disconnectWallet: (args: { callback?: () => void }) => Promise<void>;
//   setIsDisconnectedState: (val: boolean) => void;
//   isDisconnectedState: boolean;
//   setLoading: (val: boolean) => void;
//   loading: boolean;
//   setError: (val: string) => void;
//   error: string;
//   networks: any;
//   provider: any;
// }

// const WalletContext = createContext<WalletContextType | null>(null);

// // 🔑 Get this free from https://cloud.walletconnect.com
// const WALLETCONNECT_PROJECT_ID = '36cbc116e714703ba7adda2a40048697';

// export function WalletProvider({ children }: { children: ReactNode }) {
//   const [address, setAddress] = useState('');
//   const [isDisconnectedState, setIsDisconnectedState] = useState(false);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState<string>('');
//   const [provider, setProvider] = useState<any>(null);

//   const networks = {
//     eth:  { chainId: 1,      hexChainId: '0x1',    chainName: 'Ethereum' },
//     bsc:  { chainId: 56,     hexChainId: '0x38',   chainName: 'BNB Smart Chain' },
//     base: { chainId: 8453,   hexChainId: '0x2105', chainName: 'Base' },
//   };

//   // Restore session on mount
//   useEffect(() => {
//     const savedAddress = localStorage.getItem('walletAddress');
//     const wasConnected = localStorage.getItem('walletConnected');
//     if (savedAddress && wasConnected === 'true') {
//       setAddress(savedAddress);
//       setIsDisconnectedState(false);
//     }
//   }, []);

//   const getOrCreateProvider = async (chainId: number) => {
//     // Reuse existing provider if already created
//     if (provider) return provider;

//     const wcProvider = await EthereumProvider.init({
//       projectId: WALLETCONNECT_PROJECT_ID,
//       chains: [chainId],
//       optionalChains: [1, 56, 8453],        // ETH, BSC, Base
//       showQrModal: true, 
//        qrModalOptions: {
//     themeMode: 'light', // or 'dark'
//     // explorerRecommendedWalletIds: [
//     //   '4622a2b2d6af1c9844944291e5e7351a6aa24cd7b23099efac1b2fd875da31a0' // Trust Wallet ID
//     // ],
//     // explorerExcludedWalletIds: 'ALL', // ← excludes every other wallet
//   },                     // Shows QR — Trust Wallet scans this
//       metadata: {
//         name: 'Trust App',
//         description: 'Trust App WalletConnect',
//         url: window.location.origin,
//         icons: ['https://avatars.githubusercontent.com/u/108554348'],
//       },
//     });

//     // Listen for disconnect
//     wcProvider.on('disconnect', () => {
//       setAddress('');
//       setIsDisconnectedState(true);
//       setLoading(false);
//       localStorage.removeItem('walletConnected');
//       localStorage.removeItem('walletAddress');
//     });

//     // Listen for account changes
//     wcProvider.on('accountsChanged', (accounts: string[]) => {
//       if (accounts.length > 0) {
//         setAddress(accounts[0]);
//         localStorage.setItem('walletAddress', accounts[0]);
//       } else {
//         setAddress('');
//         setIsDisconnectedState(true);
//       }
//     });

//     setProvider(wcProvider);
//     return wcProvider;
//   };

//   const connectEVMWallet = async ({ config, callback }: { config: any; callback?: () => void }) => {
//     try {


//       // Detect mobile and deep-link directly
// // const isMobile = /iPhone|Android/i.test(navigator.userAgent);

// // if (isMobile) {
// //   const uri = encodeURIComponent(wcProvider.uri ?? '');
// //   window.location.href = `trust://wc?uri=${uri}`;
// // } else {
// //   await wcProvider.connect({ chains: [chainId] }); // shows QR on desktop
// // }
//       const { chainId, chainName } = config;
//       setLoading(true);
//       setError('');

//       const wcProvider = await getOrCreateProvider(chainId);

//       // This opens the QR modal — user scans with Trust Wallet
//       await wcProvider.connect({ chains: [chainId] });

//       const accounts: string[] = wcProvider.accounts;
//       const userAddress = accounts[0];

//       // Switch chain if needed
//       try {
//         await wcProvider.request({
//           method: 'wallet_switchEthereumChain',
//           params: [{ chainId: `0x${chainId.toString(16)}` }],
//         });
//       } catch (switchError: any) {
//         if (switchError.code === 4902) {
//           await wcProvider.request({
//             method: 'wallet_addEthereumChain',
//             params: [{
//               chainId: `0x${chainId.toString(16)}`,
//               chainName,
//               rpcUrls: getRpcUrl(chainId),
//               nativeCurrency: getNativeCurrency(chainId),
//               blockExplorerUrls: [getExplorerUrl(chainId)],
//             }],
//           });
//         }
//       }

//       setAddress(userAddress);
//       setIsDisconnectedState(false);
//       localStorage.setItem('walletConnected', 'true');
//       localStorage.setItem('walletAddress', userAddress);

//       if (callback) await callback();

//     } catch (err: any) {
//       setError(err.message || 'Connection failed');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const disconnectWallet = async ({ callback }: { callback?: () => void }) => {
//     if (provider) {
//       await provider.disconnect();
//       setProvider(null);
//     }
//     localStorage.removeItem('walletConnected');
//     localStorage.removeItem('walletAddress');
//     setAddress('');
//     setIsDisconnectedState(true);

//     if (callback) callback();
//   };

//   return (
//     <WalletContext.Provider value={{
//       address, setAddress,
//       provider,
//       connectEVMWallet,
//       disconnectWallet,
//       setIsDisconnectedState,
//       isDisconnectedState,
//       setLoading, loading,
//       setError, error,
//       networks,
//     }}>
//       {children}
//     </WalletContext.Provider>
//   );
// }

// export const useWallet = () => {
//   const context = useContext(WalletContext);
//   if (!context) throw new Error('useWallet must be used within WalletProvider');
//   return context;
// };

// // ── Helpers ──────────────────────────────────────────────────────────────────

// function getRpcUrl(chainId: number): string[] {
//   const map: Record<number, string[]> = {
//     1:    ['https://cloudflare-eth.com'],
//     56:   ['https://bsc-dataseed.binance.org/'],
//     8453: ['https://mainnet.base.org'],
//   };
//   return map[chainId] ?? [];
// }

// function getNativeCurrency(chainId: number) {
//   const map: Record<number, { name: string; symbol: string; decimals: number }> = {
//     1:    { name: 'Ether',   symbol: 'ETH', decimals: 18 },
//     56:   { name: 'BNB',     symbol: 'BNB', decimals: 18 },
//     8453: { name: 'Ether',   symbol: 'ETH', decimals: 18 },
//   };
//   return map[chainId] ?? { name: 'Ether', symbol: 'ETH', decimals: 18 };
// }

// function getExplorerUrl(chainId: number): string {
//   const map: Record<number, string> = {
//     1:    'https://etherscan.io',
//     56:   'https://bscscan.com',
//     8453: 'https://basescan.org',
//   };
//   return map[chainId] ?? '';
// }

























// import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
// import { createAppKit } from '@reown/appkit';
// import { EthersAdapter } from '@reown/appkit-adapter-ethers';
// import { mainnet, bsc, base } from '@reown/appkit/networks';
// import { getModal } from './appkit';

// interface WalletContextType {
//   address: string;
//   setAddress: (addr: string) => void;
//   connectEVMWallet: (args: { config: any; callback?: () => void }) => Promise<void>;
//   disconnectWallet: (args: { callback?: () => void }) => Promise<void>;
//   setIsDisconnectedState: (val: boolean) => void;
//   isDisconnectedState: boolean;
//   setLoading: (val: boolean) => void;
//   loading: boolean;
//   setError: (val: string) => void;
//   error: string;
//   networks: any;
//   provider: any;
//   cbProvider: any;
// }

// const WalletContext = createContext<WalletContextType | null>(null);

// // const PROJECT_ID = '36cbc116e714703ba7adda2a40048697';

// // ── Init AppKit once as singleton ─────────────────────────────────────────────
// // const ethersAdapter = new EthersAdapter();

// // const modal = createAppKit({
// //   adapters: [ethersAdapter],
// //   projectId: PROJECT_ID,
// //   networks: [mainnet, bsc, base],
// //   defaultNetwork: bsc,
// //   metadata: {
// //     name: 'Trust App',
// //     description: 'Trust App WalletConnect',
// //     url: typeof window !== 'undefined' ? window.location.origin : '',
// //     icons: ['https://avatars.githubusercontent.com/u/108554348'],
// //   },
// //   features: {
// //     analytics: false,
// //     email: false,
// //     socials: false,
// //   },
// //   featuredWalletIds: [
// //     '4622a2b2d6af1c9844944291e5e7351a6aa24cd7b23099efac1b2fd875da31a0', // Trust Wallet
// //   ],
// // });
// const modal = getModal()
// export function WalletProvider({ children }: { children: ReactNode }) {
//   // ── All original states preserved ──────────────────────────────────────────
//   const [address, setAddress] = useState('');
//   const [isDisconnectedState, setIsDisconnectedState] = useState(false);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState<string>('');
//   const [provider, setProvider] = useState<any>(null);

//   // ── Same networks object as original ───────────────────────────────────────
//   const networks = {
//     eth:  { chainId: 1,    hexChainId: '0x1',    chainName: 'Ethereum' },
//     bsc:  { chainId: 56,   hexChainId: '0x38',   chainName: 'BNB Smart Chain' },
//     base: { chainId: 8453, hexChainId: '0x2105', chainName: 'Base' },
//   };

//   // Restore session on mount + subscribe to AppKit account state
//   useEffect(() => {
//     // Restore saved address (same as original)
//     const savedAddress = localStorage.getItem('walletAddress');
//     const wasConnected = localStorage.getItem('walletConnected');
//     if (savedAddress && wasConnected === 'true') {
//       setAddress(savedAddress);
//       setIsDisconnectedState(false);
//     }

//     // Subscribe to AppKit — updates address when user connects/disconnects
//     const unsubscribe = modal.subscribeAccount((account) => {
//       if (account.isConnected && account.address) {
//         setAddress(account.address);
//         setIsDisconnectedState(false);
//         setProvider(modal.getWalletProvider());
//         localStorage.setItem('walletConnected', 'true');
//         localStorage.setItem('walletAddress', account.address);
//       } else {
//         setAddress('');
//         setIsDisconnectedState(true);
//         setProvider(null);
//         localStorage.removeItem('walletConnected');
//         localStorage.removeItem('walletAddress');
//       }
//     });

//     return () => unsubscribe();
//   }, []);

//   const connectEVMWallet = async ({ config, callback }: { config: any; callback?: () => void }) => {
//     try {
//       const { chainId } = config;
//       setLoading(true);
//       setError('');

//       // Opens AppKit modal:
//       // ✅ Desktop + extension  → shows extension + QR side by side
//       // ✅ Desktop no extension → shows QR code to scan
//       // ✅ Mobile               → deep links into Trust Wallet app
//       await modal.open({ view: 'Connect' });

//       // Wait for user to finish connecting (or close modal)
//       await new Promise<void>((resolve, reject) => {
//         const timeout = setTimeout(() => {
//           unsub();
//           unsubState();
//           reject(new Error('Connection timeout'));
//         }, 120000);

//         // Resolve when connected
//         const unsub = modal.subscribeAccount((account) => {
//           if (account.isConnected) {
//             clearTimeout(timeout);
//             unsub();
//             unsubState();
//             resolve();
//           }
//         });

//         // Reject if modal closes without connecting
//         const unsubState = modal.subscribeState((state) => {
//           if (!state.open) {
//             const currentAddress = localStorage.getItem('walletAddress');
//             if (!currentAddress) {
//               clearTimeout(timeout);
//               unsub();
//               unsubState();
//               reject(new Error('Modal closed without connecting'));
//             }
//           }
//         });
//       });

//       // Switch to requested chain after connecting
//       if (chainId) {
//         const networkMap: Record<number, any> = {
//           1:    mainnet,
//           56:   bsc,
//           8453: base,
//         };
//         if (networkMap[chainId]) {
//           await modal.switchNetwork(networkMap[chainId]);
//         }
//       }

//       if (callback) await callback();

//     } catch (err: any) {
//       // Swallow user-dismiss silently, surface real errors
//       if (!err.message?.includes('Modal closed')) {
//         setError(err.message || 'Connection failed');
//       }
//     } finally {
//       setLoading(false);
//     }
//   };

//   const disconnectWallet = async ({ callback }: { callback?: () => void }) => {
//     await modal.disconnect();

//     // Same cleanup as original
//     localStorage.removeItem('walletConnected');
//     localStorage.removeItem('walletAddress');
//     setAddress('');
//     setProvider(null);
//     setIsDisconnectedState(true);

//     if (callback) callback();
//   };

//   return (
//     <WalletContext.Provider value={{
//       // All original context values preserved
//       address, setAddress,
//       provider,
//       cbProvider:provider,
//       connectEVMWallet,
//       disconnectWallet,
//       setIsDisconnectedState,
//       isDisconnectedState,
//       setLoading, loading,
//       setError, error,
//       networks,
//     }}>
//       {children}
//     </WalletContext.Provider>
//   );
// }

// export const useWallet = () => {
//   const context = useContext(WalletContext);
//   if (!context) throw new Error('useWallet must be used within WalletProvider');
//   return context;
// };

// // ── Helpers (kept exactly as original) ───────────────────────────────────────

// function getRpcUrl(chainId: number): string[] {
//   const map: Record<number, string[]> = {
//     1:    ['https://cloudflare-eth.com'],
//     56:   ['https://bsc-dataseed.binance.org/'],
//     8453: ['https://mainnet.base.org'],
//   };
//   return map[chainId] ?? [];
// }

// function getNativeCurrency(chainId: number) {
//   const map: Record<number, { name: string; symbol: string; decimals: number }> = {
//     1:    { name: 'Ether', symbol: 'ETH', decimals: 18 },
//     56:   { name: 'BNB',   symbol: 'BNB', decimals: 18 },
//     8453: { name: 'Ether', symbol: 'ETH', decimals: 18 },
//   };
//   return map[chainId] ?? { name: 'Ether', symbol: 'ETH', decimals: 18 };
// }

// function getExplorerUrl(chainId: number): string {
//   const map: Record<number, string> = {
//     1:    'https://etherscan.io',
//     56:   'https://bscscan.com',
//     8453: 'https://basescan.org',
//   };
//   return map[chainId] ?? '';
// }

















import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { mainnet, bsc, base } from '@reown/appkit/networks';
import { getModal } from './appkit';
import { useAppKit } from '@reown/appkit/react'
import { createAppKit } from '@reown/appkit';
import { EthersAdapter } from '@reown/appkit-adapter-ethers';

const PROJECT_ID = 'fd94447fcbf33e960a54162ed6aaeb89';
interface WalletContextType {
  address: string;
  setAddress: (addr: string) => void;
  connectEVMWallet: (args: { config: any; callback?: () => void }) => Promise<void>;
  disconnectWallet: (args: { callback?: () => void }) => Promise<void>;
  setIsDisconnectedState: (val: boolean) => void;
  isDisconnectedState: boolean;
  setLoading: (val: boolean) => void;
  loading: boolean;
  setError: (val: string) => void;
  error: string;
  networks: any;
  provider: any;
  cbProvider: any;
}

const WalletContext = createContext<WalletContextType | null>(null);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState('');
  //  const ethersAdapter = new EthersAdapter();
  //  const modal =  createAppKit({
  //      adapters: [ethersAdapter],
  //      projectId: PROJECT_ID,
  //      networks: [mainnet, bsc, base],
  //      defaultNetwork: bsc,
       
  //      metadata: {
  //        name: 'Trust App',
  //        description: 'Trust App WalletConnect',
  //        url: window.location.origin,
  //        icons: ['https://avatars.githubusercontent.com/u/108554348'],
  //      },
  //      features: {
  //        analytics: false,
  //        email: false,
  //        socials: false,
  //      },
  //      featuredWalletIds: [
  //        '4622a2b2d6af1c9844944291e5e7351a6aa24cd7b23099efac1b2fd875da31a0',
  //      ],
  //    });
  
  const [isDisconnectedState, setIsDisconnectedState] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [provider, setProvider] = useState<any>(null);

  const networks = {
    eth:  { chainId: 1,    hexChainId: '0x1',    chainName: 'Ethereum' },
    bsc:  { chainId: 56,   hexChainId: '0x38',   chainName: 'BNB Smart Chain' },
    base: { chainId: 8453, hexChainId: '0x2105', chainName: 'Base' },
  };

  // ✅ getModal() called inside useEffect — client only
  useEffect(() => {
   
const modal= getModal()
    const savedAddress = localStorage.getItem('walletAddress');
    const wasConnected = localStorage.getItem('walletConnected');
    if (savedAddress && wasConnected === 'true') {
      setAddress(savedAddress);
      setIsDisconnectedState(false);
    }

    const unsubscribe = modal.subscribeAccount((account) => {
      if (account.isConnected && account.address) {
        setAddress(account.address);
        setIsDisconnectedState(false);
        setProvider(modal.getWalletProvider());
        localStorage.setItem('walletConnected', 'true');
        localStorage.setItem('walletAddress', account.address);
      } else {
        setAddress('');
        setIsDisconnectedState(true);
        setProvider(null);
        localStorage.removeItem('walletConnected');
        localStorage.removeItem('walletAddress');
      }
    });

    return () => unsubscribe();
  }, []);


// // Add the following import
// // + 
// function HomePage() {

//   return <button onClick={open}>Connect</button>
// }
  // ✅ getModal() called inside async handler — client only
  const connectEVMWallet = async ({ config, callback }: { config: any; callback?: () => void }) => {
    try {
      const modal = getModal();
      const { chainId } = config;
      setLoading(true);
      setError('');

      await modal.open({ view: 'Connect' });
// modal.getError
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          unsub();
          unsubState();
          reject(new Error('Connection timeout'));
        }, 120000);

        const unsub = modal.subscribeAccount((account) => {
          if (account.isConnected) {
            clearTimeout(timeout);
            unsub();
            unsubState();
            resolve();
          }
        });

        const unsubState = modal.subscribeState((state) => {
          if (!state.open) {
            const currentAddress = localStorage.getItem('walletAddress');
            if (!currentAddress) {
              clearTimeout(timeout);
              unsub();
              unsubState();
              reject(new Error('Modal closed without connecting'));
            }
          }
        });
      });

      if (chainId) {
        const networkMap: Record<number, any> = {
          1:    mainnet,
          56:   bsc,
          8453: base,
        };
        if (networkMap[chainId]) {
          await modal.switchNetwork(networkMap[chainId]);
        }
      }

      if (callback) await callback();

    } catch (err: any) {
      if (!err.message?.includes('Modal closed')) {
        setError(err.message || 'Connection failed');
      }
    } finally {
      setLoading(false);
    }
  };

  // ✅ getModal() called inside async handler — client only
  const disconnectWallet = async ({ callback }: { callback?: () => void }) => {
    const modal = getModal();
    await modal.disconnect();

    localStorage.removeItem('walletConnected');
    localStorage.removeItem('walletAddress');
    setAddress('');
    setProvider(null);
    setIsDisconnectedState(true);

    if (callback) callback();
  };

  return (
    <WalletContext.Provider value={{
      address, setAddress,
      provider,
      cbProvider: provider,
      connectEVMWallet,
      disconnectWallet,
      setIsDisconnectedState,
      isDisconnectedState,
      setLoading, loading,
      setError, error,
      networks,
    }}>
      {children}
    </WalletContext.Provider>
  );
}

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) throw new Error('useWallet must be used within WalletProvider');
  return context;
};

function getRpcUrl(chainId: number): string[] {
  const map: Record<number, string[]> = {
    1:    ['https://cloudflare-eth.com'],
    56:   ['https://bsc-dataseed.binance.org/'],
    8453: ['https://mainnet.base.org'],
  };
  return map[chainId] ?? [];
}

function getNativeCurrency(chainId: number) {
  const map: Record<number, { name: string; symbol: string; decimals: number }> = {
    1:    { name: 'Ether', symbol: 'ETH', decimals: 18 },
    56:   { name: 'BNB',   symbol: 'BNB', decimals: 18 },
    8453: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  };
  return map[chainId] ?? { name: 'Ether', symbol: 'ETH', decimals: 18 };
}

function getExplorerUrl(chainId: number): string {
  const map: Record<number, string> = {
    1:    'https://etherscan.io',
    56:   'https://bscscan.com',
    8453: 'https://basescan.org',
  };
  return map[chainId] ?? '';
}