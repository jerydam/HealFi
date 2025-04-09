import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CreditCard, Calendar, Clock, CheckCircle, AlertCircle } from 'lucide-react'

export default function LoansPage() {
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
              <CardTitle className="dark:text-white">Current Loan</CardTitle>
              <CardDescription className="dark:text-gray-400">Your active loan details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-2">
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Outstanding Balance</span>
                  <span className="text-2xl sm:text-3xl font-bold dark:text-white">2.00 cUSD</span>
                </div>
                <div className="flex items-center text-sm text-orange-600 dark:text-orange-400">
                  <Clock className="mr-1 h-4 w-4" />
                  <span>Due in 10 days (April 16, 2025)</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="dark:text-gray-300">Repayment Progress</span>
                  <span className="dark:text-gray-300">30% Complete</span>
                </div>
                <Progress value={30} className="h-2" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-lg bg-gray-50 dark:bg-gray-800 p-3 sm:p-4">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500 dark:text-gray-400" />
                    <span className="text-sm font-medium dark:text-gray-300">Loan Term</span>
                  </div>
                  <p className="mt-2 text-xl sm:text-2xl font-bold dark:text-white">30 Days</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Started on March 17, 2025</p>
                </div>
                <div className="rounded-lg bg-gray-50 dark:bg-gray-800 p-3 sm:p-4">
                  <div className="flex items-center space-x-2">
                    <CreditCard className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500 dark:text-gray-400" />
                    <span className="text-sm font-medium dark:text-gray-300">Interest Rate</span>
                  </div>
                  <p className="mt-2 text-xl sm:text-2xl font-bold dark:text-white">3%</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Total interest: 0.06 cUSD</p>
                </div>
              </div>

              <div className="rounded-lg bg-green-50 dark:bg-green-900/20 p-3 sm:p-4 text-sm text-green-800 dark:text-green-300">
                <div className="flex items-start">
                  <CheckCircle className="mr-2 h-4 w-4 sm:h-5 sm:w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                  <div>
                    <p className="font-medium">On-time repayment benefits:</p>
                    <ul className="list-disc list-inside mt-1 space-y-1">
                      <li>Earn 2 HST tokens</li>
                      <li>Increase your loan limit</li>
                      <li>Reduce future interest rates</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full bg-orange-600 hover:bg-orange-700 dark:bg-orange-600 dark:hover:bg-orange-700 text-sm sm:text-base">
                Repay Loan
              </Button>
            </CardFooter>
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
                <p className="mt-2 text-xl sm:text-2xl font-bold dark:text-white">5.00 cUSD</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Based on your savings history</p>
              </div>

              <div className="rounded-lg bg-gray-50 dark:bg-gray-800 p-3 sm:p-4">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium dark:text-gray-300">Available to Borrow</span>
                </div>
                <p className="mt-2 text-xl sm:text-2xl font-bold dark:text-white">3.00 cUSD</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">After current loan is repaid</p>
              </div>

              <div className="rounded-lg bg-orange-50 dark:bg-orange-900/20 p-3 sm:p-4 text-sm text-orange-800 dark:text-orange-300">
                <div className="flex items-start">
                  <AlertCircle className="mr-2 h-4 w-4 sm:h-5 sm:w-5 text-orange-600 dark:text-orange-400 flex-shrink-0" />
                  <p>You have an active loan. New loans are available after repayment.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="repay" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="repay" className="text-xs sm:text-sm">
              Repay Loan
            </TabsTrigger>
            <TabsTrigger value="request" className="text-xs sm:text-sm">
              Request Loan
            </TabsTrigger>
          </TabsList>
          <TabsContent value="repay" className="mt-4 sm:mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="dark:text-white">Repay Your Loan</CardTitle>
                <CardDescription className="dark:text-gray-400">Make a payment towards your current loan</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium dark:text-gray-300">Amount (cUSD)</label>
                  <Input type="number" placeholder="0.00" min="0.1" step="0.1" max="2.00" defaultValue="2.00" />
                </div>
                <div className="rounded-lg bg-gray-50 dark:bg-gray-800 p-3 sm:p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="dark:text-gray-300">Outstanding Balance</span>
                    <span className="dark:text-gray-300">2.00 cUSD</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="dark:text-gray-300">Payment Amount</span>
                    <span className="dark:text-gray-300">2.00 cUSD</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="dark:text-gray-300">Transaction Fee</span>
                    <span className="dark:text-gray-300">0.01 cUSD</span>
                  </div>
                  <div className="border-t dark:border-gray-700 pt-2 mt-2 flex justify-between font-medium">
                    <span className="dark:text-white">Total Payment</span>
                    <span className="dark:text-white">2.01 cUSD</span>
                  </div>
                </div>
                <div className="rounded-lg bg-green-50 dark:bg-green-900/20 p-3 sm:p-4 text-sm text-green-800 dark:text-green-300">
                  <div className="flex items-start">
                    <CheckCircle className="mr-2 h-4 w-4 sm:h-5 sm:w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                    <p>Full repayment will make you eligible for a new loan immediately!</p>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full bg-orange-600 hover:bg-orange-700 dark:bg-orange-600 dark:hover:bg-orange-700">
                  Confirm Repayment
                </Button>
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
                <div className="rounded-lg bg-orange-50 dark:bg-orange-900/20 p-3 sm:p-4 text-sm text-orange-800 dark:text-orange-300">
                  <div className="flex items-start">
                    <AlertCircle className="mr-2 h-4 w-4 sm:h-5 sm:w-5 text-orange-600 dark:text-orange-400 flex-shrink-0" />
                    <p>You have an active loan. New loans are available after repayment.</p>
                  </div>
                </div>
                <div className="space-y-2 opacity-60">
                  <label className="text-sm font-medium dark:text-gray-400">Amount (cUSD)</label>
                  <Input type="number" placeholder="0.00" min="0.1" step="0.1" max="5.00" disabled />
                </div>
                <div className="space-y-2 opacity-60">
                  <label className="text-sm font-medium dark:text-gray-400">Loan Duration</label>
                  <Select disabled>
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
                <div className="space-y-2 opacity-60">
                  <label className="text-sm font-medium dark:text-gray-400">Guarantor Address (Optional)</label>
                  <Input placeholder="0x..." disabled className="dark:bg-gray-800 dark:border-gray-700" />
                  <p className="text-xs text-gray-500 dark:text-gray-400">A friend who can vouch for your repayment</p>
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full" disabled>
                  Request Loan
                </Button>
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
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b dark:border-gray-700 pb-4">
                <div className="flex items-center space-x-3 mb-2 sm:mb-0">
                  <div className="rounded-full bg-green-100 dark:bg-green-900/30 p-2">
                    <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="font-medium dark:text-white">Loan Repaid</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Full repayment</p>
                  </div>
                </div>
                <div className="text-left sm:text-right">
                  <p className="text-sm font-medium dark:text-white">1.00 cUSD</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Feb 15, 2025</p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b dark:border-gray-700 pb-4">
                <div className="flex items-center space-x-3 mb-2 sm:mb-0">
                  <div className="rounded-full bg-orange-100 dark:bg-orange-900/30 p-2">
                    <CreditCard className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div>
                    <p className="font-medium dark:text-white">Loan Issued</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">30-day term</p>
                  </div>
                </div>
                <div className="text-left sm:text-right">
                  <p className="text-sm font-medium dark:text-white">1.00 cUSD</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Jan 16, 2025</p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center space-x-3 mb-2 sm:mb-0">
                  <div className="rounded-full bg-green-100 dark:bg-green-900/30 p-2">
                    <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="font-medium dark:text-white">Loan Repaid</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Full repayment</p>
                  </div>
                </div>
                <div className="text-left sm:text-right">
                  <p className="text-sm font-medium dark:text-white">0.50 cUSD</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Dec 20, 2024</p>
                </div>
              </div>
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
