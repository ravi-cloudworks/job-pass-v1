"use client"

import { useState } from "react"
import ValueStatement from "@/components/sections/ValueStatement"
import ProofSection from "@/components/sections/ProofSection"
import PainSection from "@/components/sections/PainSection"
import NewWaySection from "@/components/sections/NewWaySection"
import HowItWorksSection from "@/components/sections/HowItWorksSection"
import LoveWallSection from "@/components/sections/LoveWallSection"
import PricingSection from "@/components/sections/PricingSection"
import FaqSection from "@/components/sections/FaqSection"
import CtaSection from "@/components/sections/CtaSection"
import FooterSection from "@/components/sections/FooterSection"

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      {/* Section 1: Value Statement */}
      <ValueStatement />
      
      {/* Section 2: Proof That It Works */}
      <ProofSection />
      
      {/* Section 3: Pain Section */}
      <PainSection />
      
      {/* Section 4: The New Way */}
      <NewWaySection />
      
      {/* Section 5: How It Works */}
      <HowItWorksSection />
      
      {/* Section 6: Love Wall */}
      <LoveWallSection />
      
      {/* Section 7: Pricing */}
      <PricingSection />
      
      {/* Section 8: FAQ */}
      <FaqSection />
      
      {/* Section 9: Call-to-Action */}
      <CtaSection />
      
      {/* Section 10: Footer */}
      <FooterSection />
    </div>
  )
}