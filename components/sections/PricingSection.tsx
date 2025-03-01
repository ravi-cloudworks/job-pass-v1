import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"

export default function PricingSection() {
  const [interviewHours, setInterviewHours] = useState(5)

  // Calculate pricing based on hours
  const hourlyRate = 10
  
  // Using Record to properly type the discount rates object
  const discountRates: Record<number, number> = {
    1: 0,
    5: 0.1,
    10: 0.15,
    25: 0.2,
    50: 0.25
  }
  
  const hourOptions = [1, 5, 10, 25, 50]
  const discount = discountRates[interviewHours] || 0
  const totalPrice = interviewHours * hourlyRate * (1 - discount)
  const savings = interviewHours * hourlyRate * discount

  return (
    <section className="py-16 px-4 md:px-6 lg:px-8 bg-muted/50">
      <div className="container mx-auto max-w-5xl">
        <h2 className="text-3xl font-bold mb-4 text-center">Simple, Transparent Pricing</h2>
        <p className="text-lg text-muted-foreground mb-12 text-center max-w-2xl mx-auto">
          Pay only for the interview time you need
        </p>
        
        <div className="bg-card border rounded-lg p-8 max-w-3xl mx-auto shadow">
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-2">Select Interview Hours</h3>
            <div className="flex justify-between text-sm text-muted-foreground mb-2">
              <span>1 hour</span>
              <span>50 hours</span>
            </div>
            <div className="relative">
              <Slider
                value={[hourOptions.indexOf(interviewHours)]}
                max={hourOptions.length - 1}
                step={1}
                onValueChange={(val) => setInterviewHours(hourOptions[val[0]])}
                className="mb-6"
              />
              <div className="flex justify-between absolute w-full">
                {hourOptions.map((h, i) => (
                  <div 
                    key={i} 
                    className={`absolute transform -translate-x-1/2 -top-6 text-xs ${interviewHours === h ? 'text-primary font-semibold' : 'text-muted-foreground'}`}
                    style={{ left: `${(i / (hourOptions.length - 1)) * 100}%` }}
                  >
                    {h}h
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Your Plan</h3>
              <div className="flex justify-between">
                <span>{interviewHours} hours of AI interviews</span>
                <span>${interviewHours * hourlyRate}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Bulk discount ({(discount * 100).toFixed(0)}%)</span>
                  <span>-${savings.toFixed(2)}</span>
                </div>
              )}
              <div className="pt-2 border-t border-border">
                <div className="flex justify-between font-semibold">
                  <span>Total</span>
                  <span>${totalPrice.toFixed(2)}</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  ${(totalPrice / interviewHours).toFixed(2)} per hour
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">What's Included</h3>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600 mt-0.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  <span>Unlimited AI practice interviews</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600 mt-0.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  <span>Personalized feedback and analysis</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600 mt-0.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  <span>Progress tracking dashboard</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600 mt-0.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  <span>Industry-specific question bank</span>
                </li>
              </ul>
            </div>
          </div>
          
          <Button className="w-full" size="lg">
            Get Started with {interviewHours} Hours
          </Button>
        </div>
      </div>
    </section>
  )
}