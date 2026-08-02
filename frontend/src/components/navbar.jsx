"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Heart, Menu, X, Sun, Moon, ChevronDown } from "lucide-react"
import { useState, useEffect } from "react"
import { useTheme } from "@/components/theme-provider"
import WalletConnectButton from "@/components/wallet-connnect-button"

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const { theme, setTheme } = useTheme()
  const pathname = usePathname()

  useEffect(() => {
    setMounted(true)
  }, [])

  // Close menu when route changes
  useEffect(() => {
    setIsMenuOpen(false)
  }, [pathname])

  // Close menu on escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        setIsMenuOpen(false)
      }
    }

    if (isMenuOpen) {
      document.addEventListener('keydown', handleEscape)
      // Prevent body scroll when menu is open
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isMenuOpen])

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark")
  }

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  const isActiveLink = (href) => {
    if (href === '/') {
      return pathname === '/'
    }
    return pathname.startsWith(href)
  }

  const navLinks = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/savings", label: "Savings" },
    { href: "/loans", label: "Loans" },
    { href: "/partners", label: "Partners" },
    { href: "/tokens", label: "Tokens" },
    { href: "/metrics", label: "Metrics" },
    { href: "/register", label: "Register" },
  ]

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-all duration-200">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="relative">
                <Heart className="h-6 w-6 text-green-600 dark:text-green-500 transition-transform group-hover:scale-110" />
                <div className="absolute inset-0 h-6 w-6 text-green-600 dark:text-green-500 animate-pulse opacity-0 group-hover:opacity-20">
                  <Heart className="h-6 w-6 fill-current" />
                </div>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                HealFi
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`
                  relative px-3 py-2 text-sm font-medium rounded-md transition-all duration-200
                  ${isActiveLink(link.href)
                    ? 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20'
                    : 'text-muted-foreground hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/10'
                  }
                `}
              >
                {link.label}
                {isActiveLink(link.href) && (
                  <div className="absolute inset-x-0 bottom-0 h-0.5 bg-green-600 dark:bg-green-400 rounded-full" />
                )}
              </Link>
            ))}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden lg:flex items-center gap-3">
            {mounted && (
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={toggleTheme} 
                className="rounded-full hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
              >
                {theme === "dark" ? 
                  <Sun className="h-5 w-5 text-amber-500" /> : 
                  <Moon className="h-5 w-5 text-slate-600" />
                }
                <span className="sr-only">Toggle theme</span>
              </Button>
            )}
            <WalletConnectButton />
          </div>

          {/* Mobile Actions */}
          <div className="flex items-center gap-2 lg:hidden">
            {mounted && (
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={toggleTheme} 
                className="rounded-full hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
              >
                {theme === "dark" ? 
                  <Sun className="h-5 w-5 text-amber-500" /> : 
                  <Moon className="h-5 w-5 text-slate-600" />
                }
                <span className="sr-only">Toggle theme</span>
              </Button>
            )}
            
            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleMenu}
              className="rounded-md hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
              aria-expanded={isMenuOpen}
              aria-controls="mobile-menu"
            >
              <div className="relative w-6 h-6">
                <div className={`absolute inset-0 transition-transform duration-300 ${isMenuOpen ? 'rotate-180 opacity-0' : 'rotate-0 opacity-100'}`}>
                  <Menu className="h-6 w-6" />
                </div>
                <div className={`absolute inset-0 transition-transform duration-300 ${isMenuOpen ? 'rotate-0 opacity-100' : 'rotate-180 opacity-0'}`}>
                  <X className="h-6 w-6" />
                </div>
              </div>
              <span className="sr-only">
                {isMenuOpen ? 'Close menu' : 'Open menu'}
              </span>
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      <div 
        className={`
          fixed inset-0 z-40 lg:hidden transition-opacity duration-300
          ${isMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}
        `}
        onClick={toggleMenu}
        aria-hidden="true"
      >
        <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" />
      </div>

      {/* Mobile Menu */}
      <div 
        id="mobile-menu"
        className={`
          fixed top-16 left-0 right-0 bottom-0 z-50 lg:hidden
          bg-background border-t border-border/40
          transform transition-transform duration-300 ease-in-out
          ${isMenuOpen ? 'translate-x-0' : 'translate-x-full'}
        `}
      >
        <div className="overflow-y-auto h-full">
          <div className="container py-6 px-4">
            {/* Mobile Navigation Links */}
            <nav className="space-y-1 mb-8">
              {navLinks.map((link, index) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={toggleMenu}
                  className={`
                    flex items-center justify-between px-4 py-3 text-base font-medium rounded-lg
                    transition-all duration-200 transform
                    ${isActiveLink(link.href)
                      ? 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 scale-[1.02]'
                      : 'text-foreground hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/10 hover:scale-[1.01]'
                    }
                  `}
                  style={{
                    animationDelay: `${index * 50}ms`,
                    animation: isMenuOpen ? 'slideInFromRight 0.3s ease-out forwards' : 'none'
                  }}
                >
                  <span>{link.label}</span>
                  {isActiveLink(link.href) && (
                    <div className="w-2 h-2 bg-green-600 dark:bg-green-400 rounded-full animate-pulse" />
                  )}
                </Link>
              ))}
            </nav>

            {/* Mobile Wallet Connect */}
            <div className="border-t border-border/40 pt-6">
              <div className="px-4">
                <p className="text-sm text-muted-foreground mb-3">Account</p>
                <WalletConnectButton className="w-full" />
              </div>
            </div>

            {/* Mobile Additional Links */}
            <div className="border-t border-border/40 pt-6 mt-6">
              <div className="px-4 space-y-3">
                <p className="text-sm text-muted-foreground mb-3">Quick Links</p>
                <Link
                  href="/verify"
                  onClick={toggleMenu}
                  className="block text-sm text-muted-foreground hover:text-green-600 dark:hover:text-green-400 transition-colors"
                >
                  Identity Verification (Coming Soon)
                </Link>
                <Link
                  href="#"
                  onClick={toggleMenu}
                  className="block text-sm text-muted-foreground hover:text-green-600 dark:hover:text-green-400 transition-colors"
                >
                  Help & Support
                </Link>
                <Link
                  href="#"
                  onClick={toggleMenu}
                  className="block text-sm text-muted-foreground hover:text-green-600 dark:hover:text-green-400 transition-colors"
                >
                  Documentation
                </Link>
              </div>
            </div>

            {/* App Info */}
            <div className="border-t border-border/40 pt-6 mt-6">
              <div className="px-4 text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Heart className="h-4 w-4 text-green-600 dark:text-green-500" />
                  <span className="text-sm font-medium text-green-600 dark:text-green-400">HealFi</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Decentralized Healthcare Financing
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Built on Celo Blockchain
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Custom CSS for animations */}
      <style jsx>{`
        @keyframes slideInFromRight {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </>
  )
}