import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Heart, ArrowRight, CheckCircle, RefreshCw, Repeat } from "lucide-react"

export default function TokensPage() {
  return (
    <div className="container px-4 md:px-6 py-8">
      <div className="flex flex-col space-y-8">
        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Your Tokens</h1>
          <p className="text-gray-500">Manage your Health Support Tokens (HST)</p>
        </div>

        {/* Token Balance Card */}
        <Card className="bg-gradient-to-br from-green-50 to-blue-50 border-none">
          <CardContent className="pt-6 px-4 sm:px-6">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="rounded-full bg-green-100 p-4">
                <Heart className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
              </div>
              <div>
                <h2 className="text-3xl sm:text-4xl font-bold">10 HST</h2>
                <p className="text-sm sm:text-base text-gray-600">Health Support Tokens</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 w-full max-w-md mt-2">
                <Button className="flex-1 bg-green-600 hover:bg-green-700 text-sm sm:text-base py-2">
                  Swap for cUSD
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 border-orange-600 text-orange-600 hover:bg-orange-50 text-sm sm:text-base py-2"
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
              <CardTitle>Earning Opportunities</CardTitle>
              <CardDescription>Ways to earn more HST tokens</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg bg-green-50 p-4">
                <div className="flex items-start">
                  <CheckCircle className="mr-2 h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Repay loans on time</p>
                    <p className="text-sm text-gray-600">Earn 2 HST for each on-time loan repayment</p>
                  </div>
                </div>
              </div>
              <div className="rounded-lg bg-blue-50 p-4">
                <div className="flex items-start">
                  <RefreshCw className="mr-2 h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Maintain a savings streak</p>
                    <p className="text-sm text-gray-600">Earn 1 HST for every 4 weeks of consistent savings</p>
                  </div>
                </div>
              </div>
              <div className="rounded-lg bg-purple-50 p-4">
                <div className="flex items-start">
                  <Heart className="mr-2 h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Refer friends to HealFi</p>
                    <p className="text-sm text-gray-600">Earn 5 HST for each friend who joins and saves</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Token Benefits</CardTitle>
              <CardDescription>How to use your HST tokens</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg bg-orange-50 p-4">
                <div className="flex items-start">
                  <ArrowRight className="mr-2 h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Discounts at healthcare partners</p>
                    <p className="text-sm text-gray-600">Get 3-10% off at partner clinics and pharmacies</p>
                  </div>
                </div>
              </div>
              <div className="rounded-lg bg-green-50 p-4">
                <div className="flex items-start">
                  <Repeat className="mr-2 h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Swap for cUSD</p>
                    <p className="text-sm text-gray-600">Exchange tokens for cUSD at current rates</p>
                  </div>
                </div>
              </div>
              <div className="rounded-lg bg-blue-50 p-4">
                <div className="flex items-start">
                  <CheckCircle className="mr-2 h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Governance voting</p>
                    <p className="text-sm text-gray-600">Participate in HealFi community decisions</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Token History */}
        <Card>
          <CardHeader>
            <CardTitle>Token History</CardTitle>
            <CardDescription>Your recent HST transactions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b pb-4">
                <div className="flex items-center space-x-3 mb-2 sm:mb-0">
                  <div className="rounded-full bg-green-100 p-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium">Earned 2 HST</p>
                    <p className="text-sm text-gray-500">Loan repayment bonus</p>
                  </div>
                </div>
                <div className="text-left sm:text-right">
                  <p className="text-sm font-medium">+2 HST</p>
                  <p className="text-xs text-gray-500">April 1, 2025</p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b pb-4">
                <div className="flex items-center space-x-3 mb-2 sm:mb-0">
                  <div className="rounded-full bg-orange-100 p-2">
                    <ArrowRight className="h-4 w-4 text-orange-600" />
                  </div>
                  <div>
                    <p className="font-medium">Used 1 HST</p>
                    <p className="text-sm text-gray-500">Discount at Abeokuta Clinic</p>
                  </div>
                </div>
                <div className="text-left sm:text-right">
                  <p className="text-sm font-medium">-1 HST</p>
                  <p className="text-xs text-gray-500">March 10, 2025</p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center space-x-3 mb-2 sm:mb-0">
                  <div className="rounded-full bg-blue-100 p-2">
                    <RefreshCw className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium">Earned 1 HST</p>
                    <p className="text-sm text-gray-500">Savings streak bonus</p>
                  </div>
                </div>
                <div className="text-left sm:text-right">
                  <p className="text-sm font-medium">+1 HST</p>
                  <p className="text-xs text-gray-500">February 28, 2025</p>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full">
              View All Token History
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}

