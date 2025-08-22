"use client"

import React from 'react'
import { motion, Variants } from 'framer-motion'
import { useIntersectionObserver } from '@/hooks/use-intersection-observer'

interface ViewportAnimationProps {
  children: React.ReactNode
  className?: string
  delay?: number
  duration?: number
  threshold?: number
  variants?: Variants
  once?: boolean
}

const defaultVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
  }
}

/**
 * Wrapper component for viewport-based animations
 * Only animates when element enters viewport
 */
export const ViewportAnimation = React.memo(function ViewportAnimation({
  children,
  className,
  delay = 0,
  duration = 0.5,
  threshold = 0.1,
  variants = defaultVariants,
  once = true,
}: ViewportAnimationProps) {
  const { ref, isIntersecting } = useIntersectionObserver({
    threshold,
    freezeOnceVisible: once,
  })

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isIntersecting ? "visible" : "hidden"}
      variants={variants}
      transition={{ duration, delay }}
      className={className}
    >
      {children}
    </motion.div>
  )
})

ViewportAnimation.displayName = 'ViewportAnimation'

/**
 * Stagger children animations when in viewport
 */
export const StaggeredViewportAnimation = React.memo(function StaggeredViewportAnimation({
  children,
  className,
  staggerDelay = 0.1,
  threshold = 0.1,
  once = true,
}: {
  children: React.ReactNode
  className?: string
  staggerDelay?: number
  threshold?: number
  once?: boolean
}) {
  const { ref, isIntersecting } = useIntersectionObserver({
    threshold,
    freezeOnceVisible: once,
  })

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: staggerDelay,
      },
    },
  }

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 },
    },
  }

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isIntersecting ? "visible" : "hidden"}
      variants={containerVariants}
      className={className}
    >
      {React.Children.map(children, (child, index) => (
        <motion.div key={index} variants={itemVariants}>
          {child}
        </motion.div>
      ))}
    </motion.div>
  )
})

StaggeredViewportAnimation.displayName = 'StaggeredViewportAnimation'