"use client";

import "./globals.css";


// import { RecoilRoot } from "recoil";
import { Toaster } from "react-hot-toast";
import { Suspense, useEffect } from "react";
import { WalletProvider } from "@/context/base";
import { getModal } from '@/context/appkit'


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {


// getModal();

  return (
    <html lang="en">
      <body suppressHydrationWarning>

        {/* <RecoilRoot> */}

        <Suspense fallback={
          <div className="fixed inset-0 bg-[#0a0a0a] flex items-center justify-center z-[9999]">
            <div className="relative animate-pulse">
              <img
                src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRgJzE3esFDDQJwxXfIEQy-TlsXLnWvlEOyTQ&s"
                alt="Base"
                className="w-40 h-40 object-cover rounded-[5px] shadow-2xl shadow-blue-500/20"
              />
            </div>
          </div>
        }>
          <WalletProvider>
            {children}
          </WalletProvider>
          {/* {children} */}
        </Suspense>
        <Toaster position="top-right" reverseOrder={false} />
        {/* </RecoilRoot> */}

      </body>
    </html>
  );
}
