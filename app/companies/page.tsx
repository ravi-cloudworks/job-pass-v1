"use client"

import { useState, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import CompanyList from "@/components/companies/CompanyList"
// import CompanyDetail from "@/components/companies/CompanyDetail"
import CompanyForm from "@/components/companies/CompanyForm"
import MainLayout from "@/components/layout/MainLayout"
import { useAuth } from "@/hooks/useAuth"

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

  if (loading) return <div>Loading...</div>
  if (!user) return <div>Please sign in to view companies</div>

  return (
    <MainLayout>
      <Suspense fallback={<div className="p-4 text-center">Loading...</div>}>
        <CompaniesContent />
      </Suspense>
    </MainLayout>
  )
}