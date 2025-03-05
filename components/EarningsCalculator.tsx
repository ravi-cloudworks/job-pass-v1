"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"

export default function EarningsCalculator() {
  // Define discrete options for each slider
  const fulfillmentCostOptions = [10, 15, 20, 25, 30, 35, 40, 50]
  const sellingPriceOptions = [25, 35, 45, 55, 65, 75, 85, 100]
  const monthlySalesOptions = [5, 10, 25, 50, 100, 200, 350, 500]
  
  // State using indices rather than direct values
  const [fulfillmentCostIndex, setFulfillmentCostIndex] = useState(3) // Default to 25 (index 3)
  const [sellingPriceIndex, setSellingPriceIndex] = useState(2) // Default to 45 (index 2)
  const [monthlySalesIndex, setMonthlySalesIndex] = useState(1) // Default to 10 (index 1)
  const [currency, setCurrency] = useState("₹") // Default to Rupee
  
  // Get actual values from indices
  const fulfillmentCost = fulfillmentCostOptions[fulfillmentCostIndex]
  const sellingPrice = sellingPriceOptions[sellingPriceIndex]
  const monthlySales = monthlySalesOptions[monthlySalesIndex]
  
  // Calculate earnings based on actual values
  const validSellingPrice = sellingPrice < fulfillmentCost ? fulfillmentCost : sellingPrice
  const profitPerItem = validSellingPrice - fulfillmentCost
  const monthlyEarnings = profitPerItem * monthlySales

  return (
    <section className="py-8 px-4 md:px-6 lg:px-8 bg-olive-950 text-black">
      <div className="container mx-auto max-w-6xl">
        <h2 className="text-4xl font-bold mb-8 text-center">Calculate your earnings</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Column 1: Product image */}
          <div className="space-y-3">
            <div className="relative">
              <img 
                src="/api/placeholder/400/300" 
                alt="Mock Interview Banner" 
                className="w-full h-auto rounded-lg object-cover"
              />
              <Button 
                variant="ghost" 
                className="absolute top-1/2 right-4 transform -translate-y-1/2 bg-black/20 hover:bg-black/30 rounded-full p-2 text-black"
                aria-label="Next product"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
              </Button>
            </div>
            
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Mock Interview Banner</h3>
              <Button 
                variant="outline"
                className="border-black text-black hover:bg-black/20 text-sm py-1"
                size="sm"
              >
                Become a Expert
              </Button>
            </div>
          </div>
          
          {/* Column 2: Calculator */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold">Profit calculator</h3>
              
              <div className="flex space-x-1">
                <Button 
                  variant={currency === "$" ? "default" : "outline"} 
                  className={`${currency === "$" ? "bg-orange-500 hover:bg-orange-600" : "text-black border-black hover:bg-black/10"} px-2 py-1 h-8 min-w-8`}
                  onClick={() => setCurrency("$")}
                  size="sm"
                >
                  $
                </Button>
                <Button 
                  variant={currency === "€" ? "default" : "outline"} 
                  className={`${currency === "€" ? "bg-orange-500 hover:bg-orange-600" : "text-black border-black hover:bg-black/10"} px-2 py-1 h-8 min-w-8`}
                  onClick={() => setCurrency("€")}
                  size="sm"
                >
                  €
                </Button>
                <Button 
                  variant={currency === "£" ? "default" : "outline"} 
                  className={`${currency === "£" ? "bg-orange-500 hover:bg-orange-600" : "text-black border-black hover:bg-black/10"} px-2 py-1 h-8 min-w-8`}
                  onClick={() => setCurrency("£")}
                  size="sm"
                >
                  £
                </Button>
                <Button 
                  variant={currency === "₹" ? "default" : "outline"} 
                  className={`${currency === "₹" ? "bg-orange-500 hover:bg-orange-600" : "text-black border-black hover:bg-black/10"} px-2 py-1 h-8 min-w-8`}
                  onClick={() => setCurrency("₹")}
                  size="sm"
                >
                  ₹
                </Button>
              </div>
            </div>
            
            <div>
              <p className="text-sm mb-4"> Mock Interview (Price / 30 Minutes Card) *: {currency}{fulfillmentCost}</p>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <label htmlFor="fulfillment-cost" className="text-sm font-semibold">Interview Cost:</label>
                <div className="bg-white text-black rounded-md w-20 py-1 px-2 text-center font-bold text-sm">
                  {currency}{fulfillmentCost}
                </div>
              </div>
              
              <div className="px-1 mb-4">
                <Slider
                  id="fulfillment-cost"
                  value={[fulfillmentCostIndex]}
                  min={0}
                  max={fulfillmentCostOptions.length - 1}
                  step={1}
                  onValueChange={(val) => setFulfillmentCostIndex(val[0])}
                  className="[&>.SliderTrack]:h-1 [&>.SliderTrack]:bg-orange-500 [&>.SliderThumb]:bg-white [&>.SliderThumb]:border-2 [&>.SliderThumb]:border-orange-500"
                />
                
                <div className="relative h-6 mt-1">
                  {fulfillmentCostOptions.map((cost, i) => (
                    <div 
                      key={i} 
                      className={`text-center text-xs ${i === fulfillmentCostIndex ? 'font-bold text-gray-800' : 'text-gray-600'}`}
                      style={{ width: '20px', transform: 'translateX(-50%)', position: 'absolute', left: `${(i / (fulfillmentCostOptions.length - 1)) * 100}%` }}
                    >
                      {currency}{cost}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <label htmlFor="selling-price" className="text-sm font-semibold">Sell Card for:</label>
                <div className="bg-white text-black rounded-md w-20 py-1 px-2 text-center font-bold text-sm">
                  {currency}{validSellingPrice}
                </div>
              </div>
              
              <div className="px-1 mb-4">
                <Slider
                  id="selling-price"
                  value={[sellingPriceIndex]}
                  min={0}
                  max={sellingPriceOptions.length - 1}
                  step={1}
                  onValueChange={(val) => setSellingPriceIndex(val[0])}
                  className="[&>.SliderTrack]:h-1 [&>.SliderTrack]:bg-orange-500 [&>.SliderThumb]:bg-white [&>.SliderThumb]:border-2 [&>.SliderThumb]:border-orange-500"
                />
                
                <div className="relative h-6 mt-1">
                  {sellingPriceOptions.map((price, i) => (
                    <div 
                      key={i} 
                      className={`text-center text-xs ${i === sellingPriceIndex ? 'font-bold text-gray-800' : 'text-gray-600'} ${price < fulfillmentCost ? 'opacity-30' : ''}`}
                      style={{ width: '20px', transform: 'translateX(-50%)', position: 'absolute', left: `${(i / (sellingPriceOptions.length - 1)) * 100}%` }}
                    >
                      {currency}{price}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <label htmlFor="monthly-sales" className="text-sm font-semibold">Monthly sales:</label>
                <div className="bg-white text-black rounded-md w-20 py-1 px-2 text-center font-bold text-sm">
                  {monthlySales}
                </div>
              </div>
              
              <div className="px-1 mb-4">
                <Slider
                  id="monthly-sales"
                  value={[monthlySalesIndex]}
                  min={0}
                  max={monthlySalesOptions.length - 1}
                  step={1}
                  onValueChange={(val) => setMonthlySalesIndex(val[0])}
                  className="[&>.SliderTrack]:h-1 [&>.SliderTrack]:bg-orange-500 [&>.SliderThumb]:bg-white [&>.SliderThumb]:border-2 [&>.SliderThumb]:border-orange-500"
                />
                
                <div className="relative h-6 mt-1">
                  {monthlySalesOptions.map((sales, i) => (
                    <div 
                      key={i} 
                      className={`text-center text-xs ${i === monthlySalesIndex ? 'font-bold text-gray-800' : 'text-gray-600'}`}
                      style={{ width: '20px', transform: 'translateX(-50%)', position: 'absolute', left: `${(i / (monthlySalesOptions.length - 1)) * 100}%` }}
                    >
                      {sales}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          {/* Column 3: Results */}
          <div className="space-y-5">
            <div className="bg-olive-900 bg-opacity-40 p-5 rounded-lg">
              <h4 className="text-lg font-semibold mb-2">Your monthly earnings</h4>
              <div className="bg-white inline-block px-4 py-2 rounded-md">
                <p className="text-3xl font-bold text-black">{currency}{monthlyEarnings.toFixed(0)}</p>
              </div>
            </div>
            
            <div className="bg-olive-900 bg-opacity-20 p-5 rounded-lg">
              <p className="text-md font-semibold mb-3">Summary:</p>
              <ul className="space-y-1 list-disc pl-5 text-sm">
                <li>Mock Interview Cost: {currency}{fulfillmentCost}</li>
                <li>Your Selling Price: {currency}{validSellingPrice}</li>
                <li>Profit Per Card: {currency}{profitPerItem}</li>
                <li>Monthly Sales: {monthlySales} cards</li>
                <li className="font-bold">Total: {currency}{monthlyEarnings.toFixed(0)}</li>
              </ul>
            </div>
            
          </div>
        </div>
      </div>
    </section>
  )
}