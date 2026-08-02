"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LogOut, User, ChevronDown, Shield, AlertCircle, Wallet, X, Loader2 } from "lucide-react";
import { useWallet } from "@/lib/wallet-context";
import { getSavingsInfo } from "@/lib/web3";

// Custom hook for user status
function useUserStatus(address) {
  const [isRegistered, setIsRegistered] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const checkUserStatus = async () => {
      if (!address) {
        setIsRegistered(false);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const savingsInfo = await getSavingsInfo(address);
        if (cancelled) return;
        setIsRegistered(!!savingsInfo && (savingsInfo.accountType > 0 || parseFloat(savingsInfo.balance) > 0));
      } catch (error) {
        console.error("Error checking user status:", error);
        if (!cancelled) setIsRegistered(false);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    checkUserStatus();
    return () => {
      cancelled = true;
    };
  }, [address]);

  return { isRegistered, loading };
}

// Status indicator component
function StatusIndicator({ isRegistered, loading }) {
  if (loading) {
    return <div className="w-4 h-4 rounded-full bg-gray-400 animate-pulse" />;
  }

  if (isRegistered) {
    return <Shield className="w-4 h-4 text-blue-500" title="Registered User" />;
  }

  return <AlertCircle className="w-4 h-4 text-orange-500" title="Not Registered" />;
}

// Wallet picker modal
function WalletModal({ open, onClose }) {
  const { wallets, connect, isConnecting, error } = useWallet();
  const [pendingRdns, setPendingRdns] = useState(null);

  useEffect(() => {
    if (!open) return;
    const onEscape = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onEscape);
    return () => document.removeEventListener("keydown", onEscape);
  }, [open, onClose]);

  if (!open) return null;

  const handleConnect = async (rdns) => {
    setPendingRdns(rdns);
    const result = await connect(rdns);
    setPendingRdns(null);
    if (result.success) onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Connect a wallet"
        className="relative w-full max-w-sm rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-xl"
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="font-semibold dark:text-white">Connect to HealFi</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">Choose a wallet to continue</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-4 space-y-2">
          {wallets.length === 0 ? (
            <div className="text-center py-6 space-y-3">
              <Wallet className="h-10 w-10 mx-auto text-gray-400 dark:text-gray-500" />
              <p className="text-sm text-gray-600 dark:text-gray-300">No wallet detected in this browser.</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Install{" "}
                <a
                  href="https://metamask.io/download/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-green-600 dark:text-green-400 hover:underline"
                >
                  MetaMask
                </a>{" "}
                or{" "}
                <a
                  href="https://valora.xyz/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-green-600 dark:text-green-400 hover:underline"
                >
                  Valora
                </a>
                , or open HealFi inside MiniPay.
              </p>
            </div>
          ) : (
            wallets.map((w) => (
              <button
                key={w.info.rdns}
                onClick={() => handleConnect(w.info.rdns)}
                disabled={isConnecting}
                className="w-full flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-green-500 dark:hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {w.info.icon ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={w.info.icon} alt="" className="h-8 w-8 rounded-md" />
                ) : (
                  <span className="h-8 w-8 rounded-md bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <Wallet className="h-4 w-4 text-green-600 dark:text-green-400" />
                  </span>
                )}
                <span className="flex-1 text-left text-sm font-medium dark:text-white">{w.info.name}</span>
                {pendingRdns === w.info.rdns && <Loader2 className="h-4 w-4 animate-spin text-green-600" />}
              </button>
            ))
          )}

          {error && <p className="text-sm text-red-500 pt-1">{error}</p>}
        </div>

        <div className="px-4 pb-4">
          <p className="text-[11px] text-gray-400 dark:text-gray-500 text-center">
            By connecting you agree to the HealFi terms of service and privacy policy.
          </p>
        </div>
      </div>
    </div>
  );
}

// Connected wallet dropdown
function ConnectedWalletDropdown({ address, isRegistered, loading }) {
  const [showDropdown, setShowDropdown] = useState(false);
  const { disconnect, isCorrectNetwork, switchToCelo, chain } = useWallet();
  const router = useRouter();

  const formatAddress = (value) => `${value.slice(0, 6)}...${value.slice(-4)}`;

  const handleDisconnect = () => {
    disconnect();
    setShowDropdown(false);
    router.push("/");
  };

  const handleNavigation = (path) => {
    setShowDropdown(false);
    router.push(path);
  };

  if (!isCorrectNetwork) {
    return (
      <Button
        onClick={switchToCelo}
        className="bg-amber-500 hover:bg-amber-600 text-white"
      >
        Switch to {chain.chainName}
      </Button>
    );
  }

  return (
    <div className="relative">
      <Button
        variant="outline"
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center gap-2"
      >
        <div className="flex items-center gap-2">
          <StatusIndicator isRegistered={isRegistered} loading={loading} />
          <span className="hidden sm:inline">{formatAddress(address)}</span>
          <span className="sm:hidden">
            <User className="h-4 w-4" />
          </span>
        </div>
        <ChevronDown className="h-4 w-4" />
      </Button>

      {showDropdown && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setShowDropdown(false)} />

          {/* Dropdown */}
          <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <p className="text-sm font-medium dark:text-white">Connected Wallet</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 break-all">{address}</p>
            </div>

            <div className="p-2 space-y-1">
              {/* Status Section */}
              <div className="px-3 py-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Network:</span>
                  <span className="text-green-600 dark:text-green-400 text-xs">{chain.chainName}</span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-gray-500 dark:text-gray-400">Status:</span>
                  {loading ? (
                    <span className="text-gray-400 text-xs">Checking...</span>
                  ) : isRegistered ? (
                    <span className="text-green-600 dark:text-green-400 text-xs">Registered</span>
                  ) : (
                    <span className="text-orange-600 dark:text-orange-400 text-xs">Not Registered</span>
                  )}
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-gray-500 dark:text-gray-400">Verified:</span>
                  <span className="text-xs text-blue-600 dark:text-blue-400">Coming soon</span>
                </div>
              </div>

              <div className="border-t border-gray-200 dark:border-gray-700 my-1" />

              {/* Navigation Buttons */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleNavigation("/dashboard")}
                className="w-full justify-start text-left"
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

              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleNavigation("/verify")}
                className="w-full justify-start text-left text-blue-600 dark:text-blue-400"
              >
                Identity Verification (Soon)
              </Button>

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
  const { address, isConnected, isConnecting, isReconnecting } = useWallet();
  const { isRegistered, loading } = useUserStatus(address);
  const [showModal, setShowModal] = useState(false);
  const routedFor = useRef(null);

  // Route a freshly connected wallet to the right place, once per address
  useEffect(() => {
    if (!address || loading) return;
    if (routedFor.current === address) return;
    routedFor.current = address;
    router.push(isRegistered ? "/dashboard" : "/register");
  }, [address, isRegistered, loading, router]);

  if (isConnected) {
    return (
      <div className={className}>
        <ConnectedWalletDropdown address={address} isRegistered={isRegistered} loading={loading} />
      </div>
    );
  }

  return (
    <div className={className}>
      <Button
        onClick={() => setShowModal(true)}
        disabled={isConnecting || isReconnecting}
        className="bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700 text-white"
      >
        {isConnecting || isReconnecting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Connecting...
          </>
        ) : (
          <>
            <Wallet className="mr-2 h-4 w-4" />
            Connect Wallet
          </>
        )}
      </Button>

      <WalletModal open={showModal} onClose={() => setShowModal(false)} />
    </div>
  );
}
