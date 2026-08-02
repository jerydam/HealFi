"use client";

import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, Clock, CheckCircle } from "lucide-react";
import { useRouter } from "next/navigation";

export default function VerificationPage() {
  const router = useRouter();

  return (
    <div className="container mx-auto px-4 py-12 max-w-2xl">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <CardTitle className="text-lg md:text-xl dark:text-white flex items-center">
              <ShieldCheck className="mr-2 h-6 w-6 text-green-600 dark:text-green-400" />
              Identity Verification
            </CardTitle>
            <Badge variant="secondary" className="whitespace-nowrap">
              Coming Soon
            </Badge>
          </div>
          <CardDescription className="dark:text-gray-400">
            Identity verification is not available yet
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col items-center text-center space-y-4 py-4">
            <div className="rounded-full bg-green-100 dark:bg-green-900/30 p-4">
              <Clock className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-lg font-medium dark:text-white">Verification is coming soon</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                We're building an identity verification flow for HealFi. In the meantime, every
                feature is open — no verification required.
              </p>
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 text-left">
            <h4 className="font-medium dark:text-white mb-3">Available right now:</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div className="flex items-center text-gray-600 dark:text-gray-300">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                Deposits &amp; withdrawals
              </div>
              <div className="flex items-center text-gray-600 dark:text-gray-300">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                Loan applications
              </div>
              <div className="flex items-center text-gray-600 dark:text-gray-300">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                HST token rewards
              </div>
              <div className="flex items-center text-gray-600 dark:text-gray-300">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                Guarantors &amp; referrals
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={() => router.push("/dashboard")}
            className="w-full sm:w-auto bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700"
          >
            Go to Dashboard
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push("/savings")}
            className="w-full sm:w-auto dark:border-gray-700 dark:text-gray-200"
          >
            Manage Savings
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
