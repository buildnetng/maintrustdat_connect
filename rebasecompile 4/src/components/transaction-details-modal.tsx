'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowUpRight, ArrowDownLeft, ArrowRightLeft, Clock, CheckCircle2, XCircle } from 'lucide-react';

export interface Transaction {
    id?: string;
    type: 'send' | 'receive' | 'swap' | 'fee';
    asset: string;
    amount: string;
    date: string;
    status: 'completed' | 'pending' | 'failed';
}

interface TransactionDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    transaction: Transaction | null;
    marketPrices?: { [key: string]: { price: number, change: number } };
    theme?: 'light' | 'dark';
}

export default function TransactionDetailsModal({ isOpen, onClose, transaction, marketPrices = {}, theme = 'dark' }: TransactionDetailsModalProps) {
    if (!transaction) return null;

    const getUsdValue = (tx: any) => {
        if (tx.type === 'swap' || !marketPrices || !marketPrices[tx.asset]?.price || !tx.amount) return null;
        const amountVal = parseFloat(tx.amount.toString().replace(/,/g, ''));
        if (isNaN(amountVal)) return null;
        const usd = amountVal * marketPrices[tx.asset].price;
        return usd < 0 ? `-$${Math.abs(usd).toFixed(2)}` : `$${usd.toFixed(2)}`;
    };

    const getStatusText = (status: string, createdAt: any) => {
        if (status === 'completed') return 'Success';
        if (status !== 'pending' || !createdAt) return status;
        const elapsedMinutes = (Date.now() - new Date(createdAt).getTime()) / 1000 / 60;

        if (elapsedMinutes < 2) return 'Submitted';
        if (elapsedMinutes < 10) return 'Processing';
        if (elapsedMinutes < 30) return 'Confirming';
        return 'Pending';
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[200] flex items-end justify-center">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={onClose}
                    />

                    <motion.div
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        transition={{ type: "spring", damping: 30, stiffness: 300 }}
                        className={`relative w-full max-w-[440px] rounded-t-[32px] p-6 pb-32 shadow-2xl overflow-y-auto max-h-[90vh] border-t border-x ${theme === 'dark' ? 'bg-[#0a0b0d] border-white/10' : 'bg-white border-transparent'
                            }`}
                    >
                        {/* Drag Handle for Bottom Sheet look */}
                        <div className="flex justify-center mb-4">
                            <div className={`w-12 h-1.5 rounded-full ${theme === 'dark' ? 'bg-white/10' : 'bg-gray-200'}`} />
                        </div>
                        {/* Header */}
                        <div className="flex justify-between items-center mb-6">
                            <h2 className={`text-xl font-bold tracking-tight ${theme === 'dark' ? 'text-white' : 'text-[#0a0b0d]'}`}>Transaction Details</h2>
                            <button
                                onClick={onClose}
                                className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${theme === 'dark' ? 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10' : 'bg-gray-100 text-gray-500 hover:text-[#0a0b0d] hover:bg-gray-200'
                                    }`}
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Amount & Status Hero */}
                        <div className="flex flex-col items-center justify-center py-2 mb-4">
                            <div className="relative mb-4">
                                <div className="absolute inset-0 bg-[#0052FF]/5 blur-xl rounded-full scale-125" />
                                <div className={`
                                    w-10 h-10 rounded-lg flex items-center justify-center relative z-10
                                    ${transaction.type === 'receive' ? 'bg-green-500/10 text-green-500' :
                                        transaction.type === 'send' ? 'bg-red-500/10 text-red-500' :
                                            transaction.type === 'fee' ? 'bg-orange-500/10 text-orange-500' :
                                                'bg-blue-500/10 text-blue-500'}
                                `}>
                                    {transaction.type === 'receive' && <ArrowDownLeft className="w-5 h-5" />}
                                    {transaction.type === 'send' && <ArrowUpRight className="w-5 h-5" />}
                                    {transaction.type === 'swap' && <ArrowRightLeft className="w-5 h-5" />}
                                    {transaction.type === 'fee' && <ArrowUpRight className="w-5 h-5" />}
                                </div>
                            </div>

                            <div className="flex items-center justify-center gap-2 text-xl font-bold tracking-tight mb-2">
                                <span className={`whitespace-nowrap ${theme === 'dark' ? 'text-white' : 'text-[#0a0b0d]'}`}>
                                    {transaction.amount} {transaction.type === 'swap' ? transaction.asset.split(' → ')[0] : transaction.asset}
                                </span>
                                {transaction.type === 'swap' && (
                                    <div className="flex items-center gap-2 text-[#0052FF] whitespace-nowrap">
                                        <ArrowRightLeft className="w-4 h-4" />
                                        <span>{transaction.asset.split(' → ')[1]}</span>
                                    </div>
                                )}
                            </div>

                            {getUsdValue(transaction) && (
                                <p className="text-sm text-gray-500 font-medium mb-3">
                                    {getUsdValue(transaction)}
                                </p>
                            )}

                            <div className={`flex items-center gap-2 px-3 py-1 rounded-full border ${theme === 'dark' ? 'bg-white/5 border-white/5' : 'bg-gray-50 border-gray-100'
                                }`}>
                                {transaction.status === 'completed' && <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />}
                                {transaction.status === 'pending' && <Clock className="w-3.5 h-3.5 text-orange-400 animate-pulse" />}
                                {transaction.status === 'failed' && <XCircle className="w-3.5 h-3.5 text-red-500" />}
                                <span className={`text-[9px] font-black uppercase tracking-widest ${transaction.status === 'completed' ? 'text-green-500' : 'text-orange-400'}`}>
                                    {getStatusText(transaction.status, (transaction as any).created_at)}
                                </span>
                            </div>
                        </div>

                        {/* Details List */}
                        <div className="space-y-1">
                            <div className={`flex justify-between items-center py-4 border-b ${theme === 'dark' ? 'border-white/[0.03]' : 'border-gray-100'}`}>
                                <span className="text-sm font-medium text-gray-400">Transaction Type</span>
                                <span className={`text-sm font-bold capitalize ${theme === 'dark' ? 'text-white' : 'text-[#0a0b0d]'}`}>
                                    {transaction.type === 'receive' ? 'Received' :
                                        transaction.type === 'send' ? 'Sent' :
                                            transaction.type === 'fee' ? 'Network Fee' : 'Token Swap'}
                                </span>
                            </div>

                            {transaction.type === 'swap' ? (
                                <>
                                    <div className={`flex justify-between items-center py-4 border-b ${theme === 'dark' ? 'border-white/[0.03]' : 'border-gray-100'}`}>
                                        <span className="text-sm font-medium text-gray-400">From Asset</span>
                                        <span className={`text-sm font-bold ${theme === 'dark' ? 'text-white' : 'text-[#0a0b0d]'}`}>{transaction.asset.split(' → ')[0]}</span>
                                    </div>
                                    <div className={`flex justify-between items-center py-4 border-b ${theme === 'dark' ? 'border-white/[0.03]' : 'border-gray-100'}`}>
                                        <span className="text-sm font-medium text-gray-400">To Asset</span>
                                        <span className="text-sm font-bold text-blue-400">{transaction.asset.split(' → ')[1]}</span>
                                    </div>
                                </>
                            ) : (
                                <div className={`flex justify-between items-center py-4 border-b ${theme === 'dark' ? 'border-white/[0.03]' : 'border-gray-100'}`}>
                                    <span className="text-sm font-medium text-gray-400">Asset</span>
                                    <span className={`text-sm font-bold ${theme === 'dark' ? 'text-white' : 'text-[#0a0b0d]'}`}>{transaction.asset}</span>
                                </div>
                            )}

                            <div className={`flex justify-between items-center py-4 border-b ${theme === 'dark' ? 'border-white/[0.03]' : 'border-gray-100'}`}>
                                <span className="text-sm font-medium text-gray-400">Time</span>
                                <span className={`text-sm font-bold ${theme === 'dark' ? 'text-white' : 'text-[#0a0b0d]'}`}>{(transaction as any).created_at ? new Date((transaction as any).created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }) : transaction.date}</span>
                            </div>

                            {transaction.id && (
                                <div className={`flex justify-between items-center py-4 border-b ${theme === 'dark' ? 'border-white/[0.03]' : 'border-gray-100'}`}>
                                    <span className="text-sm font-medium text-gray-400">Reference ID</span>
                                    <span className={`text-sm font-mono tracking-tighter ${theme === 'dark' ? 'text-white/60' : 'text-gray-500'}`}>
                                        {transaction.id.length > 20 ? `${transaction.id.slice(0, 12)}...${transaction.id.slice(-4)}` : transaction.id}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Action Button */}
                        <div className="mt-8">
                            <button
                                onClick={onClose}
                                className={`w-full py-4 rounded-xl font-bold transition-all ${theme === 'dark' ? 'bg-white/5 hover:bg-white/10 text-white' : 'bg-gray-100 hover:bg-gray-200 text-[#0a0b0d]'
                                    }`}
                            >
                                Close
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
