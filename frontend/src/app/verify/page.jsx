"use client";

import React, { useState, useEffect } from "react";
import { SelfQRcodeWrapper, SelfAppBuilder } from "@selfxyz/qrcode";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Loader2, AlertCircle } from "lucide-react";
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

  useEffect(() => {
    const initWallet = async () => {
      try {
        const result = await connectWallet();
        if (result.success) {
          setWalletAddress(result.address);
          // Check verification status from local storage (replace with backend in production)
          const verificationStatus = localStorage.getItem(`verification_${result.address}`);
          setIsVerified(verificationStatus === "true");

          // Initialize SelfAppBuilder with UUID as userId
          const app = new SelfAppBuilder({
            appName: "HealFi",
            scope: "healfi",
            endpoint: "https://healfi.vercel.app/",
            logoBase64: "/logo.png",
            userId: uuid4(), // Use UUID as userId
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
    localStorage.setItem(`verification_${walletAddress}`, "true");
    setIsVerified(true);
    setError("");
    setTimeout(() => router.push("/dashboard"), 2000);
  };

  const handleVerificationError = (error) => {
    console.error(`Verification error: ${error.error_code || "Unknown"} - ${error.reason || "Unknown error"}`);
    setError(`Verification failed: ${error.reason || "Unknown error"}`);
  };

  const handleReconnect = async () => {
    try {
      setError("");
      const result = await connectWallet();
      if (result.success) {
        setWalletAddress(result.address);
        const verificationStatus = localStorage.getItem(`verification_${result.address}`);
        setIsVerified(verificationStatus === "true");
        const app = new SelfAppBuilder({
          appName: "HealFi",
          scope: "healfi",
          endpoint: "https://healfi.vercel.app/",
          logoBase64: "/logo.png",
          userId: uuid4(), // Use UUID as userId
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
      } else {
        setError("Failed to reconnect wallet. Please try again.");
      }
    } catch (error) {
      console.error("Error reconnecting wallet:", error);
      setError("Error reconnecting wallet or initializing verification.");
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12 flex justify-center items-center">
        <Loader2 className="h-8 w-8 animate-spin text-green-600 dark:text-green-400 mr-2" />
        <span>Loading...</span>
      </div>
    );
  }

  if (!walletAddress) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h2 className="text-2xl font-bold mb-2 dark:text-white">Connect Your Wallet</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-6">Please connect your wallet to verify your identity</p>
        {error && (
          <p className="text-red-500 dark:text-red-400 mb-4 flex items-center justify-center">
            <AlertCircle className="h-5 w-5 mr-2" /> {error}
          </p>
        )}
        <Button
          onClick={async () => {
            try {
              setError("");
              const result = await connectWallet();
              if (result.success) {
                setWalletAddress(result.address);
                const verificationStatus = localStorage.getItem(`verification_${result.address}`);
                setIsVerified(verificationStatus === "true");
                const app = new SelfAppBuilder({
                  appName: "HealFi",
                  scope: "healfi",
                  endpoint: "https://healfi.vercel.app/",
                  logoBase64: "/logo.png",
                  userId: uuid4(), // Use UUID as userId
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
              } else {
                setError("Failed to connect wallet. Please try again.");
              }
            } catch (error) {
              console.error("Error connecting wallet:", error);
              setError("Error connecting wallet or initializing verification.");
            }
          }}
          className="bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700"
        >
          Connect Wallet
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg md:text-xl dark:text-white">Identity Verification</CardTitle>
          <CardDescription className="dark:text-gray-400">
            Verify your identity to access all HealFi features
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          {error && (
            <p className="text-red-500 dark:text-red-400 mb-4 flex items-center justify-center">
              <AlertCircle className="h-5 w-5 mr-2" /> {error}
            </p>
          )}
          {isVerified ? (
            <div className="space-y-4">
              <p className="text-sm md:text-base text-green-600 dark:text-green-400">
                Your identity has been verified successfully!
              </p>
              <Button
                onClick={() => router.push("/dashboard")}
                className="bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700"
              >
                Go to Dashboard
              </Button>
            </div>
          ) : selfApp ? (
            <div className="space-y-4">
              <p className="text-sm md:text-base text-gray-500 dark:text-gray-400">
                Scan the QR code below with the Self app to verify your identity. Verification is required to access loan features.
              </p>
              <div className="flex justify-center">
                <SelfQRcodeWrapper
                  selfApp={selfApp}
                  onSuccess={handleVerificationSuccess}
                  onError={handleVerificationError}
                  size={350}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm md:text-base text-gray-500 dark:text-gray-400">
                Unable to initialize verification. Please try reconnecting your wallet.
              </p>
              <Button
                onClick={handleReconnect}
                className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700"
              >
                Reconnect Wallet
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}