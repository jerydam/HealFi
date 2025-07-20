"use client"

import { createContext, useContext, useEffect, useState } from "react"

// Create the context with default values
const ThemeProviderContext = createContext({
  theme: "light",
  setTheme: () => null,
  toggleTheme: () => null,
  systemTheme: "light",
  resolvedTheme: "light",
})

export function ThemeProvider({ 
  children, 
  defaultTheme = "light", 
  storageKey = "healfi-theme", 
  enableSystem = true,
  ...props 
}) {
  const [theme, setTheme] = useState(defaultTheme)
  const [systemTheme, setSystemTheme] = useState("light")
  const [mounted, setMounted] = useState(false)

  // Only run this effect on the client
  useEffect(() => {
    setMounted(true)

    // Get system preference
    const getSystemTheme = () => {
      return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
    }

    const currentSystemTheme = getSystemTheme()
    setSystemTheme(currentSystemTheme)

    // Initialize theme from localStorage or system preference
    if (storageKey) {
      const savedTheme = localStorage.getItem(storageKey)
      if (savedTheme && (savedTheme === "light" || savedTheme === "dark" || savedTheme === "system")) {
        setTheme(savedTheme)
      } else if (enableSystem) {
        setTheme("system")
      } else {
        setTheme(currentSystemTheme)
      }
    }

    // Listen for system theme changes
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
    const handleChange = (e) => {
      const newSystemTheme = e.matches ? "dark" : "light"
      setSystemTheme(newSystemTheme)
    }

    mediaQuery.addEventListener("change", handleChange)
    return () => mediaQuery.removeEventListener("change", handleChange)
  }, [storageKey, enableSystem])

  // Resolve the actual theme to apply
  const resolvedTheme = theme === "system" ? systemTheme : theme

  useEffect(() => {
    if (!mounted) return

    const root = window.document.documentElement

    // Remove all theme classes
    root.classList.remove("light", "dark")

    // Add the resolved theme class
    root.classList.add(resolvedTheme)

    // Store the theme preference
    if (storageKey) {
      localStorage.setItem(storageKey, theme)
    }

    // Update meta theme-color for mobile browsers
    const metaThemeColor = document.querySelector('meta[name="theme-color"]')
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', resolvedTheme === 'dark' ? '#0f172a' : '#ffffff')
    }
  }, [theme, resolvedTheme, storageKey, mounted])

  // Avoid rendering with incorrect theme on first mount
  if (!mounted) {
    return <div style={{ visibility: 'hidden' }}>{children}</div>
  }

  const toggleTheme = () => {
    if (enableSystem) {
      if (theme === "light") {
        setTheme("dark")
      } else if (theme === "dark") {
        setTheme("system")
      } else {
        setTheme("light")
      }
    } else {
      setTheme(theme === "light" ? "dark" : "light")
    }
  }

  const value = {
    theme,
    systemTheme,
    resolvedTheme,
    setTheme: (newTheme) => {
      if (newTheme === "light" || newTheme === "dark" || (enableSystem && newTheme === "system")) {
        setTheme(newTheme)
      }
    },
    toggleTheme,
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