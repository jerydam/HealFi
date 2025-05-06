"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Wallet, CreditCard, Heart, ArrowUpRight, Plus, Clock, CheckCircle, Loader2, ExternalLink } from "lucide-react"
import { connectWallet, getSavingsInfo, getLoanInfo, getHSTBalance, getUserActivities } from "@/lib/web3"

export default function Dashboard() {
  const router = useRouter()
  const [walletAddress, setWalletAddress] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [savingsInfo, setSavingsInfo] = useState(null)
  const [loanInfo, setLoanInfo] = useState(null)
  const [hstBalance, setHstBalance] = useState("0")
  const [activities, setActivities] = useState([]) // New state for activities
  const [error, setError] = useState("")

  useEffect(() => {
    const initWallet = async () => {
      try {
        const result = await connectWallet()
        if (result.success) {
          setWalletAddress(result.address)
          await loadUserData(result.address)
        } else {
          setError("Please connect your wallet")
          setIsLoading(false)
        }
      } catch (err) {
        setError("Error connecting wallet")
        setIsLoading(false)
      }
    }

    initWallet()
  }, [])

  const loadUserData = async (address) => {
    setIsLoading(true)
    try {
      const savings = await getSavingsInfo(address)
      if (!savings) {
        router.push("/register")
        return
      }
      setSavingsInfo(savings)
      const loan = await getLoanInfo(address)
      setLoanInfo(loan)
      const balance = await getHSTBalance(address)
      setHstBalance(balance)
      const userActivities = await getUserActivities(address)
      setActivities(userActivities.slice(0, 5)) // Limit to 5 recent activities
    } catch (err) {
      setError("Error loading user data")
    } finally {
      setIsLoading(false)
    }
  }

  const calculateSavingsProgress = () => {
    if (!savingsInfo) return 0
    const goal = 10
    return Math.min(100, (Number.parseFloat(savingsInfo.balance) / goal) * 100)
  }

  const calculateLoanProgress = () => {
    if (!loanInfo || loanInfo.repaid || !loanInfo.dueDate) return 0
    const now = new Date()
    const dueDate = new Date(loanInfo.dueDate)
    const loanDuration = 30 * 24 * 60 * 60 * 1000 // 30 days
    const elapsed = now - (dueDate - loanDuration)
    return Math.min(100, (elapsed / loanDuration) * 100)
  }

  const formatDate = (timestamp) => {
    if (!timestamp) return "N/A"
    return new Date(timestamp).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getExplorerLink = (txHash) => {
    return `https://explorer.celo.org/mainnet/tx/${txHash}`
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 md:px-6 py-12 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-green-600 dark:text-green-400" />
          <p className="text-gray-500 dark:text-gray-400">Loading dashboard...</p>
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
              await loadUserData(result.address)
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
    <div className="flex flex-col min-h-screen">
      <main className="flex-1 py-6 sm:py-8">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex flex-col space-y-6 sm:space-y-8">
            <div className="flex flex-col space-y-2">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight dark:text-white">Dashboard</h1>
              <p className="text-gray-500 dark:text-gray-400 text-sm sm:text-base">
                Manage your healthcare savings and loans
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Your Savings</CardTitle>
                  <Wallet className="h-4 w-4 text-green-600 dark:text-green-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-xl sm:text-2xl font-bold dark:text-white">
                    {savingsInfo ? Number.parseFloat(savingsInfo.balance).toFixed(2) : "0.00"} USDT
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {savingsInfo?.hstEarned || 0} HST earned
                  </p>
                  <div className="mt-4">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="dark:text-gray-300">Savings Goal: 10 USDT</span>
                      <span className="dark:text-gray-300">{calculateSavingsProgress().toFixed(0)}%</span>
                    </div>
                    <Progress value={calculateSavingsProgress()} className="h-2" />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button
                    onClick={() => router.push("/savings#deposit-tab")}
                    className="w-full bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700 text-sm sm:text-base"
                  >
                    <Plus className="mr-2 h-3 w-3 sm:h-4 sm:w-4" /> Add Savings
                  </Button>
                </CardFooter>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Your Loans</CardTitle>
                  <CreditCard className="h-4 w-4 text-orange-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-xl sm:text-2xl font-bold">
                    {loanInfo && !loanInfo.repaid ? Number.parseFloat(loanInfo.amount).toFixed(2) : "0.00"} USDT
                  </div>
                  <p className="text-xs text-gray-500">
                    {loanInfo && !loanInfo.repaid && loanInfo.dueDate
                      ? `Due on ${new Date(loanInfo.dueDate).toLocaleDateString("en-US")}`
                      : "No active loan"}
                  </p>
                  {loanInfo && !loanInfo.repaid && (
                    <>
                      <div className="mt-4 flex items-center text-xs text-gray-500">
                        <Clock className="mr-1 h-3 w-3" />
                        <span>Repayment Progress</span>
                      </div>
                      <Progress value={calculateLoanProgress()} className="h-2 mt-1" />
                    </>
                  )}
                </CardContent>
                <CardFooter>
                  <Button
                    onClick={() => router.push("/loans#repay-tab")}
                    variant="outline"
                    className="w-full text-sm sm:text-base"
                    disabled={!loanInfo || loanInfo.repaid}
                  >
                    Repay Loan
                  </Button>
                </CardFooter>
              </Card>

              <Card className="sm:col-span-2 lg:col-span-1">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Your Tokens</CardTitle>
                  <Heart className="h-4 w-4 text-red-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-xl sm:text-2xl font-bold">{Number.parseFloat(hstBalance).toFixed(2)} HST</div>
                  <p className="text-xs text-gray-500">Health Support Tokens</p>
                  <div className="mt-4 text-xs text-gray-500">
                    <div className="flex items-center">
                      <CheckCircle className="mr-1 h-3 w-3 text-green-600" />
                      <span>Eligible for discounts</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button
                    onClick={() => router.push("/tokens")}
                    variant="outline"
                    className="w-full text-sm sm:text-base"
                  >
                    Use Tokens
                  </Button>
                </CardFooter>
              </Card>
            </div>

            <Tabs defaultValue="activity" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="activity" className="text-xs sm:text-sm">
                  Recent Activity
                </TabsTrigger>
                <TabsTrigger value="partners" className="text-xs sm:text-sm">
                  Healthcare Partners
                </TabsTrigger>
                <TabsTrigger value="settings" className="text-xs sm:text-sm">
                  Account Settings
                </TabsTrigger>
              </TabsList>
              <TabsContent value="activity" className="mt-4 sm:mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                    <CardDescription>Your latest transactions and updates</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {activities.length === 0 ? (
                        <p className="text-gray-500 dark:text-gray-400 text-center">
                          No activities found. Start by registering or making a deposit!
                        </p>
                      ) : (
                        <ul className="space-y-4">
                          {activities.map((activity, index) => (
                            <li
                              key={activity.txHash || index}
                              className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b dark:border-gray-700 pb-4 last:border-b-0"
                            >
                              <div className="flex items-center space-x-3">
                                {activity.type.includes("Register") ? (
                                  <CheckCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                ) : activity.type === "Deposit" ? (
                                  <Plus className="h-5 w-5 text-green-600 dark:text-green-400" />
                                ) : activity.type === "Withdraw" ? (
                                  <ArrowUpRight className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                                ) : activity.type.includes("Loan") ? (
                                  <CreditCard className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                                ) : (
                                  <Wallet className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                                )}
                                <div>
                                  <p className="font-medium dark:text-white">
                                    {activity.type.replace(/([A-Z])/g, " $1").trim()}
                                  </p>
                                  <p className="text-sm text-gray-500 dark:text-gray-400">
                                    {formatDate(activity.timestamp)}
                                  </p>
                                </div>
                              </div>
                              <div className="mt-2 sm:mt-0 sm:text-right">
                                <p className="font-medium dark:text-white">{activity.details}</p>
                                <a
                                  href={getExplorerLink(activity.txHash)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center"
                                >
                                  View on Explorer <ExternalLink className="ml-1 h-3 w-3" />
                                </a>
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button
                      variant="outline"
                      className="w-full dark:border-gray-700 dark:text-gray-200"
                      onClick={() => alert("View all activities not implemented yet")}
                    >
                      View All Activities
                    </Button>
                  </CardFooter>
                </Card>
              </TabsContent>
              <TabsContent value="partners" className="mt-4 sm:mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Healthcare Partners</CardTitle>
                    <CardDescription>Clinics and pharmacies that accept HealFi</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <p className="text-gray-500 dark:text-gray-400 text-center">
                        Partner data not implemented yet
                      </p>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button
                      onClick={() => router.push("/partners")}
                      variant="outline"
                      className="w-full"
                    >
                      View All Partners
                    </Button>
                  </CardFooter>
                </Card>
              </TabsContent>
              <TabsContent value="settings" className="mt-4 sm:mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Account Settings</CardTitle>
                    <CardDescription>Manage your account preferences</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b pb-4">
                        <div className="mb-2 sm:mb-0">
                          <p className="font-medium">Connected Wallet</p>
                          <p className="text-sm text-gray-500">{walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}</p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full sm:w-auto"
                          onClick={() => setWalletAddress("")} // Disconnect wallet
                        >
                          Disconnect
                        </Button>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b pb-4">
                        <div className="mb-2 sm:mb-0">
                          <p className="font-medium">Notifications</p>
                          <p className="text-sm text-gray-500">Receive alerts for important updates</p>
                        </div>
                        <Button variant="outline" size="sm" className="w-full sm:w-auto">
                          Configure
                        </Button>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                        <div className="mb-2 sm:mb-0">
                          <p className="font-medium">Language</p>
                          <p className="text-sm text-gray-500">Currently set to English</p>
                        </div>
                        <Button variant="outline" size="sm" className="w-full sm:w-auto">
                          Change
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
    </div>
  )
}