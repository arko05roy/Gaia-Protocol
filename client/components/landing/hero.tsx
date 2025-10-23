"use client"

import { Button } from "@/components/ui/button"
import { MessageCircle } from "lucide-react"
import { useState } from "react"

export default function Hero() {
  const [showChat, setShowChat] = useState(false)

  return (
    <section id="home" className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: "url(/bg-hero.jpg)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundAttachment: "fixed",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/60 to-background" />
      </div>

      {/* Content */}
      <div className="relative z-10 mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
        <div className="space-y-6 animate-fade-in">
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-balance leading-tight">
            <span className="gaia-text-gradient">Empowering real-world impact</span>
            <br />
            <span className="text-foreground">through decentralized funding</span>
          </h1>

          <p className="text-xl text-foreground/70 text-balance max-w-2xl mx-auto leading-relaxed">
            Gaia Protocol connects dreamers and doers — funding real actions that heal the planet.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
            <Button onClick={() => setShowChat(true)} className="gaia-button-secondary gap-2" size="lg">
              <MessageCircle className="h-5 w-5" />
              Ask Anything
            </Button>
            <Button className="gaia-button-primary gap-2" size="lg">
              Get Started
            </Button>
          </div>
        </div>
      </div>

      {/* Chat Modal */}
      {showChat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-card rounded-lg shadow-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Ask Anything</h2>
              <button onClick={() => setShowChat(false)} className="text-foreground/50 hover:text-foreground">
                ✕
              </button>
            </div>
            <p className="text-foreground/70 mb-4">Have questions about Gaia Protocol? We're here to help!</p>
            <input
              type="text"
              placeholder="Type your question..."
              className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary mb-4"
            />
            <Button className="w-full gaia-button-primary">Send</Button>
          </div>
        </div>
      )}
    </section>
  )
}
