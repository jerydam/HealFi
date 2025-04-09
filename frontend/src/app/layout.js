import "@/app/globals.css"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/ui/theme-provider"
import Navbar from "@/components/navbar"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "HealFi - Healthcare Savings & Microloans",
  description: "Save for healthcare, access microloans, and connect with trusted healthcare providers.",
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} min-h-screen flex flex-col bg-background text-foreground`}>
        <ThemeProvider defaultTheme="light" attribute="class">
          <div className="flex flex-col min-h-screen">
            <Navbar />
            <main className="flex-1 bg-background">{children}</main>
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}
