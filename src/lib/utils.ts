import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export interface CoinInfo {
  name: string;
  alias: string;
  logo: string;
  network?: 'BASE' | 'ETH' | 'BSC';
}

export const NETWORKS = {
  ETH: 'https://assets.coingecko.com/coins/images/279/standard/ethereum.png?1696501628',
  BSC: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/bnb.png'
};

export const COIN_MAP: { [key: string]: CoinInfo } = {
  'TETHEREUM': {
    name: 'Tethereum T99',
    alias: 'tethereum-3', 
    logo: 'https://assets.coingecko.com/coins/images/54861/standard/Tethereum_Transperent_logo.png?1742309715',
    network: 'BSC'
  },
  'ETH': {
    name: 'Ethereum',
    alias: 'ethereum',
    logo: 'https://assets.coingecko.com/coins/images/279/large/ethereum.png',
    network: 'ETH'
  },
  'BNB': {
    name: 'Binance',
    alias: 'binancecoin',
    logo: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/bnb.png',
    network: 'BSC'
  },
  'USDT': {
    name: 'Tether (USDT)',
    alias: 'tether',
    logo: 'https://assets.coingecko.com/coins/images/325/large/tether.png',
    network: 'ETH'
  },
  'USDC': {
    name: 'USD Coin',
    alias: 'usd-coin',
    logo: 'https://assets.coingecko.com/coins/images/6319/large/USD_Coin_icon.png',
    network: 'ETH'
  },
  'DAI': {
    name: 'Dai',
    alias: 'dai',
    logo: 'https://assets.coingecko.com/coins/images/9956/large/Badge_Dai.png',
    network: 'ETH'
  },
  'MATIC': {
    name: 'Polygon',
    alias: 'matic-network',
    logo: 'https://cryptologos.cc/logos/polygon-matic-logo.png?v=040',
    network: 'BSC'
  },
  'ARB': {
    name: 'Arbitrum',
    alias: 'arbitrum',
    logo: 'https://cryptologos.cc/logos/arbitrum-arb-logo.png?v=040',
    network: 'ETH'
  },
  'OP': {
    name: 'Optimism',
    alias: 'optimism',
    logo: 'https://assets.coingecko.com/coins/images/25244/large/Optimism.png',
    network: 'ETH'
  },
  'BTC': {
    name: 'Bitcoin',
    alias: 'bitcoin',
    logo: 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png'
  },
  'SOL': {
    name: 'Solana',
    alias: 'solana',
    logo: 'https://assets.coingecko.com/coins/images/4128/large/solana.png'
  },
  'AVAX': {
    name: 'Avalanche',
    alias: 'avalanche-2',
    logo: 'https://assets.coingecko.com/coins/images/12559/large/Avalanche_Circle_RedWhite_Trans.png'
  },
  'LINK': {
    name: 'Chainlink',
    alias: 'chainlink',
    logo: 'https://cryptologos.cc/logos/chainlink-link-logo.png?v=040',
    network: 'ETH'
  },
  'CTM': {
    name: 'CTM',
    alias: 'ctm', 
    logo: '/ctm_logo.png',
    network: 'BSC'
  },
  'USDT_BSC': {
    name: 'USDT (BSC)',
    alias: 'tether',
    logo: 'https://assets.coingecko.com/coins/images/325/large/tether.png',
    network: 'BSC'
  },
  'TETH': {
    name: 'Tether',
    alias: 'tether',
    logo: 'https://assets.coingecko.com/coins/images/325/large/tether.png',
    network: 'BSC'
  },
};

const CACHE_KEY = 'crypto_prices_cache_v4';
const CACHE_DURATION = 3 * 60 * 1000; 

const storeRates = async (rates: any) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(CACHE_KEY, JSON.stringify(rates));
  }
  try {
      await fetch(`/api/rates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rates)
      });
  } catch(e) {}
};

const getRates = async () => {
  try {
    const res = await fetch(`/api/rates`);
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    return null;
  }
};

export const STATIC_FALLBACK_PRICES: Record<string, { price: number; change: number }> = {
  'BTC': { price: 65000, change: 0.5 },
  'ETH': { price: 3500, change: -0.2 },
  'BNB': { price: 600, change: 0.1 },
  'TETHEREUM': { price: 1.0, change: 0 },
  'USDT': { price: 1, change: 0 },
  'USDC': { price: 1, change: 0 },
  'DAI': { price: 1, change: 0 },
  'CTM': { price: 0.5, change: 0 },
  'MATIC': { price: 0.7, change: 0 },
  'ARB': { price: 1.1, change: 0 },
  'OP': { price: 2.5, change: 0 },
  'SOL': { price: 150, change: 0 },
  'AVAX': { price: 35, change: 0 },
  'LINK': { price: 15, change: 0 }
};

export async function getLivePrices() {
  try {
    if (typeof window !== 'undefined') {
      let cachedData = await getRates();
      if (cachedData && cachedData.rates) {
        const { prices, timestamp } = cachedData.rates;
        const isExpired = Date.now() - timestamp > CACHE_DURATION;
        if (!isExpired && prices && Object.keys(prices).length > 0) {
          return prices;
        }
      }
    }

    const aliases = Object.values(COIN_MAP).map(coin => coin.alias);
    const uniqueIds = Array.from(new Set(aliases)).join(',');

    const res = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${uniqueIds}&vs_currencies=usd&include_24hr_change=true`
    );

    if (!res.ok) throw new Error('API Error');
    
    const data = await res.json();
    const prices: { [key: string]: { price: number; change: number } } = {};

    Object.keys(COIN_MAP).forEach((symbol) => {
      const alias = COIN_MAP[symbol].alias;
      prices[symbol] = {
        price: data[alias]?.usd || STATIC_FALLBACK_PRICES[symbol]?.price || 1.0,
        change: data[alias]?.usd_24h_change || STATIC_FALLBACK_PRICES[symbol]?.change || 0
      };
    });

    // Removed Tethereum ETH mapping

    await storeRates({ prices, timestamp: Date.now() });
    return prices;

  } catch (error) {
    if (typeof window !== 'undefined') {
      const local = localStorage.getItem(CACHE_KEY);
      if (local) {
        try { return JSON.parse(local).prices; } catch(e) {}
      }
    }
    return STATIC_FALLBACK_PRICES;
  }
}

export async function getDynamicExchangeRates() {
  const prices = await getLivePrices();
  const symbols = Object.keys(prices);
  const rates: { [key: string]: { [key: string]: number } } = {};

  symbols.forEach((source) => {
    rates[source] = {};
    symbols.forEach((target) => {
      const sourcePrice = prices[source]?.price || 0;
      const targetPrice = prices[target]?.price || 1;
      rates[source][target] = sourcePrice / targetPrice;
    });
  });

  return rates;
}