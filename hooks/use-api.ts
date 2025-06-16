"use client"

import { useSession } from "next-auth/react"
import { useCallback } from "react"

export function useAuthenticatedApi() {
  const { data: session } = useSession()

  const apiCall = useCallback(async (url: string, options: RequestInit = {}) => {
    const token = (session as any)?.accessToken
    
    const defaultHeaders = {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    }

    const config: RequestInit = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    }

    const response = await fetch(url, config)
    
    if (!response.ok) {
      throw new Error(`API call failed: ${response.status} ${response.statusText}`)
    }

    return response
  }, [session])

  return { apiCall, isAuthenticated: !!session }
}