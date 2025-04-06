import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CreditCard, Calendar, Clock, CheckCircle, AlertCircle } from "lucide-react"

export default function LoansPage() {
  return (
    <div className="container px-4 md:px-6 py-8">
      <div className="flex flex-col space-y-8">
        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Your Loans</h1>
          <p className="text-gray-500">Manage your healthcare microloans</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Current Loan</CardTitle>
              <CardDescription>Your active loan details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col space-y-2">
                <div className="flex items-baseline justify-between">
                  <span className="text-sm font-medium text-gray-500">Outstanding Balance</span>
                  <span className="text-3xl font-bold">2.00 cUSD</span>
                </div>
                <div className="flex items-center text-sm text-orange-600">
                  <Clock className="mr-1 h-4 w-4" />
                  <span>Due in 10 days (April 16, 2025)</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Repayment Progress</span>
                  <span>30% Complete</span>
                </div>
                <Progress value={30} className="h-2" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg bg-gray-50 p-4">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-5 w-5 text-gray-500" />
                    <span className="text-sm font-medium">Loan Term</span>
                  </div>
                  <p className="mt-2 text-2xl font-bold">30 Days</p>
                  <p className="text-xs text-gray-500">Started on March 17, 2025</p>
                </div>
                <div className="rounded-lg bg-gray-50 p-4">
                  <div className="flex items-center space-x-2">
                    <CreditCard className="h-5 w-5 text-gray-500" />
                    <span className="text-sm font-medium">Interest Rate</span>
                  </div>
                  <p className="mt-2 text-2xl font-bold">3%</p>
                  <p className="text-xs text-gray-500">Total interest: 0.06 cUSD</p>
                </div>
              </div>

              <div className="rounded-lg bg-green-50 p-4 text-sm text-green-800">
                <div className="flex items-start">
                  <CheckCircle className="mr-2 h-5 w-5 text-green-600 flex-shrink-0" />
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
              <Button className="w-full bg-orange-600 hover:bg-orange-700">Repay Loan</Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Loan Eligibility</CardTitle>
              <CardDescription>Your current borrowing status</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg bg-gray-50 p-4">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium">Maximum Loan Amount</span>
                </div>
                <p className="mt-2 text-2xl font-bold">5.00 cUSD</p>
                <p className="text-xs text-gray-500">Based on your savings history</p>
              </div>

              <div className="rounded-lg bg-gray-50 p-4">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium">Available to Borrow</span>
                </div>
                <p className="mt-2 text-2xl font-bold">3.00 cUSD</p>
                <p className="text-xs text-gray-500">After current loan is repaid</p>
              </div>

              <div className="rounded-lg bg-orange-50 p-4 text-sm text-orange-800">
                <div className="flex items-start">
                  <AlertCircle className="mr-2 h-5 w-5 text-orange-600 flex-shrink-0" />
                  <p>You have an active loan. New loans are available after repayment.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="repay" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="repay">Repay Loan</TabsTrigger>
            <TabsTrigger value="request">Request Loan</TabsTrigger>
          </TabsList>
          <TabsContent value="repay" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Repay Your Loan</CardTitle>
                <CardDescription>Make a payment towards your current loan</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Amount (cUSD)</label>
                  <Input type="number" placeholder="0.00" min="0.1" step="0.1" max="2.00" defaultValue="2.00" />
                </div>
                <div className="rounded-lg bg-gray-50 p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Outstanding Balance</span>
                    <span>2.00 cUSD</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Payment Amount</span>
                    <span>2.00 cUSD</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Transaction Fee</span>
                    <span>0.01 cUSD</span>
                  </div>
                  <div className="border-t pt-2 mt-2 flex justify-between font-medium">
                    <span>Total Payment</span>
                    <span>2.01 cUSD</span>
                  </div>
                </div>
                <div className="rounded-lg bg-green-50 p-4 text-sm text-green-800">
                  <div className="flex items-start">
                    <CheckCircle className="mr-2 h-5 w-5 text-green-600 flex-shrink-0" />
                    <p>Full repayment will make you eligible for a new loan immediately!</p>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full bg-orange-600 hover:bg-orange-700">Confirm Repayment</Button>
              </CardFooter>
            </Card>
          </TabsContent>
          <TabsContent value="request" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Request a New Loan</CardTitle>
                <CardDescription>Apply for healthcare microcredit</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="rounded-lg bg-orange-50 p-4 text-sm text-orange-800">
                  <div className="flex items-start">
                    <AlertCircle className="mr-2 h-5 w-5 text-orange-600 flex-shrink-0" />
                    <p>You have an active loan. New loans are available after repayment.</p>
                  </div>
                </div>
                <div className="space-y-2 opacity-60">
                  <label className="text-sm font-medium">Amount (cUSD)</label>
                  <Input type="number" placeholder="0.00" min="0.1" step="0.1" max="5.00" disabled />
                </div>
                <div className="space-y-2 opacity-60">
                  <label className="text-sm font-medium">Loan Duration</label>
                  <Select disabled>
                    <SelectTrigger>
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
                  <label className="text-sm font-medium">Guarantor Address (Optional)</label>
                  <Input placeholder="0x..." disabled />
                  <p className="text-xs text-gray-500">A friend who can vouch for your repayment</p>
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
            <CardTitle>Loan History</CardTitle>
            <CardDescription>Your past loans and repayments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b pb-4">
                <div className="flex items-center space-x-3">
                  <div className="rounded-full bg-green-100 p-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium">Loan Repaid</p>
                    <p className="text-sm text-gray-500">Full repayment</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">1.00 cUSD</p>
                  <p className="text-xs text-gray-500">Feb 15, 2025</p>
                </div>
              </div>
              <div className="flex items-center justify-between border-b pb-4">
                <div className="flex items-center space-x-3">
                  <div className="rounded-full bg-orange-100 p-2">
                    <CreditCard className="h-4 w-4 text-orange-600" />
                  </div>
                  <div>
                    <p className="font-medium">Loan Issued</p>
                    <p className="text-sm text-gray-500">30-day term</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">1.00 cUSD</p>
                  <p className="text-xs text-gray-500">Jan 16, 2025</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="rounded-full bg-green-100 p-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium">Loan Repaid</p>
                    <p className="text-sm text-gray-500">Full repayment</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">0.50 cUSD</p>
                  <p className="text-xs text-gray-500">Dec 20, 2024</p>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full">
              View All Loan History
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}

