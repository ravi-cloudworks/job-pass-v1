import { useRef } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function HowItWorksSection() {
  const videoRef1 = useRef(null)
  const videoRef2 = useRef(null)
  
  return (
    <section id="how-it-works" className="py-16 px-4 md:px-6 lg:px-8 bg-muted/50">
      <div className="container mx-auto max-w-5xl">
        <h2 className="text-3xl font-bold mb-4 text-center">How It Works</h2>
        <p className="text-lg text-muted-foreground mb-12 text-center max-w-2xl mx-auto">
          See our AI interview assistant in action
        </p>
        
        <Tabs defaultValue="candidates" className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8">
            <TabsTrigger value="candidates">For Candidates</TabsTrigger>
            <TabsTrigger value="recruiters">For Recruiters</TabsTrigger>
          </TabsList>
          
          <TabsContent value="candidates" className="mt-0">
            <div className="aspect-video max-w-3xl mx-auto rounded-lg overflow-hidden bg-card border shadow-lg">
              <video 
                ref={videoRef1}
                controls
                className="w-full h-full"
                poster="/api/placeholder/1280/720?text=Candidate+Demo"
              >
                <source src="#" type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </div>
          </TabsContent>
          
          <TabsContent value="recruiters" className="mt-0">
            <div className="aspect-video max-w-3xl mx-auto rounded-lg overflow-hidden bg-card border shadow-lg">
              <video 
                ref={videoRef2}
                controls
                className="w-full h-full"
                poster="/api/placeholder/1280/720?text=Recruiter+Demo"
              >
                <source src="#" type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </section>
  )
}