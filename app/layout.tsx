'use client'

import { GoogleOAuthProvider } from '@react-oauth/google';
import { useEffect } from 'react'; // Add this import
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import Header from "@/components/Header"
import Footer from "@/components/Footer"
import { Toaster } from "@/components/ui/toaster"
import CrispChat from "@/components/CrispChat";
import { initializeChatbot } from "@/utils/chatbotFlow"; // Add this import
import { AuthProvider } from "@/contexts/AuthContext"

const inter = Inter({ subsets: ["latin"] })

// This Client ID is public and restricted by domain in Google Cloud Console
const GOOGLE_CLIENT_ID = "176256080981-dti77ihi1973i5cgch55g5rsjkl4fneo.apps.googleusercontent.com";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Initialize chatbot on component mount
  useEffect(() => {
    console.log('🚀 Initializing chatbot in layout component with highest priority');
    // Use setTimeout with 0 to ensure this runs before other effects but after render
    setTimeout(() => {
      initializeChatbot().catch(error => {
        console.error('Failed to initialize chatbot in layout:', error);
      });
    }, 0);
  }, []);

  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <AuthProvider>
          <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
            <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
              <div className="flex flex-col min-h-screen">
                <Header />
                <main className="flex-grow">{children}</main>
                <Footer />
              </div>
              <Toaster />
              <CrispChat /> {/* Add Crisp here */}
            </ThemeProvider>
          </GoogleOAuthProvider>
        </AuthProvider>
        <div id="portal-root" />
      </body>
    </html>
  )
}