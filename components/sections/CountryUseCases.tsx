import React from 'react';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { 
  Card, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export default function CountryUseCases() {
  return (
    <section className="py-16 px-4 md:px-6 lg:px-8 bg-background">
      <div className="container mx-auto max-w-6xl">
        <h2 className="text-3xl font-bold mb-4 text-center">Global Interview Preparation</h2>
        <p className="text-lg text-muted-foreground mb-12 text-center max-w-2xl mx-auto">
          Our AI interview assistant helps candidates prepare for interviews across different countries and sectors
        </p>
        
        <Tabs defaultValue="india" className="w-full">
          <div className="flex justify-center mb-8">
            <TabsList className="grid grid-cols-3 w-full max-w-md">
              <TabsTrigger value="india" className="text-base font-medium">India</TabsTrigger>
              <TabsTrigger value="us" className="text-base font-medium">United States</TabsTrigger>
              <TabsTrigger value="uk" className="text-base font-medium">United Kingdom</TabsTrigger>
            </TabsList>
          </div>
          {/* India Content */}
          <TabsContent value="india">
            <div className="space-y-8">
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="college-admissions">
                  <AccordionTrigger className="text-xl font-semibold">College Admissions (Undergraduate & Postgraduate)</AccordionTrigger>
                  <AccordionContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
                      <Card>
                        <CardHeader>
                          <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M22 10v6M2 10l10-5 10 5-10 5z"></path><path d="M6 12v5c3 3 9 3 12 0v-5"></path></svg>
                          </div>
                          <CardTitle>Management & Business Schools</CardTitle>
                          <CardDescription>
                            IIMs, XLRI, SPJIMR, FMS, NMIMS, MDI, IIFT, Symbiosis (SNAP), and IPM programs
                          </CardDescription>
                        </CardHeader>
                      </Card>
                      
                      <Card>
                        <CardHeader>
                          <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M18 3a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3H6a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3V6a3 3 0 0 0-3-3 3 3 0 0 0-3 3 3 3 0 0 0 3 3h12a3 3 0 0 0 3-3 3 3 0 0 0-3-3z"></path></svg>
                          </div>
                          <CardTitle>Engineering</CardTitle>
                          <CardDescription>
                            IISc Bangalore, IITs, NITs, and IIITs (M.Tech, MS, Ph.D.) via GATE interview rounds
                          </CardDescription>
                        </CardHeader>
                      </Card>
                      
                      <Card>
                        <CardHeader>
                          <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"></path></svg>
                          </div>
                          <CardTitle>Medical</CardTitle>
                          <CardDescription>
                            AIIMS, JIPMER, CMC Vellore, PGIMER, NIMHANS, and NEET-PG counseling rounds
                          </CardDescription>
                        </CardHeader>
                      </Card>
                      
                      <Card>
                        <CardHeader>
                          <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"></path></svg>
                          </div>
                          <CardTitle>Law</CardTitle>
                          <CardDescription>
                            NLUs (CLAT PG, AILET, LSAT), Jindal Global Law School, and Symbiosis Law School
                          </CardDescription>
                        </CardHeader>
                      </Card>
                    </div>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="government-jobs">
                  <AccordionTrigger className="text-xl font-semibold">Government Jobs (Public Sector)</AccordionTrigger>
                  <AccordionContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
                      <Card>
                        <CardHeader>
                          <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"></path><path d="m7 15 2.5 2.5L15 12"></path></svg>
                          </div>
                          <CardTitle>UPSC & State PSC Jobs</CardTitle>
                          <CardDescription>
                            Civil Services, State PSCs, Engineering Services, CDS, and more
                          </CardDescription>
                        </CardHeader>
                      </Card>
                      
                      <Card>
                        <CardHeader>
                          <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"></path><path d="M13 5v2"></path><path d="M13 17v2"></path><path d="M13 11v2"></path></svg>
                          </div>
                          <CardTitle>Banking & Financial</CardTitle>
                          <CardDescription>
                            IBPS PO, SBI PO, RBI Grade B, NABARD, SEBI, and IRDAI officer-level recruitments
                          </CardDescription>
                        </CardHeader>
                      </Card>
                      
                      <Card>
                        <CardHeader>
                          <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M6 2v12a2 2 0 0 0 2 2h14"></path><path d="M6 8h8"></path><path d="M9 18v-6l7 6V8"></path></svg>
                          </div>
                          <CardTitle>PSUs</CardTitle>
                          <CardDescription>
                            GATE-based PSU recruitments like ONGC, NTPC, BHEL, IOCL, ISRO, DRDO
                          </CardDescription>
                        </CardHeader>
                      </Card>
                      
                      <Card>
                        <CardHeader>
                          <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M10.05 4.575a1.575 1.575 0 1 0-3.15 0v3.15a1.575 1.575 0 1 0 3.15 0v-3.15z"></path><path d="M9.585 10.413a.638.638 0 0 0-.63-.637h-.135a.787.787 0 0 0-.795.795v2.205a.794.794 0 0 0 1.575.172V10.7a.776.776 0 0 0-.015-.287z"></path><path d="m7.5 15.5 3.75 3.75M10.5 13.5l3 3L17.25 12"></path><circle cx="12" cy="12" r="10"></circle></svg>
                          </div>
                          <CardTitle>Defense & Paramilitary</CardTitle>
                          <CardDescription>
                            SSB for NDA, CDS, AFCAT, CAPF (Assistant Commandant) and MNS interviews
                          </CardDescription>
                        </CardHeader>
                      </Card>
                    </div>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="private-sector">
                  <AccordionTrigger className="text-xl font-semibold">Private Sector Jobs (Corporate)</AccordionTrigger>
                  <AccordionContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
                      <Card>
                        <CardHeader>
                          <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>
                          </div>
                          <CardTitle>Campus Placements</CardTitle>
                          <CardDescription>
                            IT, Consulting, Finance, and Product-based tech companies
                          </CardDescription>
                        </CardHeader>
                      </Card>
                      
                      <Card>
                        <CardHeader>
                          <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M2 7A5 5 0 0 1 7 2h14a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H7a5 5 0 0 1-5-5V7Z"></path><path d="M16 2v20"></path><path d="M7 16h.01"></path></svg>
                          </div>
                          <CardTitle>Lateral Hiring</CardTitle>
                          <CardDescription>
                            Management, Data Science, AI/ML, Cybersecurity, and Product Management roles
                          </CardDescription>
                        </CardHeader>
                      </Card>
                      
                      <Card>
                        <CardHeader>
                          <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"></path></svg>
                          </div>
                          <CardTitle>Teaching & Academic</CardTitle>
                          <CardDescription>
                            Professors (UGC NET, IIT/IISc Faculty) and EdTech platforms
                          </CardDescription>
                        </CardHeader>
                      </Card>
                      
                      <Card>
                        <CardHeader>
                          <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M12 12c2-2.96 0-7-1-8 0 3.038-1.773 4.741-3 6-1.226 1.26-2 3.24-2 5a6 6 0 1 0 12 0c0-1.532-1.056-3.94-2-5-1.786 3-2.791 3-4 2z"></path></svg>
                          </div>
                          <CardTitle>Media & Entertainment</CardTitle>
                          <CardDescription>
                            Journalism (NDTV, Times of India), Advertising & Public Relations
                          </CardDescription>
                        </CardHeader>
                      </Card>
                    </div>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="international">
                  <AccordionTrigger className="text-xl font-semibold">International Exams & Opportunities</AccordionTrigger>
                  <AccordionContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
                      <Card>
                        <CardHeader>
                          <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>
                          </div>
                          <CardTitle>GMAT/MBA Admissions</CardTitle>
                          <CardDescription>
                            Harvard, Stanford, INSEAD, London Business School, and others
                          </CardDescription>
                        </CardHeader>
                      </Card>
                      
                      <Card>
                        <CardHeader>
                          <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M20 7h-9"></path><path d="M14 17H5"></path><circle cx="17" cy="17" r="3"></circle><circle cx="7" cy="7" r="3"></circle></svg>
                          </div>
                          <CardTitle>Foreign Job Interviews</CardTitle>
                          <CardDescription>
                            UK Skilled Worker Visa, US H-1B, Canada PR, and other opportunities
                          </CardDescription>
                        </CardHeader>
                      </Card>
                      
                      <Card>
                        <CardHeader>
                          <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"></path></svg>
                          </div>
                          <CardTitle>Scholarships & Fellowships</CardTitle>
                          <CardDescription>
                            Rhodes, Chevening, Fulbright, DAAD, and other prestigious programs
                          </CardDescription>
                        </CardHeader>
                      </Card>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </TabsContent>
          {/* US Content */}
          <TabsContent value="us">
            <div className="space-y-8">
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="higher-education">
                  <AccordionTrigger className="text-xl font-semibold">Higher Education Admissions</AccordionTrigger>
                  <AccordionContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
                      <Card>
                        <CardHeader>
                          <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M22 10v6M2 10l10-5 10 5-10 5z"></path><path d="M6 12v5c3 3 9 3 12 0v-5"></path></svg>
                          </div>
                          <CardTitle>MBA Programs</CardTitle>
                          <CardDescription>
                            Harvard, Stanford, Wharton, MIT Sloan, Columbia, and other top business schools
                          </CardDescription>
                        </CardHeader>
                      </Card>
                      
                      <Card>
                        <CardHeader>
                          <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M18 3a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3H6a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3V6a3 3 0 0 0-3-3 3 3 0 0 0-3 3 3 3 0 0 0 3 3h12a3 3 0 0 0 3-3 3 3 0 0 0-3-3z"></path></svg>
                          </div>
                          <CardTitle>Law School</CardTitle>
                          <CardDescription>
                            Harvard Law, Yale Law, Stanford Law, Columbia Law, and other top law schools
                          </CardDescription>
                        </CardHeader>
                      </Card>
                      
                      <Card>
                        <CardHeader>
                          <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"></path></svg>
                          </div>
                          <CardTitle>Medical School</CardTitle>
                          <CardDescription>
                            Johns Hopkins, UCSF, Harvard Medical, Stanford Medicine, and residency programs
                          </CardDescription>
                        </CardHeader>
                      </Card>
                      
                      <Card>
                        <CardHeader>
                          <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M12 6v12"></path><path d="m8 10 4-4 4 4"></path><rect x="4" y="20" width="16" height="2" rx=".5"></rect><path d="M12 6V2"></path></svg>
                          </div>
                          <CardTitle>PhD & Research</CardTitle>
                          <CardDescription>
                            MIT, Stanford, UC Berkeley, Caltech, Carnegie Mellon, and research positions
                          </CardDescription>
                        </CardHeader>
                      </Card>
                    </div>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="tech-industry">
                  <AccordionTrigger className="text-xl font-semibold">Tech Industry</AccordionTrigger>
                  <AccordionContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
                      <Card>
                        <CardHeader>
                          <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M9 5H2v7l6.29 6.29c.94.94 2.48.94 3.42 0l3.58-3.58c.94-.94.94-2.48 0-3.42L9 5Z"></path><path d="M6 9.01V9"></path><path d="m15 5 6.3 6.3a2.4 2.4 0 0 1 0 3.4L17 19"></path></svg>
                          </div>
                          <CardTitle>FAANG+ Interviews</CardTitle>
                          <CardDescription>
                            Meta, Apple, Amazon, Netflix, Google, Microsoft, and other tech giants
                          </CardDescription>
                        </CardHeader>
                      </Card>
                      
                      <Card>
                        <CardHeader>
                          <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="m8 3 4 8 5-5 5 15H2L8 3z"></path></svg>
                          </div>
                          <CardTitle>Startups</CardTitle>
                          <CardDescription>
                            Early-stage startups, YCombinator companies, Series A/B funded companies
                          </CardDescription>
                        </CardHeader>
                      </Card>
                      
                      <Card>
                        <CardHeader>
                          <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M4 13.5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v5.5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-5.5Z"></path><path d="M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-2"></path><path d="M14 14.5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v5.5a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2v-5.5Z"></path></svg>
                          </div>
                       
                          <CardTitle>Engineering Roles</CardTitle>
                          <CardDescription>
                            Software Engineering, DevOps, ML Engineering, Data Science positions
                          </CardDescription>
                        </CardHeader>
                      </Card>
                      
                      <Card>
                        <CardHeader>
                          <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M17 14V4c0-1.1-.9-2-2-2H9c-1.1 0-2 .9-2 2v10"></path><rect x="1" y="14" width="22" height="8" rx="2"></rect></svg>
                          </div>
                          <CardTitle>Product Management</CardTitle>
                          <CardDescription>
                            PM positions at tech companies of all sizes, from startups to enterprise
                          </CardDescription>
                        </CardHeader>
                      </Card>
                    </div>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="financial-services">
                  <AccordionTrigger className="text-xl font-semibold">Financial Services</AccordionTrigger>
                  <AccordionContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
                      <Card>
                        <CardHeader>
                          <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M2 17a5 5 0 0 0 10 0c0-2.76-2.5-5-5-3-2.5-2-5 .24-5 3Z"></path><path d="M12 17a5 5 0 0 0 10 0c0-2.76-2.5-5-5-3-2.5-2-5 .24-5 3Z"></path><path d="M7 14c3.22-2.91 4.29-8.75 5-12 1.66 2.38 4.94 9 5 12"></path><path d="M22 9c-4.29 0-7.14-2.33-10-7 5.71 0 10 4.67 10 7Z"></path></svg>
                          </div>
                          <CardTitle>Investment Banking</CardTitle>
                          <CardDescription>
                            Goldman Sachs, Morgan Stanley, JP Morgan, Credit Suisse, Bank of America
                          </CardDescription>
                        </CardHeader>
                      </Card>
                      
                      <Card>
                        <CardHeader>
                          <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M8 16a.99.99 0 0 1-.217-.032c-1.21-.322-1.972-1.532-2.101-2.97-.11-1.232.046-2.525.5-3.998m6.837 6H20a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2"></path><path d="M12 16v3"></path><path d="M8 22h8"></path><path d="M4.5 16H2a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h10.5M4.5 17.5c1 .167 2 .5 2.5 1s2 1 4 1"></path></svg>
                          </div>
                          <CardTitle>Private Equity & VC</CardTitle>
                          <CardDescription>
                            Blackstone, KKR, TPG, Andreessen Horowitz, Sequoia Capital
                          </CardDescription>
                        </CardHeader>
                      </Card>
                      
                      <Card>
                        <CardHeader>
                          <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="m20 7-9-4-9 4 9 4z"></path><path d="M4 12v5l8 4 8-4v-5"></path><path d="m12 16-8-4"></path><path d="m12 16 8-4"></path><path d="M12 12v8"></path></svg>
                          </div>
                          <CardTitle>Asset Management</CardTitle>
                          <CardDescription>
                            BlackRock, Vanguard, Fidelity, State Street, Capital Group
                          </CardDescription>
                        </CardHeader>
                      </Card>
                      
                      <Card>
                        <CardHeader>
                          <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M5 3v16h16"></path><path d="m5 19 6-6"></path><path d="m2 6 3-3 3 3"></path><path d="m18 16 3 3-3 3"></path><path d="M11 6h5a2 2 0 0 1 2 2v5"></path></svg>
                          </div>
                          <CardTitle>FinTech</CardTitle>
                          <CardDescription>
                            Stripe, Square, Robinhood, Coinbase, PayPal, SoFi
                          </CardDescription>
                        </CardHeader>
                      </Card>
                    </div>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="government-federal">
                  <AccordionTrigger className="text-xl font-semibold">Government & Public Service</AccordionTrigger>
                  <AccordionContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
                      <Card>
                        <CardHeader>
                          <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><rect x="2" y="4" width="20" height="16" rx="2"></rect><path d="M7 15h0M2 9h20M12 15h0M17 15h0"></path></svg>
                          </div>
                          <CardTitle>Federal Agencies</CardTitle>
                          <CardDescription>
                            FBI, CIA, NSA, State Department, Department of Defense
                          </CardDescription>
                        </CardHeader>
                      </Card>
                      
                      <Card>
                        <CardHeader>
                          <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M19 9V6a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v3"></path><path d="M3 16a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5a2 2 0 0 0-4 0v2H7v-2a2 2 0 0 0-4 0Z"></path><path d="M5 18v2"></path><path d="M19 18v2"></path></svg>
                          </div>
                          <CardTitle>Military</CardTitle>
                          <CardDescription>
                            Officer candidate programs, specialized roles, intelligence positions
                          </CardDescription>
                        </CardHeader>
                      </Card>
                      
                      <Card>
                        <CardHeader>
                          <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M3 21h18"></path><path d="M19 21v-9"></path><path d="M5 21v-9"></path><path d="M3 7V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2"></path><path d="M9 21v-6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v6"></path></svg>
                          </div>
                          <CardTitle>Diplomatic Service</CardTitle>
                          <CardDescription>
                            Foreign Service Officers, diplomatic missions, policy advisors
                          </CardDescription>
                        </CardHeader>
                      </Card>
                      
                      <Card>
                        <CardHeader>
                          <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"></path></svg>
                          </div>
                          <CardTitle>Public Policy</CardTitle>
                          <CardDescription>
                            Think tanks, policy research, advocacy organizations, advisory roles
                          </CardDescription>
                        </CardHeader>
                      </Card>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </TabsContent>
          
          {/* UK Content */}
          <TabsContent value="uk">
            <div className="space-y-8">
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="uk-education">
                  <AccordionTrigger className="text-xl font-semibold">University Admissions & Graduate Programs</AccordionTrigger>
                  <AccordionContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
                      <Card>
                        <CardHeader>
                          <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M22 10v6M2 10l10-5 10 5-10 5z"></path><path d="M6 12v5c3 3 9 3 12 0v-5"></path></svg>
                          </div>
                          <CardTitle>Oxbridge Interviews</CardTitle>
                          <CardDescription>
                            University of Oxford and University of Cambridge undergraduate and postgraduate admissions
                          </CardDescription>
                        </CardHeader>
                      </Card>
                      <Card>
                        <CardHeader>
                          <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M21.2 8.4c.5.38.8.97.8 1.6v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V10a2 2 0 0 1 2-2h3.8a2 2 0 0 0 1.4-.6L12 4.6a2 2 0 0 1 1.4-.6H20a2 2 0 0 1 2 2v2"></path></svg>
                          </div>
                          <CardTitle>Russell Group Universities</CardTitle>
                          <CardDescription>
                            LSE, Imperial College, UCL, King's College, Edinburgh, Manchester, and other top universities
                          </CardDescription>
                        </CardHeader>
                      </Card>
                      
                      <Card>
                        <CardHeader>
                          <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M3 21h18"></path><path d="M3 10h18"></path><path d="M5 6V3h2"></path><path d="M19 6V3h-2"></path><path d="M19 10V8h-2"></path><path d="M5 10V8h2"></path><path d="M7 18v3"></path><path d="M17 18v3"></path><path d="M5 14h14"></path><path d="M9 14v4"></path><path d="M15 14v4"></path></svg>
                          </div>
                          <CardTitle>MBA Programs</CardTitle>
                          <CardDescription>
                            Oxford Said, Cambridge Judge, London Business School, Imperial, Warwick Business School
                          </CardDescription>
                        </CardHeader>
                      </Card>
                      
                      <Card>
                        <CardHeader>
                          <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"></path></svg>
                          </div>
                          <CardTitle>Medical & Law Schools</CardTitle>
                          <CardDescription>
                            Medical, dental, and law school interviews at UK universities
                          </CardDescription>
                        </CardHeader>
                      </Card>
                    </div>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="uk-finance">
                  <AccordionTrigger className="text-xl font-semibold">Finance & Professional Services</AccordionTrigger>
                  <AccordionContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
                      <Card>
                        <CardHeader>
                          <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                          </div>
                          <CardTitle>Investment Banking</CardTitle>
                          <CardDescription>
                            London offices of Goldman Sachs, JP Morgan, Morgan Stanley, Barclays, HSBC
                          </CardDescription>
                        </CardHeader>
                      </Card>
                      
                      <Card>
                        <CardHeader>
                          <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="8" y1="12" x2="16" y2="12"></line><line x1="12" y1="16" x2="12" y2="16"></line><line x1="12" y1="8" x2="12" y2="8"></line></svg>
                          </div>
                          <CardTitle>Big Four Consulting</CardTitle>
                          <CardDescription>
                            Deloitte, PwC, EY, KPMG - consulting, audit, tax, and advisory services
                          </CardDescription>
                        </CardHeader>
                      </Card>
                      
                      <Card>
                        <CardHeader>
                          <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><circle cx="12" cy="12" r="5"></circle><path d="M12 1v2"></path><path d="M12 21v2"></path><path d="M4.22 4.22l1.42 1.42"></path><path d="M18.36 18.36l1.42 1.42"></path><path d="M1 12h2"></path><path d="M21 12h2"></path><path d="M4.22 19.78l1.42-1.42"></path><path d="M18.36 5.64l1.42-1.42"></path></svg>
                          </div>
                          <CardTitle>Strategy Consulting</CardTitle>
                          <CardDescription>
                            McKinsey, BCG, Bain, Oliver Wyman, Roland Berger, LEK in UK offices
                          </CardDescription>
                        </CardHeader>
                      </Card>
                      
                      <Card>
                        <CardHeader>
                          <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"></rect><line x1="7" y1="2" x2="7" y2="22"></line><line x1="17" y1="2" x2="17" y2="22"></line><line x1="2" y1="12" x2="22" y2="12"></line><line x1="2" y1="7" x2="7" y2="7"></line><line x1="2" y1="17" x2="7" y2="17"></line><line x1="17" y1="17" x2="22" y2="17"></line><line x1="17" y1="7" x2="22" y2="7"></line></svg>
                          </div>
                          <CardTitle>Asset Management</CardTitle>
                          <CardDescription>
                            Schroders, Legal & General, Aviva Investors, M&G Investments, Aberdeen
                          </CardDescription>
                        </CardHeader>
                      </Card>
                    </div>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="uk-public">
                  <AccordionTrigger className="text-xl font-semibold">Public Sector & Government</AccordionTrigger>
                  <AccordionContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
                      <Card>
                        <CardHeader>
                          <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"></path></svg>
                          </div>
                          <CardTitle>Civil Service</CardTitle>
                          <CardDescription>
                            Fast Stream, Government Economic Service, Government Legal Service
                          </CardDescription>
                        </CardHeader>
                      </Card>
                      
                      <Card>
                        <CardHeader>
                          <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z"></path><path d="M7 7h.01"></path></svg>
                          </div>
                          <CardTitle>Diplomatic Service</CardTitle>
                          <CardDescription>
                            Foreign, Commonwealth & Development Office, diplomatic missions
                          </CardDescription>
                        </CardHeader>
                      </Card>
                      
                      <Card>
                        <CardHeader>
                          <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M20 13V5a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h8"></path><path d="M18 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"></path><path d="M18 18v-4"></path></svg>
                          </div>
                          <CardTitle>Intelligence Services</CardTitle>
                          <CardDescription>
                            MI5, MI6, GCHQ intelligence and security services
                          </CardDescription>
                        </CardHeader>
                      </Card>
                      
                      <Card>
                        <CardHeader>
                          <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14"></path></svg>
                          </div>
                          <CardTitle>NHS & Healthcare</CardTitle>
                          <CardDescription>
                            NHS Graduate Management Scheme, clinical leadership, healthcare management
                          </CardDescription>
                        </CardHeader>
                      </Card>
                    </div>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="uk-tech">
                  <AccordionTrigger className="text-xl font-semibold">Technology & Innovation</AccordionTrigger>
                  <AccordionContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
                      <Card>
                        <CardHeader>
                          <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect><rect x="9" y="9" width="6" height="6"></rect><line x1="9" y1="2" x2="9" y2="4"></line><line x1="15" y1="2" x2="15" y2="4"></line><line x1="9" y1="20" x2="9" y2="22"></line><line x1="15" y1="20" x2="15" y2="22"></line><line x1="20" y1="9" x2="22" y2="9"></line><line x1="20" y1="14" x2="22" y2="14"></line><line x1="2" y1="9" x2="4" y2="9"></line><line x1="2" y1="14" x2="4" y2="14"></line></svg>
                          </div>
                          <CardTitle>Tech Startups</CardTitle>
                          <CardDescription>
                            London's tech ecosystem, Silicon Roundabout, venture-backed startups
                          </CardDescription>
                        </CardHeader>
                      </Card>
                      
                      <Card>
                        <CardHeader>
                          <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M20 15c0-8-5-11.5-10-11.5S0 7 0 15c0 4 2 6 4 6h12c2 0 4-2 4-6Z"></path><path d="M12 19c3.8 0 7-1.1 7-4H5c0 2.9 3.2 4 7 4Z"></path><path d="M12 19V5"></path></svg>
                          </div>
                          <CardTitle>FinTech</CardTitle>
                          <CardDescription>
                            Revolut, Monzo, Starling Bank, Wise (TransferWise), Checkout.com
                          </CardDescription>
                        </CardHeader>
                      </Card>
                      
                      <Card>
                        <CardHeader>
                          <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="7.5 4.21 12 6.81 16.5 4.21"></polyline><polyline points="7.5 19.79 7.5 14.6 3 12"></polyline><polyline points="21 12 16.5 14.6 16.5 19.79"></polyline><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
                          </div>
                          <CardTitle>Global Tech Companies</CardTitle>
                          <CardDescription>
                            Google, Amazon, Microsoft, Meta, Apple - UK offices and engineering centers
                          </CardDescription>
                        </CardHeader>
                      </Card>
                      
                      <Card>
                        <CardHeader>
                          <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M4 9a2 2 0 0 1-2-2V5h20v2a2 2 0 0 1-2 2H4z"></path><path d="M2 9v8a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9"></path><path d="M10 13h4"></path></svg>
                          </div>
                          <CardTitle>Cybersecurity</CardTitle>
                          <CardDescription>
                            NCSC, Darktrace, Sophos, and positions in financial institutions and government
                          </CardDescription>
                        </CardHeader>
                      </Card>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </TabsContent>
        </Tabs>
        
        <div className="mt-16 text-center">
          <div className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
            Get Started with Mock Interviews
          </div>
          <p className="mt-4 text-muted-foreground">
            Join thousands of successful candidates who've prepared with our AI interview assistant
          </p>
        </div>
      </div>
    </section>
  );
}