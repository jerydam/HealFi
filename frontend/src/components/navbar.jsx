"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Heart, Menu, X } from "lucide-react"
import { useState } from "react"

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2">
            <Heart className="h-6 w-6 text-green-600" />
            <span className="text-xl font-bold">HealFi</span>
          </Link>
        </div>

        <nav className="hidden md:flex gap-6">
          <Link href="/dashboard" className="text-sm font-medium hover:text-green-600 transition-colors">
            Dashboard
          </Link>
          <Link href="/savings" className="text-sm font-medium hover:text-green-600 transition-colors">
            Savings
          </Link>
          <Link href="/loans" className="text-sm font-medium hover:text-green-600 transition-colors">
            Loans
          </Link>
          <Link href="/partners" className="text-sm font-medium hover:text-green-600 transition-colors">
            Partners
          </Link>
          <Link href="/tokens" className="text-sm font-medium hover:text-green-600 transition-colors">
            Tokens
          </Link>
          <Link href="/voting" className="text-sm font-medium hover:text-green-600 transition-colors">
            Voting
          </Link>
        </nav>

        <div className="hidden md:flex items-center gap-4">
          <Button variant="outline" size="sm">
            Connect Wallet
          </Button>
        </div>

        <button
          className="flex items-center justify-center rounded-md p-2 md:hidden"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          <span className="sr-only">Toggle menu</span>
        </button>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="fixed inset-0 top-16 z-50 bg-background md:hidden">
          <div className="container py-6 flex flex-col gap-6">
            <Link
              href="/dashboard"
              className="text-lg font-medium hover:text-green-600 transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Dashboard
            </Link>
            <Link
              href="/savings"
              className="text-lg font-medium hover:text-green-600 transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Savings
            </Link>
            <Link
              href="/loans"
              className="text-lg font-medium hover:text-green-600 transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Loans
            </Link>
            <Link
              href="/partners"
              className="text-lg font-medium hover:text-green-600 transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Partners
            </Link>
            <Link
              href="/tokens"
              className="text-lg font-medium hover:text-green-600 transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Tokens
            </Link>
            <Link
              href="/voting"
              className="text-lg font-medium hover:text-green-600 transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Voting
            </Link>
            <Button className="w-full mt-4">Connect Wallet</Button>
          </div>
        </div>
      )}
    </header>
  )
}

