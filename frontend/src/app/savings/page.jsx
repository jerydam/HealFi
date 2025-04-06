import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowUp, ArrowDown, TrendingUp, Calendar, Info } from "lucide-react"

export default function SavingsPage() {
  return (
    <div className="container px-4 md:px-6 py-6 sm:py-8">
      <div className="flex flex-col space-y-6 sm:space-y-8">
        <div className="flex flex-col space-y-2">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Your Savings</h1>
          <p className="text-gray-500 text-sm sm:text-base">Manage your healthcare savings account</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Savings Overview</CardTitle>
              <CardDescription>Your current savings and progress</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-2">
                  <span className="text-sm font-medium text-gray-500">Current Balance</span>
                  <span className="text-2xl sm:text-3xl font-bold">5.20 cUSD</span>
                </div>
                <div className="flex items-center text-sm text-green-600">
                  <TrendingUp className="mr-1 h-4 w-4" />
                  <span>+0.20 cUSD interest earned this month</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Savings Goal: 10 cUSD</span>
                  <span>52% Complete</span>
                </div>
                <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-green-600 rounded-full" style={{ width: "52%" }}></div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-lg bg-gray-50 p-3 sm:p-4">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500" />
                    <span className="text-sm font-medium">Savings Streak</span>
                  </div>
                  <p className="mt-2 text-xl sm:text-2xl font-bold">3 Weeks</p>
                  <p className="text-xs text-gray-500">Keep going to earn bonus tokens!</p>
                </div>
                <div className="rounded-lg bg-gray-50 p-3 sm:p-4">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500" />
                    <span className="text-sm font-medium">Interest Rate</span>
                  </div>
                  <p className="mt-2 text-xl sm:text-2xl font-bold">5% APY</p>
                  <p className="text-xs text-gray-500">Earn more by saving regularly</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Manage your savings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button className="w-full bg-green-600 hover:bg-green-700 text-sm sm:text-base">
                <ArrowUp className="mr-2 h-3 w-3 sm:h-4 sm:w-4" /> Add Savings
              </Button>
              <Button variant="outline" className="w-full text-sm sm:text-base">
                <ArrowDown className="mr-2 h-3 w-3 sm:h-4 sm:w-4" /> Withdraw
              </Button>
              <div className="rounded-lg bg-blue-50 p-3 sm:p-4 text-sm text-blue-800">
                <div className="flex items-start">
                  <Info className="mr-2 h-4 w-4 sm:h-5 sm:w-5 text-blue-600 flex-shrink-0" />
                  <p>Save weekly to earn more interest and unlock bigger loans!</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="deposit" className="w-full">
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
                <CardTitle>Add to Your Savings</CardTitle>
                <CardDescription>Deposit cUSD to grow your healthcare fund</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Amount (cUSD)</label>
                  <Input type="number" placeholder="0.00" min="0.1" step="0.1" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Quick Select</span>
                    <span>1.00 cUSD</span>
                  </div>
                  <Slider defaultValue={[10]} max={30} step={5} />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>0.5 cUSD</span>
                    <span>1.0 cUSD</span>
                    <span>2.0 cUSD</span>
                    <span>3.0 cUSD</span>
                  </div>
                </div>
                <div className="rounded-lg bg-gray-50 p-3 sm:p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Amount</span>
                    <span>1.00 cUSD</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Transaction Fee</span>
                    <span>0.01 cUSD</span>
                  </div>
                  <div className="border-t pt-2 mt-2 flex justify-between font-medium">
                    <span>Total</span>
                    <span>1.01 cUSD</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full bg-green-600 hover:bg-green-700">Save Now</Button>
              </CardFooter>
            </Card>
          </TabsContent>
          <TabsContent value="withdraw" className="mt-4 sm:mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Withdraw Savings</CardTitle>
                <CardDescription>Access your funds when you need them</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Amount (cUSD)</label>
                  <Input type="number" placeholder="0.00" min="0.1" step="0.1" max="5.20" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Available Balance</span>
                    <span>5.20 cUSD</span>
                  </div>
                  <Slider defaultValue={[26]} max={52} step={1} />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>0.0 cUSD</span>
                    <span>2.6 cUSD</span>
                    <span>5.2 cUSD</span>
                  </div>
                </div>
                <div className="rounded-lg bg-gray-50 p-3 sm:p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Amount</span>
                    <span>2.60 cUSD</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Transaction Fee</span>
                    <span>0.01 cUSD</span>
                  </div>
                  <div className="border-t pt-2 mt-2 flex justify-between font-medium">
                    <span>Total to Receive</span>
                    <span>2.59 cUSD</span>
                  </div>
                </div>
                <div className="rounded-lg bg-orange-50 p-3 sm:p-4 text-sm text-orange-800">
                  <div className="flex items-start">
                    <Info className="mr-2 h-4 w-4 sm:h-5 sm:w-5 text-orange-600 flex-shrink-0" />
                    <p>Withdrawing may affect your loan eligibility and interest earnings.</p>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full">
                  Withdraw Funds
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>

        <Card>
          <CardHeader>
            <CardTitle>Transaction History</CardTitle>
            <CardDescription>Your recent savings activities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b pb-4">
                <div className="flex items-center space-x-3 mb-2 sm:mb-0">
                  <div className="rounded-full bg-green-100 p-2">
                    <ArrowUp className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium">Deposit</p>
                    <p className="text-sm text-gray-500">Weekly savings</p>
                  </div>
                </div>
                <div className="text-left sm:text-right">
                  <p className="text-sm font-medium">+1.00 cUSD</p>
                  <p className="text-xs text-gray-500">Apr 3, 2025</p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b pb-4">
                <div className="flex items-center space-x-3 mb-2 sm:mb-0">
                  <div className="rounded-full bg-blue-100 p-2">
                    <TrendingUp className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium">Interest</p>
                    <p className="text-sm text-gray-500">Monthly interest payment</p>
                  </div>
                </div>
                <div className="text-left sm:text-right">
                  <p className="text-sm font-medium">+0.20 cUSD</p>
                  <p className="text-xs text-gray-500">Apr 1, 2025</p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center space-x-3 mb-2 sm:mb-0">
                  <div className="rounded-full bg-green-100 p-2">
                    <ArrowUp className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium">Deposit</p>
                    <p className="text-sm text-gray-500">Weekly savings</p>
                  </div>
                </div>
                <div className="text-left sm:text-right">
                  <p className="text-sm font-medium">+1.00 cUSD</p>
                  <p className="text-xs text-gray-500">Mar 27, 2025</p>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full">
              View All Transactions
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}

