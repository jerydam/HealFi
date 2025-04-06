import "./globals.css"
import { Inter } from "next/font/google"
import { ThemeProvider } from "../components/ui/theme-provider"
import Navbar from "../components/navbar"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "HealFi - Healthcare Savings & Microloans",
  description: "Save for healthcare, access microloans, and connect with trusted healthcare providers.",
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <Navbar />
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}

