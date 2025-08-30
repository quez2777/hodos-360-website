"use client"

import React from "react"
import { motion } from "framer-motion"

interface LuxuryHoverProps {
  children: React.ReactNode
  className?: string
  scale?: number
  glow?: boolean
}

// Luxury hover effect with subtle scale and glow
export function LuxuryHover({ 
  children, 
  className = "",
  scale = 1.02,
  glow = true
}: LuxuryHoverProps) {
  return (
    <motion.div
      className={`relative ${className}`}
      whileHover={{ scale }}
      transition={{ 
        type: "spring", 
        stiffness: 400, 
        damping: 25 
      }}
    >
      {glow && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-[#B8860B]/0 via-[#B8860B]/10 to-[#B8860B]/0 rounded-lg blur-xl"
          initial={{ opacity: 0 }}
          whileHover={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        />
      )}
      <div className="relative z-10">
        {children}
      </div>
    </motion.div>
  )
}

// Magnetic hover effect - element follows cursor slightly
interface MagneticHoverProps {
  children: React.ReactNode
  className?: string
  strength?: number
}

export function MagneticHover({ 
  children, 
  className = "",
  strength = 0.3
}: MagneticHoverProps) {
  const [position, setPosition] = React.useState({ x: 0, y: 0 })

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = (e.clientX - rect.left - rect.width / 2) * strength
    const y = (e.clientY - rect.top - rect.height / 2) * strength
    setPosition({ x, y })
  }

  const handleMouseLeave = () => {
    setPosition({ x: 0, y: 0 })
  }

  return (
    <motion.div
      className={className}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      animate={{ x: position.x, y: position.y }}
      transition={{ 
        type: "spring", 
        stiffness: 350, 
        damping: 20 
      }}
    >
      {children}
    </motion.div>
  )
}

// Shimmer effect on hover for buttons and CTAs
interface ShimmerHoverProps {
  children: React.ReactNode
  className?: string
}

export function ShimmerHover({ 
  children, 
  className = ""
}: ShimmerHoverProps) {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      {children}
      <motion.div
        className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent"
        whileHover={{
          translateX: "200%",
        }}
        transition={{
          duration: 0.8,
          ease: "easeInOut"
        }}
      />
    </div>
  )
}

// Reveal underline effect for links
interface RevealUnderlineProps {
  children: React.ReactNode
  className?: string
  color?: string
}

export function RevealUnderline({ 
  children, 
  className = "",
  color = "#B8860B"
}: RevealUnderlineProps) {
  return (
    <div className={`relative inline-block ${className}`}>
      {children}
      <motion.div
        className="absolute bottom-0 left-0 h-[1px] w-full origin-left"
        style={{ backgroundColor: color }}
        initial={{ scaleX: 0 }}
        whileHover={{ scaleX: 1 }}
        transition={{ 
          duration: 0.3,
          ease: [0.25, 0.1, 0.25, 1]
        }}
      />
    </div>
  )
}

// Tilt effect for cards
interface TiltHoverProps {
  children: React.ReactNode
  className?: string
  maxTilt?: number
}

export function TiltHover({ 
  children, 
  className = "",
  maxTilt = 10
}: TiltHoverProps) {
  const [tilt, setTilt] = React.useState({ x: 0, y: 0 })

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientY - rect.top) / rect.height - 0.5) * maxTilt
    const y = ((e.clientX - rect.left) / rect.width - 0.5) * -maxTilt
    setTilt({ x, y })
  }

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 })
  }

  return (
    <motion.div
      className={`transform-gpu ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      animate={{
        rotateX: tilt.x,
        rotateY: tilt.y,
      }}
      transition={{ 
        type: "spring", 
        stiffness: 400, 
        damping: 30 
      }}
      style={{ transformStyle: "preserve-3d" }}
    >
      {children}
    </motion.div>
  )
}