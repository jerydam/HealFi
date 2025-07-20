"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Heart, Shield, Wallet, CreditCard, Users, ChevronRight, TrendingUp, ArrowRight, CheckCircle } from "lucide-react";
import { connectWallet, getPlatformMetrics, getSavingsInfo } from "@/lib/web3";

export default function Home() {
  const router = useRouter();
  const [metrics, setMetrics] = useState({
    totalSavings: "0",
    totalLoansDisbursed: "0",
    totalUsers: 0,
    totalHSTRedeemed: "0",
    totalFundsMatched: "0"
  });
  const [isLoading, setIsLoading] = useState(false);
  const [walletAddress, setWalletAddress] = useState("");

  useEffect(() => {
    const loadMetrics = async () => {
      try {
        const platformMetrics = await getPlatformMetrics();
        setMetrics(platformMetrics);
      } catch (error) {
        console.error("Error loading platform metrics:", error);
      }
    };
    loadMetrics();

    // Check if wallet is already connected
    const checkWalletConnection = async () => {
      try {
        if (typeof window !== "undefined" && window.ethereum) {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts.length > 0) {
            setWalletAddress(accounts[0]);
          }
        }
      } catch (error) {
        console.error("Error checking wallet connection:", error);
      }
    };
    checkWalletConnection();
  }, []);

  const handleConnectWallet = async () => {
    setIsLoading(true);
    try {
      const result = await connectWallet();
      if (result.success) {
        setWalletAddress(result.address);
        
        // Check if user is already registered
        const savingsInfo = await getSavingsInfo(result.address);
        if (savingsInfo) {
          // User is registered, go to dashboard
          router.push("/dashboard");
        } else {
          // User is not registered, go to registration
          router.push("/register");
        }
      } else {
        alert("Failed to connect wallet: " + (result.error || "Please try again."));
      }
    } catch (error) {
      console.error("Error connecting wallet:", error);
      alert("Error connecting wallet. Please make sure you have MetaMask installed.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGetStarted = () => {
    if (walletAddress) {
      // Wallet already connected, check registration status
      handleConnectWallet();
    } else {
      // Connect wallet first
      handleConnectWallet();
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-950 dark:text-white py-12 md:py-24 lg:py-32">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex flex-col items-center space-y-6 text-center">
            <div className="inline-flex items-center rounded-full bg-green-100 dark:bg-green-900/30 px-4 py-2 text-sm text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800">
              <Shield className="mr-2 h-4 w-4" />
              <span>Secure • Transparent • Decentralized</span>
            </div>
            
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl max-w-[1000px] dark:text-white">
              Your Health,{" "}
              <span className="bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                Your Future
              </span>
            </h1>
            
            <p className="max-w-[700px] text-gray-600 dark:text-gray-300 text-lg md:text-xl leading-relaxed">
              HealFi revolutionizes healthcare financing with blockchain technology. Save systematically, 
              access microloans instantly, and connect with trusted healthcare providers—all in one platform.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 mt-8 w-full max-w-lg">
              <Button
                size="lg"
                className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-lg hover:shadow-xl transition-all duration-200 w-full sm:w-auto"
                onClick={handleGetStarted}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Connecting...
                  </>
                ) : walletAddress ? (
                  <>
                    Go to Dashboard
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                ) : (
                  <>
                    Get Started
                    <Wallet className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
              
              <Button 
                variant="outline" 
                size="lg" 
                className="w-full sm:w-auto border-gray-300 dark:border-gray-600 hover:border-green-500 dark:hover:border-green-400 transition-colors"
                onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Learn More
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>

            {walletAddress && (
              <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <p className="text-sm text-green-700 dark:text-green-300 flex items-center">
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Wallet connected: {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Metrics Section */}
      <section className="py-16 bg-white dark:bg-gray-900 border-t dark:border-gray-800">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold dark:text-white mb-4">
              Platform Impact
            </h2>
            <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Real-time metrics from our blockchain-powered healthcare financing ecosystem
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="group bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-6 rounded-xl border border-green-200 dark:border-green-800 hover:shadow-lg transition-all duration-200">
              <div className="flex items-center justify-between mb-4">
                <div className="rounded-full bg-green-500 p-3">
                  <Wallet className="h-6 w-6 text-white" />
                </div>
                <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-2xl sm:text-3xl font-bold dark:text-white">
                ${Number.parseFloat(metrics.totalSavings).toLocaleString()}
              </h3>
              <p className="text-green-700 dark:text-green-300 font-medium">Total Savings</p>
              <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                Secured in smart contracts
              </p>
            </div>

            <div className="group bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 p-6 rounded-xl border border-orange-200 dark:border-orange-800 hover:shadow-lg transition-all duration-200">
              <div className="flex items-center justify-between mb-4">
                <div className="rounded-full bg-orange-500 p-3">
                  <CreditCard className="h-6 w-6 text-white" />
                </div>
                <TrendingUp className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
              <h3 className="text-2xl sm:text-3xl font-bold dark:text-white">
                ${Number.parseFloat(metrics.totalLoansDisbursed).toLocaleString()}
              </h3>
              <p className="text-orange-700 dark:text-orange-300 font-medium">Loans Provided</p>
              <p className="text-sm text-orange-600 dark:text-orange-400 mt-1">
                Healthcare microloans
              </p>
            </div>

            <div className="group bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-6 rounded-xl border border-blue-200 dark:border-blue-800 hover:shadow-lg transition-all duration-200">
              <div className="flex items-center justify-between mb-4">
                <div className="rounded-full bg-blue-500 p-3">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-2xl sm:text-3xl font-bold dark:text-white">
                {metrics.totalUsers.toLocaleString()}
              </h3>
              <p className="text-blue-700 dark:text-blue-300 font-medium">Active Users</p>
              <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                Growing community
              </p>
            </div>

            <div className="group bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 p-6 rounded-xl border border-purple-200 dark:border-purple-800 hover:shadow-lg transition-all duration-200">
              <div className="flex items-center justify-between mb-4">
                <div className="rounded-full bg-purple-500 p-3">
                  <Heart className="h-6 w-6 text-white" />
                </div>
                <TrendingUp className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-2xl sm:text-3xl font-bold dark:text-white">
                {Number.parseFloat(metrics.totalHSTRedeemed).toLocaleString()}
              </h3>
              <p className="text-purple-700 dark:text-purple-300 font-medium">HST Redeemed</p>
              <p className="text-sm text-purple-600 dark:text-purple-400 mt-1">
                Health support tokens
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-16 md:py-24 bg-gray-50 dark:bg-gray-950">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight dark:text-white mb-4">
              How HealFi Works
            </h2>
            <p className="max-w-3xl mx-auto text-gray-600 dark:text-gray-300 text-lg">
              Our blockchain-powered platform makes healthcare financing accessible, transparent, 
              and secure for everyone through three simple steps.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
            <div className="group text-center">
              <div className="relative mx-auto w-20 h-20 mb-6">
                <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-green-600 rounded-full animate-pulse opacity-20"></div>
                <div className="relative bg-gradient-to-r from-green-500 to-green-600 rounded-full p-5 shadow-lg group-hover:shadow-xl transition-shadow">
                  <Wallet className="h-10 w-10 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-sm font-bold rounded-full w-8 h-8 flex items-center justify-center">
                  1
                </div>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold mb-4 dark:text-white">Save Systematically</h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                Build your healthcare fund with regular deposits. Earn HST tokens for consistent saving 
                and watch your emergency fund grow with transparency on the blockchain.
              </p>
            </div>

            <div className="group text-center">
              <div className="relative mx-auto w-20 h-20 mb-6">
                <div className="absolute inset-0 bg-gradient-to-r from-orange-400 to-orange-600 rounded-full animate-pulse opacity-20"></div>
                <div className="relative bg-gradient-to-r from-orange-500 to-orange-600 rounded-full p-5 shadow-lg group-hover:shadow-xl transition-shadow">
                  <CreditCard className="h-10 w-10 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 text-sm font-bold rounded-full w-8 h-8 flex items-center justify-center">
                  2
                </div>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold mb-4 dark:text-white">Access Microloans</h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                Get instant access to healthcare microloans based on your savings history. 
                Fair terms, no hidden fees, and flexible repayment options tailored for healthcare needs.
              </p>
            </div>

            <div className="group text-center">
              <div className="relative mx-auto w-20 h-20 mb-6">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full animate-pulse opacity-20"></div>
                <div className="relative bg-gradient-to-r from-blue-500 to-blue-600 rounded-full p-5 shadow-lg group-hover:shadow-xl transition-shadow">
                  <Heart className="h-10 w-10 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm font-bold rounded-full w-8 h-8 flex items-center justify-center">
                  3
                </div>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold mb-4 dark:text-white">Get Quality Care</h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                Connect with verified healthcare providers in our network. Use your savings, loans, 
                or HST tokens for treatments with additional discounts and benefits.
              </p>
            </div>
          </div>

          <div className="text-center mt-12">
            <Button
              size="lg"
              className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
              onClick={handleGetStarted}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Connecting...
                </>
              ) : (
                <>
                  Start Your Health Journey
                  <ArrowRight className="ml-2 h-5 w-5" />
                </>
              )}
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold dark:text-white mb-4">
              Why Choose HealFi?
            </h2>
            <p className="max-w-2xl mx-auto text-gray-600 dark:text-gray-300 text-lg">
              Built on blockchain technology for maximum security, transparency, and accessibility
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="p-6 bg-gray-50 dark:bg-gray-800 rounded-xl hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-xl font-bold dark:text-white mb-2">Blockchain Security</h3>
              <p className="text-gray-600 dark:text-gray-300">Your funds are secured by smart contracts on the Celo blockchain, ensuring transparency and immutability.</p>
            </div>

            <div className="p-6 bg-gray-50 dark:bg-gray-800 rounded-xl hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mb-4">
                <TrendingUp className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-bold dark:text-white mb-2">Earn While Saving</h3>
              <p className="text-gray-600 dark:text-gray-300">Earn HST tokens for consistent saving behavior and use them for discounts at healthcare providers.</p>
            </div>

            <div className="p-6 bg-gray-50 dark:bg-gray-800 rounded-xl hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-xl font-bold dark:text-white mb-2">Community Support</h3>
              <p className="text-gray-600 dark:text-gray-300">Join a community of health-conscious individuals supporting each other's healthcare journeys.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-20 bg-gradient-to-r from-green-600 via-blue-600 to-purple-600 text-white">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center max-w-4xl mx-auto">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6">
              Take Control of Your Healthcare Future
            </h2>
            <p className="text-xl text-green-50 mb-8 max-w-2xl mx-auto">
              Join thousands of users who are building financial resilience for their health needs. 
              Start saving today and access healthcare financing when you need it most.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button
                size="lg"
                variant="secondary"
                className="bg-white text-green-600 hover:bg-gray-100 shadow-lg hover:shadow-xl transition-all duration-200 text-lg px-8 py-3"
                onClick={handleGetStarted}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-green-600 mr-2"></div>
                    Connecting...
                  </>
                ) : (
                  <>
                    Get Started Now
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </>
                )}
              </Button>
              
              <Link href="/metrics">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white text-white hover:bg-white hover:text-green-600 transition-all duration-200 text-lg px-8 py-3"
                >
                  View Platform Stats
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-gray-900 dark:bg-gray-950 text-gray-300">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-6">
                <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-blue-500 rounded-lg flex items-center justify-center">
                  <Heart className="h-5 w-5 text-white" />
                </div>
                <span className="text-2xl font-bold text-white">HealFi</span>
              </div>
              <p className="text-sm leading-relaxed mb-4">
                Empowering healthcare access through innovative blockchain-based financial solutions.
              </p>
              <p className="text-xs text-gray-400">
                Built on Celo • Secured by blockchain
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4 text-white">Platform</h3>
              <ul className="space-y-3 text-sm">
                <li><Link href="/savings" className="hover:text-green-400 transition-colors">Savings</Link></li>
                <li><Link href="/loans" className="hover:text-green-400 transition-colors">Loans</Link></li>
                <li><Link href="/tokens" className="hover:text-green-400 transition-colors">HST Tokens</Link></li>
                <li><Link href="/partners" className="hover:text-green-400 transition-colors">Healthcare Partners</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4 text-white">Resources</h3>
              <ul className="space-y-3 text-sm">
                <li><Link href="/metrics" className="hover:text-green-400 transition-colors">Platform Metrics</Link></li>
                <li><Link href="/verify" className="hover:text-green-400 transition-colors">Identity Verification</Link></li>
                <li><Link href="#" className="hover:text-green-400 transition-colors">Documentation</Link></li>
                <li><Link href="#" className="hover:text-green-400 transition-colors">API</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4 text-white">Company</h3>
              <ul className="space-y-3 text-sm">
                <li><Link href="#" className="hover:text-green-400 transition-colors">About Us</Link></li>
                <li><Link href="#" className="hover:text-green-400 transition-colors">Team</Link></li>
                <li><Link href="#" className="hover:text-green-400 transition-colors">Careers</Link></li>
                <li><Link href="#" className="hover:text-green-400 transition-colors">Contact</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-12 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
              <p className="text-sm text-gray-400">
                © {new Date().getFullYear()} HealFi. All rights reserved.
              </p>
              <div className="flex space-x-6 text-sm">
                <Link href="#" className="hover:text-green-400 transition-colors">Privacy Policy</Link>
                <Link href="#" className="hover:text-green-400 transition-colors">Terms of Service</Link>
                <Link href="#" className="hover:text-green-400 transition-colors">Cookie Policy</Link>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}