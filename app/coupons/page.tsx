"use client"

import CouponGenerator from '@/components/CouponGenerator'

export default function GenerateCouponsPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Generate Interview Cards</h1>
      <CouponGenerator /> 
    </div>
  )
}