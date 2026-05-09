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

                        <div className="flex flex-col items-center text-center space-y-8">
                            {/* Icon Section */}
                            <motion.div
                                initial={{ scale: 0.5, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: 0.2, type: "spring" }}
                                className="mt-4"
                            >
                                {customLogo ? (
                                    <div className="w-24 h-24 flex items-center justify-center">
                                        {customLogo}
                                    </div>
                                ) : success ? (
                                    <div className="relative w-24 h-24">
                                        <div className="absolute inset-0 bg-emerald-500 blur-3xl opacity-20 animate-pulse" />
                                        <div className="w-24 h-24 bg-emerald-500/10 rounded-full flex items-center justify-center border-2 border-emerald-500/20 relative">
                                            <CheckCircle2 className="w-12 h-12 text-emerald-500" />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="relative w-24 h-24">
                                        <div className="absolute inset-0 bg-red-500 blur-3xl opacity-20 animate-pulse" />
                                        <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center border-2 border-red-500/20 relative">
                                            <AlertCircle className="w-12 h-12 text-red-500" />
                                        </div>
                                    </div>
                                )}
                            </motion.div>

                            {/* Text Content */}
                            <div className="space-y-3">
                                {title && (
                                    <motion.h2
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.3 }}
                                        className="text-2xl font-bold tracking-tight"
                                    >
                                        {title}
                                    </motion.h2>
                                )}
                                <motion.p
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.4 }}
                                    className="text-gray-500 font-medium leading-relaxed px-4"
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
                                    className={`w-full py-6 rounded-[2rem] font-bold text-lg transition-all shadow-xl active:scale-[0.98] ${
                                        success
                                        ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/20 text-white'
                                        : theme === 'dark' ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
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