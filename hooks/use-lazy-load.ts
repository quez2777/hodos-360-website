import { useEffect, useState, useRef } from 'react'

interface UseLazyLoadOptions {
  rootMargin?: string
  threshold?: number | number[]
  triggerOnce?: boolean
}

export function useLazyLoad(options: UseLazyLoadOptions = {}) {
  const {
    rootMargin = '100px',
    threshold = 0.01,
    triggerOnce = true
  } = options

  const [isIntersecting, setIsIntersecting] = useState(false)
  const [hasIntersected, setHasIntersected] = useState(false)
  const targetRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const target = targetRef.current
    if (!target) return

    // If triggerOnce is true and we've already intersected, don't observe
    if (triggerOnce && hasIntersected) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const isCurrentlyIntersecting = entry.isIntersecting
          setIsIntersecting(isCurrentlyIntersecting)
          
          if (isCurrentlyIntersecting && triggerOnce) {
            setHasIntersected(true)
            observer.unobserve(target)
          }
        })
      },
      {
        rootMargin,
        threshold
      }
    )

    observer.observe(target)

    return () => {
      observer.unobserve(target)
    }
  }, [rootMargin, threshold, triggerOnce, hasIntersected])

  return {
    ref: targetRef,
    isIntersecting,
    hasIntersected
  }
}