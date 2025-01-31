"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import WebcamComponent from '@/components/WebcamComponent';
import TestCouponGenerator from "@/components/TestCouponGenerator"

const showcaseItems = [
  {
    title: "AI-Powered Creativity",
    description: "Unleash your imagination with our state-of-the-art AI INTERVIEW ASSISTANT.",
    image: "./placeholder.svg?height=400&width=600&text=AI-Powered+Creativity",
  },
  {
    title: "Effortless Editing",
    description: "Edit and refine your generated images with intuitive tools.",
    image: "./placeholder.svg?height=400&width=600&text=Effortless+Editing",
  },
  {
    title: "Collaborate & Share",
    description: "Work together on projects and share your creations with the world.",
    image: "./placeholder.svg?height=400&width=600&text=Collaborate+%26+Share",
  },
]

export default function Home() {
  const [currentShowcase, setCurrentShowcase] = useState(0)

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid md:grid-cols-2 gap-8 items-center">
        <div>
          <h1 className="text-4xl font-bold mb-4">Practice Better,
            Interview Easier
          </h1>
          <p className="text-xl mb-6">
            Create stunning images with the power of AI. Perfect for designers, marketers, and creatives.
          </p>
          <Button size="lg" asChild>
            <Link href="/chat">Get Started</Link>
          </Button>
        </div>
        <Card>
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            <TabsContent value="signin">
              <CardHeader>
                <CardTitle>Sign In</CardTitle>
                <CardDescription>Sign in to your AI INTERVIEW ASSISTANT account.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="space-y-1">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="john@example.com" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" type="password" />
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full">Sign In</Button>
              </CardFooter>
            </TabsContent>
            <TabsContent value="signup">
              <CardHeader>
                <CardTitle>Sign Up</CardTitle>
                <CardDescription>Create a new AI INTERVIEW ASSISTANT account.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="space-y-1">
                  <Label htmlFor="new-email">Email</Label>
                  <Input id="new-email" type="email" placeholder="john@example.com" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="new-password">Password</Label>
                  <Input id="new-password" type="password" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="confirm-password">Confirm Password</Label>
                  <Input id="confirm-password" type="password" />
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full">Sign Up</Button>
              </CardFooter>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
      <div className="mt-16">
        <h2 className="text-3xl font-bold mb-8 text-center">How It Works</h2>
        <div className="relative">
          <img
            src={showcaseItems[currentShowcase].image || "./placeholder.svg"}
            alt={showcaseItems[currentShowcase].title}
            className="w-full h-[400px] object-cover rounded-lg"
          />
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-6">
            <h3 className="text-2xl font-bold text-white mb-2">{showcaseItems[currentShowcase].title}</h3>
            <p className="text-white">{showcaseItems[currentShowcase].description}</p>
          </div>
        </div>
        <div className="flex justify-center mt-4">
          {showcaseItems.map((_, index) => (
            <button
              key={index}
              className={`w-3 h-3 rounded-full mx-1 ${index === currentShowcase ? "bg-primary" : "bg-gray-300"}`}
              onClick={() => setCurrentShowcase(index)}
            />
          ))}
        </div>

        <div>
          <h1>My Webcam App</h1>
          <WebcamComponent />
        </div>
        <div>
          <h1>My Webcam App</h1>
          <TestCouponGenerator/>
        </div>
 
      </div>
    </div>
  )
}

