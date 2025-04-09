import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Wallet, CreditCard, Heart, ArrowUpRight, Plus, Clock, CheckCircle } from "lucide-react"

export default function Dashboard() {
  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1 py-6 sm:py-8">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex flex-col space-y-6 sm:space-y-8">
            {/* Header */}
            <div className="flex flex-col space-y-2">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight dark:text-white">Dashboard</h1>
              <p className="text-gray-500 dark:text-gray-400 text-sm sm:text-base">
                Manage your healthcare savings and loans
              </p>
            </div>

            {/* Overview Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Your Savings</CardTitle>
                  <Wallet className="h-4 w-4 text-green-600 dark:text-green-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-xl sm:text-2xl font-bold dark:text-white">5.20 cUSD</div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">+0.20 cUSD interest earned</p>
                  <div className="mt-4">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="dark:text-gray-300">Savings Goal: 10 cUSD</span>
                      <span className="dark:text-gray-300">52%</span>
                    </div>
                    <Progress value={52} className="h-2" />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button className="w-full bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700 text-sm sm:text-base">
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
                  <div className="text-xl sm:text-2xl font-bold">2.00 cUSD</div>
                  <p className="text-xs text-gray-500">Due in 10 days</p>
                  <div className="mt-4 flex items-center text-xs text-gray-500">
                    <Clock className="mr-1 h-3 w-3" />
                    <span>Repayment Progress</span>
                  </div>
                  <Progress value={30} className="h-2 mt-1" />
                </CardContent>
                <CardFooter>
                  <Button variant="outline" className="w-full text-sm sm:text-base">
                    Repay Loan
                  </Button>
                </CardFooter>
              </Card>

              <Card className="sm:col-span-2 lg:col-span-1">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Your Tokens</CardTitle>
                  <Heart className="h-4 w-4 text-red-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-xl sm:text-2xl font-bold">10 HST</div>
                  <p className="text-xs text-gray-500">Health Support Tokens</p>
                  <div className="mt-4 text-xs text-gray-500">
                    <div className="flex items-center">
                      <CheckCircle className="mr-1 h-3 w-3 text-green-600" />
                      <span>Eligible for discounts</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" className="w-full text-sm sm:text-base">
                    Use Tokens
                  </Button>
                </CardFooter>
              </Card>
            </div>

            {/* Activity and Actions */}
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
                    <div className="space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b dark:border-gray-700 pb-4">
                        <div className="flex items-center space-x-3 mb-2 sm:mb-0">
                          <div className="rounded-full bg-green-100 dark:bg-green-900/30 p-2">
                            <Plus className="h-4 w-4 text-green-600 dark:text-green-400" />
                          </div>
                          <div>
                            <p className="font-medium dark:text-white">Saved 1 cUSD</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Weekly savings deposit</p>
                          </div>
                        </div>
                        <div className="text-left sm:text-right">
                          <p className="text-sm font-medium dark:text-white">+1.00 cUSD</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">2 days ago</p>
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b pb-4">
                        <div className="flex items-center space-x-3 mb-2 sm:mb-0">
                          <div className="rounded-full bg-orange-100 p-2">
                            <CreditCard className="h-4 w-4 text-orange-600" />
                          </div>
                          <div>
                            <p className="font-medium">Repaid 0.5 cUSD</p>
                            <p className="text-sm text-gray-500">Loan repayment</p>
                          </div>
                        </div>
                        <div className="text-left sm:text-right">
                          <p className="text-sm font-medium">-0.50 cUSD</p>
                          <p className="text-xs text-gray-500">Yesterday</p>
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center space-x-3 mb-2 sm:mb-0">
                          <div className="rounded-full bg-blue-100 p-2">
                            <Heart className="h-4 w-4 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium">Earned 2 HST</p>
                            <p className="text-sm text-gray-500">On-time repayment bonus</p>
                          </div>
                        </div>
                        <div className="text-left sm:text-right">
                          <p className="text-sm font-medium">+2 HST</p>
                          <p className="text-xs text-gray-500">Yesterday</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
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
                      <div className="rounded-lg border p-3 sm:p-4">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                          <div>
                            <h3 className="font-medium">Abeokuta Clinic</h3>
                            <p className="text-sm text-gray-500">General healthcare services</p>
                            <div className="mt-2 inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                              5% Discount with HST
                            </div>
                          </div>
                          <Button size="sm" variant="outline" className="w-full sm:w-auto mt-2 sm:mt-0">
                            View <ArrowUpRight className="ml-1 h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <div className="rounded-lg border p-3 sm:p-4">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                          <div>
                            <h3 className="font-medium">HealthPlus Pharmacy</h3>
                            <p className="text-sm text-gray-500">Medications and supplies</p>
                            <div className="mt-2 inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                              3% Discount with HST
                            </div>
                          </div>
                          <Button size="sm" variant="outline" className="w-full sm:w-auto mt-2 sm:mt-0">
                            View <ArrowUpRight className="ml-1 h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <div className="rounded-lg border p-3 sm:p-4">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                          <div>
                            <h3 className="font-medium">Lagos Medical Center</h3>
                            <p className="text-sm text-gray-500">Specialized care services</p>
                            <div className="mt-2 inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                              10% Discount with HST
                            </div>
                          </div>
                          <Button size="sm" variant="outline" className="w-full sm:w-auto mt-2 sm:mt-0">
                            View <ArrowUpRight className="ml-1 h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button variant="outline" className="w-full">
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
                          <p className="font-medium">Connected Wallet</p>
                          <p className="text-sm text-gray-500">0x123...abc</p>
                        </div>
                        <Button variant="outline" size="sm" className="w-full sm:w-auto">
                          Disconnect
                        </Button>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b pb-4">
                        <div className="mb-2 sm:mb-0">
                          <p className="font-medium">Notifications</p>
                          <p className="text-sm text-gray-500">Receive alerts for important updates</p>
                        </div>
                        <Button variant="outline" size="sm" className="w-full sm:w-auto">
                          Configure
                        </Button>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                        <div className="mb-2 sm:mb-0">
                          <p className="font-medium">Language</p>
                          <p className="text-sm text-gray-500">Currently set to English</p>
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
  )
}
