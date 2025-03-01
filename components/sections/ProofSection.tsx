import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function ProofSection() {
  return (
    <section className="py-16 px-4 md:px-6 lg:px-8">
      <div className="container mx-auto max-w-5xl text-center">
        <h2 className="text-3xl font-bold mb-4">Results That Speak For Themselves</h2>
        <p className="text-lg text-muted-foreground mb-12 max-w-2xl mx-auto">
          Our users are getting job offers faster and with better compensation
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-4xl font-bold text-primary">87%</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">of our users receive job offers within 30 days</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-4xl font-bold text-primary">3.2x</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">more interview callbacks after practicing with our system</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-4xl font-bold text-primary">$18K</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">average increase in salary negotiations</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}