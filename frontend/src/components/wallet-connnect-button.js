"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Wallet, LogOut, User, ChevronDown } from "lucide-react";
import { connectWallet, getSavingsInfo } from "@/lib/web3";

export default function WalletConnectButton({ className = "" }) {
  const router = useRouter();
  const [walletAddress, setWalletAddress] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    // Check if wallet is already connected
    const checkWalletConnection = async () => {
      try {
        if (typeof window !== "undefined" && window.ethereum) {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts.length > 0) {
            setWalletAddress(accounts[0]);
            await checkUserStatus(accounts[0]);
          }
        }
      } catch (error) {
        console.error("Error checking wallet connection:", error);
      }
    };

    checkWalletConnection();

    // Listen for account changes
    if (typeof window !== "undefined" && window.ethereum) {
      const handleAccountsChanged = (accounts) => {
        if (accounts.length === 0) {
          setWalletAddress("");
          setIsRegistered(false);
          setIsVerified(false);
        } else {
          setWalletAddress(accounts[0]);
          checkUserStatus(accounts[0]);
        }
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      };
    }
  }, []);

  const checkUserStatus = async (address) => {
    try {
      // Check if user is registered
      const savingsInfo = await getSavingsInfo(address);
      setIsRegistered(!!savingsInfo);

      // Check if user is verified
      const verificationStatus = localStorage.getItem(`verification_${address}`);
      setIsVerified(verificationStatus === "true");
    } catch (error) {
      console.error("Error checking user status:", error);
    }
  };

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      const result = await connectWallet();
      if (result.success) {
        setWalletAddress(result.address);
        await checkUserStatus(result.address);
        
        // Navigate based on user status
        const savingsInfo = await getSavingsInfo(result.address);
        if (savingsInfo) {
          router.push("/dashboard");
        } else {
          router.push("/register");
        }
      } else {
        alert("Failed to connect wallet: " + (result.error || "Please try again."));
      }
    } catch (error) {
      console.error("Error connecting wallet:", error);
      alert("Error connecting wallet. Please make sure you have MetaMask installed.");
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    setWalletAddress("");
    setIsRegistered(false);
    setIsVerified(false);
    setShowDropdown(false);
    router.push("/");
  };

  const formatAddress = (address) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (walletAddress) {
    return (
      <div className="relative">
        <Button
          variant="outline"
          onClick={() => setShowDropdown(!showDropdown)}
          className={`flex items-center gap-2 ${className}`}
        >
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isVerified ? 'bg-green-500' : 'bg-orange-500'}`} />
            <span className="hidden sm:inline">{formatAddress(walletAddress)}</span>
            <span className="sm:hidden">
              <User className="h-4 w-4" />
            </span>
          </div>
          <ChevronDown className="h-4 w-4" />
        </Button>

        {showDropdown && (
          <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <p className="text-sm font-medium dark:text-white">Connected Wallet</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 break-all">{walletAddress}</p>
            </div>
            
            <div className="p-2 space-y-1">
              <div className="px-3 py-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Status:</span>
                  <div className="flex items-center gap-1">
                    {isRegistered ? (
                      <span className="text-green-600 dark:text-green-400 text-xs">Registered</span>
                    ) : (
                      <span className="text-orange-600 dark:text-orange-400 text-xs">Not Registered</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-gray-500 dark:text-gray-400">Verified:</span>
                  <span className={`text-xs ${isVerified ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'}`}>
                    {isVerified ? 'Yes' : 'No'}
                  </span>
                </div>
              </div>
              
              <div className="border-t border-gray-200 dark:border-gray-700 my-1" />
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowDropdown(false);
                  router.push("/dashboard");
                }}
                className="w-full justify-start text-left"
              >
                Dashboard
              </Button>
              
              {!isRegistered && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowDropdown(false);
                    router.push("/register");
                  }}
                  className="w-full justify-start text-left text-orange-600 dark:text-orange-400"
                >
                  Complete Registration
                </Button>
              )}
              
              {!isVerified && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowDropdown(false);
                    router.push("/verify");
                  }}
                  className="w-full justify-start text-left text-blue-600 dark:text-blue-400"
                >
                  Verify Identity
                </Button>
              )}
              
              <div className="border-t border-gray-200 dark:border-gray-700 my-1" />
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDisconnect}
                className="w-full justify-start text-left text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Disconnect
              </Button>
            </div>
          </div>
        )}

        {/* Click outside to close dropdown */}
        {showDropdown && (
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowDropdown(false)}
          />
        )}
      </div>
    );
  }

  return (
    <Button
      onClick={handleConnect}
      disabled={isConnecting}
      className={`bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700 ${className}`}
    >
      {isConnecting ? (
        <>
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
          Connecting...
        </>
      ) : (
        <>
          <Wallet className="mr-2 h-4 w-4" />
          <span className="hidden sm:inline">Connect Wallet</span>
          <span className="sm:hidden">Connect</span>
        </>
      )}
    </Button>
  );
}