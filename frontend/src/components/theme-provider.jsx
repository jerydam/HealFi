"use client"

import { createContext, useContext, useEffect, useState } from "react"

// Create the context with default values
const ThemeProviderContext = createContext({
  theme: "light",
  setTheme: () => null,
})

export function ThemeProvider({ children, defaultTheme = "light", storageKey = "theme", ...props }) {
  const [theme, setTheme] = useState(defaultTheme)
  const [mounted, setMounted] = useState(false)

  // Only run this effect on the client
  useEffect(() => {
    setMounted(true)

    // Initialize theme from localStorage or system preference
    if (storageKey) {
      const savedTheme = localStorage.getItem(storageKey)
      if (savedTheme) {
        setTheme(savedTheme)
      } else {
        // Check for system preference if no saved theme
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
        setTheme(prefersDark ? "dark" : "light")
      }
    }
  }, [storageKey])

  useEffect(() => {
    if (!mounted) return

    const root = window.document.documentElement

    // Remove the previous theme class
    root.classList.remove("light", "dark")

    // Add the current theme class
    root.classList.add(theme)

    // Store the theme preference
    if (storageKey) {
      localStorage.setItem(storageKey, theme)
    }
  }, [theme, storageKey, mounted])

  // Avoid rendering with incorrect theme on first mount
  if (!mounted) {
    return <>{children}</>
  }

  const value = {
    theme,
    setTheme: (newTheme) => {
      setTheme(newTheme)
    },
  }

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

// Export the useTheme hook
export const useTheme = () => {
  const context = useContext(ThemeProviderContext)
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }
  return context
}
