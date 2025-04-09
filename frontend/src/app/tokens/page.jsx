import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Heart, ArrowRight, CheckCircle, RefreshCw, Repeat } from "lucide-react"

export default function TokensPage() {
  return (
    <div className="container mx-auto px-4 md:px-6 py-6 sm:py-8">
      <div className="flex flex-col space-y-8">
        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl font-bold tracking-tight dark:text-white">Your Tokens</h1>
          <p className="text-gray-500 dark:text-gray-400">Manage your Health Support Tokens (HST)</p>
        </div>

        {/* Token Balance Card */}
        <Card className="bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 dark:border-gray-800 border-none">
          <CardContent className="pt-6 px-4 sm:px-6">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="rounded-full bg-green-100 dark:bg-green-900/30 p-4">
                <Heart className="h-6 w-6 sm:h-8 sm:w-8 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h2 className="text-3xl sm:text-4xl font-bold dark:text-white">10 HST</h2>
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">Health Support Tokens</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 w-full max-w-md mt-2">
                <Button className="flex-1 bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700 text-sm sm:text-base py-2">
                  Swap for cUSD
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 border-orange-600 text-orange-600 hover:bg-orange-50 dark:border-orange-500 dark:text-orange-400 dark:hover:bg-orange-900/20 text-sm sm:text-base py-2"
                >
                  Use at Clinic
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Token Actions */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="dark:text-white">Earning Opportunities</CardTitle>
              <CardDescription className="dark:text-gray-400">Ways to earn more HST tokens</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg bg-green-50 dark:bg-green-900/20 p-4">
                <div className="flex items-start">
                  <CheckCircle className="mr-2 h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium dark:text-white">Repay loans on time</p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Earn 2 HST for each on-time loan repayment
                    </p>
                  </div>
                </div>
              </div>
              <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 p-4">
                <div className="flex items-start">
                  <RefreshCw className="mr-2 h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium dark:text-white">Maintain a savings streak</p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Earn 1 HST for every 4 weeks of consistent savings
                    </p>
                  </div>
                </div>
              </div>
              <div className="rounded-lg bg-purple-50 dark:bg-purple-900/20 p-4">
                <div className="flex items-start">
                  <Heart className="mr-2 h-5 w-5 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium dark:text-white">Refer friends to HealFi</p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Earn 5 HST for each friend who joins and saves
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="dark:text-white">Token Benefits</CardTitle>
              <CardDescription className="dark:text-gray-400">How to use your HST tokens</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg bg-orange-50 dark:bg-orange-900/20 p-4">
                <div className="flex items-start">
                  <ArrowRight className="mr-2 h-5 w-5 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium dark:text-white">Discounts at healthcare partners</p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Get 3-10% off at partner clinics and pharmacies
                    </p>
                  </div>
                </div>
              </div>
              <div className="rounded-lg bg-green-50 dark:bg-green-900/20 p-4">
                <div className="flex items-start">
                  <Repeat className="mr-2 h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium dark:text-white">Swap for cUSD</p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Exchange tokens for cUSD at current rates
                    </p>
                  </div>
                </div>
              </div>
              <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 p-4">
                <div className="flex items-start">
                  <CheckCircle className="mr-2 h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium dark:text-white">Governance voting</p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Participate in HealFi community decisions
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Token History */}
        <Card>
          <CardHeader>
            <CardTitle className="dark:text-white">Token History</CardTitle>
            <CardDescription className="dark:text-gray-400">Your recent HST transactions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b dark:border-gray-700 pb-4">
                <div className="flex items-center space-x-3 mb-2 sm:mb-0">
                  <div className="rounded-full bg-green-100 dark:bg-green-900/30 p-2">
                    <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="font-medium dark:text-white">Earned 2 HST</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Loan repayment bonus</p>
                  </div>
                </div>
                <div className="text-left sm:text-right">
                  <p className="text-sm font-medium dark:text-white">+2 HST</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">April 1, 2025</p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b dark:border-gray-700 pb-4">
                <div className="flex items-center space-x-3 mb-2 sm:mb-0">
                  <div className="rounded-full bg-orange-100 dark:bg-orange-900/30 p-2">
                    <ArrowRight className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div>
                    <p className="font-medium dark:text-white">Used 1 HST</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Discount at Abeokuta Clinic</p>
                  </div>
                </div>
                <div className="text-left sm:text-right">
                  <p className="text-sm font-medium dark:text-white">-1 HST</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">March 10, 2025</p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center space-x-3 mb-2 sm:mb-0">
                  <div className="rounded-full bg-blue-100 dark:bg-blue-900/30 p-2">
                    <RefreshCw className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="font-medium dark:text-white">Earned 1 HST</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Savings streak bonus</p>
                  </div>
                </div>
                <div className="text-left sm:text-right">
                  <p className="text-sm font-medium dark:text-white">+1 HST</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">February 28, 2025</p>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full dark:border-gray-700 dark:text-gray-200">
              View All Token History
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
