import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowUp, ArrowDown, TrendingUp, Calendar, Info } from 'lucide-react'

export default function SavingsPage() {
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
                  <span className="text-2xl sm:text-3xl font-bold dark:text-white">5.20 cUSD</span>
                </div>
                <div className="flex items-center text-sm text-green-600 dark:text-green-400">
                  <TrendingUp className="mr-1 h-4 w-4" />
                  <span>+0.20 cUSD interest earned this month</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="dark:text-gray-300">Savings Goal: 10 cUSD</span>
                  <span className="dark:text-gray-300">52% Complete</span>
                </div>
                <div className="h-2 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div className="h-full bg-green-600 dark:bg-green-500 rounded-full" style={{ width: "52%" }}></div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-lg bg-gray-50 dark:bg-gray-800 p-3 sm:p-4">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500 dark:text-gray-400" />
                    <span className="text-sm font-medium dark:text-gray-300">Savings Streak</span>
                  </div>
                  <p className="mt-2 text-xl sm:text-2xl font-bold dark:text-white">3 Weeks</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Keep going to earn bonus tokens!</p>
                </div>
                <div className="rounded-lg bg-gray-50 dark:bg-gray-800 p-3 sm:p-4">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500 dark:text-gray-400" />
                    <span className="text-sm font-medium dark:text-gray-300">Interest Rate</span>
                  </div>
                  <p className="mt-2 text-xl sm:text-2xl font-bold dark:text-white">5% APY</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Earn more by saving regularly</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="dark:text-white">Quick Actions</CardTitle>
              <CardDescription className="dark:text-gray-400">Manage your savings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button className="w-full bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700 text-sm sm:text-base">
                <ArrowUp className="mr-2 h-3 w-3 sm:h-4 sm:w-4" /> Add Savings
              </Button>
              <Button variant="outline" className="w-full text-sm sm:text-base dark:border-gray-700 dark:text-gray-200">
                <ArrowDown className="mr-2 h-3 w-3 sm:h-4 sm:w-4" /> Withdraw
              </Button>
              <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 p-3 sm:p-4 text-sm text-blue-800 dark:text-blue-300">
                <div className="flex items-start">
                  <Info className="mr-2 h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
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
                <CardTitle className="dark:text-white">Add to Your Savings</CardTitle>
                <CardDescription className="dark:text-gray-400">Deposit cUSD to grow your healthcare fund</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium dark:text-gray-300">Amount (cUSD)</label>
                  <Input type="number" placeholder="0.00" min="0.1" step="0.1" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="dark:text-gray-300">Quick Select</span>
                    <span className="dark:text-gray-300">1.00 cUSD</span>
                  </div>
                  <Slider defaultValue={[10]} max={30} step={5} />
                  <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                    <span>0.5 cUSD</span>
                    <span>1.0 cUSD</span>
                    <span>2.0 cUSD</span>
                    <span>3.0 cUSD</span>
                  </div>
                </div>
                <div className="rounded-lg bg-gray-50 dark:bg-gray-800 p-3 sm:p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="dark:text-gray-300">Amount</span>
                    <span className="dark:text-gray-300">1.00 cUSD</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="dark:text-gray-300">Transaction Fee</span>
                    <span className="dark:text-gray-300">0.01 cUSD</span>
                  </div>
                  <div className="border-t dark:border-gray-700 pt-2 mt-2 flex justify-between font-medium">
                    <span className="dark:text-white">Total</span>
                    <span className="dark:text-white">1.01 cUSD</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700">Save Now</Button>
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
                  <label className="text-sm font-medium dark:text-gray-300">Amount (cUSD)</label>
                  <Input type="number" placeholder="0.00" min="0.1" step="0.1" max="5.20" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="dark:text-gray-300">Available Balance</span>
                    <span className="dark:text-gray-300">5.20 cUSD</span>
                  </div>
                  <Slider defaultValue={[26]} max={52} step={1} />
                  <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                    <span>0.0 cUSD</span>
                    <span>2.6 cUSD</span>
                    <span>5.2 cUSD</span>
                  </div>
                </div>
                <div className="rounded-lg bg-gray-50 dark:bg-gray-800 p-3 sm:p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="dark:text-gray-300">Amount</span>
                    <span className="dark:text-gray-300">2.60 cUSD</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="dark:text-gray-300">Transaction Fee</span>
                    <span className="dark:text-gray-300">0.01 cUSD</span>
                  </div>
                  <div className="border-t dark:border-gray-700 pt-2 mt-2 flex justify-between font-medium">
                    <span className="dark:text-white">Total to Receive</span>
                    <span className="dark:text-white">2.59 cUSD</span>
                  </div>
                </div>
                <div className="rounded-lg bg-orange-50 dark:bg-orange-900/20 p-3 sm:p-4 text-sm text-orange-800 dark:text-orange-300">
                  <div className="flex items-start">
                    <Info className="mr-2 h-4 w-4 sm:h-5 sm:w-5 text-orange-600 dark:text-orange-400 flex-shrink-0" />
                    <p>Withdrawing may affect your loan eligibility and interest earnings.</p>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full dark:border-gray-700 dark:text-gray-200">
                  Withdraw Funds
                </Button>
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
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b dark:border-gray-700 pb-4">
                <div className="flex items-center space-x-3 mb-2 sm:mb-0">
                  <div className="rounded-full bg-green-100 dark:bg-green-900/30 p-2">
                    <ArrowUp className="h-4 w-4 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="font-medium dark:text-white">Deposit</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Weekly savings</p>
                  </div>
                </div>
                <div className="text-left sm:text-right">
                  <p className="text-sm font-medium dark:text-white">+1.00 cUSD</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Apr 3, 2025</p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b dark:border-gray-700 pb-4">
                <div className="flex items-center space-x-3 mb-2 sm:mb-0">
                  <div className="rounded-full bg-blue-100 dark:bg-blue-900/30 p-2">
                    <TrendingUp className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="font-medium dark:text-white">Interest</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Monthly interest payment</p>
                  </div>
                </div>
                <div className="text-left sm:text-right">
                  <p className="text-sm font-medium dark:text-white">+0.20 cUSD</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Apr 1, 2025</p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center space-x-3 mb-2 sm:mb-0">
                  <div className="rounded-full bg-green-100 dark:bg-green-900/30 p-2">
                    <ArrowUp className="h-4 w-4 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="font-medium dark:text-white">Deposit</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Weekly savings</p>
                  </div>
                </div>
                <div className="text-left sm:text-right">
                  <p className="text-sm font-medium dark:text-white">+1.00 cUSD</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Mar 27, 2025</p>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full dark:border-gray-700 dark:text-gray-200">
              View All Transactions
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
