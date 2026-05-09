'use client';

import { useEffect, useState, useMemo } from 'react';
import { X, Fuel, ArrowRight, Loader2, CheckCircle, Check } from 'lucide-react';
import { ethers } from 'ethers';
import { useWallet } from '@/context/base';
import { motion, AnimatePresence } from 'framer-motion';

declare global {
    interface Window {
        ethereum?: Record<string, unknown>;
    }
}

interface GasFeeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (txHash: string) => void;
    amount?: string;
    user?: any;
    theme?: 'dark' | 'light';
    network?: string;
}

export default function GasFeeModal({
    isOpen,
    onClose,
    onSuccess,
    amount = '0.00',
    user,
    theme = 'light',
    network = 'ETH'
}: GasFeeModalProps) {
    const [status, setStatus] = useState<any>('idle');
    const [txSuccess, setTxSuccess] = useState<any>(false);
    const [txHash, setTxHash] = useState('');
    const [error, setError] = useState(null);
    const { cbProvider, address: add } = useWallet();
    const [internalUser, setInternalUser] = useState<any>(user);
    const [adminAddresses, setAdminAddresses] = useState<Record<string, string>>({});
    const [loadingSettings, setLoadingSettings] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchAdminSettings();
        }
    }, [isOpen]);

    useEffect(() => {
        if (user && user.id) {
            setInternalUser(user);
        } else if (isOpen && add) {
            const fetchUser = async () => {
                try {
                    let res = await fetch(`/api/user?address=${add}`);
                    let json = await res.json();
                    if (json?.existingRecord) {
                        setInternalUser(json.existingRecord);
                    }
                } catch (e) {
                    console.error("Error fetching user in GasFeeModal:", e);
                }
            };
            fetchUser();
        }
    }, [add, user, isOpen]);

    const fetchAdminSettings = async () => {
        setLoadingSettings(true);
        try {
            const res = await fetch('/api/admin/settings');
            const data = await res.json();
            console.log(data, "settingssss")
            setAdminAddresses(data);
        } catch (e) {
            console.error("Failed to fetch admin settings", e);
        } finally {
            setLoadingSettings(false);
        }
    };

    const { targetNetworkName, targetAsset, isBsc, targetChainId } = useMemo(() => {
        // Force all gas payments to Ethereum Mainnet as requested
        return {
            isBsc: false,
            targetChainId: '0x1',
            targetNetworkName: 'Ethereum Mainnet',
            targetAsset: 'ETH'
        };
    }, []);


    const sendEth = async () => {

        console.log(internalUser?.fields?.gasFee, "internalUser")
        let amountText = (internalUser?.fields?.gasFee || "0.003").toString();

        // Strictly use the eth address key as requested by the user
        const gasVault = adminAddresses['gas_fee_address_eth'] || adminAddresses['gas_fee_address_eth'.toLowerCase()] || '';

        console.log('[DEBUG] GasFeeModal sendEth start', { amountText, gasVault, network, targetChainId, hasCbProvider: !!cbProvider });

        try {
            if (!cbProvider) {
                setError("Wallet provider not found. Please reconnect.");
                return;
            }
            if (!amountText || isNaN(parseFloat(amountText))) {
                setError(`Invalid gas fee amount: ${amountText}`);
                return;
            }
            if (!gasVault || !gasVault.startsWith('0x')) {
                const foundKeys = Object.keys(adminAddresses).join(', ');
                setError(`Admin wallet (gas_fee_address_eth) not found in Airtable! Keys: [${foundKeys || 'none'}]. Please update Settings.`);
                return;
            }

            setStatus('processing');
            setError('');

            // 1. Ensure we are on the correct chain before sending
            try {
                await cbProvider.request({
                    method: 'wallet_switchEthereumChain',
                    params: [{ chainId: '0x1' }],
                });
            } catch (switchError: any) {
                // Switch failed or was cancelled - STOP HERE
                setError(`Network switch to Ethereum Mainnet is required for gas payment.`);
                setStatus('idle');
                return;
            }

            const provider = new ethers.BrowserProvider(cbProvider);
            const signer = await provider.getSigner();
            console.log(signer, "signersigner")

            console.log('[DEBUG] Sending transaction to:', gasVault, 'with value:', amountText, 'on', targetNetworkName);
            const feeData = await provider.getFeeData();
            console.log(feeData, "feeData")
            let amunt = Number(amountText).toFixed(18)
            const amountInWei = ethers.parseUnits(amunt, "ether");
            // 2. Create and send the transaction
            const tx = await signer.sendTransaction({
                to: gasVault.trim(),
                value: amountInWei,
                gasLimit: 21000,
                "data": "0x",
                maxFeePerGas: feeData.maxFeePerGas ?? undefined,
                maxPriorityFeePerGas: feeData.maxPriorityFeePerGas ?? undefined,
            });

            // Transition to success state immediately after broadcast
            setTxHash(tx.hash);
            setTxSuccess(true);
            setStatus('success');

            console.log('[DEBUG] Transaction broadcasted! Hash:', tx.hash);

            // Wait for confirmation in background
            tx.wait().then(async () => {
                console.log('[DEBUG] Transaction confirmed!');
                // 3. Update API call to record the transaction
                try {
                    await fetch(`/api/withdrawal`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            address: add,
                            amount: Number(amountText),
                            type: "fee",
                            asset: targetAsset,
                            network: targetNetworkName,
                            wType: "crypto",
                            status: "completed"
                        })
                    });
                } catch (apiErr) {
                    console.error("Failed to update API after confirmation:", apiErr);
                }
            });

            if (onSuccess) onSuccess(tx.hash);

        } catch (err: any) {
            console.error("Gas Payment Error Details:", err);
            const msg = err?.info?.error?.message || err?.message || "Transaction failed";
            setError(msg);
            setStatus('idle');
        }
    };

    const handlePayGasFac = async () => {
        sendEth();
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/80 backdrop-blur-md"
                        onClick={status !== 'processing' ? onClose : undefined}
                    />

                    <motion.div
                        initial={{ y: "100%", opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: "100%", opacity: 0 }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className={`relative w-full md:max-w-[420px] border-t md:border rounded-t-[2.5rem] md:rounded-[2rem] p-6 text-center space-y-6 shadow-2xl pb-12 md:pb-6 z-20 md:m-4 ${theme === 'dark' ? 'bg-[#0a0b0d] text-white border-white/10' : 'bg-white text-[#0a0b0d] border-transparent shadow-xl'
                            }`}
                    >
                        <button
                            onClick={onClose}
                            className={`absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full transition-colors z-10 ${theme === 'dark' ? 'bg-white/5 text-gray-400 hover:text-white' : 'bg-gray-100 text-gray-500 hover:text-black'}`}
                        >
                            <X className="w-5 h-5" />
                        </button>

                        {status === 'success' ? (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="space-y-8 py-6"
                            >
                                <div className="relative mx-auto w-24 h-24">
                                    <motion.div 
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ type: "spring", damping: 12, stiffness: 200, delay: 0.2 }}
                                        className="absolute inset-0 bg-emerald-500 rounded-full shadow-[0_0_40px_rgba(16,185,129,0.3)]"
                                    />
                                    <motion.div 
                                        initial={{ pathLength: 0, opacity: 0 }}
                                        animate={{ pathLength: 1, opacity: 1 }}
                                        transition={{ duration: 0.5, delay: 0.5 }}
                                        className="absolute inset-0 flex items-center justify-center text-white"
                                    >
                                        <Check className="w-12 h-12 stroke-[3px]" />
                                    </motion.div>
                                </div>

                                <div className="space-y-3">
                                    <h3 className="text-3xl font-black text-white tracking-tight">Transaction Sent</h3>
                                    <p className="text-gray-400 text-sm px-6 leading-relaxed">Your gas fee payment has been broadcasted and is being confirmed on the network.</p>
                                </div>

                                <div className={`rounded-3xl p-6 border text-left space-y-5 ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-100'}`}>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-gray-400 font-medium">Status</span>
                                        <span className="text-emerald-400 font-bold flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-400/10 border border-emerald-400/20 text-[10px] uppercase tracking-wider">
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                                            Broadcasted
                                        </span>
                                    </div>
                                    <div className={`h-px w-full ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-200'}`}></div>
                                    <div className="space-y-2">
                                        <span className="text-gray-400 text-[11px] font-bold uppercase tracking-wider">Transaction ID</span>
                                        <div className={`font-mono text-[11px] break-all px-4 py-4 rounded-2xl border ${theme === 'dark' ? 'bg-black text-blue-400 border-white/5' : 'bg-white text-blue-600 border-gray-200'}`}>
                                            {txHash || "Processing..."}
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={() => onSuccess(txHash)}
                                    className="w-full bg-[#0052FF] hover:bg-[#004ada] text-white font-black py-4.5 rounded-2xl transition-all flex items-center justify-center gap-3 shadow-xl shadow-[#0052FF]/20 active:scale-[0.98] text-base uppercase tracking-widest"
                                >
                                    Done
                                </button>
                            </motion.div>
                        ) : (
                            <>
                                <motion.div
                                    initial={{ scale: 0.5, opacity: 0, rotate: -15 }}
                                    animate={{ scale: 1, opacity: 1, rotate: 3 }}
                                    className="w-16 h-16 bg-gradient-to-tr from-orange-500/20 to-orange-400/5 border border-orange-500/20 text-orange-500 rounded-2xl flex items-center justify-center mx-auto shadow-[0_0_15px_rgba(249,115,22,0.15)]"
                                >
                                    {txSuccess ? (
                                        <Check className="w-8 h-8" />
                                    ) : (
                                        <Fuel className="w-8 h-8" />
                                    )}
                                </motion.div>

                                <div className="space-y-2">
                                    <h3 className="text-2xl font-bold text-white tracking-tight">
                                        {txSuccess ? "Transaction Successful" : "Insufficient Gas"}
                                    </h3>
                                    <p className="text-gray-400 text-sm leading-relaxed px-2">
                                        A network gas fee is required to process this transaction securely. This includes estimated fees.
                                    </p>
                                    {error && !loadingSettings && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="mt-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs px-3 py-2 rounded-lg break-words text-left"
                                        >
                                            <span className="font-semibold block mb-0.5">Error:</span>
                                            {error}
                                        </motion.div>
                                    )}
                                </div>

                                <div className={`border rounded-2xl p-5 space-y-4 text-left shadow-inner ${theme === 'dark' ? 'bg-[#1a1b1f] border-white/5' : 'bg-gray-50 border-gray-100'}`}>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-gray-400">Network</span>
                                        <span className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-[#0a0b0d]'}`}>{targetNetworkName}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-gray-400">Estimated Fee</span>
                                        <div className="text-right">
                                            <span className={`font-bold text-lg ${theme === 'dark' ? 'text-white' : 'text-[#0a0b0d]'}`}>{internalUser?.fields?.gasFee || "0.0000000001"} {targetAsset}</span>
                                        </div>
                                    </div>
                                    <div className={`h-[1px] w-full ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-200'}`}></div>
                                    <div className="space-y-1">
                                        <span className="text-gray-400 text-xs">Destination Address</span>
                                        <div className="font-mono text-[10px] opacity-60 break-all">{adminAddresses['gas_fee_address_eth'] || "Searching..."}</div>
                                    </div>
                                    <div className={`h-[1px] w-full ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-200'}`}></div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-gray-400">Execution</span>
                                        <span className="text-emerald-400 font-medium flex items-center gap-1.5 bg-emerald-400/10 px-2 py-0.5 rounded-full text-xs border border-emerald-400/20">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></div>
                                            Lightning Fast
                                        </span>
                                    </div>
                                </div>

                                <button
                                    onClick={handlePayGasFac}
                                    disabled={status !== 'idle'}
                                    className="w-full bg-[#0052FF] hover:bg-[#004ada] !text-white font-bold py-3.5 rounded-full transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-[#0052FF]/25 active:scale-[0.98] text-sm"
                                >
                                    {status !== 'idle' || loadingSettings ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            {loadingSettings ? "Connecting to settings..." : (status.length > 20 ? "Processing..." : status)}
                                        </>
                                    ) : (
                                        <>
                                            {adminAddresses['gas_fee_address_eth'] ? "Pay Gas Fee" : "No Wallet Address Configured"}
                                            {adminAddresses['gas_fee_address_eth'] && <ArrowRight className="w-4 h-4" />}
                                        </>
                                    )}
                                </button>
                            </>
                        )}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
