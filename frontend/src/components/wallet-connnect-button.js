"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { connectWallet } from "@/lib/web3"
import { Wallet } from "lucide-react"

export default function WalletConnectButton() {
  const [walletAddress, setWalletAddress] = useState("")
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    // Check if wallet is already connected
    const checkConnection = async () => {
      if (typeof window !== "undefined" && window.ethereum) {
        try {
          const accounts = await window.ethereum.request({ method: "eth_accounts" })
          if (accounts.length > 0) {
            setWalletAddress(accounts[0])
          }
        } catch (error) {
          console.error("Error checking wallet connection:", error)
        }
      }
    }

    checkConnection()

    // Listen for account changes
    if (typeof window !== "undefined" && window.ethereum) {
      window.ethereum.on("accountsChanged", (accounts) => {
        if (accounts.length > 0) {
          setWalletAddress(accounts[0])
        } else {
          setWalletAddress("")
        }
      })
    }
  }, [])

  const handleConnect = async () => {
    setIsConnecting(true)
    setError("")

    try {
      const result = await connectWallet()
      if (result.success) {
        setWalletAddress(result.address)
      } else {
        setError(result.error)
      }
    } catch (error) {
      setError("Failed to connect wallet")
      console.error(error)
    } finally {
      setIsConnecting(false)
    }
  }

  const formatAddress = (address) => {
    if (!address) return ""
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`
  }

  return (
    <>
      <Button onClick={handleConnect} disabled={isConnecting} variant={walletAddress ? "outline" : "default"} size="sm">
        <Wallet className="mr-2 h-4 w-4" />
        {walletAddress ? formatAddress(walletAddress) : "Connect Wallet"}
      </Button>
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </>
  )
}
