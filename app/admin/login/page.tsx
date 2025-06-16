"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function AdminLoginRedirect() {
  const router = useRouter()
  
  useEffect(() => {
    // Redirect admin login to normal login
    router.replace("/auth/signin")
  }, [router])

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="text-lg font-semibold">Redirecting to login...</h1>
        <p className="text-muted-foreground">Please use the main login page.</p>
      </div>
    </div>
  )
}