"use client"

import { createContext, useContext, useEffect, useState } from "react"

const ThemeProviderContext = createContext()

export function ThemeProvider({
  children,
  defaultTheme = "light",
  storageKey = "theme",
  attribute = "data-theme",
  ...props
}) {
  const [theme, setTheme] = useState(defaultTheme)

  useEffect(() => {
    const root = window.document.documentElement

    // Remove the previous attribute value
    const previousValue = root.getAttribute(attribute)
    if (previousValue) {
      root.classList.remove(previousValue)
    }

    // Add the current theme class
    root.classList.add(theme)

    // Set the attribute value
    root.setAttribute(attribute, theme)

    // Store the theme preference
    if (storageKey) {
      localStorage.setItem(storageKey, theme)
    }
  }, [theme, attribute, storageKey])

  // Initialize theme from localStorage on mount
  useEffect(() => {
    if (storageKey) {
      const savedTheme = localStorage.getItem(storageKey)
      if (savedTheme) {
        setTheme(savedTheme)
      }
    }
  }, [storageKey])

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

export const useTheme = () => {
  const context = useContext(ThemeProviderContext)
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }
  return context
}
