'use client';

import { X, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface StatusModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    message: string;
    success: boolean;
    actionLabel?: string;
    onAction?: () => void;
    customLogo?: React.ReactNode;
    theme?: 'dark' | 'light';
}

export default function StatusModal({
    isOpen,
    onClose,
    title,
    message,
    success,
    actionLabel,
    onAction,
    customLogo,
    theme = 'light'
}: StatusModalProps) {
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/80 backdrop-blur-md"
                        onClick={onClose}
                    />

                    {/* Modal Container */}
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className={`relative w-full max-w-sm border rounded-[2.5rem] p-8 shadow-2xl ${theme === 'dark' ? 'bg-[#000000] text-white border-white/10' : 'bg-white text-[#0a0b0d] border-transparent shadow-xl'
                            }`}
                    >

                        {/* Close Button */}
                        <button
                            onClick={onClose}
                            className={`absolute right-6 top-6 w-8 h-8 flex items-center justify-center rounded-full transition-colors ${theme === 'dark' ? 'bg-gray-800/50 text-gray-400 hover:text-white' : 'bg-gray-100 text-gray-500 hover:text-black'}`}
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="flex flex-col items-center text-center space-y-6">
                            {/* Icon Section */}
                            <motion.div
                                initial={{ scale: 0.5, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: 0.2, type: "spring" }}
                                className="mt-4"
                            >
                                {customLogo ? (
                                    <div className="w-20 h-20 flex items-center justify-center">
                                        {customLogo}
                                    </div>
                                ) : success ? (
                                    <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center border border-green-500/20">
                                        <CheckCircle2 className="w-10 h-10 text-green-500" />
                                    </div>
                                ) : (
                                    <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center border border-red-500/20">
                                        <AlertCircle className="w-10 h-10 text-red-500" />
                                    </div>
                                )}
                            </motion.div>

                            {/* Text Content */}
                            <div className="space-y-2">
                                {title && (
                                    <motion.h2
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.3 }}
                                        className="text-xl font-bold tracking-tight"
                                    >
                                        {title}
                                    </motion.h2>
                                )}
                                <motion.p
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.4 }}
                                    className="text-gray-400 text-sm leading-relaxed px-2"
                                >
                                    {message}
                                </motion.p>
                            </div>

                            {/* Action Button */}
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5 }}
                                className="w-full pt-4"
                            >
                                <button
                                    onClick={onAction || onClose}
                                    className={`w-full py-4 rounded-xl font-black uppercase tracking-widest transition-all active:scale-95 shadow-lg text-[11px] ${success
                                        ? 'bg-[#3375BB] hover:bg-[#004ada] shadow-[#3375BB]/20 text-white'
                                        : 'bg-white/10 hover:bg-white/20 text-white'
                                        }`}
                                >
                                    {actionLabel || (success ? 'Done' : 'Try Again')}
                                </button>
                            </motion.div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}