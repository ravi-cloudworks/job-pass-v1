"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"

export default function EarningsCalculator() {
  // Define discrete options for each slider
  const fulfillmentCostOptions = [10, 25, 50, 75]
  const sellingPriceOptions = [25, 50, 100, 150]
  const coachingPriceOptions = [100, 150, 250, 500]
  const monthlySalesOptions = [10, 25, 100, 500]

  // State using indices rather than direct values
  const [fulfillmentCostIndex, setFulfillmentCostIndex] = useState(3) // Default to 25 (index 3)
  const [sellingPriceIndex, setSellingPriceIndex] = useState(2) // Default to 45 (index 2)
  const [coachingPriceIndex, setCoachingPriceIndex] = useState(1) // Default to 25 (index 1)
  const [monthlySalesIndex, setMonthlySalesIndex] = useState(1) // Default to 10 (index 1)
  const [currency, setCurrency] = useState("₹") // Default to Rupee

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Here you would typically send the data to your backend
    console.log('Form submitted:', formData)
    // For demo purposes, just close the modal and show a success message
    setIsModalOpen(false)
    alert('Your application has been submitted successfully! We will contact you soon.')
  }

  // Get actual values from indices
  const fulfillmentCost = fulfillmentCostOptions[fulfillmentCostIndex]
  const sellingPrice = sellingPriceOptions[sellingPriceIndex]
  const coachingPrice = coachingPriceOptions[coachingPriceIndex]
  const monthlySales = monthlySalesOptions[monthlySalesIndex]

  // Image carousel
  const images = ['./templates/card-1.png', './templates/card-2.png']
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  const nextImage = () => {
    setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images.length)
  }

  // Calculate earnings based on actual values
  const validSellingPrice = sellingPrice < fulfillmentCost ? fulfillmentCost : sellingPrice
  const profitPerItem = validSellingPrice - fulfillmentCost + coachingPrice
  const monthlyEarnings = profitPerItem * monthlySales

  return (
    <section className="py-8 px-4 md:px-6 lg:px-8 bg-olive-950 text-black">
      <div className="container mx-auto max-w-6xl">
        <h2 className="text-4xl font-bold mb-8 text-center">Calculate your earnings</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {/* Column 1: Product image */}
          <div className="space-y-3 h-full flex flex-col justify-center border border-gray-300 rounded-lg p-5">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Mock Interview Cards</h3>
            </div>
            <div className="relative">
              <img
                src={images[currentImageIndex]}
                alt="Mock Interview Cards"
                className="w-full h-auto rounded-lg object-cover"
              />
              <Button
                variant="ghost"
                className="absolute top-1/2 right-4 transform -translate-y-1/2 bg-black/20 hover:bg-black/30 rounded-full p-2 text-black"
                aria-label="Next Interview Card"
                onClick={nextImage}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
              </Button>
            </div>
          </div>

          {/* Column 2: Calculator */}
          <div className="space-y-4 h-full flex flex-col">
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

            {/* <div>
              <p className="text-sm mb-4"> Mock Interview (Price / 30 Minutes Card) *: {currency}{fulfillmentCost}</p>
            </div> */}

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <label htmlFor="fulfillment-cost" className="text-sm font-semibold">Buy Card for: </label>
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
                <label htmlFor="coaching-price" className="text-sm font-semibold">Sell Interview Coaching for:</label>
                <div className="bg-white text-black rounded-md w-20 py-1 px-2 text-center font-bold text-sm">
                  {currency}{coachingPrice}
                </div>
              </div>

              <div className="px-1 mb-4">
                <Slider
                  id="coaching-price"
                  value={[coachingPriceIndex]}
                  min={0}
                  max={coachingPriceOptions.length - 1}
                  step={1}
                  onValueChange={(val) => setCoachingPriceIndex(val[0])}
                  className="[&>.SliderTrack]:h-1 [&>.SliderTrack]:bg-orange-500 [&>.SliderThumb]:bg-white [&>.SliderThumb]:border-2 [&>.SliderThumb]:border-orange-500"
                />

                <div className="relative h-6 mt-1">
                  {coachingPriceOptions.map((price, i) => (
                    <div
                      key={i}
                      className={`text-center text-xs ${i === coachingPriceIndex ? 'font-bold text-gray-800' : 'text-gray-600'}`}
                      style={{ width: '20px', transform: 'translateX(-50%)', position: 'absolute', left: `${(i / (coachingPriceOptions.length - 1)) * 100}%` }}
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
          <div className="flex flex-col justify-between h-full border border-gray-300 rounded-lg p-5">
            <div className="space-y-2">
              <div className="bg-olive-900 bg-opacity-40 p-5 rounded-lg">
                <h4 className="text-lg font-semibold mb-2 text-center">Your Monthly Earnings</h4>
                <div className="bg-white rounded-md p-4 text-center">
                  <p className="text-3xl font-bold text-black">{currency}{monthlyEarnings.toFixed(0)}</p>
                </div>
              </div>

              <div className="bg-olive-900 bg-opacity-20 p-5 rounded-lg">
                <p className="text-md font-semibold mb-3">Summary:</p>
                <ul className="space-y-1 list-disc pl-5 text-sm">
                  <li>Mock Interview Cost: {currency}{fulfillmentCost}</li>
                  <li>Your Selling Price: {currency}{validSellingPrice}</li>
                  <li>Coaching Price: {currency}{coachingPrice}</li>
                  <li>Profit Per Card: {currency}{profitPerItem}</li>
                  <li>Monthly Sales: {monthlySales} cards</li>
                  <li className="font-bold">Total: {currency}{monthlyEarnings.toFixed(0)}</li>
                </ul>
              </div>
            </div>

            {/* <Button
              variant="default"
              className="w-full mt-auto bg-orange-500 hover:bg-orange-600"
              onClick={() => setIsModalOpen(true)}
            >
              Become an Expert
            </Button> */}


            <Button
              variant="default"
              className="w-full mt-auto bg-orange-500 hover:bg-orange-600"
              onClick={() => {
                if (window.$crisp) {
                  window.$crisp.push(["do", "chat:open"]);
                }
              }}
            >
              Become an Expert
            </Button>

          </div>
        </div>
      </div>

      {/* Expert Application Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md mx-4 overflow-hidden">
            <div className="bg-orange-500 p-4">
              <h2 className="text-xl font-bold text-white">Become an Expert</h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  required
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  required
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  required
                />
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">Tell us about your expertise</label>
                <textarea
                  id="message"
                  name="message"
                  rows={4}
                  value={formData.message}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                  required
                ></textarea>
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                  className="border-gray-300 text-gray-700"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-orange-500 hover:bg-orange-600 text-white"
                >
                  Submit Application
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  )
}