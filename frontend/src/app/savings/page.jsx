"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowUp, ArrowDown, TrendingUp, Info, Loader2, ExternalLink,
  Users, Shield, AlertCircle, User, Clock, CheckCircle2
} from "lucide-react";
import { useWallet } from "@/lib/wallet-context";
import {
  deposit as depositToSavings,
  withdraw as withdrawFromSavings,
  getAccountStatus,
  getIndividualAccount,
  getUserFamilyAccount,
  getFamilyInfo,
  switchActiveAccount,
  getUSDTBalance,
  getUserActivities,
  getExplorerTxUrl,
  proposeFamilyWithdrawal,
  getFamilySigners,
  approveFamilyWithdrawal,
  getFamilyWithdrawalRequests,
  getWithdrawalRequest,
} from "@/lib/web3";

const ACCOUNT_TYPE = { NONE: 0, INDIVIDUAL: 1, FAMILY: 2 };

export default function SavingsPage() {
  const router = useRouter();
  const { address, isConnected, isReconnecting, getSigner } = useWallet();

  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawTo, setWithdrawTo] = useState("");
  const [transactions, setTransactions] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isTransactionPending, setIsTransactionPending] = useState(false);
  const [approvingId, setApprovingId] = useState(null); // tracks which request is being approved

  const [selectedAccount, setSelectedAccount] = useState("individual");

  const [accountStatus, setAccountStatus] = useState(null);
  const [individualAccount, setIndividualAccount] = useState(null);
  const [familyAccount, setFamilyAccount] = useState(null);
  const [familyInfo, setFamilyInfo] = useState(null);
  const [familySigners, setFamilySigners] = useState(null);
  const [usdtBalanceFormatted, setUsdtBalanceFormatted] = useState("0.00");
  const [isLoading, setIsLoading] = useState(true);

  // Pending withdrawal requests visible to the trustee
  const [pendingRequests, setPendingRequests] = useState([]);
  const [isLoadingRequests, setIsLoadingRequests] = useState(false);

  const hasIndividual = !!accountStatus?.hasIndividualAccount;
  const hasFamily = !!accountStatus?.hasFamilyAccount;
  const hasBoth = hasIndividual && hasFamily;
  const isFamilyView = selectedAccount === "family";

  const displayBalance = isFamilyView
    ? familyAccount?.treasuryBalance ?? "0.00"
    : individualAccount?.balance ?? "0.00";

  const isEmergencySigner =
    isFamilyView && familySigners?.emergencySigner?.toLowerCase() === address?.toLowerCase();
  const isTrusteeSigner =
    isFamilyView && familySigners?.trusteeSigner?.toLowerCase() === address?.toLowerCase();

  const loadBalances = useCallback(async () => {
    if (!address) return;
    try {
      const [status, usdtBalance] = await Promise.all([
        getAccountStatus(address),
        getUSDTBalance(address),
      ]);

      if (!status || (!status.hasIndividualAccount && !status.hasFamilyAccount)) {
        router.push("/register");
        return;
      }

      setAccountStatus(status);
      setUsdtBalanceFormatted(Number(usdtBalance).toFixed(2));

      setSelectedAccount((prev) => {
        if (status.activeAccount === ACCOUNT_TYPE.FAMILY && status.hasFamilyAccount) return "family";
        if (status.activeAccount === ACCOUNT_TYPE.INDIVIDUAL && status.hasIndividualAccount) return "individual";
        if (status.hasIndividualAccount) return "individual";
        if (status.hasFamilyAccount) return "family";
        return prev;
      });

      const loads = [];
      if (status.hasIndividualAccount) {
        loads.push(getIndividualAccount(address).then(setIndividualAccount));
      } else {
        setIndividualAccount(null);
      }

      if (status.hasFamilyAccount) {
        loads.push(getUserFamilyAccount(address).then(setFamilyAccount));
        loads.push(getFamilyInfo(status.familyId).then(setFamilyInfo));
        loads.push(getFamilySigners(status.familyId).then(setFamilySigners));
      } else {
        setFamilyAccount(null);
        setFamilyInfo(null);
        setFamilySigners(null);
      }

      await Promise.all(loads);
    } catch (err) {
      console.error("Error loading savings data:", err);
    }
  }, [address, router]);

  // Load pending requests whenever the trustee is in family view
  const loadPendingRequests = useCallback(async () => {
    if (!accountStatus?.familyId || !familySigners) return;
    const trusteeSigner = familySigners?.trusteeSigner?.toLowerCase();
    if (!trusteeSigner || trusteeSigner !== address?.toLowerCase()) return;

    setIsLoadingRequests(true);
    try {
      const ids = await getFamilyWithdrawalRequests(accountStatus.familyId);
      const details = await Promise.all(ids.map(getWithdrawalRequest));
      // Only show open (not executed, not cancelled) requests
      const open = details
        .map((req, i) => ({ ...req, id: ids[i] }))
        .filter((r) => r && !r.executed && !r.cancelled);
      setPendingRequests(open);
    } catch (e) {
      console.error("Error loading pending requests:", e);
    } finally {
      setIsLoadingRequests(false);
    }
  }, [accountStatus?.familyId, familySigners, address]);

  useEffect(() => {
    if (!address) { setIsLoading(false); return; }
    setIsLoading(true);
    loadBalances().finally(() => setIsLoading(false));
  }, [address, loadBalances]);

  // Re-load pending requests whenever family signers resolve or view switches
  useEffect(() => {
    if (isFamilyView) loadPendingRequests();
  }, [isFamilyView, loadPendingRequests]);

  useEffect(() => {
    let cancelled = false;
    const loadActivities = async () => {
      if (!address) return;
      try {
        const activities = await getUserActivities(address);
        if (cancelled) return;
        setTransactions(
          activities.filter((tx) => tx.type === "Deposit" || tx.type === "Withdrawal").slice(0, 5)
        );
      } catch (error) {
        console.error("Error loading activities:", error);
      }
    };
    loadActivities();
    return () => { cancelled = true; };
  }, [address]);

  const handleDeposit = async () => {
    if (!depositAmount || parseFloat(depositAmount) <= 0) {
      setError("Please enter a valid deposit amount"); return;
    }
    setError(""); setSuccess(""); setIsTransactionPending(true);
    try {
      const signer = await getSigner();
      const target = isFamilyView ? ACCOUNT_TYPE.FAMILY : ACCOUNT_TYPE.INDIVIDUAL;
      const result = await depositToSavings(depositAmount, target, signer);
      if (result.success) {
        setSuccess(isFamilyView ? "Deposit successful! Funds added to the family treasury." : "Deposit successful!");
        setDepositAmount("");
        await loadBalances();
      } else {
        setError(result.error || "Deposit failed");
      }
    } catch (error) {
      setError("Failed to deposit: " + error.message);
    } finally {
      setIsTransactionPending(false);
    }
  };

  const handleWithdraw = async () => {
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
      setError("Please enter a valid withdrawal amount"); return;
    }
    if (parseFloat(withdrawAmount) > parseFloat(individualAccount?.balance || 0)) {
      setError("Insufficient balance for withdrawal"); return;
    }
    setError(""); setSuccess(""); setIsTransactionPending(true);
    try {
      const signer = await getSigner();
      const result = await withdrawFromSavings(withdrawAmount, signer);
      if (result.success) {
        setSuccess("Withdrawal successful!");
        setWithdrawAmount("");
        await loadBalances();
      } else {
        setError(result.error || "Withdrawal failed");
      }
    } catch (error) {
      setError("Failed to withdraw: " + error.message);
    } finally {
      setIsTransactionPending(false);
    }
  };

  const handleProposeWithdrawal = async () => {
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
      setError("Please enter a valid amount"); return;
    }
    if (!withdrawTo || !/^0x[a-fA-F0-9]{40}$/.test(withdrawTo)) {
      setError("Please enter a valid recipient address (must be a family member)"); return;
    }
    setError(""); setSuccess(""); setIsTransactionPending(true);
    try {
      const signer = await getSigner();
      const result = await proposeFamilyWithdrawal(withdrawAmount, withdrawTo, signer);
      if (result.success) {
        setSuccess("Withdrawal proposed! Waiting for trustee signer approval.");
        setWithdrawAmount(""); setWithdrawTo("");
        await loadBalances();
      } else {
        setError(result.error || "Proposal failed");
      }
    } catch (error) {
      setError("Failed to propose withdrawal: " + error.message);
    } finally {
      setIsTransactionPending(false);
    }
  };

  // ── Trustee: approve a pending proposal ───────────────────────────────────
  const handleApproveWithdrawal = async (requestId) => {
    setError(""); setSuccess(""); setApprovingId(requestId);
    try {
      const signer = await getSigner();
      const result = await approveFamilyWithdrawal(requestId, signer);
      if (result.success) {
        setSuccess("Withdrawal approved and executed!");
        await loadBalances();
        await loadPendingRequests();
      } else {
        setError(result.error || "Approval failed");
      }
    } catch (error) {
      setError("Failed to approve: " + error.message);
    } finally {
      setApprovingId(null);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "N/A";
    return new Date(timestamp).toLocaleDateString("en-US", {
      year: "numeric", month: "long", day: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  };

  const formatTs = (unix) =>
    unix ? new Date(unix * 1000).toLocaleDateString("en-US", {
      month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
    }) : "—";

  const activePlanType = isFamilyView ? familyAccount?.planType : individualAccount?.planType;
  const planLabel = ["Daily", "Weekly", "Monthly"][activePlanType ?? 0] ?? "—";
  const activeStreak = isFamilyView ? familyAccount?.streak : individualAccount?.streak;
  const activeHstEarned = isFamilyView ? familyAccount?.hstEarned : individualAccount?.hstEarned;

  if (!isConnected && !isReconnecting) {
    return (
      <div className="container mx-auto px-4 md:px-6 py-12">
        <div className="max-w-md mx-auto text-center">
          <h2 className="text-2xl font-bold mb-2 dark:text-white">Connect Your Wallet</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6">Please connect your wallet to access savings features</p>
        </div>
      </div>
    );
  }

  if (isLoading || isReconnecting) {
    return (
      <div className="container mx-auto px-4 md:px-6 py-12 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-green-600 dark:text-green-400" />
          <p className="text-gray-500 dark:text-gray-400">Loading savings information…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 md:px-6 py-6 sm:py-8">
      <div className="flex flex-col space-y-6 sm:space-y-8">
        <div className="flex flex-col space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight dark:text-white">Your Savings</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm sm:text-base">
            {isFamilyView ? `Family treasury — ${familyInfo?.familyName ?? ""}` : "Individual savings account"}
          </p>
        </div>

        {hasBoth && (
          <Tabs value={selectedAccount} onValueChange={setSelectedAccount} className="w-full">
            <TabsList className="grid w-full grid-cols-2 max-w-md">
              <TabsTrigger value="individual" className="flex items-center gap-2">
                <User className="h-4 w-4" /> Individual
              </TabsTrigger>
              <TabsTrigger value="family" className="flex items-center gap-2">
                <Users className="h-4 w-4" /> Family
              </TabsTrigger>
            </TabsList>
          </Tabs>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* ── Overview card ── */}
          <Card>
            <CardHeader>
              <CardTitle className="dark:text-white flex items-center gap-2">
                {isFamilyView && <Users className="h-5 w-5 text-orange-500" />}
                Savings Overview
              </CardTitle>
              <CardDescription className="dark:text-gray-400">
                {isFamilyView ? "Shared family treasury balance" : "Your personal balance and earnings"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-2">
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  {isFamilyView ? "Family Treasury" : "Balance"}
                </span>
                <span className="text-2xl sm:text-3xl font-bold dark:text-white">{displayBalance} USDT</span>
              </div>

              <div className="rounded-lg bg-gray-50 dark:bg-gray-800 p-3 sm:p-4 space-y-1">
                <div className="flex items-center space-x-2 mb-1">
                  <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <span className="font-medium dark:text-white text-sm">Your HST Earnings</span>
                </div>
                <p className="text-lg font-bold dark:text-white">{activeHstEarned || "0.00"} HST</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Streak: {activeStreak || 0} • Plan: {planLabel}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Wallet USDT</p>
                  <p className="text-base font-bold dark:text-white">{usdtBalanceFormatted}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Account Type</p>
                  <p className="text-base font-bold dark:text-white">{isFamilyView ? "Family" : "Individual"}</p>
                </div>
              </div>

              {isFamilyView && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {isEmergencySigner && (
                    <span className="flex items-center gap-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 px-2 py-1 rounded-full">
                      <Shield className="h-3 w-3" /> Emergency Signer
                    </span>
                  )}
                  {isTrusteeSigner && (
                    <span className="flex items-center gap-1 text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 px-2 py-1 rounded-full">
                      <Shield className="h-3 w-3" /> Trustee Signer
                    </span>
                  )}
                  {!isEmergencySigner && !isTrusteeSigner && (
                    <span className="flex items-center gap-1 text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-2 py-1 rounded-full">
                      <Users className="h-3 w-3" /> Family Member
                    </span>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
              {/* ── Trustee: Pending Withdrawal Approvals ─────────────────────────── */}
        {isFamilyView && isTrusteeSigner && (
          <Card>
            <CardHeader>
              <CardTitle className="dark:text-white flex items-center gap-2">
                <Clock className="h-5 w-5 text-purple-500" />
                Pending Withdrawal Approvals
              </CardTitle>
              <CardDescription className="dark:text-gray-400">
                As trustee signer, you must co-sign these proposals before funds are released.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingRequests ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-5 w-5 animate-spin text-purple-500 mr-2" />
                  <span className="text-sm text-gray-500 dark:text-gray-400">Checking for pending proposals…</span>
                </div>
              ) : pendingRequests.length === 0 ? (
                <div className="flex items-center gap-2 py-6 justify-center">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">No pending withdrawal proposals.</p>
                </div>
              ) : (
                <ul className="space-y-3">
                  {pendingRequests.map((req) => (
                    <li
                      key={req.id}
                      className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-lg border border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-900/20 p-4"
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-900/50 px-2 py-0.5 rounded-full">
                            Request #{req.id}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">{formatTs(req.createdAt)}</span>
                        </div>
                        <p className="text-base font-semibold dark:text-white">{req.amount} USDT</p>
                        <div className="text-xs text-gray-500 dark:text-gray-400 space-y-0.5">
                          <p>To: <span className="font-mono">{req.to}</span></p>
                          <p>Proposed by: <span className="font-mono">{req.proposer?.slice(0, 10)}…</span></p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleApproveWithdrawal(req.id)}
                        disabled={approvingId === req.id}
                        className="bg-purple-600 hover:bg-purple-700 shrink-0"
                      >
                        {approvingId === req.id
                          ? <><Loader2 className="mr-1 h-3 w-3 animate-spin" />Approving…</>
                          : <><CheckCircle2 className="mr-1 h-3 w-3" />Approve & Release</>}
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
              {error && <p className="text-red-500 text-sm mt-3">{error}</p>}
              {success && <p className="text-green-500 text-sm mt-3">{success}</p>}
            </CardContent>
          </Card>
        )}
          {/* ── Deposit / Withdraw card ── */}
          <Card>
            <Tabs defaultValue="deposit" className="w-full">
              <TabsList className={`grid w-full ${isFamilyView && !isEmergencySigner ? "grid-cols-1" : "grid-cols-2"}`}>
                <TabsTrigger value="deposit" className="text-xs sm:text-sm">
                  Deposit {isFamilyView && "to Pool"}
                </TabsTrigger>
                {(!isFamilyView || isEmergencySigner) && (
                  <TabsTrigger value="withdraw" className="text-xs sm:text-sm">
                    {isFamilyView ? "Propose Withdrawal" : "Withdraw"}
                  </TabsTrigger>
                )}
              </TabsList>

              <TabsContent value="deposit" className="mt-4 sm:mt-6">
                <CardHeader>
                  <CardTitle className="dark:text-white">
                    {isFamilyView ? "Deposit to Family Pool" : "Deposit to Savings"}
                  </CardTitle>
                  <CardDescription className="dark:text-gray-400">
                    {isFamilyView
                      ? "Any family member can add funds to the shared treasury"
                      : "Add funds to your healthcare savings"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isFamilyView && (
                    <div className="flex items-start gap-2 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 p-3 text-sm text-blue-800 dark:text-blue-300">
                      <Info className="h-4 w-4 shrink-0 mt-0.5" />
                      <p>Your deposit goes directly into the family treasury. Every member earns their own streak and HST rewards.</p>
                    </div>
                  )}
                  <div className="space-y-2">
                    <label className="text-sm font-medium dark:text-gray-300">Amount (USDT)</label>
                    <Input
                      type="number" placeholder="0.00" min="0.1" step="0.1"
                      value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)}
                      className="dark:border-gray-700"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400">Available in wallet: {usdtBalanceFormatted} USDT</p>
                  </div>
                  <div className="rounded-lg bg-green-50 dark:bg-green-900/20 p-3 text-sm text-green-800 dark:text-green-300">
                    <p className="font-medium mb-1">Deposit Benefits:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Earn HST tokens for consistent deposits</li>
                      <li>Build your personal savings streak</li>
                      <li>Increase loan eligibility</li>
                      {isFamilyView && <li>Grows the shared family treasury</li>}
                    </ul>
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-2">
                  <Button
                    onClick={handleDeposit}
                    disabled={isTransactionPending || !depositAmount || parseFloat(depositAmount) <= 0}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    {isTransactionPending
                      ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Processing…</>
                      : isFamilyView ? "Deposit to Family Pool" : "Deposit Now"}
                  </Button>
                  {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                  {success && <p className="text-green-500 text-sm text-center">{success}</p>}
                </CardFooter>
              </TabsContent>

              {(!isFamilyView || isEmergencySigner) && (
                <TabsContent value="withdraw" className="mt-4 sm:mt-6">
                  <CardHeader>
                    <CardTitle className="dark:text-white">
                      {isFamilyView ? "Propose Family Withdrawal" : "Withdraw from Savings"}
                    </CardTitle>
                    <CardDescription className="dark:text-gray-400">
                      {isFamilyView
                        ? "Propose a withdrawal — the trustee signer must then approve it"
                        : "Access your saved funds"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {isFamilyView && (
                      <div className="flex items-start gap-2 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 p-3 text-sm text-amber-800 dark:text-amber-300">
                        <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                        <p>
                          Family withdrawals require 2-of-2 signatures. After you propose, the trustee
                          signer (<span className="font-mono text-xs">{familySigners?.trusteeSigner?.slice(0, 8)}…</span>) must approve on-chain.
                        </p>
                      </div>
                    )}
                    {!isFamilyView && hasFamily && accountStatus?.activeAccount !== ACCOUNT_TYPE.INDIVIDUAL && (
                      <div className="flex items-start gap-2 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 p-3 text-sm text-blue-800 dark:text-blue-300">
                        <Info className="h-4 w-4 shrink-0 mt-0.5" />
                        <p>Your family account is currently active on-chain. Withdrawing here will first switch your active account to Individual.</p>
                      </div>
                    )}
                    <div className="space-y-2">
                      <label className="text-sm font-medium dark:text-gray-300">Amount (USDT)</label>
                      <Input
                        type="number" placeholder="0.00" min="0.1" step="0.1"
                        value={withdrawAmount} onChange={(e) => setWithdrawAmount(e.target.value)}
                        className="dark:border-gray-700"
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400">Available: {displayBalance} USDT</p>
                    </div>
                    {isFamilyView && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium dark:text-gray-300">
                          Recipient Address <span className="text-red-500">*</span>
                        </label>
                        <Input
                          placeholder="0x… (must be a family member)"
                          value={withdrawTo} onChange={(e) => setWithdrawTo(e.target.value)}
                          className="dark:border-gray-700"
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400">Funds can only be sent to a registered family member address.</p>
                      </div>
                    )}
                    {!isFamilyView && (
                      <div className="rounded-lg bg-orange-50 dark:bg-orange-900/20 p-3 text-sm text-orange-800 dark:text-orange-300">
                        <div className="flex items-start">
                          <Info className="mr-2 h-4 w-4 shrink-0" />
                          <ul className="list-disc list-inside space-y-1">
                            <li>Withdrawals may affect loan eligibility</li>
                            <li>Processing may take a few minutes</li>
                          </ul>
                        </div>
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="flex flex-col gap-2">
                    <Button
                      onClick={isFamilyView ? handleProposeWithdrawal : handleWithdraw}
                      disabled={
                        isTransactionPending ||
                        !withdrawAmount ||
                        parseFloat(withdrawAmount) <= 0 ||
                        (!isFamilyView && parseFloat(withdrawAmount) > parseFloat(individualAccount?.balance || 0))
                      }
                      className="w-full bg-orange-600 hover:bg-orange-700"
                    >
                      {isTransactionPending
                        ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Processing…</>
                        : isFamilyView ? "Propose Withdrawal" : "Withdraw Now"}
                    </Button>
                    {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                    {success && <p className="text-green-500 text-sm text-center">{success}</p>}
                  </CardFooter>
                </TabsContent>
              )}
            </Tabs>

            {isFamilyView && !isEmergencySigner && (
              <div className="px-6 pb-6">
                <div className="flex items-start gap-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-3 text-sm text-gray-600 dark:text-gray-400">
                  <Shield className="h-4 w-4 shrink-0 mt-0.5" />
                  <p>Withdrawals from the family treasury are proposed by the Emergency Signer and approved by the Trustee Signer. Any member can deposit at any time.</p>
                </div>
              </div>
            )}
          </Card>
        </div>

        

        {/* ── Transaction history ── */}
        <Card>
          <CardHeader>
            <CardTitle className="dark:text-white">Savings History</CardTitle>
            <CardDescription className="dark:text-gray-400">Your recent deposits and withdrawals</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {transactions.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-center">
                  No transactions yet.{" "}
                  {isFamilyView ? "Any family member can make the first deposit!" : "Start by making a deposit!"}
                </p>
              ) : (
                <ul className="space-y-4">
                  {transactions.map((tx, index) => (
                    <li
                      key={tx.txHash || index}
                      className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b dark:border-gray-700 pb-4 last:border-b-0"
                    >
                      <div className="flex items-center space-x-3">
                        {tx.type === "Deposit"
                          ? <ArrowUp className="h-5 w-5 text-green-600 dark:text-green-400" />
                          : <ArrowDown className="h-5 w-5 text-orange-600 dark:text-orange-400" />}
                        <div>
                          <p className="font-medium dark:text-white">{tx.type}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{formatDate(tx.timestamp)}</p>
                        </div>
                      </div>
                      <div className="mt-2 sm:mt-0 sm:text-right">
                        <p className="font-medium dark:text-white">
                          {tx.details?.includes("USDT") ? tx.details : `${parseFloat(tx.amount || 0).toFixed(2)} USDT`}
                        </p>
                        {tx.txHash && (
                         <a 
                            href={getExplorerTxUrl(tx.txHash)} target="_blank" rel="noopener noreferrer"
                            className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center justify-end"
                          >
                            View on Explorer <ExternalLink className="ml-1 h-3 w-3" />
                          </a>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </CardContent>
          <CardFooter>
            <Button
              variant="outline" className="w-full dark:border-gray-700 dark:text-gray-200"
              onClick={() => router.push("/activities")}
            >
              View All Transactions
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}