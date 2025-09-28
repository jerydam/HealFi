// components/ClientLayout.js
"use client";

import { ThemeProvider } from "@/components/ui/theme-provider";
import { ThirdwebProvider } from "thirdweb/react"; // Import directly from thirdweb
import Navbar from "@/components/navbar";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function ClientLayout({ children }) {
  return (
    <ThirdwebProvider>
      <ThemeProvider 
        defaultTheme="light" 
        attribute="class"
        enableSystem={true}
        storageKey="healfi-theme"
      >
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
    </ThirdwebProvider>
  );
}