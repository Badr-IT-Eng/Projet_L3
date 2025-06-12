"use client"

import { useEffect, useRef, ReactNode } from 'react'

type AnimationType = 'fade-in' | 'slide-up' | 'slide-left' | 'slide-right' | 'zoom-in' | 'bounce'

interface ScrollRevealProps {
  children: ReactNode
  animation?: AnimationType
  delay?: number
  threshold?: number
  className?: string
  once?: boolean
}

export function ScrollReveal({
  children,
  animation = 'fade-in',
  delay = 0,
  threshold = 0.1,
  className = '',
  once = true,
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null)
  const enteredRef = useRef(false)

  useEffect(() => {
    const currentRef = ref.current
    if (!currentRef) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            if (once && enteredRef.current) return
            
            enteredRef.current = true
            setTimeout(() => {
              currentRef.classList.add('visible')
            }, delay)
            
            if (once) observer.unobserve(currentRef)
          } else if (!once) {
            enteredRef.current = false
            currentRef.classList.remove('visible')
          }
        })
      },
      { threshold }
    )

    observer.observe(currentRef)

    return () => {
      if (currentRef) observer.unobserve(currentRef)
    }
  }, [delay, threshold, once])

  const getAnimationClass = () => {
    switch (animation) {
      case 'fade-in': return 'scroll-fade-in'
      case 'slide-up': return 'scroll-slide-up'
      case 'slide-left': return 'scroll-slide-left'
      case 'slide-right': return 'scroll-slide-right'
      case 'zoom-in': return 'scroll-zoom-in'
      case 'bounce': return 'scroll-bounce'
      default: return 'scroll-fade-in'
    }
  }

  return (
    <div 
      ref={ref} 
      className={`${getAnimationClass()} ${className}`}
      style={{ 
        opacity: 0,
        transition: `transform 0.8s ease, opacity 0.8s ease`,
        transitionDelay: `${delay}ms`,
        willChange: 'transform, opacity'
      }}
    >
      {children}
    </div>
  )
}

export function ParallaxSection({ 
  children,
  speed = 0.2,
  className = ''
}: { 
  children: ReactNode
  speed?: number
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  
  useEffect(() => {
    const handleScroll = () => {
      if (!ref.current) return
      
      const scrollY = window.scrollY
      const elementTop = ref.current.offsetTop
      const viewport = window.innerHeight
      
      // Only apply parallax when element is visible
      if (scrollY + viewport > elementTop && scrollY < elementTop + ref.current.offsetHeight) {
        const offset = (scrollY - elementTop) * speed
        ref.current.style.transform = `translateY(${offset}px)`
      }
    }
    
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [speed])
  
  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  )
}

// Smooth scrolling utility
export function enableSmoothScroll() {
  useEffect(() => {
    // Add smooth scrolling to all links
    const handleLinkClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const link = target.closest('a')
      
      if (!link) return
      const href = link.getAttribute('href')
      
      if (href?.startsWith('#') && href.length > 1) {
        e.preventDefault()
        const targetElement = document.querySelector(href)
        
        if (targetElement) {
          targetElement.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          })
        }
      }
    }
    
    document.addEventListener('click', handleLinkClick)
    return () => document.removeEventListener('click', handleLinkClick)
  }, [])
  
  return null
} 