import "@/app/globals.css";
import ClientLayout from "@/components/ClientLayout"; // Import ClientLayout

export const metadata = {
  title: "HealFi - Healthcare Savings & Microloans",
  description: "Save for healthcare, access microloans, and connect with trusted healthcare providers on the blockchain.",
  keywords: "healthcare, savings, microloans, blockchain, DeFi, Self Protocol, identity verification",
  authors: [{ name: "HealFi Team" }],
  creator: "HealFi",
  publisher: "HealFi",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://healfi.vercel.app'),
  openGraph: {
    title: "HealFi - Healthcare Savings & Microloans",
    description: "Save for healthcare, access microloans, and connect with trusted healthcare providers.",
    url: 'https://healfi.vercel.app',
    siteName: 'HealFi',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'HealFi - Healthcare Financial Solutions',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'HealFi - Healthcare Savings & Microloans',
    description: 'Save for healthcare, access microloans, and connect with trusted healthcare providers.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0f172a' },
  ],
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className="min-h-screen flex flex-col bg-background text-foreground antialiased">
        <ClientLayout>
          {children}
        </ClientLayout>
      </body>
    </html>
  );
}