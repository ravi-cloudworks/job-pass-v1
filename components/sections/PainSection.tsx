import { Card, CardDescription, CardHeader } from "@/components/ui/card"

export default function PainSection() {
  return (
    <section className="py-16 px-4 md:px-6 lg:px-8 bg-muted/50">
      <div className="container mx-auto max-w-5xl">
        <h2 className="text-3xl font-bold mb-4 text-center">Why Interview Preparation Is Broken</h2>
        <p className="text-lg text-muted-foreground mb-12 text-center max-w-2xl mx-auto">
          The traditional ways of preparing for interviews leave you unprepared and anxious
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card className="border-destructive/20">
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-destructive"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                <h3 className="font-semibold">Practicing with Friends</h3>
              </div>
              <CardDescription>
                They're not hiring managers and can't give you the critical feedback you need.
              </CardDescription>
            </CardHeader>
          </Card>
          
          <Card className="border-destructive/20">
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-destructive"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                <h3 className="font-semibold">Online Guides and Videos</h3>
              </div>
              <CardDescription>
                Passive consumption doesn't build muscle memory or real-world skills.
              </CardDescription>
            </CardHeader>
          </Card>
          
          <Card className="border-destructive/20">
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-destructive"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                <h3 className="font-semibold">Career Coaches</h3>
              </div>
              <CardDescription>
                Expensive and hard to schedule around your busy life.
              </CardDescription>
            </CardHeader>
          </Card>
          
          <Card className="border-destructive/20">
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-destructive"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                <h3 className="font-semibold">Outdated Question Lists</h3>
              </div>
              <CardDescription>
                Companies change their interview questions constantly, making static lists useless.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    </section>
  )
}