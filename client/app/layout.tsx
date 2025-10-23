import type React from "react"
import type { Metadata } from "next"
import { Poppins, Roboto } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import FloatingChat from "@/components/floating-chat"
import { headers } from "next/headers";
import { cookieToInitialState } from "wagmi";
import { getConfig } from "./config";
import { Providers } from "./providers";



const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-poppins",
})

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-roboto",
})

export const metadata: Metadata = {
  title: "Gaia Protocol - Empowering Real-World Impact",
  description: "Gaia Protocol connects dreamers and doers — funding real actions that heal the planet.",
  generator: "v0.app",
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>)
{
  const initialState = cookieToInitialState(
    getConfig(),
    (await headers()).get("cookie")
  );
  return (
    <html lang="en">
      <body className={`${poppins.variable} ${roboto.variable} font-sans antialiased `}>
        <Providers initialState={initialState}>
          {children}
        <FloatingChat />
        <Analytics />
        </Providers>
      </body>
    </html>
  )
}
