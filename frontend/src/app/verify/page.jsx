"use client";

import React, { useState, useEffect } from "react";
import { SelfQRcodeWrapper, SelfAppBuilder } from "@selfxyz/qrcode";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Loader2, AlertCircle, ShieldCheck, CheckCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { connectWallet } from "@/lib/web3";
import { v4 as uuid4 } from "uuid";

export default function VerificationPage() {
  const router = useRouter();
  const [walletAddress, setWalletAddress] = useState(null);
  const [isVerified, setIsVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selfApp, setSelfApp] = useState(null);
  const [error, setError] = useState("");
  const [verificationInProgress, setVerificationInProgress] = useState(false);

  useEffect(() => {
    const initWallet = async () => {
      try {
        const result = await connectWallet();
        if (result.success) {
          setWalletAddress(result.address);
          // Check verification status from local storage
          const verificationStatus = localStorage.getItem(`verification_${result.address}`);
          setIsVerified(verificationStatus === "true");

          if (verificationStatus !== "true") {
            // Initialize SelfAppBuilder only if not verified
            try {
              const app = new SelfAppBuilder({
                appName: "HealFi",
                scope: "healfi",
                endpoint: "https://healfi.vercel.app/",
                logoBase64: "/logo.png",
                userId: uuid4(),
                disclosures: {
                  minimumAge: 18,
                  excludedCountries: [],
                  ofac: true,
                  nationality: true,
                  name: true,
                  dateOfBirth: true,
                },
              }).build();
              setSelfApp(app);
            } catch (selfError) {
              console.error("Error initializing Self app:", selfError);
              setError("Failed to initialize verification system. Please try refreshing the page.");
            }
          }
        } else {
          setError("Failed to connect wallet. Please try again.");
        }
      } catch (error) {
        console.error("Error initializing wallet:", error);
        setError("Error connecting wallet or initializing verification.");
      } finally {
        setIsLoading(false);
      }
    };

    initWallet();
  }, []);

  const handleVerificationSuccess = () => {
    setVerificationInProgress(true);
    localStorage.setItem(`verification_${walletAddress}`, "true");
    setIsVerified(true);
    setError("");
    
    setTimeout(() => {
      router.push("/dashboard");
    }, 3000);
  };

  const handleVerificationError = (error) => {
    console.error(`Verification error: ${error.error_code || "Unknown"} - ${error.reason || "Unknown error"}`);
    setError(`Verification failed: ${error.reason || "Unknown error"}. Please try again.`);
    setVerificationInProgress(false);
  };

  const handleReconnect = async () => {
    setIsLoading(true);
    setError("");
    
    try {
      const result = await connectWallet();
      if (result.success) {
        setWalletAddress(result.address);
        const verificationStatus = localStorage.getItem(`verification_${result.address}`);
        setIsVerified(verificationStatus === "true");
        
        if (verificationStatus !== "true") {
          const app = new SelfAppBuilder({
            appName: "HealFi",
            scope: "healfi",
            endpoint: "https://healfi.vercel.app/",
            logoBase64: "/logo.png",
            userId: uuid4(),
            disclosures: {
              minimumAge: 18,
              excludedCountries: [],
              ofac: true,
              nationality: true,
              name: true,
              dateOfBirth: true,
            },
          }).build();
          setSelfApp(app);
        }
      } else {
        setError("Failed to reconnect wallet. Please try again.");
      }
    } catch (error) {
      console.error("Error reconnecting wallet:", error);
      setError("Error reconnecting wallet or initializing verification.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12 flex justify-center items-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-green-600 dark:text-green-400 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">Loading verification...</p>
        </div>
      </div>
    );
  }

  if (!walletAddress) {
    return (
      <div className="container mx-auto px-4 py-12 text-center max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg md:text-xl dark:text-white">Connect Your Wallet</CardTitle>
            <CardDescription className="dark:text-gray-400">
              Please connect your wallet to verify your identity
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            {error && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                <p className="text-red-600 dark:text-red-400 flex items-center justify-center">
                  <AlertCircle className="h-5 w-5 mr-2" /> {error}
                </p>
              </div>
            )}
            <Button
              onClick={async () => {
                setError("");
                setIsLoading(true);
                try {
                  const result = await connectWallet();
                  if (result.success) {
                    setWalletAddress(result.address);
                    const verificationStatus = localStorage.getItem(`verification_${result.address}`);
                    setIsVerified(verificationStatus === "true");
                    
                    if (verificationStatus !== "true") {
                      const app = new SelfAppBuilder({
                        appName: "HealFi",
                        scope: "healfi",
                        endpoint: "https://healfi.vercel.app/",
                        logoBase64: "/logo.png",
                        userId: uuid4(),
                        disclosures: {
                          minimumAge: 18,
                          excludedCountries: [],
                          ofac: true,
                          nationality: true,
                          name: true,
                          dateOfBirth: true,
                        },
                      }).build();
                      setSelfApp(app);
                    }
                  } else {
                    setError("Failed to connect wallet. Please try again.");
                  }
                } catch (error) {
                  console.error("Error connecting wallet:", error);
                  setError("Error connecting wallet or initializing verification.");
                } finally {
                  setIsLoading(false);
                }
              }}
              className="bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700"
            >
              Connect Wallet
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg md:text-xl dark:text-white flex items-center">
            <ShieldCheck className="mr-2 h-6 w-6 text-green-600 dark:text-green-400" />
            Identity Verification
          </CardTitle>
          <CardDescription className="dark:text-gray-400">
            Verify your identity to access all HealFi features including loans and withdrawals
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-6">
          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
              <p className="text-red-600 dark:text-red-400 flex items-center justify-center">
                <AlertCircle className="h-5 w-5 mr-2" /> {error}
              </p>
            </div>
          )}

          {verificationInProgress ? (
            <div className="space-y-4">
              <div className="flex justify-center">
                <div className="rounded-full bg-green-100 dark:bg-green-900/30 p-4">
                  <Loader2 className="h-8 w-8 animate-spin text-green-600 dark:text-green-400" />
                </div>
              </div>
              <div>
                <p className="text-lg font-medium text-green-600 dark:text-green-400">
                  Verification Successful! 🎉
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  Redirecting to dashboard...
                </p>
              </div>
            </div>
          ) : isVerified ? (
            <div className="space-y-4">
              <div className="flex justify-center">
                <div className="rounded-full bg-green-100 dark:bg-green-900/30 p-4">
                  <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
              </div>
              <div>
                <p className="text-lg font-medium text-green-600 dark:text-green-400">
                  Your identity has been verified successfully! ✓
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  You now have full access to all HealFi features including loans and withdrawals.
                </p>
              </div>
              <Button
                onClick={() => router.push("/dashboard")}
                className="bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700"
              >
                Go to Dashboard
              </Button>
            </div>
          ) : selfApp ? (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-lg font-medium dark:text-white mb-2">
                  Complete Identity Verification
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Scan the QR code below with the Self app to verify your identity. 
                  This enables access to loans and withdrawal features.
                </p>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
                <div className="flex justify-center mb-4">
                  <SelfQRcodeWrapper
                    selfApp={selfApp}
                    onSuccess={handleVerificationSuccess}
                    onError={handleVerificationError}
                    size={280}
                  />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                  Don't have the Self app? Download it from your app store
                </p>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                <h4 className="font-medium text-blue-800 dark:text-blue-300 mb-2">
                  Why do we need verification?
                </h4>
                <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                  <li>• Comply with financial regulations</li>
                  <li>• Protect against fraud and money laundering</li>
                  <li>• Enable secure loan and withdrawal features</li>
                  <li>• Build trust in the HealFi ecosystem</li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-center">
                <div className="rounded-full bg-gray-100 dark:bg-gray-800 p-4">
                  <AlertCircle className="h-8 w-8 text-gray-500 dark:text-gray-400" />
                </div>
              </div>
              <div>
                <p className="text-lg font-medium dark:text-white">
                  Unable to Initialize Verification
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  There was an issue setting up the verification system. Please try reconnecting your wallet.
                </p>
              </div>
              <Button
                onClick={handleReconnect}
                className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700"
              >
                Reconnect Wallet
              </Button>
            </div>
          )}

          {/* Features unlocked by verification */}
          {!isVerified && !verificationInProgress && (
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 text-left">
              <h4 className="font-medium dark:text-white mb-3">Features unlocked after verification:</h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center text-gray-600 dark:text-gray-300">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Loan applications
                </div>
                <div className="flex items-center text-gray-600 dark:text-gray-300">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Withdrawals
                </div>
                <div className="flex items-center text-gray-600 dark:text-gray-300">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Higher limits
                </div>
                <div className="flex items-center text-gray-600 dark:text-gray-300">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  All features
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}