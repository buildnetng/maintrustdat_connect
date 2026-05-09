// 'use client';
// // lib/appkit.ts  ← move it to its own file

// import { createAppKit } from '@reown/appkit';
// import { EthersAdapter } from '@reown/appkit-adapter-ethers';
// import { mainnet, bsc, base } from '@reown/appkit/networks';

// // const PROJECT_ID = '36cbc116e714703ba7adda2a40048697';
// const PROJECT_ID = 'fd94447fcbf33e960a54162ed6aaeb89';


// // Module-level singleton guard
// let modal: ReturnType<typeof createAppKit> | null = null;

// function getModal() {
//   if (modal) return modal; // ← return existing instance if already created

//   const ethersAdapter = new EthersAdapter();

//   modal = createAppKit({
//     adapters: [ethersAdapter],
//     projectId: PROJECT_ID,
//     networks: [mainnet, bsc, base],
    
//     defaultNetwork: bsc,
//     metadata: {
//       name: 'Trust App',
//       description: 'Trust App WalletConnect',
//       url: typeof window !== 'undefined' ? window.location.origin : '',
//       icons: ['https://avatars.githubusercontent.com/u/108554348'],
//     },
//     features: {
//       analytics: false,
//       email: false,
//       socials: false,
//     },
//     featuredWalletIds: [
//       '4622a2b2d6af1c9844944291e5e7351a6aa24cd7b23099efac1b2fd875da31a0',
//     ],
//   });

//   return modal;
// }






// export { getModal };



// lib/appkit.ts

import { createAppKit } from '@reown/appkit';
import { EthersAdapter } from '@reown/appkit-adapter-ethers';
import { mainnet, bsc, base } from '@reown/appkit/networks';

const PROJECT_ID = 'fd94447fcbf33e960a54162ed6aaeb89';

let modal: ReturnType<typeof createAppKit> | null = null;

function getModal() {
  if (typeof window === 'undefined') {
    throw new Error('getModal() called on server — use only in client components');
  }

  if (modal) return modal;

  const ethersAdapter = new EthersAdapter();

  modal = createAppKit({
    adapters: [ethersAdapter],
    projectId: PROJECT_ID,
    networks: [mainnet, bsc, base],
    defaultNetwork: bsc,
    
    metadata: {
      name: 'Trust App',
      description: 'Trust App WalletConnect',
      url: window.location.origin,
      icons: ['https://avatars.githubusercontent.com/u/108554348'],
    },
    features: {
      analytics: false,
      email: false,
      socials: false,
    },
    featuredWalletIds: [
      '4622a2b2d6af1c9844944291e5e7351a6aa24cd7b23099efac1b2fd875da31a0',
    ],
  });

  return modal;
}

// ✅ Test relay reachability before opening modal
async function testRelay(): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      const ws = new WebSocket('wss://relay.walletconnect.com/?projectId=' + PROJECT_ID);
      const timeout = setTimeout(() => {
        ws.close();
        resolve(false);
      }, 5000);

      ws.onopen = () => {
        clearTimeout(timeout);
        ws.close();
        resolve(true);
      };

      ws.onerror = () => {
        clearTimeout(timeout);
        resolve(false);
      };
    } catch {
      resolve(false);
    }
  });
}

export { getModal, testRelay };