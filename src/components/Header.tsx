"use client";

import Link from "next/link";
import { useState } from "react";

export default function Header() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    return (
        <header className="fixed top-0 left-0 right-0 z-50 bg-[#0a0b0d]/80 backdrop-blur-md border-b border-white/5">
            <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                {/* Logo */}
                <Link href="/" className="flex items-center">
                    <img
                        src="/favicon.png"
                        alt="Trust Wallet"
                        className="h-8 md:h-10 w-auto object-contain"
                    />
                </Link>

                {/* Desktop Nav */}
                <nav className="hidden md:flex items-center gap-8">
                    {['Explore', 'Trade', 'Earn', 'Learn'].map((item) => (
                        <Link
                            key={item}
                            href="#"
                            className="text-sm font-medium text-gray-400 hover:text-white transition-colors"
                        >
                            {item}
                        </Link>
                    ))}
                </nav>

                {/* Actions */}
                <div className="flex items-center gap-4">
                    <button className="hidden md:block px-4 py-2 text-sm font-bold text-white hover:text-[#0052FF] transition-colors">
                        Sign In
                    </button>
                    <button className="bg-[#0052FF] hover:bg-[#004ada] text-white px-5 py-2 rounded-full text-sm font-bold transition-all shadow-lg shadow-blue-900/20">
                        Get Started
                    </button>
                </div>
            </div>
        </header>
    );
}
