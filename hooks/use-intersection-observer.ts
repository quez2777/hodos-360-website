import { useEffect, useRef, useState } from 'react'

interface UseIntersectionObserverProps {
  threshold?: number | number[]
  root?: Element | null
  rootMargin?: string
  freezeOnceVisible?: boolean
}

/**
 * Custom hook for intersection observer
 * Useful for triggering animations when elements enter viewport
 */
export function useIntersectionObserver({
  threshold = 0.1,
  root = null,
  rootMargin = '0px',
  freezeOnceVisible = true,
}: UseIntersectionObserverProps = {}) {
  const [isIntersecting, setIsIntersecting] = useState(false)
  const [hasIntersected, setHasIntersected] = useState(false)
  const targetRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    const target = targetRef.current
    if (!target) return

    // Skip if already intersected and freeze is enabled
    if (freezeOnceVisible && hasIntersected) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        const isCurrentlyIntersecting = entry.isIntersecting
        setIsIntersecting(isCurrentlyIntersecting)
        
        if (isCurrentlyIntersecting && !hasIntersected) {
          setHasIntersected(true)
        }
      },
      {
        threshold,
        root,
        rootMargin,
      }
    )

    observer.observe(target)

    return () => {
      if (target) {
        observer.unobserve(target)
      }
    }
  }, [threshold, root, rootMargin, freezeOnceVisible, hasIntersected])

  return {
    ref: targetRef,
    isIntersecting: freezeOnceVisible ? hasIntersected : isIntersecting,
    hasIntersected,
  }
}

/**
 * Hook for viewport-based animations with Framer Motion
 */
export function useViewportAnimation(options?: UseIntersectionObserverProps) {
  const { ref, isIntersecting } = useIntersectionObserver(options)
  
  return {
    ref,
    animate: isIntersecting ? 'visible' : 'hidden',
    initial: 'hidden',
    variants: {
      hidden: { opacity: 0, y: 20 },
      visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.6, ease: 'easeOut' }
      }
    }
  }
}