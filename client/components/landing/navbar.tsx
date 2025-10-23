"use client"

import Link from "next/link"
import { Leaf } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function Navbar() {
  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2 font-bold text-xl text-primary hover:text-primary/80 transition-colors"
          >
            <Leaf className="h-6 w-6" />
            <span>Gaia Protocol</span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-8">
            <Link href="#home" className="text-sm font-bold text-foreground hover:text-primary transition-colors">
              Home
            </Link>
            <Link href="#about" className="text-sm font-bold text-foreground hover:text-primary transition-colors">
              About
            </Link>
            <Link href="#projects" className="text-sm font-bold text-foreground hover:text-primary transition-colors">
              Projects
            </Link>
            <Link href="#faq" className="text-sm font-bold text-foreground hover:text-primary transition-colors">
              FAQ
            </Link>
            <Link href="#contact" className="text-sm font-bold text-foreground hover:text-primary transition-colors">
              Contact
            </Link>
          </div>

          {/* CTA Buttons */}
          <div className="flex items-center gap-3">
            <Link href="/dashboard">
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}
