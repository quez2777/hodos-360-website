"use client"

import React, { useEffect, useRef } from "react"
import { motion, useInView, useAnimation } from "framer-motion"

interface ScrollRevealProps {
  children: React.ReactNode
  className?: string
  delay?: number
  duration?: number
  y?: number
}

export function ScrollReveal({ 
  children, 
  className = "",
  delay = 0,
  duration = 0.8,
  y = 30
}: ScrollRevealProps) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })
  const controls = useAnimation()

  useEffect(() => {
    if (isInView) {
      controls.start("visible")
    }
  }, [isInView, controls])

  return (
    <motion.div
      ref={ref}
      animate={controls}
      initial="hidden"
      variants={{
        hidden: { opacity: 0, y },
        visible: { 
          opacity: 1, 
          y: 0,
          transition: {
            duration,
            delay,
            ease: [0.25, 0.1, 0.25, 1] // Luxury easing curve
          }
        }
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// Staggered children animation wrapper
interface StaggerRevealProps {
  children: React.ReactNode
  className?: string
  staggerDelay?: number
}

export function StaggerReveal({ 
  children, 
  className = "",
  staggerDelay = 0.1
}: StaggerRevealProps) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: staggerDelay
          }
        }
      }}
      className={className}
    >
      {React.Children.map(children, (child, index) => (
        <motion.div
          key={index}
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { 
              opacity: 1, 
              y: 0,
              transition: {
                duration: 0.6,
                ease: [0.25, 0.1, 0.25, 1]
              }
            }
          }}
        >
          {child}
        </motion.div>
      ))}
    </motion.div>
  )
}

// Parallax scroll effect for luxury depth
interface ParallaxScrollProps {
  children: React.ReactNode
  className?: string
  speed?: number
}

export function ParallaxScroll({ 
  children, 
  className = "",
  speed = 0.5
}: ParallaxScrollProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [offsetY, setOffsetY] = React.useState(0)

  useEffect(() => {
    const handleScroll = () => {
      if (ref.current) {
        const rect = ref.current.getBoundingClientRect()
        const scrolled = window.scrollY
        const rate = scrolled * -speed
        setOffsetY(rate)
      }
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [speed])

  return (
    <div ref={ref} className={className}>
      <motion.div
        style={{
          transform: `translateY(${offsetY}px)`
        }}
        transition={{ type: "spring", stiffness: 100 }}
      >
        {children}
      </motion.div>
    </div>
  )
}

// Fade in on scroll with scale
interface ScaleRevealProps {
  children: React.ReactNode
  className?: string
  scale?: number
}

export function ScaleReveal({ 
  children, 
  className = "",
  scale = 0.95
}: ScaleRevealProps) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-50px" })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale }}
      animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale }}
      transition={{
        duration: 0.8,
        ease: [0.25, 0.1, 0.25, 1]
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}