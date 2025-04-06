import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Heart, MapPin, Search, ArrowUpRight, Clock, CheckCircle } from 'lucide-react'

export default function PartnersPage() {
  return (
    <div className="container px-4 md:px-6 py-8">
      <div className="flex flex-col space-y-8">
        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Healthcare Partners</h1>
          <p className="text-gray-500">Find trusted clinics and pharmacies that accept HealFi</p>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            <Input className="pl-10" placeholder="Search by name or location" />
          </div>
          <Tabs defaultValue="all" className="w-full md:w-auto">
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="clinics">Clinics</TabsTrigger>
              <TabsTrigger value="pharmacies">Pharmacies</TabsTrigger>
              <TabsTrigger value="nearby">Nearby</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Partners List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Abeokuta Clinic</CardTitle>
              <CardDescription className="flex items-center">
                <MapPin className="mr-1 h-3 w-3" /> Abeokuta, Nigeria
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Services</span>
                  <span className="text-sm font-medium">General Healthcare</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Discount</span>
                  <span className="text-sm font-medium text-green-600">5% with HST</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Payment</span>
                  <span className="text-sm font-medium">cUSD, Cash</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Rating</span>
                  <div className="flex items-center">
                    <Heart className="h-4 w-4 fill-red-500 text-red-500" />
                    <Heart className="h-4 w-4 fill-red-500 text-red-500" />
                    <Heart className="h-4 w-4 fill-red-500 text-red-500" />
                    <Heart className="h-4 w-4 fill-red-500 text-red-500" />
                    <Heart className="h-4 w-4 text-gray-300" />
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full">
                Visit Partner <ArrowUpRight className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>HealthPlus Pharmacy</CardTitle>
              <CardDescription className="flex items-center">
                <MapPin className="mr-1 h-3 w-3" /> Lagos, Nigeria
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Services</span>
                  <span className="text-sm font-medium">Medications, Supplies</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Discount</span>
                  <span className="text-sm font-medium text-green-600">3% with HST</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Payment</span>
                  <span className="text-sm font-medium">cUSD, Cash, Card</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Rating</span>
                  <div className="flex items-center">
                    <Heart className="h-4 w-4 fill-red-500 text-red-500" />
                    <Heart className="h-4 w-4 fill-red-500 text-red-500" />
                    <Heart className="h-4 w-4 fill-red-500 text-red-500" />
                    <Heart className="h-4 w-4 fill-red-500 text-red-500" />
                    <Heart className="h-4 w-4 fill-red-500 text-red-500" />
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full">
                Visit Partner <ArrowUpRight className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Lagos Medical Center</CardTitle>
              <CardDescription className="flex items-center">
                <MapPin className="mr-1 h-3 w-3" /> Lagos, Nigeria
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Services</span>
                  <span className="text-sm font-medium">Specialized Care</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Discount</span>
                  <span className="text-sm font-medium text-green-600">10% with HST</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Payment</span>
                  <span className="text-sm font-medium">cUSD, Cash, Card</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Rating</span>
                  <div className="flex items-center">
                    <Heart className="h-4 w-4 fill-red-500 text-red-500" />
                    <Heart className="h-4 w-4 fill-red-500 text-red-500" />
                    <Heart className="h-4 w-4 fill-red-500 text-red-500" />
                    <Heart className="h-4 w-4 fill-red-500 text-red-500" />
                    <Heart className="h-4 w-4 text-gray-300" />
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full">
                Visit Partner <ArrowUpRight className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* Service History */}
        <Card>
          <CardHeader>
            <CardTitle>Your Service History</CardTitle>
            <CardDescription>Recent visits to healthcare partners</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b pb-4">
                <div className="flex items-center space-x-3">
                  <div className="rounded-full bg-blue-100 p-2">
                    <CheckCircle className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium">Checkup</p>
                    <p className="text-sm text-gray-500">Abeokuta Clinic</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">1.00 cUSD</p>
                  <p className="text-xs text-gray-500">March 10, 2025</p>
                </div>
              </div>
              <div className="flex items-center justify-between border-b pb-4">
                <div className="flex items-center space-x-3">
                  <div className="rounded-full bg-green-100 p-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium">Medication</p>
                    <p className="text-sm text-gray-500">HealthPlus Pharmacy</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">0.50 cUSD</p>
                  <p className="text-xs text-gray-500">February 25, 2025</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="rounded-full bg-blue-100 p-2">
                    <CheckCircle className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium">Consultation</p>
                    <p className="text-sm text-gray-500">Lagos Medical Center</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">2.00 cUSD</p>
                  <p className="text-xs text-gray-500">January 15, 2025</p>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full">
              View All History
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
