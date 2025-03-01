import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export default function LoveWallSection() {
  // Reviews for love wall
  const reviews = [
    {
      name: "Alex Miller",
      role: "Software Engineer at Google",
      photo: "/api/placeholder/32/32",
      review: "This interview assistant helped me prepare for my technical interviews. I went from getting rejected to landing my dream job at Google!",
      rating: 5
    },
    {
      name: "Sarah Johnson",
      role: "Product Manager",
      photo: "/api/placeholder/32/32",
      review: "The personalized feedback on my responses was invaluable. I felt so much more confident in my actual interviews.",
      rating: 5
    },
    {
      name: "Michael Chen",
      role: "Data Scientist",
      photo: "/api/placeholder/32/32",
      review: "The AI asked me questions I actually got in my real interviews. The practice made all the difference.",
      rating: 5
    },
    {
      name: "Jessica Williams",
      role: "UX Designer",
      photo: "/api/placeholder/32/32",
      review: "I practiced my portfolio presentations and got real-time feedback. Landed 3 job offers in 2 weeks!",
      rating: 5
    },
    {
      name: "Robert Taylor",
      role: "Engineering Manager",
      photo: "/api/placeholder/32/32",
      review: "As someone who interviews candidates, I recommend this to anyone preparing for technical roles. It simulates real interviews perfectly.",
      rating: 5
    },
    {
      name: "Emily Rodriguez",
      role: "Recent CS Graduate",
      photo: "/api/placeholder/32/32",
      review: "Got my first tech job after just 2 weeks of practicing with this tool. Worth every penny!",
      rating: 5
    }
  ]

  return (
    <section className="py-16 px-4 md:px-6 lg:px-8">
      <div className="container mx-auto max-w-5xl">
        <h2 className="text-3xl font-bold mb-4 text-center">What Our Users Say</h2>
        <p className="text-lg text-muted-foreground mb-12 text-center max-w-2xl mx-auto">
          Join thousands of successful job seekers who improved their interview skills
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reviews.map((review, index) => (
            <Card key={index} className="h-full flex flex-col">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-4">
                  <Avatar>
                    <AvatarImage src={review.photo} alt={review.name} />
                    <AvatarFallback>{review.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold">{review.name}</h3>
                    <p className="text-sm text-muted-foreground">{review.role}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-grow">
                <div className="flex mb-2 text-amber-500">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill={i < review.rating ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                  ))}
                </div>
                <p className="text-sm">{review.review}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}