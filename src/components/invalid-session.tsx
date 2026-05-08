'use client';

import { motion } from 'framer-motion';
import { ShieldAlert, LogOut } from 'lucide-react';
import { Outfit } from 'next/font/google';

const outfit = Outfit({ subsets: ['latin'], weight: ['300', '400', '500', '600', '700'] });

export default function InvalidSession() {
    return (
        <div className={`min-h-screen bg-[#0a0b0d] flex items-center justify-center p-6 ${outfit.className}`}>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md bg-[#151515] border border-white/10 rounded-[2.5rem] p-8 text-center space-y-6 shadow-2xl"
            >
                <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto text-red-500">
                    <ShieldAlert className="w-10 h-10" />
                </div>

                <div className="space-y-2">
                    <h1 className="text-2xl font-bold text-white tracking-tight">Invalid Session</h1>
                    <p className="text-gray-400 text-sm leading-relaxed">
                        Security mismatch detected. Your session parameters do not match our secure records.
                        Please return to the merchant platform and try again.
                    </p>
                </div>

                <div className="pt-4">
                    <button
                        onClick={() => window.location.href = 'https://base.org'}
                        className="mx-auto w-auto px-10 bg-[#0052FF] hover:bg-[#004ada] !text-white font-bold py-2.5 rounded-xl text-xs transition-all flex items-center justify-center gap-2 shadow-lg"
                    >
                        <LogOut className="w-4 h-4" /> Return to Home 
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
