"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Wallet, CreditCard, Heart, ArrowUpRight, Plus, Clock, CheckCircle, Loader2, ExternalLink, ShieldCheck } from "lucide-react";
import { useWallet } from "@/lib/wallet-context";
import {
  getSavingsInfo,
  getLoanInfo,
  getHSTBalance,
  getUserActivities,
  getExplorerTxUrl
} from "@/lib/web3";

export default function Dashboard() {
  const router = useRouter();
  const { address, isConnected, isReconnecting, disconnect } = useWallet();

  const [activities, setActivities] = useState([]);
  const [savings, setSavings] = useState(null);
  const [loan, setLoan] = useState(null);
  const [hstBalanceFormatted, setHstBalanceFormatted] = useState("0.00");
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  // Load everything the dashboard shows
  useEffect(() => {
    let cancelled = false;

    if (!address) {
      setIsLoading(false);
      return;
    }

    const loadDashboard = async () => {
      setIsLoading(true);
      setLoadError(false);
      try {
        const [savingsInfo, loanInfo, hstBalance] = await Promise.all([
          getSavingsInfo(address),
          getLoanInfo(address),
          getHSTBalance(address),
        ]);

        if (cancelled) return;

        if (!savingsInfo) {
          setLoadError(true);
          return;
        }

        const isRegistered = savingsInfo.accountType > 0 || parseFloat(savingsInfo.balance) > 0;
        if (!isRegistered) {
          router.push("/register");
          return;
        }

        setSavings(savingsInfo);
        setLoan(loanInfo && parseFloat(loanInfo.amount) > 0 ? loanInfo : null);
        setHstBalanceFormatted(Number(hstBalance).toFixed(2));
      } catch (error) {
        console.error("Error loading dashboard:", error);
        if (!cancelled) setLoadError(true);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    loadDashboard();
    return () => {
      cancelled = true;
    };
  }, [address, router]);

  // Load user activities
  useEffect(() => {
    let cancelled = false;

    const loadActivities = async () => {
      if (!address) return;
      try {
        const userActivities = await getUserActivities(address);
        if (!cancelled) setActivities(userActivities.slice(0, 5));
      } catch (error) {
        console.error("Error loading activities:", error);
      }
    };

    loadActivities();
    return () => {
      cancelled = true;
    };
  }, [address]);

  const calculateSavingsProgress = () => {
    if (!savings) return 0;
    const goal = 10;
    return Math.min(100, (parseFloat(savings.balance) / goal) * 100);
  };

  const calculateLoanProgress = () => {
    if (!loan || loan.repaid) return 0;
    const now = new Date();
    const dueDate = loan.dueDate;
    const loanDuration = 30 * 24 * 60 * 60 * 1000;
    const elapsed = now - (dueDate - loanDuration);
    return Math.min(100, Math.max(0, (elapsed / loanDuration) * 100));
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "N/A";
    return new Date(timestamp).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getExplorerLink = (txHash) => getExplorerTxUrl(txHash);

  const getActivityIcon = (type) => {
    if (type.includes("Register")) {
      return <CheckCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />;
    } else if (type === "Deposit") {
      return <Plus className="h-4 w-4 text-green-600 dark:text-green-400" />;
    } else if (type === "Withdrawal") {
      return <ArrowUpRight className="h-4 w-4 text-orange-600 dark:text-orange-400" />;
    } else if (type.includes("Loan")) {
      return <CreditCard className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />;
    } else {
      return <Wallet className="h-4 w-4 text-purple-600 dark:text-purple-400" />;
    }
  };

  const formatActivityType = (type) => {
    return type.replace(/([A-Z])/g, " $1").trim();
  };

  const formatActivityDetails = (details) => {
    if (typeof details === 'string') {
      const cleanedDetails = details.replace(/Qm[a-zA-Z0-9]{44,}/g, '');
      return cleanedDetails.replace(/[a-zA-Z0-9]{40,}/g, '').trim();
    }
    return details;
  };

  // Show loading state
  if (!isConnected && !isReconnecting) {
    return (
      <div className="container mx-auto px-4 md:px-6 py-12 text-center">
        <h2 className="text-2xl font-bold mb-2 dark:text-white">Connect Your Wallet</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-6">Please connect your wallet to access the dashboard</p>
      </div>
    );
  }

  if (isLoading || isReconnecting) {
    return (
      <div className="container mx-auto px-4 md:px-6 py-12 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-green-600 dark:text-green-400" />
          <p className="text-gray-500 dark:text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="container mx-auto px-4 md:px-6 py-12 text-center">
        <h2 className="text-2xl font-bold mb-2 dark:text-white">Error</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-6">Failed to load dashboard data</p>
      </div>
    );
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
              
              {/* Verification Status Banner */}
              <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 p-3 sm:p-4 text-sm text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                <div className="flex items-start">
                  <ShieldCheck className="mr-2 h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-medium">Identity Verification — Coming Soon</p>
                    <p className="mt-1">
                      All HealFi features are available in the meantime.{" "}
                      <Button
                        variant="link"
                        className="p-0 text-blue-700 dark:text-blue-300 underline h-auto"
                        onClick={() => router.push("/verify")}
                      >
                        Learn more
                      </Button>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Your Savings</CardTitle>
                  <Wallet className="h-4 w-4 text-green-600 dark:text-green-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-xl sm:text-2xl font-bold dark:text-white">
                    {savings?.balance || "0.00"} USDT
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {savings?.hstEarned || "0.00"} HST earned
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
                    onClick={() => router.push("/savings")}
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
                  <div className="text-xl sm:text-2xl font-bold dark:text-white">
                    {loan ? loan.amount : "0.00"} USDT
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {loan && !loan.repaid && loan.dueDate
                      ? `Due on ${loan.dueDate.toLocaleDateString("en-US")}`
                      : "No active loan"}
                  </p>
                  {loan && !loan.repaid && (
                    <>
                      <div className="mt-4 flex items-center text-xs text-gray-500 dark:text-gray-400">
                        <Clock className="mr-1 h-3 w-3" />
                        <span>Repayment Progress</span>
                      </div>
                      <Progress value={calculateLoanProgress()} className="h-2 mt-1" />
                    </>
                  )}
                </CardContent>
                <CardFooter>
                  <Button
                    onClick={() => router.push("/loans")}
                    variant="outline"
                    className="w-full text-sm sm:text-base"
                  >
                    {loan && !loan.repaid ? "Manage Loan" : "Apply for Loan"}
                  </Button>
                </CardFooter>
              </Card>

              <Card className="sm:col-span-2 lg:col-span-1">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Your Tokens</CardTitle>
                  <Heart className="h-4 w-4 text-red-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-xl sm:text-2xl font-bold dark:text-white">{hstBalanceFormatted} HST</div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Health Support Tokens</p>
                  <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
                    <div className="flex items-center">
                      <CheckCircle className="mr-1 h-3 w-3 text-green-600 dark:text-green-400" />
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
                    {activities.length === 0 ? (
                      <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                        No activities found. Start by making a deposit!
                      </p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b dark:border-gray-700">
                              <th className="text-left py-3 px-2 w-12"></th>
                              <th className="text-left py-3 px-2 font-medium text-sm text-gray-500 dark:text-gray-400">Activity</th>
                              <th className="text-left py-3 px-2 font-medium text-sm text-gray-500 dark:text-gray-400">Details</th>
                              <th className="text-left py-3 px-2 font-medium text-sm text-gray-500 dark:text-gray-400">Date</th>
                              <th className="text-right py-3 px-2 font-medium text-sm text-gray-500 dark:text-gray-400">Transaction</th>
                            </tr>
                          </thead>
                          <tbody>
                            {activities.map((activity, index) => (
                              <tr key={activity.txHash || index} className="border-b dark:border-gray-700 last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                <td className="py-3 px-2">
                                  {getActivityIcon(activity.type)}
                                </td>
                                <td className="py-3 px-2 font-medium dark:text-white">
                                  {formatActivityType(activity.type)}
                                </td>
                                <td className="py-3 px-2 max-w-xs">
                                  <div className="truncate text-gray-500 dark:text-gray-400">
                                    {formatActivityDetails(activity.details)}
                                  </div>
                                </td>
                                <td className="py-3 px-2 text-sm text-gray-500 dark:text-gray-400">
                                  {formatDate(activity.timestamp)}
                                </td>
                                <td className="py-3 px-2 text-right">
                                  {activity.txHash ? (
                                    <a
                                      href={getExplorerLink(activity.txHash)}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:underline text-sm"
                                    >
                                      <ExternalLink className="h-3 w-3" />
                                    </a>
                                  ) : (
                                    <span className="text-gray-400 dark:text-gray-600">-</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </CardContent>
                  <CardFooter>
                    <Button
                      variant="outline"
                      className="w-full dark:border-gray-700 dark:text-gray-200"
                      onClick={() => router.push("/activities")}
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
                          <p className="font-medium dark:text-white">Connected Wallet</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{address.slice(0, 6)}...{address.slice(-4)}</p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full sm:w-auto"
                          onClick={() => {
                            disconnect();
                            router.push("/");
                          }}
                        >
                          Disconnect
                        </Button>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b pb-4">
                        <div className="mb-2 sm:mb-0">
                          <p className="font-medium dark:text-white">Verification Status</p>
                          <p className="text-sm text-blue-500">Coming soon</p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full sm:w-auto"
                          onClick={() => router.push("/verify")}
                        >
                          Learn More
                        </Button>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b pb-4">
                        <div className="mb-2 sm:mb-0">
                          <p className="font-medium dark:text-white">Notifications</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Receive alerts for important updates</p>
                        </div>
                        <Button variant="outline" size="sm" className="w-full sm:w-auto">
                          Configure
                        </Button>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                        <div className="mb-2 sm:mb-0">
                          <p className="font-medium dark:text-white">Language</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Currently set to English</p>
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
  );
}