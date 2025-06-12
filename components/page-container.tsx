import React from "react"
import { cn } from "@/lib/utils"

interface PageContainerProps {
  children: React.ReactNode
  className?: string
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "none"
}

/**
 * Consistent page container for all application pages
 * Ensures consistent centering, width and padding
 */
export function PageContainer({
  children,
  className,
  maxWidth = "none",
}: PageContainerProps) {
  
  const maxWidthClass = {
    sm: "max-w-screen-sm",
    md: "max-w-screen-md",
    lg: "max-w-screen-lg",
    xl: "max-w-screen-xl",
    "2xl": "max-w-screen-2xl",
    "none": "max-w-[1800px]", // Same as layout default
  }[maxWidth]
  
  return (
    <div className={cn(
      "w-full mx-auto px-4 sm:px-6 lg:px-8 py-6",
      maxWidthClass,
      className
    )}>
      {children}
    </div>
  )
} 