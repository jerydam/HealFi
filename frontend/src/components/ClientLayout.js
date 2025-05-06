// components/ClientLayout.tsx
"use client";

import { ThemeProvider } from "@/components/ui/theme-provider";
import { Web3Provider } from "@/lib/web3";
import Navbar from "@/components/navbar";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function ClientLayout({ children }) {
  return (
    <Web3Provider>
      <ThemeProvider defaultTheme="light" attribute="class">
        <div className="flex flex-col min-h-screen">
          <Navbar />
          <main className="flex-1 bg-background">{children}</main>
        </div>
        <ToastContainer
          position="top-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
        />
      </ThemeProvider>
    </Web3Provider>
  );
}