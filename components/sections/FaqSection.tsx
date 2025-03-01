import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
  } from "@/components/ui/accordion"
  
  export default function FaqSection() {
    return (
      <section className="py-16 px-4 md:px-6 lg:px-8">
        <div className="container mx-auto max-w-5xl">
          <h2 className="text-3xl font-bold mb-4 text-center">Frequently Asked Questions</h2>
          <p className="text-lg text-muted-foreground mb-12 text-center max-w-2xl mx-auto">
            Everything you need to know about our interview assistant
          </p>
          
          <Accordion type="single" collapsible className="max-w-3xl mx-auto">
            <AccordionItem value="item-1">
              <AccordionTrigger>How does the AI interview assistant work?</AccordionTrigger>
              <AccordionContent>
                Our AI uses advanced language processing to simulate realistic interview scenarios. 
                It asks questions based on your target role and industry, analyzes your responses, 
                and provides detailed feedback on your answers, communication style, and areas for improvement.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-2">
              <AccordionTrigger>What types of interviews can I practice?</AccordionTrigger>
              <AccordionContent>
                You can practice a wide range of interview types including behavioral, technical, 
                case studies, competency-based, and company-specific interviews for roles across 
                various industries such as tech, finance, healthcare, marketing, and more.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-3">
              <AccordionTrigger>How realistic are the AI interviews?</AccordionTrigger>
              <AccordionContent>
                Our AI interviewers are trained on thousands of real interview scenarios and 
                updated regularly to reflect current hiring practices. Users consistently 
                report that our simulations closely match their actual interview experiences.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-4">
              <AccordionTrigger>Do I need any special equipment?</AccordionTrigger>
              <AccordionContent>
                All you need is a computer with a webcam and microphone. Our platform works 
                in most modern browsers without requiring any software installation.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-5">
              <AccordionTrigger>How long does each practice interview take?</AccordionTrigger>
              <AccordionContent>
                Practice interviews typically last 30-45 minutes, including the feedback 
                session. You can choose shorter or longer sessions based on your preferences and the specific skills you want to practice.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-6">
              <AccordionTrigger>Can I practice for specific companies?</AccordionTrigger>
              <AccordionContent>
                Yes! You can select target companies, and our system will customize the interview experience 
                to reflect that company's known interview style, culture, and question patterns.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-7">
              <AccordionTrigger>Do my interview hours expire?</AccordionTrigger>
              <AccordionContent>
                No, your purchased interview hours never expire. You can use them at your own pace, 
                whether that's intensively before an upcoming interview or spread out over months of job searching.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-8">
              <AccordionTrigger>Is there a money-back guarantee?</AccordionTrigger>
              <AccordionContent>
                Yes, we offer a 7-day satisfaction guarantee. If you're not satisfied with your 
                experience for any reason, contact us for a full refund.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>
    )
  }