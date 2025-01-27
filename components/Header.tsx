import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ThemeCustomizer } from "@/components/theme-customizer"

export default function Header() {
  return (
    <header className="border-b">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold">
        AI INTERVIEW ASSISTANT
        </Link>
        <nav className="space-x-4">
          <Link href="/docs" className="hover:underline">
            Docs
          </Link>
          <Link href="/pricing" className="hover:underline">
            Pricing
          </Link>
          <Link href="/about" className="hover:underline">
            About
          </Link>
          <Link href="/chat" className="hover:underline">
            AI Chat
          </Link>
          <Button variant="outline" asChild>
            <Link href="/login">Sign In</Link>
          </Button>
          <ThemeCustomizer />
        </nav>
      </div>
    </header>
  )
}

