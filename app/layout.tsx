import type React from "react"
import "@/app/globals.css"
import { Poppins } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { ClientWrapper } from "@/components/client-wrapper"
import { PageTransition } from "@/components/page-transition"
import { Toaster } from "@/components/ui/toaster"
import { SessionProvider } from "@/components/session-provider"
import { BackToTop } from "@/components/back-to-top"
import { ScrollPerformanceOptimizer } from "@/components/scroll-performance"
import { LoadingIndicator } from "@/components/loading-indicator"
import { Footer } from "./components/footer"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-options"

const poppins = Poppins({ 
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-poppins",
})

export const metadata = {
  title: "RECOVR - Advanced Lost & Found Recovery System",
  description: "AI-powered system for detecting, tracking, and recovering lost objects using advanced image recognition technology.",
  keywords: "lost and found, object recovery, AI, image matching, lost items, found items",
  author: "RECOVR Team",
  generator: 'v0.dev'
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  // Get the session from the server
  const session = await getServerSession(authOptions);
  
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${poppins.className} min-h-screen bg-background antialiased`}>
        <SessionProvider session={session}>
          <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
            <LoadingIndicator />
            <div className="relative flex min-h-screen flex-col items-center">
              <div className="w-full max-w-[1800px] mx-auto">
                <ClientWrapper />
                <main className="flex-1 w-full">
                  <PageTransition>
                    {children}
                  </PageTransition>
                </main>
              </div>
              <Footer />
              <BackToTop />
            </div>
            <ScrollPerformanceOptimizer />
            <Toaster />
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  )
}
