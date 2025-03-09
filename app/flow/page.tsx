// app/flow/page.tsx
"use client"

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import MainLayout from "@/components/layout/MainLayout"
import TestManager from "@/components/tests/TestManager"
import { useAuth } from "@/hooks/useAuth"

function TestFlowContent() {
  const { user, loading } = useAuth()
  const searchParams = useSearchParams()
  const companyId = searchParams.get('companyId')
  
  if (loading) return <div>Loading...</div>
  if (!companyId) {
    return <div className="p-4">Company ID is required</div>
  }
  
  return <TestManager companyId={companyId} user={user} view="flow" />
}

export default function FlowPage() {
  return (
    <MainLayout>
      <Suspense fallback={<div>Loading...</div>}>
        <TestFlowContent />
      </Suspense>
    </MainLayout>
  )
}