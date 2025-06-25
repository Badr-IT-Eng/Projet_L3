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
import { 
  Loader2, 
  Eye, 
  EyeOff, 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Info,
  User,
  Mail,
  Lock,
  Phone,
  UserCheck,
  ArrowRight,
  Sparkles,
  KeyRound
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { FloatingShapes } from "@/components/ui/floating-shapes"

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

export function ModernAuthForm({ type }: AuthFormProps) {
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
  const [currentStep, setCurrentStep] = useState(1)
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
            checkLockoutStatus(formData.username)
            return 0
          }
          return prev - 1
        })
      }, 60000)

      return () => clearInterval(timer)
    }
  }, [lockoutStatus?.locked, remainingTime, formData.username])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value,
    })

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
    if (strength < 30) return "from-red-500 to-red-600"
    if (strength < 50) return "from-orange-500 to-orange-600"
    if (strength < 70) return "from-yellow-500 to-yellow-600"
    if (strength < 85) return "from-blue-500 to-blue-600"
    return "from-green-500 to-green-600"
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

    if (type === "signin" && lockoutStatus?.locked) {
      setError(`Account is locked. Please try again in ${remainingTime} minutes.`)
      setLoading(false)
      return
    }

    if (type === "register") {
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
        const result = await signIn("credentials", {
          username: formData.username,
          password: formData.password,
          redirect: false,
        })

        if (result?.error) {
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
          
          setTimeout(() => {
            router.push("/auth/signin")
          }, 2000)
        } else {
          setError(data.message || "Registration failed")
          
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

  const nextStep = () => {
    if (currentStep < 2) setCurrentStep(currentStep + 1)
  }

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1)
  }

  const getStepTitle = () => {
    if (type === "signin") return "Welcome Back"
    return currentStep === 1 ? "Personal Information" : "Account Security"
  }

  const getStepDescription = () => {
    if (type === "signin") return "Sign in to access your account"
    return currentStep === 1 ? "Tell us about yourself" : "Create secure credentials"
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/10 to-accent/10 flex items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden">
      <FloatingShapes />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md sm:max-w-lg lg:max-w-xl relative z-10"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-primary to-accent rounded-full mb-4"
          >
            {type === "signin" ? (
              <KeyRound className="h-8 w-8 text-primary-foreground" />
            ) : (
              <UserCheck className="h-8 w-8 text-primary-foreground" />
            )}
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent"
          >
            {type === "signin" ? "Welcome Back" : "Create Account"}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="text-gray-600 mt-2 text-sm sm:text-base"
          >
            {type === "signin" 
              ? "Enter your credentials to continue" 
              : "Join RecovR and never lose anything again"
            }
          </motion.p>
        </div>

        {/* Progress Bar for Registration */}
        {type === "register" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="mb-6"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Step {currentStep} of 2</span>
              <span className="text-sm text-gray-500">{currentStep === 1 ? "50%" : "100%"} Complete</span>
            </div>
            <Progress value={currentStep * 50} className="h-2" />
          </motion.div>
        )}

        {/* Main Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          <Card className="backdrop-blur-sm bg-white/70 border-0 shadow-xl mx-auto rounded-2xl">
            <CardHeader className="space-y-1 pb-4">
              <CardTitle className="text-lg sm:text-xl font-semibold text-center">
                {getStepTitle()}
              </CardTitle>
              <CardDescription className="text-center text-sm sm:text-base">
                {getStepDescription()}
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Success Message */}
                <AnimatePresence>
                  {success && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Alert className="border-green-200 bg-green-50">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <AlertDescription className="text-green-700">
                          {success}
                        </AlertDescription>
                      </Alert>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Error Message */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Alert variant="destructive">
                        <XCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Lockout Warning */}
                <AnimatePresence>
                  {lockoutStatus?.locked && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Alert className="border-red-200 bg-red-50">
                        <Clock className="h-4 w-4 text-red-600" />
                        <AlertDescription className="text-red-700">
                          Account locked for {remainingTime} more minutes due to failed login attempts.
                        </AlertDescription>
                      </Alert>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Failed Attempts Warning */}
                <AnimatePresence>
                  {lockoutStatus && !lockoutStatus.locked && lockoutStatus.failedAttempts > 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Alert className="border-orange-200 bg-orange-50">
                        <AlertTriangle className="h-4 w-4 text-orange-600" />
                        <AlertDescription className="text-orange-700">
                          {lockoutStatus.remainingAttempts} login attempts remaining before account lockout.
                        </AlertDescription>
                      </Alert>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Form Fields */}
                <AnimatePresence mode="wait">
                  {type === "signin" || currentStep === 1 ? (
                    <motion.div
                      key="step1"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-4"
                    >
                      {/* Username/Email */}
                      <div className="space-y-2">
                        <Label htmlFor="username" className="text-sm font-medium text-gray-700">
                          {type === "signin" ? "Username or Email" : "Username"}
                        </Label>
                        <div className="relative">
                          <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input
                            id="username"
                            name="username"
                            type="text"
                            value={formData.username}
                            onChange={handleChange}
                            required
                            disabled={loading || lockoutStatus?.locked}
                            placeholder={type === "signin" ? "Enter username or email" : "Choose a username"}
                            className="pl-10 h-12 border-primary focus:border-primary focus:ring-primary"
                          />
                        </div>
                      </div>

                      {/* Registration Fields - Step 1 */}
                      {type === "register" && (
                        <>
                          <div className="space-y-2">
                            <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email</Label>
                            <div className="relative">
                              <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                              <Input
                                id="email"
                                name="email"
                                type="email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                                disabled={loading}
                                placeholder="Enter your email"
                                className="pl-10 h-12 border-primary focus:border-primary focus:ring-primary"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="firstName" className="text-sm font-medium text-gray-700">First Name</Label>
                              <Input
                                id="firstName"
                                name="firstName"
                                type="text"
                                value={formData.firstName}
                                onChange={handleChange}
                                disabled={loading}
                                placeholder="First name"
                                className="h-12 border-primary focus:border-primary focus:ring-primary"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="lastName" className="text-sm font-medium text-gray-700">Last Name</Label>
                              <Input
                                id="lastName"
                                name="lastName"
                                type="text"
                                value={formData.lastName}
                                onChange={handleChange}
                                disabled={loading}
                                placeholder="Last name"
                                className="h-12 border-primary focus:border-primary focus:ring-primary"
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="phone" className="text-sm font-medium text-gray-700">Phone Number</Label>
                            <div className="relative">
                              <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                              <Input
                                id="phone"
                                name="phone"
                                type="tel"
                                value={formData.phone}
                                onChange={handleChange}
                                disabled={loading}
                                placeholder="Enter your phone number"
                                className="pl-10 h-12 border-primary focus:border-primary focus:ring-primary"
                              />
                            </div>
                          </div>
                        </>
                      )}

                      {/* Password for Sign In */}
                      {type === "signin" && (
                        <div className="space-y-2">
                          <Label htmlFor="password" className="text-sm font-medium text-gray-700">Password</Label>
                          <div className="relative">
                            <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                            <Input
                              id="password"
                              name="password"
                              type={showPassword ? "text" : "password"}
                              value={formData.password}
                              onChange={handleChange}
                              required
                              disabled={loading || lockoutStatus?.locked}
                              placeholder="Enter your password"
                              className="pl-10 pr-10 h-12 border-primary focus:border-primary focus:ring-primary"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-12 px-3 hover:bg-transparent"
                              onClick={() => setShowPassword(!showPassword)}
                              disabled={loading}
                            >
                              {showPassword ? (
                                <EyeOff className="h-4 w-4 text-gray-400" />
                              ) : (
                                <Eye className="h-4 w-4 text-gray-400" />
                              )}
                            </Button>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  ) : (
                    <motion.div
                      key="step2"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-4"
                    >
                      {/* Password */}
                      <div className="space-y-2">
                        <Label htmlFor="password" className="text-sm font-medium text-gray-700">Password</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input
                            id="password"
                            name="password"
                            type={showPassword ? "text" : "password"}
                            value={formData.password}
                            onChange={handleChange}
                            required
                            disabled={loading}
                            placeholder="Create a secure password"
                            className="pl-10 pr-10 h-12 border-primary focus:border-primary focus:ring-primary"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-12 px-3 hover:bg-transparent"
                            onClick={() => setShowPassword(!showPassword)}
                            disabled={loading}
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4 text-gray-400" />
                            ) : (
                              <Eye className="h-4 w-4 text-gray-400" />
                            )}
                          </Button>
                        </div>

                        {/* Password Strength Indicator */}
                        {passwordValidation && formData.password && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            transition={{ duration: 0.3 }}
                            className="space-y-3 mt-3"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                {getPasswordStrengthIcon(passwordValidation.strength)}
                                <span className="text-sm font-medium">
                                  {passwordValidation.strengthDescription}
                                </span>
                              </div>
                              <Badge 
                                variant={passwordValidation.valid ? "default" : "destructive"}
                                className="text-xs"
                              >
                                {passwordValidation.strength}%
                              </Badge>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${passwordValidation.strength}%` }}
                                transition={{ duration: 0.5, ease: "easeOut" }}
                                className={`h-full bg-gradient-to-r ${getPasswordStrengthColor(passwordValidation.strength)} rounded-full`}
                              />
                            </div>
                            {passwordValidation.errors.length > 0 && (
                              <motion.ul
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.2 }}
                                className="text-sm text-red-600 space-y-1"
                              >
                                {passwordValidation.errors.map((error, index) => (
                                  <motion.li
                                    key={index}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    className="flex items-start space-x-1"
                                  >
                                    <XCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                                    <span>{error}</span>
                                  </motion.li>
                                ))}
                              </motion.ul>
                            )}
                          </motion.div>
                        )}
                      </div>

                      {/* Confirm Password */}
                      <div className="space-y-2">
                        <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">Confirm Password</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input
                            id="confirmPassword"
                            name="confirmPassword"
                            type={showConfirmPassword ? "text" : "password"}
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            required
                            disabled={loading}
                            placeholder="Confirm your password"
                            className="pl-10 pr-10 h-12 border-primary focus:border-primary focus:ring-primary"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-12 px-3 hover:bg-transparent"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            disabled={loading}
                          >
                            {showConfirmPassword ? (
                              <EyeOff className="h-4 w-4 text-gray-400" />
                            ) : (
                              <Eye className="h-4 w-4 text-gray-400" />
                            )}
                          </Button>
                        </div>
                        {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                          <motion.p
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-sm text-red-600 flex items-center space-x-1"
                          >
                            <XCircle className="h-3 w-3" />
                            <span>Passwords do not match</span>
                          </motion.p>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Action Buttons */}
                <div className="space-y-3 pt-4">
                  {type === "register" && currentStep === 1 ? (
                    <Button
                      type="button"
                      onClick={nextStep}
                      className="w-full h-12 bg-gradient-to-r from-primary to-accent hover:from-primary-focus hover:to-accent-focus text-primary-foreground font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
                      disabled={!formData.username || !formData.email}
                    >
                      Continue
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  ) : (
                    <motion.div className="space-y-3">
                      {type === "register" && currentStep === 2 && (
                        <Button
                          type="button"
                          onClick={prevStep}
                          variant="outline"
                          className="w-full h-12 border-gray-300 text-gray-700 hover:bg-gray-50"
                        >
                          Back
                        </Button>
                      )}
                      <Button
                        type="submit"
                        className="w-full h-12 bg-gradient-to-r from-primary to-accent hover:from-primary-focus hover:to-accent-focus text-primary-foreground font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={loading || !isFormValid()}
                      >
                        {loading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            {type === "signin" ? "Signing in..." : "Creating account..."}
                          </>
                        ) : (
                          <>
                            {type === "signin" ? (
                              <KeyRound className="mr-2 h-4 w-4" />
                            ) : (
                              <Sparkles className="mr-2 h-4 w-4" />
                            )}
                            {type === "signin" ? "Sign In" : "Create Account"}
                          </>
                        )}
                      </Button>
                    </motion.div>
                  )}
                </div>
              </form>
            </CardContent>

            <CardFooter className="flex flex-col space-y-4 pt-2">
              <div className="text-sm text-center text-gray-600">
                {type === "signin" ? (
                  <>
                    Don't have an account?{" "}
                    <Link href="/auth/register" className="font-medium text-blue-600 hover:text-blue-500 transition-colors">
                      Sign up
                    </Link>
                  </>
                ) : (
                  <>
                    Already have an account?{" "}
                    <Link href="/auth/signin" className="font-medium text-blue-600 hover:text-blue-500 transition-colors">
                      Sign in
                    </Link>
                  </>
                )}
              </div>

              {/* Security Info */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="flex items-center justify-center space-x-1 text-xs text-gray-500"
              >
                <Shield className="h-3 w-3" />
                <span>Protected by enterprise-grade security</span>
              </motion.div>
            </CardFooter>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  )
}