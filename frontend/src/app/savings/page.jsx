"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowUp, ArrowDown, TrendingUp, Calendar, Info, Loader2, ExternalLink } from "lucide-react"
import { connectWallet, getSavingsInfo, deposit, withdraw, getUSDTBalance, getSavingsTransactions } from "@/lib/web3"

export default function SavingsPage() {
  const [walletAddress, setWalletAddress] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [savingsInfo, setSavingsInfo] = useState(null)
  const [usdtBalance, setUsdtBalance] = useState("0")
  const [depositAmount, setDepositAmount] = useState("")
  const [withdrawAmount, setWithdrawAmount] = useState("")
  const [isDepositing, setIsDepositing] = useState(false)
  const [isWithdrawing, setIsWithdrawing] = useState(false)
  const [transactions, setTransactions] = useState([]) // New state for transaction history
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
        }
      } catch (error) {
        console.error("Error initializing wallet:", error)
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
        window.location.href = "/register"
        return
      }
      setSavingsInfo(savings)
      const balance = await getUSDTBalance(address)
      setUsdtBalance(balance)
      // Fetch transaction history
      const txs = await getSavingsTransactions(address)
      setTransactions(txs.slice(0, 5)) // Limit to 5 most recent transactions
    } catch (error) {
      console.error("Error loading user data:", error)
      setError("Error loading data")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeposit = async () => {
    if (!depositAmount || Number.parseFloat(depositAmount) <= 0) {
      setError("Please enter a valid deposit amount")
      return
    }
    setIsDepositing(true)
    setError("")
    setSuccess("")
    try {
      const result = await deposit(depositAmount)
      if (result.success) {
        setSuccess("Deposit successful!")
        setDepositAmount("")
        await loadUserData(walletAddress)
      } else {
        setError(result.error)
      }
    } catch (error) {
      setError("Failed to deposit. Please try again.")
      console.error(error)
    } finally {
      setIsDepositing(false)
    }
  }

  const handleWithdraw = async () => {
    if (!withdrawAmount || Number.parseFloat(withdrawAmount) <= 0) {
      setError("Please enter a valid withdrawal amount")
      return
    }
    if (savingsInfo && Number.parseFloat(withdrawAmount) > Number.parseFloat(savingsInfo.balance)) {
      setError("Withdrawal amount exceeds your balance")
      return
    }
    setIsWithdrawing(true)
    setError("")
    setSuccess("")
    try {
      const result = await withdraw(withdrawAmount)
      if (result.success) {
        setSuccess("Withdrawal successful!")
        setWithdrawAmount("")
        await loadUserData(walletAddress)
      } else {
        setError(result.error)
      }
    } catch (error) {
      setError("Failed to withdraw. Please try again.")
      console.error(error)
    } finally {
      setIsWithdrawing(false)
    }
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

  const calculateProgress = () => {
    if (!savingsInfo) return 0
    const goal = 10
    return Math.min(100, Math.max(0, (Number.parseFloat(savingsInfo.balance) / goal) * 100))
  }

  const getAccountTypeName = (accountType) => {
    if (accountType === 0) return "Individual"
    if (accountType === 1) return "Family"
    return "Unknown"
  }

  const getPlanTypeName = (planType) => {
    if (planType === 0) return "Basic"
    if (planType === 1) return "Premium"
    return "Unknown"
  }

  const getExplorerLink = (txHash) => {
    // Assuming Celo blockchain; adjust for your network
    return `https://explorer.celo.org/mainnet/tx/${txHash}`
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 md:px-6 py-12 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-green-600 dark:text-green-400" />
          <p className="text-gray-500 dark:text-gray-400">Loading savings information...</p>
        </div>
      </div>
    )
  }

  if (!walletAddress) {
    return (
      <div className="container mx-auto px-4 md:px-6 py-12">
        <div className="max-w-md mx-auto text-center">
          <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-400 dark:text-gray-500" />
          <h2 className="text-2xl font-bold mb-2 dark:text-white">Connect Your Wallet</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6">Please connect your wallet to access savings features</p>
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

  if (!savingsInfo) {
    return (
      <div className="container mx-auto px-4 md:px-6 py-12">
        <div className="max-w-md mx-auto text-center">
          <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-400 dark:text-gray-500" />
          <h2 className="text-2xl font-bold mb-2 dark:text-white">No Savings Account Found</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            You need to register an individual or family account to start saving
          </p>
          <Button
            onClick={() => (window.location.href = "/register")}
            className="bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700"
          >
            Register Now
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 md:px-6 py-6 sm:py-8">
      <div className="flex flex-col space-y-6 sm:space-y-8">
        <div className="flex flex-col space-y-2">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight dark:text-white">Your Savings</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm sm:text-base">
            Manage your healthcare savings account
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="dark:text-white">Savings Overview</CardTitle>
              <CardDescription className="dark:text-gray-400">Your current savings and progress</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-2">
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Current Balance</span>
                  <span className="text-2xl sm:text-3xl font-bold dark:text-white">
                    {Number.parseFloat(savingsInfo.balance).toFixed(2)} USDT
                  </span>
                </div>
                <div className="flex items-center text-sm text-green-600 dark:text-green-400">
                  <TrendingUp className="mr-1 h-4 w-4" />
                  <span>
                    {getAccountTypeName(savingsInfo.accountType)} Account • {getPlanTypeName(savingsInfo.planType)} Plan
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="dark:text-gray-300">Savings Goal: 10 USDT</span>
                  <span className="dark:text-gray-300">{calculateProgress().toFixed(0)}% Complete</span>
                </div>
                <div className="h-2 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-600 dark:bg-green-500 rounded-full"
                    style={{ width: `${calculateProgress()}%` }}
                  ></div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-lg bg-gray-50 dark:bg-gray-800 p-3 sm:p-4">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500 dark:text-gray-400" />
                    <span className="text-sm font-medium dark:text-gray-300">Savings Streak</span>
                  </div>
                  <p className="mt-2 text-xl sm:text-2xl font-bold dark:text-white">{savingsInfo.streak} Weeks</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Last deposit: {formatDate(savingsInfo.lastDepositTime)}
                  </p>
                </div>
                <div className="rounded-lg bg-gray-50 dark:bg-gray-800 p-3 sm:p-4">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500 dark:text-gray-400" />
                    <span className="text-sm font-medium dark:text-gray-300">HST Earned</span>
                  </div>
                  <p className="mt-2 text-xl sm:text-2xl font-bold dark:text-white">{savingsInfo.hstEarned} HST</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Earn more by saving regularly</p>
                </div>
              </div>

              {savingsInfo.accountType === 1 && (
                <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 p-3 sm:p-4">
                  <div className="flex items-start">
                    <Info className="mr-2 h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                    <div>
                      <p className="font-medium dark:text-blue-300">Family Treasury</p>
                      <p className="text-sm text-blue-800 dark:text-blue-300">
                        Family ID: {savingsInfo.familyId} • Balance:{" "}
                        {Number.parseFloat(savingsInfo.familyTreasuryBalance).toFixed(2)} USDT
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="dark:text-white">Quick Actions</CardTitle>
              <CardDescription className="dark:text-gray-400">Manage your savings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                className="w-full bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700 text-sm sm:text-base"
                onClick={() => document.getElementById("deposit-tab").click()}
              >
                <ArrowUp className="mr-2 h-3 w-3 sm:h-4 sm:w-4" /> Add Savings
              </Button>
              <Button
                variant="outline"
                className="w-full text-sm sm:text-base dark:border-gray-700 dark:text-gray-200"
                onClick={() => document.getElementById("withdraw-tab").click()}
              >
                <ArrowDown className="mr-2 h-3 w-3 sm:h-4 sm:w-4" /> Withdraw
              </Button>
              <div className="rounded-lg bg-gray-50 dark:bg-gray-800 p-3 sm:p-4">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium dark:text-gray-300">USDT Balance</span>
                </div>
                <p className="mt-2 text-xl sm:text-2xl font-bold dark:text-white">
                  {Number.parseFloat(usdtBalance).toFixed(2)} USDT
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Available for deposits</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="deposit" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="deposit" id="deposit-tab" className="text-xs sm:text-sm">
              Deposit
            </TabsTrigger>
            <TabsTrigger value="withdraw" id="withdraw-tab" className="text-xs sm:text-sm">
              Withdraw
            </TabsTrigger>
          </TabsList>
          <TabsContent value="deposit" className="mt-4 sm:mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="dark:text-white">Add to Your Savings</CardTitle>
                <CardDescription className="dark:text-gray-400">
                  Deposit USDT to grow your healthcare fund
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium dark:text-gray-300">Amount (USDT)</label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    min="0.1"
                    step="0.1"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    className="dark:border-gray-700"
                  />
                </div>

                <div className="rounded-lg bg-gray-50 dark:bg-gray-800 p-3 sm:p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="dark:text-gray-300">Amount</span>
                    <span className="dark:text-gray-300">{Number.parseFloat(depositAmount || 0).toFixed(2)} USDT</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="dark:text-gray-300">Transaction Fee</span>
                    <span className="dark:text-gray-300">
                      {(Number.parseFloat(depositAmount || 0) * 0.01).toFixed(2)} USDT
                    </span>
                  </div>
                  <div className="border-t dark:border-gray-700 pt-2 mt-2 flex justify-between font-medium">
                    <span className="dark:text-white">Total</span>
                    <span className="dark:text-white">
                      {(Number.parseFloat(depositAmount || 0) * 1.01).toFixed(2)} USDT
                    </span>
                  </div>
                </div>

                <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 p-3 sm:p-4 text-sm text-blue-800 dark:text-blue-300">
                  <div className="flex items-start">
                    <Info className="mr-2 h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                    <p>
                      Regular deposits increase your savings streak and earn you HST tokens.
                      {savingsInfo.streak >= 3 && " You're on a streak! Keep it up to earn bonus tokens."}
                    </p>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col">
                <Button
                  onClick={handleDeposit}
                  disabled={isDepositing || !depositAmount || Number.parseFloat(depositAmount) <= 0}
                  className="w-full bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700"
                >
                  {isDepositing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    "Save Now"
                  )}
                </Button>
                {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
                {success && <p className="text-green-500 text-sm mt-2">{success}</p>}
              </CardFooter>
            </Card>
          </TabsContent>
          <TabsContent value="withdraw" className="mt-4 sm:mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="dark:text-white">Withdraw Savings</CardTitle>
                <CardDescription className="dark:text-gray-400">Access your funds when you need them</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium dark:text-gray-300">Amount (USDT)</label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    min="0.1"
                    step="0.1"
                    max={savingsInfo.balance}
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    className="dark:border-gray-700"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="dark:text-gray-300">Available Balance</span>
                    <span className="dark:text-gray-300">{Number.parseFloat(savingsInfo.balance).toFixed(2)} USDT</span>
                  </div>
                </div>
                <div className="rounded-lg bg-gray-50 dark:bg-gray-800 p-3 sm:p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="dark:text-gray-300">Amount</span>
                    <span className="dark:text-gray-300">{Number.parseFloat(withdrawAmount || 0).toFixed(2)} USDT</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="dark:text-gray-300">Transaction Fee</span>
                    <span className="dark:text-gray-300">
                      {(Number.parseFloat(withdrawAmount || 0) * 0.01).toFixed(2)} USDT
                    </span>
                  </div>
                  <div className="border-t dark:border-gray-700 pt-2 mt-2 flex justify-between font-medium">
                    <span className="dark:text-white">Total to Receive</span>
                    <span className="dark:text-white">
                      {(Number.parseFloat(withdrawAmount || 0) * 0.99).toFixed(2)} USDT
                    </span>
                  </div>
                </div>
                <div className="rounded-lg bg-orange-50 dark:bg-orange-900/20 p-3 sm:p-4 text-sm text-orange-800 dark:text-orange-300">
                  <div className="flex items-start">
                    <Info className="mr-2 h-4 w-4 sm:h-5 sm:w-5 text-orange-600 dark:text-orange-400 flex-shrink-0" />
                    <p>
                      Withdrawing may affect your loan eligibility and reset your savings streak. Only withdraw when
                      necessary for healthcare expenses.
                    </p>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col">
                <Button
                  onClick={handleWithdraw}
                  disabled={
                    isWithdrawing ||
                    !withdrawAmount ||
                    Number.parseFloat(withdrawAmount) <= 0 ||
                    Number.parseFloat(withdrawAmount) > Number.parseFloat(savingsInfo.balance)
                  }
                  variant="outline"
                  className="w-full dark:border-gray-700 dark:text-gray-200"
                >
                  {isWithdrawing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    "Withdraw Funds"
                  )}
                </Button>
                {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
                {success && <p className="text-green-500 text-sm mt-2">{success}</p>}
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>

        <Card>
          <CardHeader>
            <CardTitle className="dark:text-white">Transaction History</CardTitle>
            <CardDescription className="dark:text-gray-400">Your recent savings activities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {transactions.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-center">
                  No transactions found. Start by making a deposit!
                </p>
              ) : (
                <ul className="space-y-4">
                  {transactions.map((tx, index) => (
                    <li
                      key={tx.txHash || index}
                      className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b dark:border-gray-700 pb-4 last:border-b-0"
                    >
                      <div className="flex items-center space-x-3">
                        {tx.type === "Deposit" ? (
                          <ArrowUp className="h-5 w-5 text-green-600 dark:text-green-400" />
                        ) : (
                          <ArrowDown className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                        )}
                        <div>
                          <p className="font-medium dark:text-white">{tx.type}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{formatDate(tx.timestamp)}</p>
                        </div>
                      </div>
                      <div className="mt-2 sm:mt-0 sm:text-right">
                        <p className="font-medium dark:text-white">
                          {tx.type === "Deposit" ? "+" : "-"}
                          {Number.parseFloat(tx.amount).toFixed(2)} USDT
                        </p>
                        <a
                          href={getExplorerLink(tx.txHash)}
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
              onClick={() => alert("View all transactions not implemented yet")}
            >
              View All Transactions
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}