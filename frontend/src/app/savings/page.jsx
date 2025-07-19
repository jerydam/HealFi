"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowUp, ArrowDown, TrendingUp, Calendar, Info, Loader2, ExternalLink, AlertCircle } from "lucide-react";
import { connectWallet, getSavingsInfo, deposit, withdraw, getUSDTBalance, getSavingsTransactions } from "@/lib/web3";

export default function SavingsPage() {
  const router = useRouter();
  const [walletAddress, setWalletAddress] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isVerified, setIsVerified] = useState(false);
  const [savingsInfo, setSavingsInfo] = useState(null);
  const [usdtBalance, setUsdtBalance] = useState("0");
  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [transactions, setTransactions] = useState([]);
  const [isDepositing, setIsDepositing] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const initWallet = async () => {
      try {
        const result = await connectWallet();
        if (result.success) {
          setWalletAddress(result.address);
          const verificationStatus = localStorage.getItem(`verification_${result.address}`);
          setIsVerified(verificationStatus === "true");
          await loadUserData(result.address);
        } else {
          setError("Please connect your wallet");
          setIsLoading(false);
        }
      } catch (err) {
        setError("Error connecting wallet");
        setIsLoading(false);
      }
    };

    initWallet();
  }, []);

  const loadUserData = async (address) => {
    setIsLoading(true);
    try {
      const savings = await getSavingsInfo(address);
      if (!savings) {
        router.push("/register");
        return;
      }
      setSavingsInfo(savings);
      const balance = await getUSDTBalance(address);
      setUsdtBalance(balance);
      const txs = await getSavingsTransactions(address);
      setTransactions(txs.slice(0, 5)); // Limit to 5 recent transactions
    } catch (err) {
      setError("Error loading savings data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeposit = async () => {
    if (!depositAmount || Number.parseFloat(depositAmount) <= 0) {
      setError("Please enter a valid deposit amount");
      return;
    }
    setIsDepositing(true);
    setError("");
    setSuccess("");
    try {
      const result = await deposit(depositAmount);
      if (result.success) {
        setSuccess("Deposit successful!");
        setDepositAmount("");
        await loadUserData(walletAddress);
      } else {
        setError(result.error);
      }
    } catch (error) {
      setError("Failed to deposit. Please try again.");
      console.error(error);
    } finally {
      setIsDepositing(false);
    }
  };

  const handleWithdraw = async () => {
    if (!withdrawAmount || Number.parseFloat(withdrawAmount) <= 0) {
      setError("Please enter a valid withdrawal amount");
      return;
    }
    if (Number.parseFloat(withdrawAmount) > Number.parseFloat(savingsInfo?.balance || 0)) {
      setError("Insufficient savings balance");
      return;
    }
    setIsWithdrawing(true);
    setError("");
    setSuccess("");
    try {
      const result = await withdraw(withdrawAmount);
      if (result.success) {
        setSuccess("Withdrawal successful!");
        setWithdrawAmount("");
        await loadUserData(walletAddress);
      } else {
        setError(result.error);
      }
    } catch (error) {
      setError("Failed to withdraw. Please try again.");
      console.error(error);
    } finally {
      setIsWithdrawing(false);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "N/A";
    return new Date(timestamp).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getExplorerLink = (txHash) => {
    return `https://explorer.celo.org/mainnet/tx/${txHash}`;
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 md:px-6 py-12 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-green-600 dark:text-green-400" />
          <p className="text-gray-500 dark:text-gray-400">Loading savings information...</p>
        </div>
      </div>
    );
  }

  if (error || !walletAddress) {
    return (
      <div className="container mx-auto px-4 md:px-6 py-12">
        <div className="max-w-md mx-auto text-center">
          <TrendingUp className="h-12 w-12 mx-auto mb-4 text-gray-400 dark:text-gray-500" />
          <h2 className="text-2xl font-bold mb-2 dark:text-white">Connect Your Wallet</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6">{error || "Please connect your wallet to access savings features"}</p>
          <Button
            onClick={async () => {
              const result = await connectWallet();
              if (result.success) {
                setWalletAddress(result.address);
                await loadUserData(result.address);
              }
            }}
            className="bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700"
          >
            Connect Wallet
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 md:px-6 py-6 sm:py-8">
      <div className="flex flex-col space-y-6 sm:space-y-8">
        <div className="flex flex-col space-y-2">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight dark:text-white">Your Savings</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm sm:text-base">Manage your healthcare savings</p>
          {!isVerified && (
            <div className="rounded-lg bg-orange-50 dark:bg-orange-900/20 p-3 sm:p-4 text-sm text-orange-800 dark:text-orange-300">
              <div className="flex items-start">
                <AlertCircle className="mr-2 h-4 w-4 sm:h-5 sm:w-5 text-orange-600 dark:text-orange-400 flex-shrink-0" />
                <div>
                  <p className="font-medium">Verification Recommended</p>
                  <p>
                    Verify your identity to access loans and other features.{" "}
                    <Button
                      variant="link"
                      className="p-0 text-blue-600 dark:text-blue-400"
                      onClick={() => router.push("/verify")}
                    >
                      Verify Now
                    </Button>
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="dark:text-white">Savings Overview</CardTitle>
              <CardDescription className="dark:text-gray-400">Your current savings balance and progress</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-2">
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Current Balance</span>
                  <span className="text-2xl sm:text-3xl font-bold dark:text-white">
                    {savingsInfo ? Number.parseFloat(savingsInfo.balance).toFixed(2) : "0.00"} USDT
                  </span>
                </div>
                <div className="flex items-center text-sm text-green-600 dark:text-green-400">
                  <TrendingUp className="mr-1 h-4 w-4" />
                  <span>{savingsInfo?.hstEarned || 0} HST earned</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="dark:text-gray-300">Savings Goal: 10 USDT</span>
                  <span className="dark:text-gray-300">
                    {savingsInfo ? (Math.min(100, (Number.parseFloat(savingsInfo.balance) / 10) * 100)).toFixed(0) : 0}%
                  </span>
                </div>
                <Progress
                  value={savingsInfo ? Math.min(100, (Number.parseFloat(savingsInfo.balance) / 10) * 100) : 0}
                  className="h-2"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-lg bg-gray-50 dark:bg-gray-800 p-3 sm:p-4">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500 dark:text-gray-400" />
                    <span className="text-sm font-medium dark:text-gray-300">Last Deposit</span>
                  </div>
                  <p className="mt-2 text-xl sm:text-2xl font-bold dark:text-white">
                    {savingsInfo?.lastDeposit ? Number.parseFloat(savingsInfo.lastDeposit).toFixed(2) : "0.00"} USDT
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {savingsInfo?.lastDepositTime ? formatDate(savingsInfo.lastDepositTime) : "N/A"}
                  </p>
                </div>
                <div className="rounded-lg bg-gray-50 dark:bg-gray-800 p-3 sm:p-4">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500 dark:text-gray-400" />
                    <span className="text-sm font-medium dark:text-gray-300">Total Contributions</span>
                  </div>
                  <p className="mt-2 text-xl sm:text-2xl font-bold dark:text-white">
                    {savingsInfo?.totalContributions ? Number.parseFloat(savingsInfo.totalContributions).toFixed(2) : "0.00"} USDT
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Since account creation</p>
                </div>
              </div>

              <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 p-3 sm:p-4 text-sm text-blue-800 dark:text-blue-300">
                <div className="flex items-start">
                  <Info className="mr-2 h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Savings Benefits:</p>
                    <ul className="list-disc list-inside mt-1 space-y-1">
                      <li>Earn HST tokens for consistent savings</li>
                      <li>Access to microloans after verification</li>
                      <li>Use savings at partner healthcare facilities</li>
                      <li>Build your healthcare financial safety net</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="dark:text-white">Account Status</CardTitle>
              <CardDescription className="dark:text-gray-400">Your savings eligibility and balance</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg bg-gray-50 dark:bg-gray-800 p-3 sm:p-4">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium dark:text-gray-300">USDT Balance</span>
                </div>
                <p className="mt-2 text-xl sm:text-2xl font-bold dark:text-white">
                  {Number.parseFloat(usdtBalance).toFixed(2)} USDT
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Available for deposits</p>
              </div>

              <div className="rounded-lg bg-gray-50 dark:bg-gray-800 p-3 sm:p-4">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium dark:text-gray-300">Verification Status</span>
                </div>
                <p className="mt-2 text-xl sm:text-2xl font-bold dark:text-white">{isVerified ? "Verified" : "Not Verified"}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {isVerified ? "Full access to all features" : "Verify to unlock loans"}
                </p>
              </div>

              {!isVerified && (
                <Button
                  onClick={() => router.push("/verify")}
                  className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700"
                >
                  Verify Identity
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="deposit" id="deposit-tab" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="deposit" className="text-xs sm:text-sm">
              Deposit
            </TabsTrigger>
            <TabsTrigger value="withdraw" className="text-xs sm:text-sm">
              Withdraw
            </TabsTrigger>
          </TabsList>
          <TabsContent value="deposit" className="mt-4 sm:mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="dark:text-white">Deposit to Savings</CardTitle>
                <CardDescription className="dark:text-gray-400">Add funds to your healthcare savings</CardDescription>
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
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Minimum deposit: 0.1 USDT. Available balance: {Number.parseFloat(usdtBalance).toFixed(2)} USDT
                  </p>
                </div>

                <div className="rounded-lg bg-green-50 dark:bg-green-900/20 p-3 sm:p-4 text-sm text-green-800 dark:text-green-300">
                  <div className="flex items-start">
                    <TrendingUp className="mr-2 h-4 w-4 sm:h-5 sm:w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Deposit Benefits:</p>
                      <ul className="list-disc list-inside mt-1 space-y-1">
                        <li>Earn HST tokens for deposits</li>
                        <li>Increase your loan eligibility</li>
                        <li>Funds available for healthcare expenses</li>
                      </ul>
                    </div>
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
                    "Deposit Now"
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
                <CardTitle className="dark:text-white">Withdraw from Savings</CardTitle>
                <CardDescription className="dark:text-gray-400">Access your saved funds</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium dark:text-gray-300">Amount (USDT)</label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    min="0.1"
                    step="0.1"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    className="dark:border-gray-700"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Available balance: {savingsInfo ? Number.parseFloat(savingsInfo.balance).toFixed(2) : "0.00"} USDT
                  </p>
                </div>

                <div className="rounded-lg bg-orange-50 dark:bg-orange-900/20 p-3 sm:p-4 text-sm text-orange-800 dark:text-orange-300">
                  <div className="flex items-start">
                    <Info className="mr-2 h-4 w-4 sm:h-5 sm:w-5 text-orange-600 dark:text-orange-400 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Withdrawal Notice:</p>
                      <ul className="list-disc list-inside mt-1 space-y-1">
                        <li>Withdrawals may affect loan eligibility</li>
                        <li>Ensure sufficient balance for healthcare needs</li>
                        <li>Processing may take a few minutes</li>
                      </ul>
                    </div>
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
                    Number.parseFloat(withdrawAmount) > Number.parseFloat(savingsInfo?.balance || 0)
                  }
                  className="w-full bg-orange-600 hover:bg-orange-700 dark:bg-orange-600 dark:hover:bg-orange-700"
                >
                  {isWithdrawing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    "Withdraw Now"
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
            <CardTitle className="dark:text-white">Savings History</CardTitle>
            <CardDescription className="dark:text-gray-400">Your recent deposits and withdrawals</CardDescription>
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
                        <p className="font-medium dark:text-white">{Number.parseFloat(tx.amount).toFixed(2)} USDT</p>
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
  );
}