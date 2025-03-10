"use client"

import { useState, Suspense, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import CompanyList from "@/components/companies/CompanyList"
// import CompanyDetail from "@/components/companies/CompanyDetail"
import CompanyForm from "@/components/companies/CompanyForm"
import MainLayout from "@/components/layout/MainLayout"
import { useAuth } from "@/hooks/useAuth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LockIcon } from "lucide-react"

// Create a client component that uses useSearchParams
function CompaniesContent() {
  const searchParams = useSearchParams()
  const view = searchParams.get('view') || 'list'
  const id = searchParams.get('id')
  
  return (
    <>
      {view === 'list' && <CompanyList />}
      {view === 'new' && <CompanyForm />}
      {view === 'edit' && id && <CompanyForm companyId={id} />}
    </>
  )
}

// Main page component with Suspense
export default function CompaniesPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      // Optional: store the intended destination to redirect back after login
      // sessionStorage.setItem("redirectAfterLogin", window.location.pathname)
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="animate-pulse text-center">
          <div className="h-8 w-8 mx-auto mb-4 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="container mx-auto py-16 px-4 max-w-md">
        <Card className="text-center">
          <CardHeader>
            <div className="mx-auto bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mb-4">
              <LockIcon className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">Restricted Access</CardTitle>
            <CardDescription>
              You need to be signed in to access this page
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-6 text-muted-foreground">
              Please sign in with your account to view this content.
            </p>
            <Button 
              className="w-full" 
              onClick={() => router.push("/login")}
            >
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <MainLayout>
      <Suspense fallback={<div className="p-4 text-center">Loading...</div>}>
        <CompaniesContent />
      </Suspense>
    </MainLayout>
  )
}