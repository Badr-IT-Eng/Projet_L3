"use client"

import { AuthForm } from "@/components/auth/auth-form"

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <AuthForm type="register" />
    </div>
  )
} 