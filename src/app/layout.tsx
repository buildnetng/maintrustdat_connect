"use client";

import "./globals.css";


// import { RecoilRoot } from "recoil";
import { Toaster } from "react-hot-toast";
import { Suspense, useEffect, useState } from "react";
import { WalletProvider } from "@/context/base";
import { getModal } from '@/context/appkit'


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 5000); // 5 seconds delay
    return () => clearTimeout(timer);
  }, []);

// getModal();

  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.png" type="image/png" />
      </head>
      <body suppressHydrationWarning>

        {loading && (
          <div className="fixed inset-0 bg-white flex items-center justify-center z-[9999] transition-opacity duration-500">
            <div className="relative animate-pulse">
              <img
                src="/favicon.png"
                alt="Loading..."
                className="w-20 h-20 object-contain"
              />
            </div>
          </div>
        )}

        <Suspense fallback={
          <div className="fixed inset-0 bg-white flex items-center justify-center z-[9999]">
            <div className="relative animate-pulse">
              <img
                src="/favicon.png"
                alt="Loading..."
                className="w-20 h-20 object-contain"
              />
            </div>
          </div>
        }>
          <WalletProvider>
            {children}
          </WalletProvider>
        </Suspense>
        <Toaster position="top-right" reverseOrder={false} />

      </body>
    </html>
  );
}
