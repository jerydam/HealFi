"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { ethers } from "ethers";
import { ACTIVE_CHAIN } from "@/utils/config";

const STORAGE_KEY = "healfi.wallet.rdns";

// Celo chain params in the shape wallet_addEthereumChain expects
const chainIdHex = `0x${ACTIVE_CHAIN.id.toString(16)}`;
const addChainParams = {
  chainId: chainIdHex,
  chainName: ACTIVE_CHAIN.chainName,
  nativeCurrency: ACTIVE_CHAIN.nativeCurrency,
  rpcUrls: ACTIVE_CHAIN.rpcUrls,
  blockExplorerUrls: ACTIVE_CHAIN.blockExplorerUrls,
};

const WalletContext = createContext(null);

export function WalletProvider({ children }) {
  // Wallets announced through EIP-6963, keyed by rdns
  const [wallets, setWallets] = useState([]);
  const [address, setAddress] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(true);
  const [error, setError] = useState("");

  // The raw EIP-1193 provider of the connected wallet
  const providerRef = useRef(null);
  const [providerVersion, setProviderVersion] = useState(0);

  // --- Wallet discovery (EIP-6963, with a window.ethereum fallback) ---
  useEffect(() => {
    if (typeof window === "undefined") return;

    const onAnnounce = (event) => {
      const detail = event.detail;
      if (!detail?.info?.rdns) return;
      setWallets((current) =>
        current.some((w) => w.info.rdns === detail.info.rdns) ? current : [...current, detail]
      );
    };

    window.addEventListener("eip6963:announceProvider", onAnnounce);
    window.dispatchEvent(new Event("eip6963:requestProvider"));

    return () => window.removeEventListener("eip6963:announceProvider", onAnnounce);
  }, []);

  const availableWallets = useMemo(() => {
    if (wallets.length > 0) return wallets;
    // Legacy wallets that do not announce themselves (incl. MiniPay)
    if (typeof window !== "undefined" && window.ethereum) {
      return [
        {
          info: {
            rdns: "injected",
            name: window.ethereum.isMiniPay ? "MiniPay" : "Browser Wallet",
            icon: null,
          },
          provider: window.ethereum,
        },
      ];
    }
    return [];
  }, [wallets]);

  // --- Wire up an EIP-1193 provider's events ---
  const attachListeners = useCallback((eip1193) => {
    if (!eip1193?.on) return () => {};

    const onAccountsChanged = (accounts) => {
      if (!accounts || accounts.length === 0) {
        providerRef.current = null;
        setProviderVersion((v) => v + 1);
        setAddress(null);
        setChainId(null);
        if (typeof window !== "undefined") localStorage.removeItem(STORAGE_KEY);
      } else {
        setAddress(ethers.getAddress(accounts[0]));
      }
    };

    const onChainChanged = (nextChainId) => {
      setChainId(Number.parseInt(nextChainId, 16));
    };

    eip1193.on("accountsChanged", onAccountsChanged);
    eip1193.on("chainChanged", onChainChanged);

    return () => {
      eip1193.removeListener?.("accountsChanged", onAccountsChanged);
      eip1193.removeListener?.("chainChanged", onChainChanged);
    };
  }, []);

  const detachRef = useRef(() => {});

  const adopt = useCallback(
    async (eip1193, accounts) => {
      detachRef.current();
      providerRef.current = eip1193;
      setProviderVersion((v) => v + 1);
      detachRef.current = attachListeners(eip1193);

      setAddress(ethers.getAddress(accounts[0]));

      const currentChainId = await eip1193.request({ method: "eth_chainId" });
      setChainId(Number.parseInt(currentChainId, 16));
    },
    [attachListeners]
  );

  // --- Connect ---
  const connect = useCallback(
    async (rdns) => {
      setError("");

      const target =
        availableWallets.find((w) => w.info.rdns === rdns) || availableWallets[0];

      if (!target) {
        const message =
          "No wallet detected. Install a Celo-compatible wallet such as MetaMask or Valora, or open HealFi in MiniPay.";
        setError(message);
        return { success: false, error: message };
      }

      setIsConnecting(true);
      try {
        const accounts = await target.provider.request({ method: "eth_requestAccounts" });
        if (!accounts || accounts.length === 0) {
          throw new Error("No accounts returned by the wallet");
        }

        await adopt(target.provider, accounts);
        if (typeof window !== "undefined") {
          localStorage.setItem(STORAGE_KEY, target.info.rdns);
        }
        return { success: true, address: ethers.getAddress(accounts[0]) };
      } catch (err) {
        // 4001 is the standard "user rejected request" code
        const message =
          err?.code === 4001 ? "Connection request rejected" : err?.message || "Failed to connect wallet";
        setError(message);
        return { success: false, error: message };
      } finally {
        setIsConnecting(false);
      }
    },
    [availableWallets, adopt]
  );

  const disconnect = useCallback(() => {
    detachRef.current();
    detachRef.current = () => {};
    providerRef.current = null;
    setProviderVersion((v) => v + 1);
    setAddress(null);
    setChainId(null);
    setError("");
    if (typeof window !== "undefined") localStorage.removeItem(STORAGE_KEY);
  }, []);

  // --- Eager reconnect: previously connected wallet, or MiniPay ---
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (address) {
      setIsReconnecting(false);
      return;
    }

    let cancelled = false;

    const reconnect = async () => {
      const savedRdns = localStorage.getItem(STORAGE_KEY);
      const isMiniPay = !!window.ethereum?.isMiniPay;

      if (!savedRdns && !isMiniPay) {
        setIsReconnecting(false);
        return;
      }

      const target =
        availableWallets.find((w) => w.info.rdns === savedRdns) ||
        (isMiniPay ? availableWallets[0] : null);

      if (!target) {
        // Discovery may not have announced yet; stay in reconnecting state
        return;
      }

      try {
        // MiniPay injects an already-authorised account
        const method = isMiniPay && !savedRdns ? "eth_requestAccounts" : "eth_accounts";
        const accounts = await target.provider.request({ method });
        if (!cancelled && accounts && accounts.length > 0) {
          await adopt(target.provider, accounts);
        }
      } catch (err) {
        console.error("Wallet reconnect failed:", err);
      } finally {
        if (!cancelled) setIsReconnecting(false);
      }
    };

    reconnect();
    return () => {
      cancelled = true;
    };
  }, [availableWallets, address, adopt]);

  // Give discovery a moment before declaring "not connected"
  useEffect(() => {
    const timer = setTimeout(() => setIsReconnecting(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  // --- Network switching ---
  const switchToCelo = useCallback(async () => {
    const eip1193 = providerRef.current;
    if (!eip1193) return { success: false, error: "No wallet connected" };

    try {
      await eip1193.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: chainIdHex }],
      });
      return { success: true };
    } catch (switchError) {
      // 4902: chain not added to the wallet yet
      if (switchError?.code === 4902 || switchError?.data?.originalError?.code === 4902) {
        try {
          await eip1193.request({
            method: "wallet_addEthereumChain",
            params: [addChainParams],
          });
          return { success: true };
        } catch (addError) {
          const message = addError?.message || `Failed to add ${ACTIVE_CHAIN.chainName}`;
          setError(message);
          return { success: false, error: message };
        }
      }
      const message = switchError?.message || `Failed to switch to ${ACTIVE_CHAIN.chainName}`;
      setError(message);
      return { success: false, error: message };
    }
  }, []);

  // --- ethers plumbing ---
  const browserProvider = useMemo(() => {
    if (!providerRef.current) return null;
    return new ethers.BrowserProvider(providerRef.current, "any");
    // providerVersion changes whenever the underlying provider is swapped
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [providerVersion]);

  const getSigner = useCallback(async () => {
    if (!browserProvider) throw new Error("No wallet connected");
    return browserProvider.getSigner();
  }, [browserProvider]);

  const isCorrectNetwork = chainId === ACTIVE_CHAIN.id;

  const value = useMemo(
    () => ({
      address,
      chainId,
      isConnected: !!address,
      isCorrectNetwork,
      isConnecting,
      isReconnecting,
      error,
      wallets: availableWallets,
      connect,
      disconnect,
      switchToCelo,
      getSigner,
      provider: browserProvider,
      chain: ACTIVE_CHAIN,
    }),
    [
      address,
      chainId,
      isCorrectNetwork,
      isConnecting,
      isReconnecting,
      error,
      availableWallets,
      connect,
      disconnect,
      switchToCelo,
      getSigner,
      browserProvider,
    ]
  );

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
}
