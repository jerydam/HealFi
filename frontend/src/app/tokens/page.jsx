"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Heart, ArrowRight, CheckCircle, RefreshCw, Repeat } from "lucide-react"
import { connectWallet, getHSTBalance } from "@/lib/web3"

export default function TokensPage() {
  const [walletAddress, setWalletAddress] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [hstBalance, setHstBalance] = useState("0")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  useEffect(() => {
    const initWallet = async () => {
      try {
        const result = await connectWallet()
        if (result.success) {
          setWalletAddress(result.address)
          loadUserData(result.address)
        } else {
          setIsLoading(false)
          setError("Please connect your wallet")
        }
      } catch (error) {
        console.error("Error initializing wallet:", error)
        setIsLoading(false)
        setError("Error connecting wallet")
      }
    }

    initWallet()
  }, [])

  const loadUserData = async (address) => {
    setIsLoading(true)
    try {
      const balance = await getHSTBalance(address)
      setHstBalance(balance)
    } catch (error) {
      console.error("Error loading token data:", error)
      setError("Error loading token data")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSwapForUSDT = async () => {
    setError("")
    setSuccess("")
    try {
      // Placeholder: Implement token swap logic with smart contract
      // Example: await swapHSTForUSDT(amount)
      setSuccess("Token swap initiated! (Placeholder)")
      await loadUserData(walletAddress)
    } catch (error) {
      setError("Failed to swap tokens. Please try again.")
      console.error(error)
    }
  }

  const handleUseAtClinic = async () => {
    setError("")
    setSuccess("")
    try {
      // Placeholder: Implement clinic usage logic with smart contract
      // Example: await useHSTAtClinic(amount, clinicAddress)
      setSuccess("Token usage at clinic initiated! (Placeholder)")
      await loadUserData(walletAddress)
    } catch (error) {
      setError("Failed to use tokens at clinic. Please try again.")
      console.error(error)
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 md:px-6 py-12 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-green-600 dark:text-green-400" />
          <p className="text-gray-500 dark:text-gray-400">Loading token information...</p>
        </div>
      </div>
    )
  }

  if (!walletAddress) {
    return (
      <div className="container mx-auto px-4 md:px-6 py-12">
        <div className="max-w-md mx-auto text-center">
          <Heart className="h-12 w-12 mx-auto mb-4 text-gray-400 dark:text-gray-500" />
          <h2 className="text-2xl font-bold mb-2 dark:text-white">Connect Your Wallet</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6">Please connect your wallet to view your tokens</p>
          <Button
            onClick={async () => {
              const result = await connectWallet()
              if (result.success) {
                setWalletAddress(result.address)
                loadUserData(result.address)
              }
            }}
            className="bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700"
          >
            Connect Wallet
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 md:px-6 py-6 sm:py-8">
      <div className="flex flex-col space-y-6 sm:space-y-8">
        <div className="flex flex-col space-y-2">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight dark:text-white">Your Tokens</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm sm:text-base">
            Manage your Health Support Tokens (HST)
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="dark:text-white">Token Balance</CardTitle>
              <CardDescription className="dark:text-gray-400">
                Your Health Support Tokens for healthcare services
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-2">
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Current Balance</span>
                  <span className="text-2xl sm:text-3xl font-bold dark:text-white">
                    {Number.parseFloat(hstBalance).toFixed(2)} HST
                  </span>
                </div>
                <div className="flex items-center text-sm text-red-600 dark:text-red-400">
                  <Heart className="mr-1 h-4 w-4" />
                  <span>Eligible for healthcare discounts</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-lg bg-gray-50 dark:bg-gray-800 p-3 sm:p-4">
                  <div className="flex items-center space-x-2">
                    <RefreshCw className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500 dark:text-gray-400" />
                    <span className="text-sm font-medium dark:text-gray-300">Earn More Tokens</span>
                  </div>
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    Save regularly or repay loans on time to earn HST
                  </p>
                </div>
                <div className="rounded-lg bg-gray-50 dark:bg-gray-800 p-3 sm:p-4">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500 dark:text-gray-400" />
                    <span className="text-sm font-medium dark:text-gray-300">Token Benefits</span>
                  </div>
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    Use at partner clinics or swap for USDT
                  </p>
                </div>
              </div>

              <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 p-3 sm:p-4 text-sm text-blue-800 dark:text-blue-300">
                <div className="flex items-start">
                  <CheckCircle className="mr-2 h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                  <p>
                    HST tokens can be used for discounts at partner healthcare providers or swapped for USDT to cover other expenses.
                  </p>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col sm:flex-row gap-4">
              <Button
                onClick={handleUseAtClinic}
                className="w-full sm:w-auto bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700 text-sm sm:text-base"
              >
                Use at Clinic
              </Button>
              <Button
                onClick={handleSwapForUSDT}
                variant="outline"
                className="w-full sm:w-auto text-sm sm:text-base dark:border-gray-700 dark:text-gray-200"
              >
                <Repeat className="mr-2 h-3 w-3 sm:h-4 sm:w-4" /> Swap for USDT
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="dark:text-white">Quick Actions</CardTitle>
              <CardDescription className="dark:text-gray-400">Manage your tokens</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                onClick={handleUseAtClinic}
                className="w-full bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700 text-sm sm:text-base"
              >
                <Heart className="mr-2 h-3 w-3 sm:h-4 sm:w-4" /> Use Tokens
              </Button>
              <Button
                onClick={handleSwapForUSDT}
                variant="outline"
                className="w-full text-sm sm:text-base dark:border-gray-700 dark:text-gray-200"
              >
                <Repeat className="mr-2 h-3 w-3 sm:h-4 sm:w-4" /> Swap Tokens
              </Button>
              <div className="rounded-lg bg-gray-50 dark:bg-gray-800 p-3 sm:p-4">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium dark:text-gray-300">Token Value</span>
                </div>
                <p className="mt-2 text-xl sm:text-2xl font-bold dark:text-white">1 HST ≈ 0.1 USDT</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Estimated value based on current rates</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="dark:text-white">Token History</CardTitle>
            <CardDescription className="dark:text-gray-400">Your recent token transactions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-gray-500 dark:text-gray-400 text-center">
                Token transaction history not implemented yet
              </p>
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full dark:border-gray-700 dark:text-gray-200">
              View All Transactions
            </Button>
          </CardFooter>
        </Card>
      </div>
      {error && <p className="text-red-500 text-sm mt-4 text-center">{error}</p>}
      {success && <p className="text-green-500 text-sm mt-4 text-center">{success}</p>}
    </div>
  )
}