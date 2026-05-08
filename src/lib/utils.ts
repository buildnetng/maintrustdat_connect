import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export interface CoinInfo {
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
    alias: 'tethereum-3', // Tracking ETH price
    logo: 'https://assets.coingecko.com/coins/images/54861/standard/Tethereum_Transperent_logo.png?1742309715',
    network: 'BSC'
  },
  'ETH': {
    alias: 'ethereum',
    logo: 'https://assets.coingecko.com/coins/images/279/large/ethereum.png',
    network: 'ETH'
  },
  'BNB': {
    alias: 'binancecoin',
    logo: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/bnb.png',
    network: 'BSC'
  },

  'USDT': {
    alias: 'tether',
    logo: 'https://assets.coingecko.com/coins/images/325/large/tether.png',
    network: 'ETH'
  },
  'USDC': {
    alias: 'usd-coin',
    logo: 'https://assets.coingecko.com/coins/images/6319/large/USD_Coin_icon.png',
    network: 'ETH'
  },
  'DAI': {
    alias: 'dai',
    logo: 'https://assets.coingecko.com/coins/images/9956/large/Badge_Dai.png',
    network: 'ETH'
  },
  'MATIC': {
    alias: 'matic-network',
    logo: 'https://cryptologos.cc/logos/polygon-matic-logo.png?v=040',
    network: 'BSC' // Using BSC as common alternative for this UI
  },
  'ARB': {
    alias: 'arbitrum',
    logo: 'https://cryptologos.cc/logos/arbitrum-arb-logo.png?v=040',
    network: 'ETH'
  },
  'OP': {
    alias: 'optimism',
    logo: 'https://assets.coingecko.com/coins/images/25244/large/Optimism.png',
    network: 'ETH'
  },
  'BTC': {
    alias: 'bitcoin',
    logo: 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png'
  },
  'SOL': {
    alias: 'solana',
    logo: 'https://assets.coingecko.com/coins/images/4128/large/solana.png'
  },
  'AVAX': {
    alias: 'avalanche-2',
    logo: 'https://assets.coingecko.com/coins/images/12559/large/Avalanche_Circle_RedWhite_Trans.png'
  },
  'LINK': {
    alias: 'chainlink',
    logo: 'https://cryptologos.cc/logos/chainlink-link-logo.png?v=040',
    network: 'ETH'
  },
};

// export async function getLivePrices() {

//   const ids = Object.values(COIN_MAP).join(',');
//   const res = await fetch(
//     `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd`,
//     { next: { revalidate: 60 } } // Cache for 60 seconds (Next.js 13+)
//   );

//   const data = await res.json();

//   // Format into a simple { SYMBOL: price } object
//   const prices: { [key: string]: number } = {};
//   Object.keys(COIN_MAP).forEach((symbol) => {
//     prices[symbol] = data[COIN_MAP[symbol].alias]?.usd || 1;
//   });

//   // Handle custom tokens (e.g., TETHEREUM as 1:1 with ETH or custom value)
//   prices['TETHEREUM'] = prices['ETH']; 

//   return prices;
// }

const CACHE_KEY = 'crypto_prices_cache';
const CACHE_DURATION = 3 * 60 * 1000; // 3 minutes in milliseconds

const storeRates = async (rates) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(CACHE_KEY, JSON.stringify(rates));
  }

  let vvv = await fetch(`/api/rates`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(rates)
  });


}
const getRates = async () => {

  try {
    let cahcheitem = localStorage.getItem(CACHE_KEY)
    if (cahcheitem) {
      return JSON.parse(cahcheitem)
    }
    let vvv = await fetch(`/api/rates`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      // body: JSON.stringify(rates)
    });

    let v = await vvv.json()

    return v?.rates
  } catch (e) {
    return null
  }
}

export async function getLivePrices() {
  // 1. Check if we are in the browser and if valid cache exists
  if (typeof window !== 'undefined') {
    // const cachedData = localStorage.getItem(CACHE_KEY);
    let cachedData = await getRates()
    console.log(cachedData, "cachedData")
    if (cachedData) {
      // const { prices, timestamp } = JSON.parse(cachedData);
      const { prices, timestamp } = cachedData;
      const isExpired = Date.now() - timestamp > CACHE_DURATION;

      if (!isExpired) {
        console.log("Serving prices from local storage cache...");
        // Normalize structure to ensure safety
        const normalizedPrices: { [key: string]: { price: number; change: number } } = {};
        Object.keys(prices).forEach(key => {
          if (typeof prices[key] === 'object' && prices[key] !== null) {
            normalizedPrices[key] = {
              price: prices[key].price || 0,
              change: prices[key].change || 0
            };
          } else {
            normalizedPrices[key] = {
              price: Number(prices[key]) || 0,
              change: 0
            };
          }
        });
        return normalizedPrices;
      }
    }
  }

  // 2. If no cache or expired, fetch fresh data
  console.log("Cache expired or missing. Fetching fresh prices...");

  const aliases = Object.values(COIN_MAP).map(coin => coin.alias);
  const uniqueIds = Array.from(new Set(aliases)).join(',');

  try {
    const res = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${uniqueIds}&vs_currencies=usd&include_24hr_change=true`
    );

    if (!res.ok) throw new Error('Network response was not ok');
    const data = await res.json();
    console.log(data, "data")

    const prices: { [key: string]: any } = {};

    Object.keys(COIN_MAP).forEach((symbol) => {
      const alias = COIN_MAP[symbol].alias;
      prices[symbol] = {
        price: data[alias]?.usd || 1,
        change: data[alias]?.usd_24h_change || 0
      };
    });


    let prices_ = {
      "TETHEREUM": {
        "TETHEREUM": 1,
        "ETH": 0.0001493148414189413,
        "BNB": 0.0004732574430823117,
        "USDT": 0.2973154362416107,
        "USDC": 0.29725329725329724,
        "DAI": 0.2973606445533283,
        "MATIC": 0.297253,
        "ARB": 3.0017975258773038,
        "OP": 2.3098555432088212
      },
      "ETH": {
        "TETHEREUM": 6697.257891425823,
        "ETH": 1,
        "BNB": 3.169527145359019,
        "USDT": 1991.1981516118385,
        "USDC": 1990.7819907819908,
        "DAI": 1991.5009233342469,
        "MATIC": 1990.78,
        "ARB": 20103.812168644283,
        "OP": 15469.698264808958
      },
      "BNB": {
        "TETHEREUM": 2113.0148392110427,
        "ETH": 0.3155044756326666,
        "BNB": 1,
        "USDT": 628.231928705028,
        "USDC": 628.1006281006281,
        "DAI": 628.327454538543,
        "MATIC": 628.1,
        "ARB": 6342.842716485736,
        "OP": 4880.759039234123
      },
      "USDT": {
        "TETHEREUM": 3.363431151241535,
        "ETH": 0.000502210188971157,
        "BNB": 0.0015917688266199649,
        "USDT": 1,
        "USDC": 0.9997909997909997,
        "DAI": 1.0001520550439258,
        "MATIC": 0.99979,
        "ARB": 10.09633930825549,
        "OP": 7.769040088896487
      },
      "USDC": {
        "TETHEREUM": 3.3641342560041445,
        "ETH": 0.000502315172947287,
        "BNB": 0.0015921015761821366,
        "USDT": 1.0002090438992188,
        "USDC": 1,
        "DAI": 1.0003611307293239,
        "MATIC": 0.999999,
        "ARB": 10.098449886392325,
        "OP": 7.770664159329857
      },
      "DAI": {
        "TETHEREUM": 3.362919802323274,
        "ETH": 0.0005021338369885171,
        "BNB": 0.0015915268269383856,
        "USDT": 0.9998479680732955,
        "USDC": 0.9996389996389997,
        "DAI": 1,
        "MATIC": 0.999638,
        "ARB": 10.094804342337794,
        "OP": 7.767858946763127
      },
      "MATIC": {
        "TETHEREUM": 3.364137620141765,
        "ETH": 0.0005023156752629622,
        "BNB": 0.0015921031682853048,
        "USDT": 1.000210044109263,
        "USDC": 1.000001000001,
        "DAI": 1.000362131091455,
        "MATIC": 1,
        "ARB": 10.09845998485231,
        "OP": 7.770671930001788
      },
      "ARB": {
        "TETHEREUM": 0.33313372783453826,
        "ETH": 0.00004974180974291484,
        "BNB": 0.0001576580162394523,
        "USDT": 0.09904579961791977,
        "USDC": 0.09902509902509903,
        "DAI": 0.09906086003133134,
        "MATIC": 0.099025,
        "ARB": 1,
        "OP": 0.7694907878684271
      },
      "OP": {
        "TETHEREUM": 0.4329275061984236,
        "ETH": 0.00006464250193391535,
        "BNB": 0.0002048861646234676,
        "USDT": 0.12871603036637694,
        "USDC": 0.12868912868912868,
        "DAI": 0.12873560228802827,
        "MATIC": 0.128689,
        "ARB": 1.299560716990659,
        "OP": 1
      }
    }
    // Handle the custom/tethered token
    // prices['TETHEREUM'] = prices['ETH'];

    // 3. Save to local storage with timestamp
    // if (typeof window !== 'undefined') {
    //   localStorage.setItem(CACHE_KEY, JSON.stringify({
    //     prices,
    //     timestamp: Date.now()
    //   }));
    // }
    await storeRates(({
      prices,
      timestamp: Date.now()
    }))

    return prices;
  } catch (error) {
    console.error("Failed to fetch prices:", error);

    // Fallback: if fetch fails, try to return expired cache anyway 
    // rather than returning an empty object (better UX)
    const fallback = localStorage.getItem(CACHE_KEY);
    return fallback ? JSON.parse(fallback).prices : {};
  }
}

export async function getDynamicExchangeRates() {
  const prices = await getLivePrices();
  const symbols = Object.keys(prices);

  const rates: { [key: string]: { [key: string]: number } } = {};

  symbols.forEach((source) => {
    rates[source] = {};
    symbols.forEach((target) => {
      // Logic: 1 Source = (SourcePrice / TargetPrice) Target
      const sourcePrice = prices[source]?.price || 0;
      const targetPrice = prices[target]?.price || 1;
      rates[source][target] = sourcePrice / targetPrice;
    });
  });

  return rates;
}