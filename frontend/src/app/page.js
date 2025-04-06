import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Heart, Shield, Wallet, CreditCard, Users, ChevronRight } from 'lucide-react'

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-green-50 to-white py-12 md:py-24">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center space-y-4 text-center">
            <div className="inline-flex items-center rounded-lg bg-green-100 px-3 py-1 text-sm text-green-700">
              <Shield className="mr-1 h-4 w-4" />
              <span>Secure Healthcare Savings</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl">
              Save for Health. Borrow with Ease.
            </h1>
            <p className="max-w-[700px] text-gray-600 md:text-xl">
              HealFi helps you save for healthcare expenses, access microcredit when needed, and connect with trusted healthcare providers.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 mt-8">
              <Button size="lg" className="bg-green-600 hover:bg-green-700">
                Connect Wallet
                <Wallet className="ml-2 h-4 w-4" />
              </Button>
              <Button variant="outline" size="lg">
                Learn More
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-white">
        <div className="container px-4 md:px-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            <div className="flex flex-col items-center p-6 bg-white rounded-lg shadow-sm border border-gray-100">
              <div className="rounded-full bg-green-100 p-3 mb-4">
                <Wallet className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold">500+</h3>
              <p className="text-gray-500">Total Savings (cUSD)</p>
            </div>
            <div className="flex flex-col items-center p-6 bg-white rounded-lg shadow-sm border border-gray-100">
              <div className="rounded-full bg-orange-100 p-3 mb-4">
                <CreditCard className="h-6 w-6 text-orange-600" />
              </div>
              <h3 className="text-2xl font-bold">200+</h3>
              <p className="text-gray-500">Loans Provided</p>
            </div>
            <div className="flex flex-col items-center p-6 bg-white rounded-lg shadow-sm border border-gray-100">
              <div className="rounded-full bg-blue-100 p-3 mb-4">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold">1,000+</h3>
              <p className="text-gray-500">Community Members</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 md:py-24 bg-gray-50">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center space-y-4 text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">How HealFi Works</h2>
            <p className="max-w-[700px] text-gray-600">
              Our platform makes healthcare financing accessible to everyone through simple savings and microloans.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex flex-col items-center p-6 bg-white rounded-lg shadow-sm">
              <div className="rounded-full bg-green-100 p-4 mb-4">
                <Wallet className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold mb-2">Save</h3>
              <p className="text-center text-gray-600">
                Set aside small amounts regularly to build your healthcare fund and earn interest.
              </p>
            </div>
            <div className="flex flex-col items-center p-6 bg-white rounded-lg shadow-sm">
              <div className="rounded-full bg-orange-100 p-4 mb-4">
                <CreditCard className="h-8 w-8 text-orange-600" />
              </div>
              <h3 className="text-xl font-bold mb-2">Borrow</h3>
              <p className="text-center text-gray-600">
                Access microloans when you need them most, with fair terms and easy repayment options.
              </p>
            </div>
            <div className="flex flex-col items-center p-6 bg-white rounded-lg shadow-sm">
              <div className="rounded-full bg-blue-100 p-4 mb-4">
                <Heart className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold mb-2">Heal</h3>
              <p className="text-center text-gray-600">
                Connect with trusted healthcare providers and use your savings or loans for treatment.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 md:py-24 bg-green-600 text-white">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center space-y-4 text-center">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">Ready to secure your health future?</h2>
            <p className="max-w-[700px] text-green-50">
              Join thousands of others who are taking control of their healthcare finances with HealFi.
            </p>
            <Button size="lg" variant="secondary" className="mt-4">
              Get Started Now
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-6 bg-gray-900 text-gray-300">
        <div className="container px-4 md:px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Heart className="h-6 w-6 text-green-500" />
                <span className="text-xl font-bold text-white">HealFi</span>
              </div>
              <p className="text-sm">Empowering healthcare access through innovative financial solutions.</p>
            </div>
            <div>
              <h3 className="text-lg font-medium mb-4">Product</h3>
              <ul className="space-y-2 text-sm">
                <li><Link href="#" className="hover:text-white">Savings</Link></li>
                <li><Link href="#" className="hover:text-white">Loans</Link></li>
                <li><Link href="#" className="hover:text-white">Healthcare Partners</Link></li>
                <li><Link href="#" className="hover:text-white">Tokens</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-medium mb-4">Company</h3>
              <ul className="space-y-2 text-sm">
                <li><Link href="#" className="hover:text-white">About</Link></li>
                <li><Link href="#" className="hover:text-white">Team</Link></li>
                <li><Link href="#" className="hover:text-white">Careers</Link></li>
                <li><Link href="#" className="hover:text-white">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-medium mb-4">Legal</h3>
              <ul className="space-y-2 text-sm">
                <li><Link href="#" className="hover:text-white">Privacy Policy</Link></li>
                <li><Link href="#" className="hover:text-white">Terms of Service</Link></li>
                <li><Link href="#" className="hover:text-white">Cookie Policy</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-sm text-center">
            <p>&copy; {new Date().getFullYear()} HealFi. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
