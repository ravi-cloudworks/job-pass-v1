'use client'

import { GoogleOAuthProvider } from '@react-oauth/google';

import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import Header from "@/components/Header"
import Footer from "@/components/Footer"
import { Toaster } from "@/components/ui/toaster"  // Update this import

const inter = Inter({ subsets: ["latin"] })

// This Client ID is public and restricted by domain in Google Cloud Console
const GOOGLE_CLIENT_ID = "176256080981-dti77ihi1973i5cgch55g5rsjkl4fneo.apps.googleusercontent.com";


// export const metadata: Metadata = {
//   title: "AI INTERVIEW ASSISTANT",
//   description: "Professional AI INTERVIEW ASSISTANT ",
// }


export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
            <div className="flex flex-col min-h-screen">
              <Header />
              <main className="flex-grow">{children}</main>
              <Footer />
            </div>
            <Toaster />
          </ThemeProvider>
        </GoogleOAuthProvider>
        <div id="portal-root" />
      </body>
    </html>
  )
}
