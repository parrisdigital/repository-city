import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ??
      (process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : "http://localhost:3000")
  ),
  title: {
    default: "Repository City — Explore code as architecture",
    template: "%s | Repository City",
  },
  description:
    "Turn any public GitHub repository into an interactive isometric city where folders become districts and files become buildings.",
  openGraph: {
    title: "Repository City",
    description:
      "Explore public GitHub repositories as interactive isometric cities.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Repository City",
    description:
      "Explore public GitHub repositories as interactive isometric cities.",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-[#090d11]">{children}</body>
    </html>
  )
}
