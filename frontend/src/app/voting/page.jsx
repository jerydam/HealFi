import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { CheckCircle, XCircle, Clock, AlertCircle, ThumbsUp, ThumbsDown } from "lucide-react"

export default function VotingPage() {
  return (
    <div className="container px-4 md:px-6 py-8">
      <div className="flex flex-col space-y-8">
        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Community Governance</h1>
          <p className="text-gray-500">Participate in HealFi's decision-making process</p>
        </div>

        <div className="rounded-lg bg-blue-50 p-4 text-blue-800">
          <div className="flex items-start">
            <AlertCircle className="mr-2 h-5 w-5 text-blue-600 flex-shrink-0" />
            <div>
              <p className="font-medium">Your voting power: 10 HST</p>
              <p className="text-sm">Each token gives you one vote. Earn more tokens to increase your influence!</p>
            </div>
          </div>
        </div>

        <Tabs defaultValue="active" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="active" className="text-xs sm:text-sm">
              Active Proposals
            </TabsTrigger>
            <TabsTrigger value="past" className="text-xs sm:text-sm">
              Past Proposals
            </TabsTrigger>
            <TabsTrigger value="create" className="text-xs sm:text-sm">
              Create Proposal
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="mt-6 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <CardTitle className="text-lg sm:text-xl">Lower Loan Fees</CardTitle>
                  <div className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 w-fit">
                    Ends: April 10, 2025
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600">
                  This proposal suggests reducing the loan transaction fee from 1% to 0.5% to make healthcare loans more
                  accessible to all users.
                </p>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Votes For: 60%</span>
                    <span>Votes Against: 40%</span>
                  </div>
                  <div className="flex h-2 w-full overflow-hidden rounded-full bg-gray-200">
                    <div className="bg-green-600 h-full" style={{ width: "60%" }}></div>
                    <div className="bg-red-500 h-full" style={{ width: "40%" }}></div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>300 HST</span>
                    <span>200 HST</span>
                  </div>
                </div>
                <div className="rounded-lg bg-gray-50 p-3 sm:p-4 space-y-2">
                  <p className="text-sm font-medium">Your vote:</p>
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                    <Button className="flex-1 bg-green-600 hover:bg-green-700 text-xs sm:text-sm">
                      <ThumbsUp className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" /> Vote For
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 border-red-500 text-red-500 hover:bg-red-50 text-xs sm:text-sm"
                    >
                      <ThumbsDown className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" /> Vote Against
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Add New Healthcare Partner</CardTitle>
                <CardDescription className="flex items-center">
                  <Clock className="mr-1 h-3 w-3" /> Ends: April 15, 2025
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600">
                  This proposal suggests adding Ibadan General Hospital as a new healthcare partner with a 7% discount
                  for HealFi users.
                </p>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Votes For: 85%</span>
                    <span>Votes Against: 15%</span>
                  </div>
                  <div className="flex h-2 w-full overflow-hidden rounded-full bg-gray-200">
                    <div className="bg-green-600 h-full" style={{ width: "85%" }}></div>
                    <div className="bg-red-500 h-full" style={{ width: "15%" }}></div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>425 HST</span>
                    <span>75 HST</span>
                  </div>
                </div>
                <div className="rounded-lg bg-gray-50 p-3 sm:p-4 space-y-2">
                  <p className="text-sm font-medium">Your vote:</p>
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                    <Button className="flex-1 bg-green-600 hover:bg-green-700 text-xs sm:text-sm">
                      <ThumbsUp className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" /> Vote For
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 border-red-500 text-red-500 hover:bg-red-50 text-xs sm:text-sm"
                    >
                      <ThumbsDown className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" /> Vote Against
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="past" className="mt-6 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <CardTitle className="text-lg sm:text-xl">Increase Savings Interest Rate</CardTitle>
                  <div className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 w-fit">
                    Passed
                  </div>
                </div>
                <CardDescription>Ended: March 15, 2025</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600">
                  This proposal increased the annual interest rate on savings from 4% to 5% to incentivize more
                  healthcare savings.
                </p>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Votes For: 75%</span>
                    <span>Votes Against: 25%</span>
                  </div>
                  <div className="flex h-2 w-full overflow-hidden rounded-full bg-gray-200">
                    <div className="bg-green-600 h-full" style={{ width: "75%" }}></div>
                    <div className="bg-red-500 h-full" style={{ width: "25%" }}></div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>450 HST</span>
                    <span>150 HST</span>
                  </div>
                </div>
                <div className="rounded-lg bg-green-50 p-4 text-sm text-green-800">
                  <div className="flex items-start">
                    <CheckCircle className="mr-2 h-5 w-5 text-green-600 flex-shrink-0" />
                    <p>This proposal has been implemented. The new interest rate is now active.</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Add Emergency Loan Option</CardTitle>
                  <div className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">Rejected</div>
                </div>
                <CardDescription>Ended: February 20, 2025</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600">
                  This proposal suggested adding an emergency loan option with higher limits but also higher interest
                  rates.
                </p>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Votes For: 30%</span>
                    <span>Votes Against: 70%</span>
                  </div>
                  <div className="flex h-2 w-full overflow-hidden rounded-full bg-gray-200">
                    <div className="bg-green-600 h-full" style={{ width: "30%" }}></div>
                    <div className="bg-red-500 h-full" style={{ width: "70%" }}></div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>180 HST</span>
                    <span>420 HST</span>
                  </div>
                </div>
                <div className="rounded-lg bg-red-50 p-4 text-sm text-red-800">
                  <div className="flex items-start">
                    <XCircle className="mr-2 h-5 w-5 text-red-600 flex-shrink-0" />
                    <p>This proposal was rejected by the community and will not be implemented.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="create" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Create a New Proposal</CardTitle>
                <CardDescription>Share your ideas to improve HealFi</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Proposal Title</label>
                  <Input placeholder="Enter a clear, concise title" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Description</label>
                  <Textarea
                    placeholder="Describe your proposal in detail. What problem does it solve? How will it benefit the community?"
                    className="min-h-[120px]"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Category</label>
                  <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background">
                    <option value="">Select a category</option>
                    <option value="finance">Financial Parameters</option>
                    <option value="partners">Healthcare Partners</option>
                    <option value="features">New Features</option>
                    <option value="governance">Governance Rules</option>
                  </select>
                </div>
                <div className="rounded-lg bg-amber-50 p-3 sm:p-4 text-amber-800">
                  <div className="flex flex-col sm:flex-row sm:items-start gap-2">
                    <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Proposal requirements:</p>
                      <ul className="list-disc list-inside mt-1 space-y-1 text-xs sm:text-sm">
                        <li>You must have at least 5 HST to create a proposal</li>
                        <li>Proposals run for 7 days by default</li>
                        <li>A minimum of 100 HST in total votes is required for a proposal to pass</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full bg-green-600 hover:bg-green-700">Submit Proposal</Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="text-center space-y-2">
          <h3 className="text-lg font-medium">Your voice shapes HealFi!</h3>
          <p className="text-sm text-gray-600">
            Every vote counts in our community-driven platform. Help us build a better healthcare financing solution for
            everyone.
          </p>
        </div>
      </div>
    </div>
  )
}

