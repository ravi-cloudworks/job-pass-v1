import Link from "next/link"

export default function Footer() {
  return (
    <footer className="border-t">
      <div className="container mx-auto px-4 py-6 flex justify-between items-center">
        <p>&copy; 2025 AI INTERVIEW ASSISTANT. All rights reserved.</p>
        <nav className="space-x-4">
          <Link href="/privacy" className="hover:underline">
            Privacy Policy
          </Link>
          <Link href="/terms" className="hover:underline">
            Terms of Service
          </Link>
          <Link href="/contact" className="hover:underline">
            Contact Us
          </Link>
        </nav>
      </div>
    </footer>
  )
}

