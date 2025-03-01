import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function CtaSection() {
  return (
    <section className="py-20 px-4 md:px-6 lg:px-8 bg-primary text-primary-foreground">
      <div className="container mx-auto max-w-5xl text-center">
        <h2 className="text-3xl font-bold mb-4">Ready to Land Your Dream Job?</h2>
        <p className="text-xl mb-8 max-w-2xl mx-auto opacity-90">
          Start practicing with our AI interview assistant today and get the edge you need in your job search.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="lg" variant="secondary" asChild>
            <Link href="/register">Get Started Now</Link>
          </Button>
          <Button size="lg" variant="outline" className="bg-transparent" asChild>
            <Link href="/demo">Watch Demo</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}