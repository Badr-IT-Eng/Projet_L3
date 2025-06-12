"use client"

import { useEffect } from 'react'

export function ScrollPerformanceOptimizer() {
  useEffect(() => {
    // Add a class to body during scroll to optimize rendering
    let scrollTimeout: NodeJS.Timeout
    const scrollHandler = () => {
      document.body.classList.add('is-scrolling')
      
      clearTimeout(scrollTimeout)
      scrollTimeout = setTimeout(() => {
        document.body.classList.remove('is-scrolling')
      }, 100)
    }
    
    // Using passive event listener for better scroll performance
    window.addEventListener('scroll', scrollHandler, { passive: true })
    
    // Other browser optimizations
    if ('requestIdleCallback' in window) {
      // Force browsers to use compositor-only animations
      window.requestIdleCallback(() => {
        const allAnimatedElements = document.querySelectorAll('.animate-fade-in, .animate-slide-up, .animate-slide-in-right, .animate-slide-in-left')
        allAnimatedElements.forEach(el => {
          if (el instanceof HTMLElement) {
            el.style.willChange = 'transform, opacity'
            el.style.transform = 'translateZ(0)'
          }
        })
      })
    }
    
    // Clean up
    return () => {
      window.removeEventListener('scroll', scrollHandler)
      clearTimeout(scrollTimeout)
    }
  }, [])
  
  return null
} 