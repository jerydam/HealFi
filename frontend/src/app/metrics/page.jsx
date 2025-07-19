"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Wallet, CreditCard, Users, DollarSign } from "lucide-react"
import { getPlatformMetrics, connectWallet } from "@/lib/web3"

export default function MetricsPage() {
  const [walletAddress, setWalletAddress] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [metrics, setMetrics] = useState({
    totalSavings: "0",
    totalLoans: "0",
    totalUsers: 0,
    contractBalance: "0",
  })
  const [error, setError] = useState("")

  useEffect(() => {
    const initWallet = async () => {
      try {
        const result = await connectWallet()
        if (result.success) {
          setWalletAddress(result.address)
          loadMetrics()
        } else {
          setError("Please connect your wallet")
          setIsLoading(false)
        }
      } catch (error) {
        console.error("Error initializing wallet:", error)
        setError("Error connecting wallet")
        setIsLoading(false)
      }
    }

    initWallet()
  }, [])

  const loadMetrics = async () => {
    setIsLoading(true)
    try {
      const platformMetrics = await getPlatformMetrics()
      setMetrics(platformMetrics)
    } catch (error) {
      setError("Error loading platform metrics")
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 md:px-6 py-12 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-green-600 dark:text-green-400" />
          <p className="text-gray-500 dark:text-gray-400">Loading platform metrics...</p>
        </div>
      </div>
    )
  }

  if (error || !walletAddress) {
    return (
      <div className="container mx-auto px-4 md:px-6 py-12 text-center">
        <h2 className="text-2xl font-bold mb-2 dark:text-white">Error</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-6">{error || "Please connect your wallet"}</p>
        <Button
          onClick={async () => {
            const result = await connectWallet()
            if (result.success) {
              setWalletAddress(result.address)
              loadMetrics()
            }
          }}
          className="bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700"
        >
          Connect Wallet
        </Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 md:px-6 py-6 sm:py-8">
      <div className="flex flex-col space-y-6 sm:space-y-8">
        <div className="flex flex-col space-y-2">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight dark:text-white">Platform Metrics</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm sm:text-base">
            Overview of HealFi's ecosystem performance
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Savings</CardTitle>
              <Wallet className="h-4 w-4 text-green-600 dark:text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold dark:text-white">
                {Number.parseFloat(metrics.totalSavings).toFixed(2)} USDT
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Across all users</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Loans</CardTitle>
              <CreditCard className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold dark:text-white">
                {Number.parseFloat(metrics.totalLoans).toFixed(2)} USDT
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Disbursed to users</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold dark:text-white">{metrics.totalUsers}</div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Registered members</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Contract Balance</CardTitle>
              <DollarSign className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold dark:text-white">
                {Number.parseFloat(metrics.contractBalance).toFixed(2)} USDT
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Available in contract</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="dark:text-white">About These Metrics</CardTitle>
            <CardDescription className="dark:text-gray-400">
              Real-time data from the HealFi smart contracts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-gray-500 dark:text-gray-400">
              These metrics reflect the total activity on the HealFi platform, including all user savings, loans
              disbursed, registered users, and the current USDT balance held in the savings contract. Data is fetched
              directly from the blockchain for transparency and accuracy.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}