"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LogOut, User, ChevronDown, Shield, CheckCircle, AlertCircle, Wallet } from "lucide-react";
import { 
  ConnectButton, 
  useActiveAccount, 
  useActiveWallet,
  useDisconnect 
} from "thirdweb/react";
import { createThirdwebClient } from "thirdweb";
import { inAppWallet, createWallet } from "thirdweb/wallets";
import { celoAlfajores, getSavingsInfo } from "@/lib/web3";

// Configure ThirdWeb client
const client = createThirdwebClient({
  clientId: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID,
});

// Configure supported wallets
const wallets = [
  inAppWallet({
    auth: {
      options: [
        "google",
        "discord",
        "telegram",
        "email",
        "x",
        "passkey",
        "phone",
        "facebook",
      ],
    },
  }),
  createWallet("io.metamask"),
  createWallet("com.coinbase.wallet"),
  createWallet("me.rainbow"),
  createWallet("io.rabby"),
  createWallet("io.zerion.wallet"),
];

// Custom hook for user status
function useUserStatus(address, account) {
  const [isRegistered, setIsRegistered] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUserStatus = async () => {
      if (!address || !account) {
        setIsRegistered(false);
        setIsVerified(false);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // Check if user is registered
        const savingsInfo = await getSavingsInfo(address);
        setIsRegistered(!!savingsInfo);

        // Check if user is verified
        const verificationStatus = localStorage.getItem(`verification_${address}`);
        setIsVerified(verificationStatus === "true");
      } catch (error) {
        console.error("Error checking user status:", error);
        setIsRegistered(false);
        setIsVerified(false);
      } finally {
        setLoading(false);
      }
    };

    checkUserStatus();
  }, [address, account]);

  return { isRegistered, isVerified, loading };
}

// Status indicator component
function StatusIndicator({ isRegistered, isVerified, loading }) {
  if (loading) {
    return <div className="w-4 h-4 rounded-full bg-gray-400 animate-pulse" />;
  }

  if (isVerified) {
    return <CheckCircle className="w-4 h-4 text-green-500" title="Verified User" />;
  }

  if (isRegistered) {
    return <Shield className="w-4 h-4 text-blue-500" title="Registered User" />;
  }

  return <AlertCircle className="w-4 h-4 text-orange-500" title="Not Registered" />;
}

// Connected wallet dropdown
function ConnectedWalletDropdown({ account, isRegistered, isVerified, loading }) {
  const [showDropdown, setShowDropdown] = useState(false);
  const { disconnect } = useDisconnect();
  const router = useRouter();

  const formatAddress = (address) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const handleDisconnect = async () => {
    try {
      disconnect();
      setShowDropdown(false);
      router.push("/");
    } catch (error) {
      console.error("Error disconnecting:", error);
    }
  };

  const handleNavigation = (path) => {
    setShowDropdown(false);
    router.push(path);
  };

  return (
    <div className="relative">
      <Button
        variant="outline"
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center gap-2"
        disabled={loading}
      >
        <div className="flex items-center gap-2">
          <StatusIndicator isRegistered={isRegistered} isVerified={isVerified} loading={loading} />
          <span className="hidden sm:inline">{formatAddress(account.address)}</span>
          <span className="sm:hidden">
            <User className="h-4 w-4" />
          </span>
        </div>
        <ChevronDown className="h-4 w-4" />
      </Button>

      {showDropdown && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowDropdown(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <p className="text-sm font-medium dark:text-white">Connected Wallet</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 break-all">
                {account.address}
              </p>
            </div>
            
            <div className="p-2 space-y-1">
              {/* Status Section */}
              <div className="px-3 py-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Status:</span>
                  <div className="flex items-center gap-1">
                    {loading ? (
                      <span className="text-gray-400 text-xs">Checking...</span>
                    ) : isRegistered ? (
                      <span className="text-green-600 dark:text-green-400 text-xs">Registered</span>
                    ) : (
                      <span className="text-orange-600 dark:text-orange-400 text-xs">Not Registered</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-gray-500 dark:text-gray-400">Verified:</span>
                  <span className={`text-xs ${
                    loading ? 'text-gray-400' : 
                    isVerified ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'
                  }`}>
                    {loading ? 'Checking...' : isVerified ? 'Yes' : 'No'}
                  </span>
                </div>
              </div>
              
              <div className="border-t border-gray-200 dark:border-gray-700 my-1" />
              
              {/* Navigation Buttons */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleNavigation("/dashboard")}
                className="w-full justify-start text-left"
                disabled={loading}
              >
                Dashboard
              </Button>
              
              {!loading && !isRegistered && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleNavigation("/register")}
                  className="w-full justify-start text-left text-orange-600 dark:text-orange-400"
                >
                  Complete Registration
                </Button>
              )}
              
              {!loading && !isVerified && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleNavigation("/verify")}
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
        </>
      )}
    </div>
  );
}

// Main component
export default function WalletConnectButton({ className = "" }) {
  const router = useRouter();
  const account = useActiveAccount();
  const wallet = useActiveWallet();
  const { isRegistered, isVerified, loading } = useUserStatus(account?.address, account);

  // Handle connection state changes
  useEffect(() => {
    if (account?.address && !loading && wallet) {
      // Auto-navigate based on registration status
      if (!isRegistered) {
        // Small delay to ensure the user sees the connection
        setTimeout(() => router.push("/register"), 1000);
      } else {
        setTimeout(() => router.push("/dashboard"), 1000);
      }
    }
  }, [account?.address, isRegistered, loading, wallet, router]);

  // If wallet is connected, show the dropdown
  if (account) {
    return (
      <ConnectedWalletDropdown
        account={account}
        isRegistered={isRegistered}
        isVerified={isVerified}
        loading={loading}
      />
    );
  }

  // If no wallet connected, show ThirdWeb connect button
  return (
    <div className={className}>
      <ConnectButton
        client={client}
        wallets={wallets}
        chain={celoAlfajores}
        connectModal={{
          size: "compact",
          title: "Connect to HealFi",
          titleIcon: "/healfi-logo.png", // Add your logo
          welcomeScreen: {
            title: "Welcome to HealFi",
            subtitle: "Connect your wallet to start saving for healthcare",
            img: {
              src: "/healfi-banner.png", // Add your banner image
              width: 300,
              height: 200,
            },
          },
          termsOfServiceUrl: "/terms-of-service",
          privacyPolicyUrl: "/privacy-policy",
        }}
        connectButton={{
          label: "Connect Wallet",
          style: {
            backgroundColor: "#10b981",
            color: "white",
            border: "none",
            borderRadius: "6px",
            padding: "8px 16px",
            fontSize: "14px",
            fontWeight: "500",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          },
        }}
        switchButton={{
          label: "Switch Network",
          style: {
            backgroundColor: "#f59e0b",
            color: "white",
            border: "none",
            borderRadius: "6px",
            padding: "8px 16px",
            fontSize: "14px",
            fontWeight: "500",
            cursor: "pointer",
          },
        }}
        detailsButton={{
          style: {
            backgroundColor: "#6b7280",
            color: "white",
            border: "none",
            borderRadius: "6px",
            padding: "8px 16px",
            fontSize: "14px",
            fontWeight: "500",
            cursor: "pointer",
          },
        }}
        theme="light" // or "dark" based on your app theme
        auth={{
          loginOptional: false,
        }}
      />
    </div>
  );
}