"use client"

import { useState, useEffect } from "react"
import { usePathname, useSearchParams } from "next/navigation"

export function LoadingIndicator() {
  const [loading, setLoading] = useState(false)
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    const handleStart = () => {
      setLoading(true)
    }

    const handleComplete = () => {
      setTimeout(() => setLoading(false), 300)
    }
    
    // Create custom events for route change monitoring
    window.addEventListener("routeChangeStart", handleStart)
    window.addEventListener("routeChangeComplete", handleComplete)
    window.addEventListener("routeChangeError", handleComplete)

    // Next.js App Router doesn't expose route change events directly,
    // so we'll use a custom approach to detect navigation
    return () => {
      window.removeEventListener("routeChangeStart", handleStart)
      window.removeEventListener("routeChangeComplete", handleComplete)
      window.removeEventListener("routeChangeError", handleComplete)
    }
  }, [])
  
  // Reset loading state when path or search params change
  useEffect(() => {
    setLoading(false)
  }, [pathname, searchParams])
  
  // Listen for click events on links to preemptively show loading
  useEffect(() => {
    const handleLinkClick = (e: MouseEvent) => {
      const target = e.target as Element
      const link = target.closest('a')
      if (link && link.href && link.href.startsWith(window.location.origin)) {
        setLoading(true)
        // Dispatch custom event for route change start
        window.dispatchEvent(new Event("routeChangeStart"))
      }
    }
    
    document.addEventListener('click', handleLinkClick)
    return () => document.removeEventListener('click', handleLinkClick)
  }, [])

  if (!loading) return null

  return (
    <div className="fixed top-0 left-0 right-0 h-1 z-50 animate-loadingBar"></div>
  )
} 