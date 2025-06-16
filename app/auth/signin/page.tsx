"use client"

import { AuthForm } from "@/components/auth/auth-form"

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <AuthForm type="signin" />
    </div>
  )
} 