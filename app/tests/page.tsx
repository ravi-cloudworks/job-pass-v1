// app/tests/page.tsx
"use client"

import { Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"
import MainLayout from "@/components/layout/MainLayout"
import TestManager from "@/components/tests/TestManager"

function TestsContent() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const view = searchParams.get('view') || 'list'
  const id = searchParams.get('id')
  const companyId = searchParams.get('companyId')

  if (loading) return <div>Loading...</div>
  if (!user) {
    router.push('/login')
    return null
  }

  return (
    <TestManager 
      companyId={companyId} 
      user={user}
      testId={id}
      view={view}
    />
  )
}

export default function TestsPage() {
  return (
    <MainLayout>
      <Suspense fallback={<div>Loading...</div>}>
        <TestsContent />
      </Suspense>
    </MainLayout>
  )
}