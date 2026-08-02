"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { MapPin, Globe } from "lucide-react"

export default function PartnersPage() {
  // The partner directory is public - browsing it does not require a wallet
  const handleVisitWebsite = (url) => {
    // Placeholder: Redirect to partner website
    window.open(url, "_blank")
  }

  return (
    <div className="container mx-auto px-4 md:px-6 py-6 sm:py-8">
      <div className="flex flex-col space-y-6 sm:space-y-8">
        <div className="flex flex-col space-y-2">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight dark:text-white">Healthcare Partners</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm sm:text-base">
            Find clinics and pharmacies that accept HealFi
          </p>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="relative flex-1">
            <Input
              placeholder="Search for a healthcare provider..."
              className="pl-10 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
            />
            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
          </div>
          <Button variant="outline" className="dark:border-gray-700 dark:text-gray-200">
            Filter by Location
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Placeholder: Partner data should be fetched from a contract or API */}
          <Card>
            <CardHeader>
              <CardTitle className="dark:text-white">Partner Data Not Available</CardTitle>
              <CardDescription className="dark:text-gray-400">
                Healthcare partner information not implemented yet
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500 dark:text-gray-400">
                Please check back later for a list of healthcare partners.
              </p>
            </CardContent>
            <CardFooter>
              <Button
                variant="outline"
                className="w-full dark:border-gray-700 dark:text-gray-200"
                onClick={() => handleVisitWebsite("https://example.com")}
              >
                <Globe className="mr-2 h-3 w-3 sm:h-4 sm:w-4" /> Visit Website
              </Button>
            </CardFooter>
          </Card>
        </div>

        <div className="flex justify-center">
          <Button
            variant="outline"
            className="dark:border-gray-700 dark:text-gray-200"
            onClick={() => alert("View all partners not implemented yet")}
          >
            View All Partners
          </Button>
        </div>
      </div>
    </div>
  )
}