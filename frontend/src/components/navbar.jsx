"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Heart, Menu, X, Sun, Moon } from "lucide-react"
import { useState, useEffect } from "react"
import { useTheme } from "@/components/theme-provider"
import WalletConnectButton from "@/components/wallet-connnect-button"

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const { theme, setTheme } = useTheme()

  // Wait until mounted to avoid hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark")
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2">
            <Heart className="h-6 w-6 text-green-600 dark:text-green-500" />
            <span className="text-xl font-bold">HealFi</span>
          </Link>
        </div>

        <nav className="hidden md:flex gap-6">
          <Link
            href="/dashboard"
            className="text-sm font-medium hover:text-green-600 dark:hover:text-green-500 transition-colors"
          >
            Dashboard
          </Link>
          <Link
            href="/savings"
            className="text-sm font-medium hover:text-green-600 dark:hover:text-green-500 transition-colors"
          >
            Savings
          </Link>
          <Link
            href="/loans"
            className="text-sm font-medium hover:text-green-600 dark:hover:text-green-500 transition-colors"
          >
            Loans
          </Link>
          <Link
            href="/partners"
            className="text-sm font-medium hover:text-green-600 dark:hover:text-green-500 transition-colors"
          >
            Partners
          </Link>
          <Link
            href="/tokens"
            className="text-sm font-medium hover:text-green-600 dark:hover:text-green-500 transition-colors"
          >
            Tokens
          </Link>
          <Link
            href="/register"
            className="text-sm font-medium hover:text-green-600 dark:hover:text-green-500 transition-colors"
          >
            Register
          </Link>
        </nav>

        <div className="hidden md:flex items-center gap-4">
          {mounted && (
            <Button variant="ghost" size="icon" onClick={toggleTheme} className="rounded-full">
              {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              <span className="sr-only">Toggle theme</span>
            </Button>
          )}
          <WalletConnectButton />
        </div>

        <div className="flex items-center md:hidden gap-2">
          {mounted && (
            <Button variant="ghost" size="icon" onClick={toggleTheme} className="rounded-full">
              {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              <span className="sr-only">Toggle theme</span>
            </Button>
          )}
          <button
            className="flex items-center justify-center rounded-md p-2"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            <span className="sr-only">Toggle menu</span>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="fixed inset-0 top-16 z-50 bg-background md:hidden overflow-y-auto">
          <div className="container py-6 flex flex-col gap-4">
            <Link
              href="/dashboard"
              className="text-base font-medium hover:text-green-600 dark:hover:text-green-500 transition-colors py-2"
              onClick={() => setIsMenuOpen(false)}
            >
              Dashboard
            </Link>
            <Link
              href="/savings"
              className="text-base font-medium hover:text-green-600 dark:hover:text-green-500 transition-colors py-2"
              onClick={() => setIsMenuOpen(false)}
            >
              Savings
            </Link>
            <Link
              href="/loans"
              className="text-base font-medium hover:text-green-600 dark:hover:text-green-500 transition-colors py-2"
              onClick={() => setIsMenuOpen(false)}
            >
              Loans
            </Link>
            <Link
              href="/partners"
              className="text-base font-medium hover:text-green-600 dark:hover:text-green-500 transition-colors py-2"
              onClick={() => setIsMenuOpen(false)}
            >
              Partners
            </Link>
            <Link
              href="/tokens"
              className="text-base font-medium hover:text-green-600 dark:hover:text-green-500 transition-colors py-2"
              onClick={() => setIsMenuOpen(false)}
            >
              Tokens
            </Link>
            <Link
              href="/voting"
              className="text-base font-medium hover:text-green-600 dark:hover:text-green-500 transition-colors py-2"
              onClick={() => setIsMenuOpen(false)}
            >
              Voting
            </Link>
            <WalletConnectButton />
          </div>
        </div>
      )}
    </header>
  )
}
