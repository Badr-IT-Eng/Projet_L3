"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Mail, CheckCircle, XCircle, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function VerifyEmailPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  
  const [email, setEmail] = useState("")
  const [code, setCode] = useState("")
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [verified, setVerified] = useState(false)
  const [countdown, setCountdown] = useState(0)

  useEffect(() => {
    // Get email and code from URL parameters
    const emailParam = searchParams.get("email")
    const codeParam = searchParams.get("code")
    
    if (emailParam) {
      setEmail(emailParam)
    }
    
    if (codeParam) {
      setCode(codeParam)
      // Auto-verify if code is provided in URL
      verifyCode(emailParam || "", codeParam)
    }
  }, [searchParams])

  useEffect(() => {
    // Countdown timer for resend button
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  const verifyCode = async (emailToVerify: string, codeToVerify: string) => {
    if (!emailToVerify || !codeToVerify) {
      setError("Email and verification code are required")
      return
    }

    setLoading(true)
    setError("")
    setMessage("")

    try {
      const response = await fetch("/api/auth/verify-email", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: emailToVerify,
          code: codeToVerify,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setVerified(true)
        setMessage("Email verified successfully! You can now sign in.")
        
        // Redirect to sign in page after 3 seconds
        setTimeout(() => {
          router.push("/auth/signin?verified=true")
        }, 3000)
      } else {
        setError(data.error || "Verification failed")
      }
    } catch (err) {
      setError("Network error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = () => {
    verifyCode(email, code)
  }

  const resendCode = async () => {
    if (!email) {
      setError("Email is required")
      return
    }

    setResending(true)
    setError("")
    setMessage("")

    try {
      const response = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (response.ok) {
        setMessage("New verification code sent to your email")
        setCountdown(60) // 60 second cooldown
      } else {
        setError(data.error || "Failed to resend code")
      }
    } catch (err) {
      setError("Network error. Please try again.")
    } finally {
      setResending(false)
    }
  }

  if (verified) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8">
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <CardTitle className="text-2xl text-green-600">Email Verified!</CardTitle>
              <CardDescription>
                Your email has been successfully verified. You will be redirected to the sign in page shortly.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <Button asChild className="w-full">
                  <Link href="/auth/signin">
                    Continue to Sign In
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Link href="/auth/signin">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Sign In
            </Button>
          </Link>
        </div>
        
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <Mail className="w-8 h-8 text-blue-600" />
            </div>
            <CardTitle className="text-2xl">Verify Your Email</CardTitle>
            <CardDescription>
              Enter the verification code sent to your email address
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="code">Verification Code</Label>
              <Input
                id="code"
                type="text"
                placeholder="Enter 6-digit code"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                disabled={loading}
                maxLength={6}
              />
              <p className="text-xs text-muted-foreground">
                Enter the 6-digit code sent to your email
              </p>
            </div>

            {error && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {message && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>{message}</AlertDescription>
              </Alert>
            )}

            <Button
              onClick={handleVerify}
              disabled={loading || !email || !code}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Verify Email"
              )}
            </Button>

            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">
                Didn't receive the code?
              </p>
              <Button
                variant="outline"
                onClick={resendCode}
                disabled={resending || countdown > 0 || !email}
                className="w-full"
              >
                {resending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Resending...
                  </>
                ) : countdown > 0 ? (
                  `Resend in ${countdown}s`
                ) : (
                  "Resend Code"
                )}
              </Button>
            </div>
            
            <div className="text-center text-xs text-muted-foreground">
              <p>
                In development mode, check the server console for the verification code
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}