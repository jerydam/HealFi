"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CreditCard, Calendar, Clock, CheckCircle, AlertCircle, Loader2 } from "lucide-react"
import { checkLoanEligibility, applyForLoan, repayLoan, stakeGuarantor, getLoanInfo, getUSDTBalance, connectWallet } from "@/lib/web3"

export default function LoansPage() {
  const [walletAddress, setWalletAddress] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isEligible, setIsEligible] = useState(false)
  const [loanInfo, setLoanInfo] = useState(null)
  const [usdtBalance, setUsdtBalance] = useState("0")
  const [loanAmount, setLoanAmount] = useState("")
  const [repayAmount, setRepayAmount] = useState("")
  const [guarantorAddress, setGuarantorAddress] = useState("")
  const [isApplying, setIsApplying] = useState(false)
  const [isRepaying, setIsRepaying] = useState(false)
  const [isStaking, setIsStaking] = useState(false)
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
      const eligible = await checkLoanEligibility(address)
      setIsEligible(eligible)
      const loan = await getLoanInfo(address)
      setLoanInfo(loan)
      const balance = await getUSDTBalance(address)
      setUsdtBalance(balance)
      if (loan && !loan.repaid && loan.amount) {
        const totalDue = Number.parseFloat(loan.amount) + Number.parseFloat(loan.interest)
        setRepayAmount(totalDue.toString())
      }
    } catch (error) {
      console.error("Error loading user data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleApplyLoan = async () => {
    if (!loanAmount || Number.parseFloat(loanAmount) <= 0) {
      setError("Please enter a valid loan amount")
      return
    }
    setIsApplying(true)
    setError("")
    setSuccess("")
    try {
      const result = await applyForLoan(loanAmount)
      if (result.success) {
        setSuccess("Loan application successful!")
        setLoanAmount("")
        await loadUserData(walletAddress)
      } else {
        setError(result.error)
      }
    } catch (error) {
      setError("Failed to apply for loan. Please try again.")
      console.error(error)
    } finally {
      setIsApplying(false)
    }
  }

  const handleRepayLoan = async () => {
    if (!repayAmount || Number.parseFloat(repayAmount) <= 0) {
      setError("Please enter a valid repayment amount")
      return
    }
    setIsRepaying(true)
    setError("")
    setSuccess("")
    try {
      const result = await repayLoan(repayAmount)
      if (result.success) {
        setSuccess("Loan repayment successful!")
        setRepayAmount("")
        await loadUserData(walletAddress)
      } else {
        setError(result.error)
      }
    } catch (error) {
      setError("Failed to repay loan. Please try again.")
      console.error(error)
    } finally {
      setIsRepaying(false)
    }
  }

  const handleStakeGuarantor = async () => {
    if (!guarantorAddress || !guarantorAddress.startsWith("0x")) {
      setError("Please enter a valid guarantor address")
      return
    }
    setIsStaking(true)
    setError("")
    setSuccess("")
    try {
      const result = await stakeGuarantor(walletAddress, guarantorAddress)
      if (result.success) {
        setSuccess("Guarantor staked successfully!")
        setGuarantorAddress("")
        await loadUserData(walletAddress)
      } else {
        setError(result.error)
      }
    } catch (error) {
      setError("Failed to stake guarantor. Please try again.")
      console.error(error)
    } finally {
      setIsStaking(false)
    }
  }

  const calculateProgress = () => {
    if (!loanInfo || loanInfo.repaid || !loanInfo.dueDate) return 0
    const now = new Date()
    const dueDate = new Date(loanInfo.dueDate)
    const loanDuration = 30 * 24 * 60 * 60 * 1000
    const elapsed = now - (dueDate - loanDuration)
    return Math.min(100, Math.max(0, (elapsed / loanDuration) * 100))
  }

  const formatDate = (date) => {
    if (!date) return "N/A"
    return date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 md:px-6 py-12 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-green-600 dark:text-green-400" />
          <p className="text-gray-500 dark:text-gray-400">Loading loan information...</p>
        </div>
      </div>
    )
  }

  if (!walletAddress) {
    return (
      <div className="container mx-auto px-4 md:px-6 py-12">
        <div className="max-w-md mx-auto text-center">
          <CreditCard className="h-12 w-12 mx-auto mb-4 text-gray-400 dark:text-gray-500" />
          <h2 className="text-2xl font-bold mb-2 dark:text-white">Connect Your Wallet</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6">Please connect your wallet to access loan features</p>
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
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight dark:text-white">Your Loans</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm sm:text-base">Manage your healthcare microloans</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="dark:text-white">
                {loanInfo && !loanInfo.repaid && Number.parseFloat(loanInfo.amount) > 0 ? "Current Loan" : "Loan Status"}
              </CardTitle>
              <CardDescription className="dark:text-gray-400">
                {loanInfo && !loanInfo.repaid && Number.parseFloat(loanInfo.amount) > 0
                  ? "Your active loan details"
                  : "You don't have an active loan"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {loanInfo && !loanInfo.repaid && Number.parseFloat(loanInfo.amount) > 0 ? (
                <>
                  <div className="flex flex-col space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-2">
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Outstanding Balance</span>
                      <span className="text-2xl sm:text-3xl font-bold dark:text-white">
                        {Number.parseFloat(loanInfo.amount).toFixed(2)} USDT
                      </span>
                    </div>
                    <div className="flex items-center text-sm text-orange-600 dark:text-orange-400">
                      <Clock className="mr-1 h-4 w-4" />
                      <span>Due on {formatDate(loanInfo.dueDate)}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="dark:text-gray-300">Repayment Progress</span>
                      <span className="dark:text-gray-300">{calculateProgress().toFixed(0)}% Complete</span>
                    </div>
                    <Progress value={calculateProgress()} className="h-2" />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="rounded-lg bg-gray-50 dark:bg-gray-800 p-3 sm:p-4">
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500 dark:text-gray-400" />
                        <span className="text-sm font-medium dark:text-gray-300">Loan Term</span>
                      </div>
                      <p className="mt-2 text-xl sm:text-2xl font-bold dark:text-white">30 Days</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Started on {formatDate(new Date(loanInfo.dueDate.getTime() - 30 * 24 * 60 * 60 * 1000))}
                      </p>
                    </div>
                    <div className="rounded-lg bg-gray-50 dark:bg-gray-800 p-3 sm:p-4">
                      <div className="flex items-center space-x-2">
                        <CreditCard className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500 dark:text-gray-400" />
                        <span className="text-sm font-medium dark:text-gray-300">Interest</span>
                      </div>
                      <p className="mt-2 text-xl sm:text-2xl font-bold dark:text-white">
                        {Number.parseFloat(loanInfo.interest).toFixed(2)} USDT
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Total to repay: {(Number.parseFloat(loanInfo.amount) + Number.parseFloat(loanInfo.interest)).toFixed(2)} USDT
                      </p>
                    </div>
                  </div>

                  {loanInfo.guarantor && loanInfo.guarantor !== "0x0000000000000000000000000000000000000000" && (
                    <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 p-3 sm:p-4 text-sm text-blue-800 dark:text-blue-300">
                      <div className="flex items-start">
                        <CheckCircle className="mr-2 h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                        <div>
                          <p className="font-medium">Guarantor:</p>
                          <p className="text-xs break-all">{loanInfo.guarantor}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="rounded-lg bg-gray-50 dark:bg-gray-800 p-6 text-center">
                  <CreditCard className="h-12 w-12 mx-auto mb-4 text-gray-400 dark:text-gray-500" />
                  <h3 className="text-lg font-medium mb-2 dark:text-white">No Active Loan</h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-4">
                    You don't have any active loans at the moment.
                  </p>
                  {isEligible ? (
                    <p className="text-green-600 dark:text-green-400 font-medium">
                      You are eligible to apply for a loan!
                    </p>
                  ) : (
                    <p className="text-orange-600 dark:text-orange-400">
                      Continue saving to become eligible for a loan.
                    </p>
                  )}
                </div>
              )}
            </CardContent>
            {loanInfo && !loanInfo.repaid && Number.parseFloat(loanInfo.amount) > 0 && (
              <CardFooter>
                <Button
                  onClick={() => {
                    const totalDue = Number.parseFloat(loanInfo.amount) + Number.parseFloat(loanInfo.interest)
                    setRepayAmount(totalDue.toString())
                    document.getElementById("repay-tab").click()
                  }}
                  className="w-full bg-orange-600 hover:bg-orange-700 dark:bg-orange-600 dark:hover:bg-orange-700 text-sm sm:text-base"
                >
                  Repay Loan
                </Button>
              </CardFooter>
            )}
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="dark:text-white">Loan Eligibility</CardTitle>
              <CardDescription className="dark:text-gray-400">Your current borrowing status</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg bg-gray-50 dark:bg-gray-800 p-3 sm:p-4">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium dark:text-gray-300">Maximum Loan Amount</span>
                </div>
                <p className="mt-2 text-xl sm:text-2xl font-bold dark:text-white">
                  {isEligible ? "5.00 USDT" : "0.00 USDT"}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Based on your savings history</p>
              </div>

              <div className="rounded-lg bg-gray-50 dark:bg-gray-800 p-3 sm:p-4">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium dark:text-gray-300">USDT Balance</span>
                </div>
                <p className="mt-2 text-xl sm:text-2xl font-bold dark:text-white">
                  {Number.parseFloat(usdtBalance).toFixed(2)} USDT
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Available for repayments</p>
              </div>

              {loanInfo && !loanInfo.repaid && Number.parseFloat(loanInfo.amount) > 0 ? (
                <div className="rounded-lg bg-orange-50 dark:bg-orange-900/20 p-3 sm:p-4 text-sm text-orange-800 dark:text-orange-300">
                  <div className="flex items-start">
                    <AlertCircle className="mr-2 h-4 w-4 sm:h-5 sm:w-5 text-orange-600 dark:text-orange-400 flex-shrink-0" />
                    <p>You have an active loan. New loans are available after repayment.</p>
                  </div>
                </div>
              ) : isEligible ? (
                <div className="rounded-lg bg-green-50 dark:bg-green-900/20 p-3 sm:p-4 text-sm text-green-800 dark:text-green-300">
                  <div className="flex items-start">
                    <CheckCircle className="mr-2 h-4 w-4 sm:h-5 sm:w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                    <p>You are eligible for a loan! Apply now to access healthcare funds.</p>
                  </div>
                </div>
              ) : (
                <div className="rounded-lg bg-orange-50 dark:bg-orange-900/20 p-3 sm:p-4 text-sm text-orange-800 dark:text-orange-300">
                  <div className="flex items-start">
                    <AlertCircle className="mr-2 h-4 w-4 sm:h-5 sm:w-5 text-orange-600 dark:text-orange-400 flex-shrink-0" />
                    <p>Continue saving to become eligible for a loan.</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="repay" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="repay" id="repay-tab" className="text-xs sm:text-sm">
              Repay Loan
            </TabsTrigger>
            <TabsTrigger value="request" className="text-xs sm:text-sm">
              Request Loan
            </TabsTrigger>
            <TabsTrigger value="guarantor" className="text-xs sm:text-sm">
              Add Guarantor
            </TabsTrigger>
          </TabsList>
          <TabsContent value="repay" className="mt-4 sm:mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="dark:text-white">Repay Your Loan</CardTitle>
                <CardDescription className="dark:text-gray-400">
                  Make a payment towards your current loan
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
                    value={repayAmount}
                    onChange={(e) => setRepayAmount(e.target.value)}
                    disabled={!loanInfo || loanInfo.repaid || Number.parseFloat(loanInfo?.amount || 0) <= 0}
                    className="dark:border-gray-700"
                  />
                </div>

                {loanInfo && !loanInfo.repaid && Number.parseFloat(loanInfo.amount) > 0 ? (
                  <div className="rounded-lg bg-gray-50 dark:bg-gray-800 p-3 sm:p-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="dark:text-gray-300">Outstanding Balance</span>
                      <span className="dark:text-gray-300">{Number.parseFloat(loanInfo.amount).toFixed(2)} USDT</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="dark:text-gray-300">Interest</span>
                      <span className="dark:text-gray-300">{Number.parseFloat(loanInfo.interest).toFixed(2)} USDT</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="dark:text-gray-300">Payment Amount</span>
                      <span className="dark:text-gray-300">{Number.parseFloat(repayAmount || 0).toFixed(2)} USDT</span>
                    </div>
                    <div className="border-t dark:border-gray-700 pt-2 mt-2 flex justify-between font-medium">
                      <span className="dark:text-white">Total Payment</span>
                      <span className="dark:text-white">{Number.parseFloat(repayAmount || 0).toFixed(2)} USDT</span>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-lg bg-gray-50 dark:bg-gray-800 p-3 sm:p-4 text-center">
                    <p className="text-gray-500 dark:text-gray-400">You don't have any active loans to repay.</p>
                  </div>
                )}

                {loanInfo && !loanInfo.repaid && Number.parseFloat(loanInfo.amount) > 0 && (
                  <div className="rounded-lg bg-green-50 dark:bg-green-900/20 p-3 sm:p-4 text-sm text-green-800 dark:text-green-300">
                    <div className="flex items-start">
                      <CheckCircle className="mr-2 h-4 w-4 sm:h-5 sm:w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                      <p>Full repayment will make you eligible for a new loan immediately!</p>
                    </div>
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex flex-col">
                <Button
                  onClick={handleRepayLoan}
                  disabled={
                    isRepaying ||
                    !loanInfo ||
                    loanInfo.repaid ||
                    Number.parseFloat(loanInfo?.amount || 0) <= 0 ||
                    !repayAmount ||
                    Number.parseFloat(repayAmount) <= 0
                  }
                  className="w-full bg-orange-600 hover:bg-orange-700 dark:bg-orange-600 dark:hover:bg-orange-700"
                >
                  {isRepaying ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    "Confirm Repayment"
                  )}
                </Button>
                {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
                {success && <p className="text-green-500 text-sm mt-2">{success}</p>}
              </CardFooter>
            </Card>
          </TabsContent>
          <TabsContent value="request" className="mt-4 sm:mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="dark:text-white">Request a New Loan</CardTitle>
                <CardDescription className="dark:text-gray-400">Apply for healthcare microcredit</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {loanInfo && !loanInfo.repaid && Number.parseFloat(loanInfo.amount) > 0 ? (
                  <div className="rounded-lg bg-orange-50 dark:bg-orange-900/20 p-3 sm:p-4 text-sm text-orange-800 dark:text-orange-300">
                    <div className="flex items-start">
                      <AlertCircle className="mr-2 h-4 w-4 sm:h-5 sm:w-5 text-orange-600 dark:text-orange-400 flex-shrink-0" />
                      <p>You have an active loan. New loans are available after repayment.</p>
                    </div>
                  </div>
                ) : !isEligible ? (
                  <div className="rounded-lg bg-orange-50 dark:bg-orange-900/20 p-3 sm:p-4 text-sm text-orange-800 dark:text-orange-300">
                    <div className="flex items-start">
                      <AlertCircle className="mr-2 h-4 w-4 sm:h-5 sm:w-5 text-orange-600 dark:text-orange-400 flex-shrink-0" />
                      <p>You are not eligible for a loan yet. Continue saving to become eligible.</p>
                    </div>
                  </div>
                ) : null}

                <div className="space-y-2">
                  <label className="text-sm font-medium dark:text-gray-300">Amount (USDT)</label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    min="0.1"
                    step="0.1"
                    max="5.00"
                    value={loanAmount}
                    onChange={(e) => setLoanAmount(e.target.value)}
                    disabled={!isEligible || (loanInfo && !loanInfo.repaid && Number.parseFloat(loanInfo.amount) > 0)}
                    className="dark:border-gray-700"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium dark:text-gray-300">Loan Duration</label>
                  <Select
                    disabled={!isEligible || (loanInfo && !loanInfo.repaid && Number.parseFloat(loanInfo.amount) > 0)}
                    defaultValue="30"
                  >
                    <SelectTrigger className="dark:bg-gray-800 dark:border-gray-700">
                      <SelectValue placeholder="Select duration" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 days</SelectItem>
                      <SelectItem value="30">30 days</SelectItem>
                      <SelectItem value="45">45 days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {isEligible && (!loanInfo || loanInfo.repaid || Number.parseFloat(loanInfo.amount) <= 0) && (
                  <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 p-3 sm:p-4 text-sm text-blue-800 dark:text-blue-300">
                    <div className="flex items-start">
                      <CheckCircle className="mr-2 h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                      <div>
                        <p className="font-medium">Loan Terms:</p>
                        <ul className="list-disc list-inside mt-1 space-y-1">
                          <li>Maximum loan amount: 5.00 USDT</li>
                          <li>Interest rate: 3% for 30 days</li>
                          <li>Origination fee: 1%</li>
                          <li>Repayment in full by due date</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex flex-col">
                <Button
                  onClick={handleApplyLoan}
                  disabled={
                    isApplying ||
                    !isEligible ||
                    (loanInfo && !loanInfo.repaid && Number.parseFloat(loanInfo.amount) > 0) ||
                    !loanAmount ||
                    Number.parseFloat(loanAmount) <= 0
                  }
                  className="w-full bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700"
                >
                  {isApplying ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    "Request Loan"
                  )}
                </Button>
                {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
                {success && <p className="text-green-500 text-sm mt-2">{success}</p>}
              </CardFooter>
            </Card>
          </TabsContent>
          <TabsContent value="guarantor" className="mt-4 sm:mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="dark:text-white">Add a Guarantor</CardTitle>
                <CardDescription className="dark:text-gray-400">
                  A guarantor can help you qualify for larger loans
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium dark:text-gray-300">Guarantor Address</label>
                  <Input
                    placeholder="0x..."
                    value={guarantorAddress}
                    onChange={(e) => setGuarantorAddress(e.target.value)}
                    disabled={
                      !isEligible ||
                      (loanInfo &&
                        loanInfo.guarantor &&
                        loanInfo.guarantor !== "0x0000000000000000000000000000000000000000")
                    }
                    className="dark:border-gray-700"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Enter the wallet address of someone who agrees to be your guarantor
                  </p>
                </div>

                {loanInfo &&
                loanInfo.guarantor &&
                loanInfo.guarantor !== "0x0000000000000000000000000000000000000000" ? (
                  <div className="rounded-lg bg-green-50 dark:bg-green-900/20 p-3 sm:p-4 text-sm text-green-800 dark:text-green-300">
                    <div className="flex items-start">
                      <CheckCircle className="mr-2 h-4 w-4 sm:h-5 sm:w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                      <div>
                        <p className="font-medium">You already have a guarantor:</p>
                        <p className="text-xs break-all mt-1">{loanInfo.guarantor}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 p-3 sm:p-4 text-sm text-blue-800 dark:text-blue-300">
                    <div className="flex items-start">
                      <AlertCircle className="mr-2 h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                      <div>
                        <p className="font-medium">Guarantor Benefits:</p>
                        <ul className="list-disc list-inside mt-1 space-y-1">
                          <li>Helps you qualify for larger loans</li>
                          <li>Guarantor earns HST tokens when you repay on time</li>
                          <li>Builds trust in the HealFi community</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex flex-col">
                <Button
                  onClick={handleStakeGuarantor}
                  disabled={
                    isStaking ||
                    !isEligible ||
                    (loanInfo &&
                      loanInfo.guarantor &&
                      loanInfo.guarantor !== "0x0000000000000000000000000000000000000000") ||
                    !guarantorAddress ||
                    !guarantorAddress.startsWith("0x")
                  }
                  className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700"
                >
                  {isStaking ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    "Add Guarantor"
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
            <CardTitle className="dark:text-white">Loan History</CardTitle>
            <CardDescription className="dark:text-gray-400">Your past loans and repayments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-gray-500 dark:text-gray-400 text-center">
                Loan history not implemented yet
              </p>
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full dark:border-gray-700 dark:text-gray-200">
              View All Loan History
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}