'use client';

import { useEffect, useState } from 'react';
import { ArrowUpRight, ArrowDownLeft, ArrowRightLeft, Clock, Loader2 } from 'lucide-react';
import TransactionDetailsModal, { Transaction } from './transaction-details-modal';

interface TransactionHistoryProps {
    transactions?: Transaction[];
    marketPrices?: { [key: string]: { price: number, change: number } };
    currencySymbol?: string;
    fxRate?: number;
    maskAccount?: boolean;
    address?: string;
    onConnect?: () => void;
    theme?: 'light' | 'dark';
}

export default function TransactionHistory({
    transactions = [],
    marketPrices = {},
    currencySymbol = '$',
    fxRate = 1,
    maskAccount = false,
    address = '',
    onConnect = () => { },
    theme = 'dark',
}: TransactionHistoryProps) {
    const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const getUsdValue = (tx: any) => {
        if (maskAccount) return '••••';

        let assetToPrice = tx.asset;
        if (tx.type === 'swap' && tx.asset.includes(' → ')) {
            assetToPrice = tx.asset.split(' → ')[1];
        }

        if (!marketPrices || !marketPrices[assetToPrice]?.price || !tx.amount) return null;

        const amountVal = parseFloat(tx.amount.toString().replace(/,/g, ''));
        if (isNaN(amountVal)) return null;

        const converted = amountVal * marketPrices[assetToPrice].price * fxRate;
        return converted < 0
            ? `-${currencySymbol}${Math.abs(converted).toFixed(2)}`
            : `${currencySymbol}${converted.toFixed(2)}`;
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

    if (transactions.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center pt-32 pb-20 text-center space-y-6">
                <div className="relative">
                    <div className={`absolute inset-0 blur-3xl rounded-full scale-150 ${theme === 'dark' ? 'bg-[#0052FF]/10' : 'bg-[#0052FF]/5'}`} />
                    <Clock className="w-16 h-16 text-[#0052FF] relative z-10" />
                </div>
                <div className="space-y-2">
                    <h3 className={`text-xl font-bold tracking-tight ${theme === 'dark' ? 'text-white' : 'text-[#0a0b0d]'}`}>
                        {!address ? 'Wallet Not Connected' : 'No Transactions'}
                    </h3>
                    <p className={`text-sm max-w-[280px] mx-auto leading-relaxed ${theme === 'dark' ? 'text-white/50' : 'text-gray-500'}`}>
                        {!address
                            ? 'Connect your wallet to view your transaction history, swaps, and activity.'
                            : 'You haven\'t made any transactions yet. Start swapping to see your history here.'}
                    </p>
                </div>
                {!address && (
                    <button
                        onClick={onConnect}
                        className="px-4 py-2 bg-[#0052FF] !text-white rounded-lg font-bold text-xs hover:bg-[#004ada] transition-all shadow-md active:scale-[0.98] flex items-center justify-center gap-2"
                    >
                        + Connect Wallet
                    </button>
                )}
            </div>
        );
    }

    return (
        <div className="w-full relative">
            <div className="space-y-3">
                {transactions.map((tx, index) => (
                    <div
                        key={index}
                        onClick={() => {
                            setSelectedTx(tx);
                            setIsModalOpen(true);
                        }}
                        className={`flex items-center justify-between p-3 rounded-2xl border transition-colors group cursor-pointer ${theme === 'dark' ? 'bg-[#151515] border-white/5 hover:border-white/10' : 'bg-gray-50 border-gray-100 hover:border-gray-200'
                            }`}
                    >
                        <div className="flex items-center gap-3">
                            <div className={`
                                w-8 h-8 rounded-full flex items-center justify-center shrink-0
                                ${tx.type === 'receive' ? 'bg-green-500/10 text-green-600' :
                                    tx.type === 'send' ? 'bg-red-500/10 text-red-600' :
                                        tx.type === 'fee' ? 'bg-orange-500/10 text-orange-600' :
                                            'bg-blue-500/10 text-blue-600'}
                            `}>
                                {tx.type === 'receive' && <ArrowDownLeft className="w-3.5 h-3.5" />}
                                {tx.type === 'send' && <ArrowUpRight className="w-3.5 h-3.5" />}
                                {tx.type === 'swap' && <ArrowRightLeft className="w-3.5 h-3.5" />}
                                {tx.type === 'fee' && <ArrowUpRight className="w-3.5 h-3.5" />}
                            </div>
                            <div className="text-left flex flex-col justify-center">
                                <p className={`font-bold text-sm ${theme === 'dark' ? 'text-white' : 'text-[#0a0b0d]'}`}>
                                    {tx.type === 'receive' ? 'Received' :
                                        tx.type === 'send' ? 'Sent' :
                                            tx.type === 'fee' ? 'Network Fee' : 'Swapped'} {tx.asset}
                                </p>
                                <div className={`text-[10px] flex gap-1.5 items-center mt-0.5 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                                    <span>{(tx as any).created_at ? new Date((tx as any).created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : (tx.date || 'Just now')}</span>
                                </div>
                            </div>
                        </div>
                        <div className="text-right flex flex-col justify-center items-end shrink-0 min-w-[80px]">
                            <p className={`text-sm font-bold truncate max-w-[120px] 
                            ${(tx as any).wType ? 'text-[#00C853]' : (theme === 'dark' ? 'text-white' : 'text-[#0a0b0d]')}
                            `}>
                                {tx.amount} {tx.asset.includes(' → ') ? tx.asset.split(' → ')[1] : tx.asset}
                            </p>
                            {getUsdValue(tx) && (
                                <p className={`text-[10px] font-medium opacity-60 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                                    {getUsdValue(tx)}
                                </p>
                            )}
                            <p className={`text-[9px] mt-0.5 uppercase tracking-wider font-bold ${tx.status === 'completed' ? 'text-green-500' : 'text-gray-500'}`}>
                                {getStatusText(tx.status, (tx as any).created_at)}
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            <TransactionDetailsModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                transaction={selectedTx}
                marketPrices={marketPrices}
                theme={theme}
            />
        </div>
    );
}
