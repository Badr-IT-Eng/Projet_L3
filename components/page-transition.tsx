"use client"

import { usePathname } from 'next/navigation'
import { useEffect, useState, ReactNode } from 'react'

interface PageTransitionProps {
  children: ReactNode
}

export function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname()
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [displayChildren, setDisplayChildren] = useState(children)
  
  useEffect(() => {
    // Only trigger transition when path changes
    if (pathname) {
      setIsTransitioning(true)
      
      // IMPORTANT: Must wait for new page content to be ready BEFORE transitioning
      // This helps prevent layout shifts and flickering
      const timer = setTimeout(() => {
        setDisplayChildren(children)
        
        // Small delay after children are updated to allow render to complete
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            setIsTransitioning(false)
          })
        })
      }, 10)
      
      return () => clearTimeout(timer)
    }
  }, [pathname, children])
  
  return (
    <div
      className={`page-transition w-full transform-gpu ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}
      style={{
        transition: isTransitioning ? 'none' : 'opacity 0.3s ease-in-out',
      }}
    >
      {displayChildren}
    </div>
  )
} 