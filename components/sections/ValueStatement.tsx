import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export default function ValueStatement() {
  return (
    <section className="py-20 px-4 md:px-6 lg:px-8 bg-gradient-to-b from-primary/10 to-background">
      <div className="container mx-auto max-w-5xl">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <Badge className="mb-4">AI-Powered Interview Prep</Badge>
            <h1 className="text-4xl font-bold tracking-tight mb-4">
              Get Your Dream Job in <span className="text-primary">Days</span>, Not Months
            </h1>
            <p className="text-xl mb-8 text-muted-foreground">
              AI-powered mock interviews with personalized feedback to help you practice better and interview with confidence.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" asChild>
                <Link href="/chat">Start Practicing Now</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="#how-it-works">See How It Works</Link>
              </Button>
            </div>
          </div>
          <div className="relative">
            <div className="aspect-video rounded-lg overflow-hidden bg-muted shadow-xl border">
              <img 
                src="/api/placeholder/600/350" 
                alt="AI Interview Assistant Demo" 
                className="object-cover w-full h-full"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end">
                <Button className="m-4" variant="secondary" size="sm">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                  Watch Demo
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}