"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export function useAuth(requireAuth = true) {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (requireAuth && status === "unauthenticated") {
      router.push("/auth/signin")
    }
  }, [status, requireAuth, router])

  const isAdmin = session?.user?.role === "ROLE_ADMIN"
  const isUser = session?.user?.role === "ROLE_USER"
  const isAuthenticated = status === "authenticated"
  const isLoading = status === "loading"

  return {
    session,
    isAuthenticated,
    isLoading,
    isAdmin,
    isUser,
    user: session?.user,
  }
}

export function useRequireAuth() {
  return useAuth(true)
}

export function useRequireAdmin() {
  const auth = useAuth(true)
  const router = useRouter()

  useEffect(() => {
    if (auth.isAuthenticated && !auth.isAdmin) {
      router.push("/dashboard")
    }
  }, [auth.isAuthenticated, auth.isAdmin, router])

  return auth
}