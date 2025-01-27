import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import Header from "@/components/Header"
import Footer from "@/components/Footer"
import { Toaster } from "@/components/ui/toaster"  // Update this import

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "AI INTERVIEW ASSISTANT",
  description: "Professional AI INTERVIEW ASSISTANT ",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-grow">{children}</main>
            <Footer />
          </div>
          <Toaster />  {/* Add the Toaster component here */}
        </ThemeProvider>
        <div id="portal-root" />
      </body>
    </html>
  )
}
