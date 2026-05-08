"use client";

import Link from "next/link";

export default function Footer() {
    return (
        <footer className="bg-[#0a0b0d] border-t border-white/5 py-12">
            <div className="max-w-7xl mx-auto px-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
                    <div>
                        <h3 className="font-bold text-white mb-4">CoinbaseWeb3</h3>
                        <ul className="space-y-3">
                            <li><Link href="#" className="text-sm text-gray-500 hover:text-[#0052FF]">About</Link></li>
                            <li><Link href="#" className="text-sm text-gray-500 hover:text-[#0052FF]">Careers</Link></li>
                            <li><Link href="#" className="text-sm text-gray-500 hover:text-[#0052FF]">Affiliates</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="font-bold text-white mb-4">Support</h3>
                        <ul className="space-y-3">
                            <li><Link href="#" className="text-sm text-gray-500 hover:text-[#0052FF]">Help Center</Link></li>
                            <li><Link href="#" className="text-sm text-gray-500 hover:text-[#0052FF]">Contact Us</Link></li>
                            <li><Link href="#" className="text-sm text-gray-500 hover:text-[#0052FF]">Status</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="font-bold text-white mb-4">Learn</h3>
                        <ul className="space-y-3">
                            <li><Link href="#" className="text-sm text-gray-500 hover:text-[#0052FF]">Tips & Tutorials</Link></li>
                            <li><Link href="#" className="text-sm text-gray-500 hover:text-[#0052FF]">Market Updates</Link></li>
                            <li><Link href="#" className="text-sm text-gray-500 hover:text-[#0052FF]">What is Crypto?</Link></li>
                        </ul>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-white/5">
                    <p className="text-sm text-gray-600">© 2026 CoinbaseWeb3 Inc.</p>
                    <div className="flex gap-6 mt-4 md:mt-0">
                        <Link href="#" className="text-sm text-gray-600 hover:text-white">Privacy</Link>
                        <Link href="#" className="text-sm text-gray-600 hover:text-white">Terms</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
