import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ThemeCustomizer } from "@/components/theme-customizer"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ChevronDown } from "lucide-react"

export default function Header() {
  return (
    <header className="border-b">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold">
          AI INTERVIEW ASSISTANT
        </Link>
        <nav className="space-x-4 flex items-center">
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
            AI Interview Assitant
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-1">
                Expert
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href="/cards" className="w-full">
                  Generate Interview Cards
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/test" className="w-full">
                  Create Custom Mock Test
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/earnings" className="w-full">
                  How much you can earn more?
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="outline" asChild>
            <Link href="/login">Sign In</Link>
          </Button>
          {/* <ThemeCustomizer /> */}
        </nav>
      </div>
    </header>
  )
}