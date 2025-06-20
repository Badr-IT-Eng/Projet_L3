"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { signIn } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Loader2, Eye, EyeOff, Shield, AlertTriangle, CheckCircle, XCircle, Clock, Info } from "lucide-react"

interface AuthFormProps {
  type: "signin" | "register"
}

interface PasswordValidation {
  valid: boolean
  strength: number
  strengthDescription: string
  errors: string[]
}

interface LockoutStatus {
  locked: boolean
  failedAttempts: number
  remainingAttempts: number
  remainingLockoutMinutes: number
  maxAllowedAttempts: number
}

export function EnhancedAuthForm({ type }: AuthFormProps) {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    phone: "",
  })
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [passwordValidation, setPasswordValidation] = useState<PasswordValidation | null>(null)
  const [lockoutStatus, setLockoutStatus] = useState<LockoutStatus | null>(null)
  const [remainingTime, setRemainingTime] = useState<number>(0)
  const router = useRouter()

  // Check lockout status for signin
  useEffect(() => {
    if (type === "signin" && formData.username) {
      checkLockoutStatus(formData.username)
    }
  }, [type, formData.username])

  // Countdown timer for lockout
  useEffect(() => {
    if (lockoutStatus?.locked && remainingTime > 0) {
      const timer = setInterval(() => {
        setRemainingTime(prev => {
          if (prev <= 1) {
            // Refresh lockout status when timer expires
            checkLockoutStatus(formData.username)
            return 0
          }
          return prev - 1
        })
      }, 60000) // Update every minute

      return () => clearInterval(timer)
    }
  }, [lockoutStatus?.locked, remainingTime, formData.username])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value,
    })

    // Real-time password validation for registration
    if (name === "password" && type === "register") {
      validatePassword(value)
    }
  }

  const validatePassword = async (password: string) => {
    if (!password.trim()) {
      setPasswordValidation(null)
      return
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/validate-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
      })

      if (response.ok) {
        const validation = await response.json()
        setPasswordValidation(validation)
      }
    } catch (error) {
      console.error("Password validation error:", error)
    }
  }

  const checkLockoutStatus = async (identifier: string) => {
    if (!identifier.trim()) return

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/lockout-status/${encodeURIComponent(identifier)}`)
      if (response.ok) {
        const status = await response.json()
        setLockoutStatus(status)
        if (status.locked) {
          setRemainingTime(status.remainingLockoutMinutes)
        }
      }
    } catch (error) {
      console.error("Lockout status check error:", error)
    }
  }

  const getPasswordStrengthColor = (strength: number) => {
    if (strength < 30) return "bg-red-500"
    if (strength < 50) return "bg-orange-500"
    if (strength < 70) return "bg-yellow-500"
    if (strength < 85) return "bg-blue-500"
    return "bg-green-500"
  }

  const getPasswordStrengthIcon = (strength: number) => {
    if (strength < 30) return <XCircle className="h-4 w-4 text-red-500" />
    if (strength < 50) return <AlertTriangle className="h-4 w-4 text-orange-500" />
    if (strength < 70) return <Shield className="h-4 w-4 text-yellow-500" />
    if (strength < 85) return <CheckCircle className="h-4 w-4 text-blue-500" />
    return <CheckCircle className="h-4 w-4 text-green-500" />
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess("")

    // Check if account is locked
    if (type === "signin" && lockoutStatus?.locked) {
      setError(`Account is locked. Please try again in ${remainingTime} minutes.`)
      setLoading(false)
      return
    }

    if (type === "register") {
      // Registration validation
      if (formData.password !== formData.confirmPassword) {
        setError("Passwords do not match")
        setLoading(false)
        return
      }

      if (passwordValidation && !passwordValidation.valid) {
        setError("Please fix password requirements before continuing")
        setLoading(false)
        return
      }

      if (!passwordValidation || passwordValidation.strength < 30) {
        setError("Password is too weak. Please choose a stronger password.")
        setLoading(false)
        return
      }
    }

    try {
      if (type === "signin") {
        // Enhanced signin with better error handling
        const result = await signIn("credentials", {
          username: formData.username,
          password: formData.password,
          redirect: false,
        })

        if (result?.error) {
          // Parse error response for better UX
          try {
            const errorData = JSON.parse(result.error)
            setError(errorData.message || "Login failed")
            
            if (errorData.type === "ACCOUNT_LOCKED") {
              setLockoutStatus({
                locked: true,
                failedAttempts: 0,
                remainingAttempts: 0,
                remainingLockoutMinutes: errorData.remainingLockoutMinutes || 15,
                maxAllowedAttempts: 5
              })
              setRemainingTime(errorData.remainingLockoutMinutes || 15)
            } else if (errorData.remainingAttempts !== undefined) {
              setLockoutStatus(prev => ({
                ...prev,
                failedAttempts: errorData.maxAllowedAttempts - errorData.remainingAttempts,
                remainingAttempts: errorData.remainingAttempts,
                locked: false,
                remainingLockoutMinutes: 0,
                maxAllowedAttempts: errorData.maxAllowedAttempts || 5
              }))
            }
          } catch {
            setError("Invalid username or password")
          }
        } else if (result?.ok) {
          setSuccess("Login successful! Redirecting...")
          setTimeout(() => {
            router.push("/dashboard")
          }, 1000)
        }
      } else {
        // Registration
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/signup`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: formData.username,
            email: formData.email,
            password: formData.password,
            firstName: formData.firstName,
            lastName: formData.lastName,
            phone: formData.phone,
          }),
        })

        const data = await response.json()

        if (response.ok) {
          setSuccess("Registration successful! You can now sign in.")
          setFormData({
            username: "",
            email: "",
            password: "",
            confirmPassword: "",
            firstName: "",
            lastName: "",
            phone: "",
          })
          setPasswordValidation(null)
          
          // Redirect to signin after delay
          setTimeout(() => {
            router.push("/auth/signin")
          }, 2000)
        } else {
          setError(data.message || "Registration failed")
          
          // Handle specific validation errors
          if (data.passwordErrors) {
            setError(`Password requirements not met: ${data.passwordErrors.join(", ")}`)
          }
        }
      }
    } catch (error) {
      console.error("Authentication error:", error)
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const isFormValid = () => {
    if (type === "signin") {
      return formData.username && formData.password && !lockoutStatus?.locked
    } else {
      return formData.username && 
             formData.email && 
             formData.password && 
             formData.confirmPassword &&
             formData.password === formData.confirmPassword &&
             passwordValidation?.valid &&
             passwordValidation?.strength >= 30
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">
          {type === "signin" ? "Sign In" : "Create Account"}
        </CardTitle>
        <CardDescription className="text-center">
          {type === "signin" 
            ? "Enter your credentials to access your account" 
            : "Fill in the information below to create your account"
          }
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Success Message */}
          {success && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-700">
                {success}
              </AlertDescription>
            </Alert>
          )}

          {/* Error Message */}
          {error && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Lockout Warning */}
          {lockoutStatus?.locked && (
            <Alert className="border-red-200 bg-red-50">
              <Clock className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-700">
                Account locked for {remainingTime} more minutes due to failed login attempts.
              </AlertDescription>
            </Alert>
          )}

          {/* Failed Attempts Warning */}
          {lockoutStatus && !lockoutStatus.locked && lockoutStatus.failedAttempts > 0 && (
            <Alert className="border-orange-200 bg-orange-50">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-orange-700">
                {lockoutStatus.remainingAttempts} login attempts remaining before account lockout.
              </AlertDescription>
            </Alert>
          )}

          {/* Username/Email */}
          <div className="space-y-2">
            <Label htmlFor="username">
              {type === "signin" ? "Username or Email" : "Username"}
            </Label>
            <Input
              id="username"
              name="username"
              type="text"
              value={formData.username}
              onChange={handleChange}
              required
              disabled={loading || lockoutStatus?.locked}
              placeholder={type === "signin" ? "Enter username or email" : "Choose a username"}
            />
          </div>

          {/* Email (registration only) */}
          {type === "register" && (
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
                disabled={loading}
                placeholder="Enter your email"
              />
            </div>
          )}

          {/* First Name (registration only) */}
          {type === "register" && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  name="firstName"
                  type="text"
                  value={formData.firstName}
                  onChange={handleChange}
                  disabled={loading}
                  placeholder="First name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  name="lastName"
                  type="text"
                  value={formData.lastName}
                  onChange={handleChange}
                  disabled={loading}
                  placeholder="Last name"
                />
              </div>
            </div>
          )}

          {/* Phone (registration only) */}
          {type === "register" && (
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                disabled={loading}
                placeholder="Enter your phone number"
              />
            </div>
          )}

          {/* Password */}
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={handleChange}
                required
                disabled={loading || lockoutStatus?.locked}
                placeholder="Enter your password"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>

            {/* Password Strength Indicator */}
            {type === "register" && passwordValidation && formData.password && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {getPasswordStrengthIcon(passwordValidation.strength)}
                    <span className="text-sm font-medium">
                      Password Strength: {passwordValidation.strengthDescription}
                    </span>
                  </div>
                  <Badge variant={passwordValidation.valid ? "default" : "destructive"}>
                    {passwordValidation.strength}%
                  </Badge>
                </div>
                <Progress 
                  value={passwordValidation.strength} 
                  className="h-2"
                />
                {passwordValidation.errors.length > 0 && (
                  <ul className="text-sm text-red-600 space-y-1">
                    {passwordValidation.errors.map((error, index) => (
                      <li key={index} className="flex items-start space-x-1">
                        <XCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                        <span>{error}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          {/* Confirm Password (registration only) */}
          {type === "register" && (
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  placeholder="Confirm your password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={loading}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                <p className="text-sm text-red-600 flex items-center space-x-1">
                  <XCircle className="h-3 w-3" />
                  <span>Passwords do not match</span>
                </p>
              )}
            </div>
          )}

          {/* Submit Button */}
          <Button 
            type="submit" 
            className="w-full" 
            disabled={loading || !isFormValid()}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {type === "signin" ? "Signing in..." : "Creating account..."}
              </>
            ) : (
              <>
                <Shield className="mr-2 h-4 w-4" />
                {type === "signin" ? "Sign In" : "Create Account"}
              </>
            )}
          </Button>
        </form>
      </CardContent>

      <CardFooter className="flex flex-col space-y-2">
        <div className="text-sm text-center text-gray-600">
          {type === "signin" ? (
            <>
              Don't have an account?{" "}
              <Link href="/auth/register" className="font-medium text-blue-600 hover:text-blue-500">
                Sign up
              </Link>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <Link href="/auth/signin" className="font-medium text-blue-600 hover:text-blue-500">
                Sign in
              </Link>
            </>
          )}
        </div>

        {/* Security Info */}
        <div className="flex items-center justify-center space-x-1 text-xs text-gray-500">
          <Info className="h-3 w-3" />
          <span>Secured with enterprise-grade authentication</span>
        </div>
      </CardFooter>
    </Card>
  )
}