"use client"

import Image from "next/image"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"

interface LogoProps {
  width?: number
  height?: number
  className?: string
}

export function Logo({ width = 140, height = 40, className = "" }: LogoProps) {
  const { theme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Avoid hydration mismatch
  if (!mounted) {
    return (
      <div 
        className={`${className}`} 
        style={{ width, height }}
      />
    )
  }

  const isDark = resolvedTheme === "dark"
  
  return (
    <Image
      src={isDark ? "/logo-dark.svg" : "/logo-light.svg"}
      alt="RECOVR Logo"
      width={width}
      height={height}
      className={className}
      priority
    />
  )
}